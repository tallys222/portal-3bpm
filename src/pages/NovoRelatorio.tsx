import React, { useState, useEffect } from "react";
import { EfetivoTable } from "../components/form/EfetivoTable";
import { AlteracoesTable } from "../components/form/AlteracoesTable";
import { createReport, getProximoNumero, isoToDdmm, listAllReports, listMyReports } from "../lib/reports";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../components/shared/Toast";
import type { EfetivoItem, Alteracao } from "../types/report";
import { EF_DEFAULT_LABELS } from "../types/report";
import { useNomesConhecidos } from "../hooks/useNomesConhecidos";
import type { Report } from "../types/report";

const DRAFT_KEY = "bpm3_rascunho_relatorio";
const MODELO_KEY = "bpm3_efetivo_modelo";

interface DraftData {
  numBase: string; data: string; supNome: string; supMat: string;
  efetivo: EfetivoItem[]; alteracoes: Alteracao[]; observacoes: string; savedAt: string;
}

function saveDraft(d: DraftData) { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, savedAt: new Date().toISOString() })); }
function loadDraft(): DraftData | null { try { const r = localStorage.getItem(DRAFT_KEY); return r ? JSON.parse(r) : null; } catch { return null; } }
function clearDraft() { localStorage.removeItem(DRAFT_KEY); }
function fmtDraft(iso: string) { return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }

function efetivoInicial(): EfetivoItem[] {
  try {
    const modelo = localStorage.getItem(MODELO_KEY);
    if (modelo) return JSON.parse(modelo);
  } catch {}
  return EF_DEFAULT_LABELS.map((label) => ({ label, value: "" }));
}

interface Props {
  onSaved?: () => void;
  initialData?: Report; // relatório base para duplicar
}

export function NovoRelatorio({ onSaved, initialData }: Props) {
  const { firebaseUser, userProfile } = useAuth();

  const [numBase, setNumBase]         = useState("");
  const [data, setData]               = useState(new Date().toISOString().slice(0, 10));
  const [supNome, setSupNome]         = useState(initialData?.supervisor_nome ?? "");
  const [supMat, setSupMat]           = useState(initialData?.supervisor_matricula ?? "");
  const [efetivo, setEfetivo]         = useState<EfetivoItem[]>(
    initialData?.efetivo ?? efetivoInicial()
  );
  const [alteracoes, setAlteracoes]   = useState<Alteracao[]>(initialData?.alteracoes ?? []);
  const [observacoes, setObservacoes] = useState(initialData?.observacoes ?? "");
  const [saving, setSaving]           = useState(false);
  const [loadingNum, setLoadingNum]   = useState(false);
  const [error, setError]             = useState("");
  const [draftInfo, setDraftInfo]     = useState<string | null>(null);
  const [todosRelatorios, setTodosRelatorios] = useState<Report[]>([]);

  const nomeUsuario = userProfile
    ? (userProfile.rankName || userProfile.fullName || "").trim().toUpperCase()
    : "";

  const relatorioNumFinal = numBase && nomeUsuario
    ? `${numBase.trim()} - ${nomeUsuario}`
    : numBase.trim();

  // Nomes conhecidos para autocomplete
  const nomesConhecidos = useNomesConhecidos(todosRelatorios);

  // Carrega relatórios anteriores para o autocomplete
  useEffect(() => {
    if (!firebaseUser) return;
    const fn = userProfile?.papel === "gestor" ? listAllReports : () => listMyReports(firebaseUser.uid);
    fn().then(setTodosRelatorios).catch(() => {});
  }, [firebaseUser, userProfile?.papel]);

  async function gerarNumeroBase() {
    setLoadingNum(true);
    try {
      const proximo = await getProximoNumero();
      const ano = new Date().getFullYear();
      setNumBase(`${String(Math.max(proximo, 114)).padStart(5, "0")}/${ano}`);
    } catch { toast("Erro ao buscar próximo número.", "err"); }
    finally { setLoadingNum(false); }
  }

  useEffect(() => {
    const draft = loadDraft();
    if (draft) { setDraftInfo(fmtDraft(draft.savedAt)); }
    else { gerarNumeroBase(); }
  }, []);

  function restaurarRascunho() {
    const draft = loadDraft();
    if (!draft) return;
    setNumBase(draft.numBase); setData(draft.data);
    setSupNome(draft.supNome); setSupMat(draft.supMat);
    setEfetivo(draft.efetivo); setAlteracoes(draft.alteracoes);
    setObservacoes(draft.observacoes); setDraftInfo(null);
    toast("Rascunho restaurado!", "ok");
  }

  function descartarRascunho() { clearDraft(); setDraftInfo(null); gerarNumeroBase(); toast("Rascunho descartado.", ""); }

  function handleSalvarRascunho() {
    saveDraft({ numBase, data, supNome, supMat, efetivo, alteracoes, observacoes, savedAt: new Date().toISOString() });
    setDraftInfo(fmtDraft(new Date().toISOString()));
    toast("Rascunho salvo localmente!", "ok");
  }

  async function handleSave() {
    if (!numBase.trim()) { setError("Informe o número do relatório."); return; }
    if (!data) { setError("Informe a data do serviço."); return; }
    if (!supNome.trim()) { setError("Informe o nome do supervisor."); return; }
    if (!firebaseUser) { setError("Usuário não autenticado."); return; }
    setSaving(true); setError("");
    try {
      await createReport({
        relatorio_num: relatorioNumFinal,
        relatorio_data: isoToDdmm(data),
        supervisor_nome: supNome.trim().toUpperCase(),
        supervisor_matricula: supMat.trim(),
        efetivo, alteracoes, observacoes,
        resumo: {} as any,
        createdBy: firebaseUser.uid,
      });
      clearDraft(); setDraftInfo(null);
      toast("Relatório salvo no Firebase!", "ok");
      onSaved?.(); resetForm();
    } catch (e: any) { setError(e.message ?? "Erro ao salvar."); }
    finally { setSaving(false); }
  }

  function resetForm() {
    setData(new Date().toISOString().slice(0, 10));
    setSupNome(""); setSupMat("");
    setEfetivo(efetivoInicial());
    setAlteracoes([]); setObservacoes(""); setError("");
    gerarNumeroBase();
  }

  function handleClear() {
    if (!confirm("Limpar todos os campos? O rascunho salvo não será apagado.")) return;
    resetForm();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {draftInfo && (
        <div style={{ background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.3)", borderRadius: 10, padding: "12px 18px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span style={{ color: "#f59e0b", fontSize: 13 }}>📝 Rascunho salvo em <b>{draftInfo}</b> — deseja continuar de onde parou?</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn sm" onClick={restaurarRascunho} style={{ borderColor: "rgba(245,158,11,.4)", color: "#f59e0b" }}>↩ Restaurar</button>
            <button className="btn sm danger" onClick={descartarRascunho}>Descartar</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-hd">➤ Identificação do Relatório</div>
        <div className="row r2">
          <div className="fg">
            <label>Nº Relatório{loadingNum && <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 11 }}> — gerando…</span>}</label>
            <input value={numBase} onChange={(e) => setNumBase(e.target.value)} placeholder="00114/2026" />
          </div>
          <div className="fg">
            <label>Responsável pelo Preenchimento</label>
            <input value={nomeUsuario} readOnly style={{ opacity: nomeUsuario ? 1 : 0.4, cursor: "default", background: "rgba(37,99,235,.06)" }} placeholder="Carregando usuário…" tabIndex={-1} />
          </div>
        </div>
        {relatorioNumFinal && (
          <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(37,99,235,.08)", border: "1px solid rgba(37,99,235,.2)", fontSize: 12, color: "var(--dim)" }}>
            <span style={{ color: "var(--muted)" }}>Será salvo como: </span>
            <b style={{ color: "var(--text)" }}>{relatorioNumFinal}</b>
          </div>
        )}
        <div className="row r2" style={{ marginTop: 12 }}>
          <div className="fg"><label>Data do Serviço</label><input type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
          <div className="fg"><label>Matrícula do Supervisor</label><input value={supMat} onChange={(e) => setSupMat(e.target.value)} placeholder="Ex.: 0000085774" /></div>
        </div>
        <div className="fg" style={{ marginTop: 12 }}>
          <label>Supervisor — Nome completo + Posto</label>
          <input value={supNome} onChange={(e) => setSupNome(e.target.value)} placeholder="Ex.: JOSE DA SILVA - 1º TEN PM" />
        </div>
      </div>

      <div className="card">
        <div className="card-hd"><span className="num">1</span> Efetivo — Relação Nominal</div>
        <EfetivoTable value={efetivo} onChange={setEfetivo} />
      </div>

      <div className="card">
        <div className="card-hd"><span className="num">1.3</span> Permutas / Execuções / Dispensas / Faltas / Atrasos</div>
        <AlteracoesTable value={alteracoes} onChange={setAlteracoes} nomesConhecidos={nomesConhecidos} />
      </div>

      <div className="card">
        <div className="card-hd">✎ Observações / Anexos</div>
        <div className="fg"><textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Remanejamentos, substituições, informações adicionais…" style={{ minHeight: 90 }} /></div>
      </div>

      {error && <p className="err-msg" style={{ marginBottom: 8 }}>⚠ {error}</p>}

      <div className="btn-group">
        <button className="btn primary" onClick={handleSave} disabled={saving}>{saving ? "Salvando…" : "💾 Salvar e Enviar"}</button>
        <button className="btn" onClick={handleSalvarRascunho} style={{ borderColor: "rgba(245,158,11,.4)", color: "#f59e0b" }}>📝 Salvar Rascunho</button>
        <button className="btn" onClick={handleClear}>🗑 Limpar</button>
      </div>

      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
        💡 O rascunho é salvo <b>neste navegador</b> e persiste entre sessões. "Salvar e Enviar" é permanente e visível ao gestor.
      </p>
    </div>
  );
}
