import { Timestamp } from "firebase/firestore";

// ── Efetivo ──────────────────────────────────────────────────
export interface EfetivoItem {
  label: string; // "GUARNIÇÃO R/P 1"
  value: string; // "2ºSGT WALLISTON"
}

// ── Alterações (seção 1.3) ───────────────────────────────────
export interface Alteracao {
  grad: string;
  guarnicao: string;
  motivo: string;      // texto completo: "DISPENSA DE SERVIÇO"
  nome: string;
  numParte: string;
  observacao: string;
  ordem: string;
  tempo: string;
}

// ── Resumo (seção 2) ─────────────────────────────────────────
export interface ResumoCategoria {
  radiopatrulha: string;
  especializadas: string;
  "forçatarefa": string;
  comunitario: string;
  total: string;
}

export interface Resumo {
  "prisões": ResumoCategoria;
  "ocorrências": ResumoCategoria;
  flagrantes: ResumoCategoria;
  "apreensões": ResumoCategoria;
  bocs: ResumoCategoria;
  tcos: ResumoCategoria;
}

export function emptyCategoria(): ResumoCategoria {
  return { radiopatrulha: "0", especializadas: "0", "forçatarefa": "0", comunitario: "0", total: "0" };
}

export function emptyResumo(): Resumo {
  return {
    "prisões":     emptyCategoria(),
    "ocorrências": emptyCategoria(),
    flagrantes:    emptyCategoria(),
    "apreensões":  emptyCategoria(),
    bocs:          emptyCategoria(),
    tcos:          emptyCategoria(),
  };
}

// ── Relatório ─────────────────────────────────────────────────
export interface Report {
  id: string;
  relatorio_num: string;        // "00106/2025 - 2ºSGT PM MAT 113841 CLEBER ROCHA"
  relatorio_data: string;       // "15/01/2026" — DD/MM/YYYY
  supervisor_nome: string;
  supervisor_matricula: string;
  efetivo: EfetivoItem[];
  alteracoes: Alteracao[];
  observacoes: string;
  resumo: Resumo;
  createdBy: string;
  createdAt: Timestamp | null;
}

// ── Usuário (coleção `users`) ─────────────────────────────────
export type Papel = "gestor" | "operador";

export interface UserProfile {
  uid: string;
  fullName: string;      // "Tallysson Kaique Melo Barbosa"
  rankName: string;      // "Sd Tallysson"
  email: string;
  phone?: string;
  role?: string;
  approvalStatus?: string;
  papel: Papel;
  // campos legados — mantidos por compatibilidade
  nome?: string;
  grad?: string;
  mat?: string;
}

// ── Constantes ────────────────────────────────────────────────
export const MOTIVOS_LIST = [
  "DISPENSA MÉDICA",
  "DISPENSA DE SERVIÇO",
  "EXECUÇÃO",
  "FALTA",
  "ATRASO",
  "PERMUTA",
  "APRESENTAÇÃO",
] as const;

export const GRADS_LIST = [
  "ASP OF", "SUB TEN", "1ºSGT", "2ºSGT", "3ºSGT", "CB", "SD",
  "TEN", "CAP", "MAJ", "TC", "CEL",
] as const;

export const EF_DEFAULT_LABELS: string[] = [
  "OFICIAL DE OPERAÇÕES", "AUX.OF.DE OPERAÇÕES", "COPOM", "ARMEIRO",
  "GUARDA DO QUARTEL", "GUARNIÇÃO R/P 1", "GUARNIÇÃO R/P 2", "GUARNIÇÃO R/P 3",
  "GUARNIÇÃO R/P 4", "GUARNIÇÃO R/P 5", "GUARNIÇÃO R/P 6", "GUARNIÇÃO R/P 7",
  "GUARNIÇÃO R/P 8", "GUARNIÇÃO R/P 9", "PELOPES", "ROCAM", "CANIL",
  "CAVALARIA", "ÁGUIAS", "MINISTÉRIO PÚBLICO", "HOSPITAL DO AGRESTE",
  "COMPLEXO DE JUSTIÇA", "FÓRUM", "POLICIAMENTO COMUNITÁRIO",
];

export const RESUMO_ROWS: (keyof Resumo)[] = [
  "prisões", "ocorrências", "flagrantes", "apreensões", "bocs", "tcos",
];

export const RESUMO_COLS: (keyof ResumoCategoria)[] = [
  "radiopatrulha", "especializadas", "forçatarefa", "comunitario",
];

export const RESUMO_COL_LABELS: Record<string, string> = {
  radiopatrulha: "Radiopatrulha",
  especializadas: "Especializadas",
  "forçatarefa": "Força Tarefa",
  comunitario: "Pol. Comunitário",
  total: "Total",
};

export const MOTIVO_COLORS: Record<string, string> = {
  "DISPENSA MÉDICA":    "#38bdf8",
  "DISPENSA DE SERVIÇO":"#a78bfa",
  "EXECUÇÃO":           "#34d399",
  "FALTA":              "#f87171",
  "ATRASO":             "#fbbf24",
  "PERMUTA":            "#f472b6",
  "APRESENTAÇÃO":       "#86efac",
};
