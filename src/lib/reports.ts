import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Report } from "../types/report";

const COL = "reports";

export type ReportInput = Omit<Report, "id" | "createdAt">;

// ── CRUD ─────────────────────────────────────────────────────
export async function createReport(data: ReportInput): Promise<string> {
  const ref = await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateReport(id: string, data: Partial<ReportInput>): Promise<void> {
  await updateDoc(doc(db, COL, id), data);
}

export async function deleteReport(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export async function getReport(id: string): Promise<Report | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Report;
}

// Gestor: todos os relatórios
// Sem orderBy("createdAt") para não excluir documentos antigos sem esse campo.
// A ordenação é feita no cliente por relatorio_data.
export async function listAllReports(): Promise<Report[]> {
  const snap = await getDocs(collection(db, COL));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Report))
    .sort((a, b) => sortByData(b.relatorio_data, a.relatorio_data));
}

// Operador: apenas os próprios
export async function listMyReports(uid: string): Promise<Report[]> {
  const q = query(collection(db, COL), where("createdBy", "==", uid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Report))
    .sort((a, b) => sortByData(b.relatorio_data, a.relatorio_data));
}

// Ordena datas no formato DD/MM/YYYY ou DDMMYYYY
function sortByData(a: string | undefined, b: string | undefined): number {
  return normData(a).localeCompare(normData(b));
}

function normData(d: string | undefined): string {
  if (!d) return "";
  if (d.includes("/")) {
    const [dd, mm, yyyy] = d.split("/");
    return `${yyyy ?? ""}${mm ?? ""}${dd ?? ""}`;
  }
  if (/^\d{8}$/.test(d)) return `${d.slice(4)}${d.slice(2, 4)}${d.slice(0, 2)}`;
  return d;
}

// ── Helpers ──────────────────────────────────────────────────
export function ddmmToIso(s: string): string {
  if (!s || !s.includes("/")) return s;
  const [d, m, y] = s.split("/");
  return `${y}-${m}-${d}`;
}

export function isoToDdmm(s: string): string {
  if (!s || !s.includes("-")) return s;
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

// ── Normalização de nomes ─────────────────────────────────────
// Remove espaços extras, acentos e pontuação, converte para maiúsculas.
// Garante que "MORAES ", "Moraes" e "MORAES" virem a mesma chave.
export function normalizarNome(s: string): string {
  return (s ?? "")
    .toUpperCase()
    .trim()
    .normalize("NFD")                        // decompõe acentos
    .replace(/[\u0300-\u036f]/g, "")         // remove diacríticos
    .replace(/[^A-Z0-9\s]/g, "")            // remove pontuação
    .replace(/\s+/g, " ")                    // colapsa espaços duplos
    .trim();
}

// ── Histórico por militar ────────────────────────────────────
export interface HistoricoEntry {
  nomeCompleto: string;
  grad: string;
  nome: string;
  ocorrencias: Array<{
    reportId: string;
    relatorio_num: string;
    relatorio_data: string;
    motivo: string;
    tempo: string;
    guarnicao: string;
    numParte: string;
    observacao: string;
  }>;
}

export function buildHistorico(reports: Report[]): HistoricoEntry[] {
  const map = new Map<string, HistoricoEntry>();
  // Mapa secundário: chave normalizada → chave primária no map principal
  // Permite encontrar uma entrada existente mesmo quando ordem muda ou falta
  const nomeParaChave = new Map<string, string>();

  for (const rep of reports) {
    for (const alt of rep.alteracoes ?? []) {
      if (!alt.nome) continue;

      const ordemLimpa = (alt.ordem ?? "").trim();
      const nomeNorm = `${normalizarNome(alt.grad)}|${normalizarNome(alt.nome)}`;

      // Tenta encontrar uma entrada já existente pelo nome normalizado
      const chaveExistente = nomeParaChave.get(nomeNorm);

      let key: string;
      if (chaveExistente) {
        // Já existe uma entrada para este militar — usa a mesma chave
        key = chaveExistente;
      } else if (ordemLimpa) {
        key = `ordem:${ordemLimpa}`;
      } else {
        key = `nome:${nomeNorm}`;
      }

      if (!map.has(key)) {
        map.set(key, {
          nomeCompleto: `${alt.grad ? alt.grad + " " : ""}${alt.nome}`.trim().toUpperCase(),
          grad: alt.grad,
          nome: alt.nome,
          ocorrencias: [],
        });
      }

      // Registra a associação nome → chave para registros futuros sem ordem
      if (!nomeParaChave.has(nomeNorm)) {
        nomeParaChave.set(nomeNorm, key);
      }
      // Se este registro tem ordem, atualiza o mapeamento para capturar promoções
      if (ordemLimpa) {
        nomeParaChave.set(nomeNorm, key);
      }

      const entry = map.get(key)!;
      // Atualiza com o registro mais recente (captura promoções)
      entry.grad = alt.grad;
      entry.nome = alt.nome;
      entry.nomeCompleto = `${alt.grad ? alt.grad + " " : ""}${alt.nome}`.trim().toUpperCase();

      entry.ocorrencias.push({
        reportId: rep.id, relatorio_num: rep.relatorio_num, relatorio_data: rep.relatorio_data,
        motivo: alt.motivo, tempo: alt.tempo, guarnicao: alt.guarnicao,
        numParte: alt.numParte, observacao: alt.observacao,
      });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((e) => ({
      ...e,
      ocorrencias: e.ocorrencias.sort((a, b) =>
        ddmmToIso(b.relatorio_data).localeCompare(ddmmToIso(a.relatorio_data))
      ),
    }));
}

// ── Próximo número sequencial do ano atual ───────────────────
export async function getProximoNumero(): Promise<number> {
  const ano = new Date().getFullYear();
  // Sem orderBy para não excluir documentos antigos sem createdAt
  const snap = await getDocs(collection(db, COL));

  let maiorNum = 0;
  snap.docs.forEach((d) => {
    const num: string = d.data().relatorio_num ?? "";
    const match = num.match(/^(\d+)\/(\d{4})/);
    if (match && parseInt(match[2]) === ano) {
      const n = parseInt(match[1]);
      if (n > maiorNum) maiorNum = n;
    }
  });

  return maiorNum + 1;
}