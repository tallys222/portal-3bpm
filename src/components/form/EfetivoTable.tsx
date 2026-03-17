import React, { useState } from "react";
import type { EfetivoItem } from "../../types/report";
import { EF_DEFAULT_LABELS } from "../../types/report";

const MODELO_KEY = "bpm3_efetivo_modelo";

function salvarModelo(items: EfetivoItem[]) {
  localStorage.setItem(MODELO_KEY, JSON.stringify(items));
}

function carregarModelo(): EfetivoItem[] | null {
  try {
    const raw = localStorage.getItem(MODELO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

interface Props { value: EfetivoItem[]; onChange: (v: EfetivoItem[]) => void; }

export function EfetivoTable({ value, onChange }: Props) {
  const [nL, setNL] = useState(""); const [nV, setNV] = useState("");
  const temModelo = !!localStorage.getItem(MODELO_KEY);

  const upd = (i: number, f: keyof EfetivoItem, v: string) =>
    onChange(value.map((x, j) => j === i ? { ...x, [f]: v.toUpperCase() } : x));

  const add = () => {
    if (!nL.trim()) return;
    onChange([...value, { label: nL.trim().toUpperCase(), value: nV.trim().toUpperCase() }]);
    setNL(""); setNV("");
  };

  const loadDefault = () => {
    if (value.length > 0 && !confirm("Substituir efetivo atual pelas funções padrão?")) return;
    onChange(EF_DEFAULT_LABELS.map((label) => ({ label, value: "" })));
  };

  const handleSalvarModelo = () => {
    salvarModelo(value);
    alert("Modelo salvo! Será carregado automaticamente nos próximos relatórios.");
  };

  const handleCarregarModelo = () => {
    const modelo = carregarModelo();
    if (!modelo) return;
    if (value.some(v => v.value) && !confirm("Substituir efetivo atual pelo modelo salvo?")) return;
    onChange(modelo);
  };

  return (
    <div>
      <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={TH}>Função / Posto</th>
              <th style={TH}>Nome</th>
              <th style={{ ...TH, width: 48 }}></th>
            </tr>
          </thead>
          <tbody>
            {value.map((item, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(26,45,90,.4)" }}>
                <td style={TD}><input style={IN} value={item.label} onChange={(e) => upd(i, "label", e.target.value)} /></td>
                <td style={TD}><input style={IN} value={item.value} placeholder="SEM RECURSO" onChange={(e) => upd(i, "value", e.target.value)} /></td>
                <td style={{ ...TD, textAlign: "center" }}>
                  <button onClick={() => onChange(value.filter((_, j) => j !== i))} style={RM}>✕</button>
                </td>
              </tr>
            ))}
            <tr style={{ background: "rgba(37,99,235,.03)" }}>
              <td style={TD}><input style={IN} value={nL} placeholder="Nova função…" onChange={(e) => setNL(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} /></td>
              <td style={TD}><input style={IN} value={nV} placeholder="Nome de guerra…" onChange={(e) => setNV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} /></td>
              <td style={{ ...TD, textAlign: "center" }}>
                <button onClick={add} style={{ background: "rgba(37,99,235,.12)", border: "1px solid rgba(37,99,235,.3)", color: "var(--accent2)", borderRadius: 7, padding: "3px 10px", cursor: "pointer" }}>＋</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Ações do efetivo */}
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <button onClick={loadDefault} className="btn sm">⚡ Funções Padrão</button>

        {temModelo && (
          <button onClick={handleCarregarModelo} className="btn sm"
            style={{ borderColor: "rgba(34,197,94,.35)", color: "#22c55e" }}>
            📋 Carregar Modelo Salvo
          </button>
        )}

        <button onClick={handleSalvarModelo} className="btn sm"
          style={{ borderColor: "rgba(56,189,248,.35)", color: "var(--accent2)" }}
          title="Salva o efetivo atual como modelo padrão para os próximos relatórios">
          💾 Salvar como Modelo
        </button>
      </div>

      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
        💡 "Salvar como Modelo" memoriza o efetivo atual neste navegador e carrega automaticamente nos próximos relatórios.
      </p>
    </div>
  );
}

const TH: React.CSSProperties = { background: "rgba(37,99,235,.1)", border: "1px solid var(--border)", padding: "8px 10px", fontSize: 11, fontWeight: 600, letterSpacing: ".7px", textTransform: "uppercase", color: "var(--muted)", textAlign: "left" };
const TD: React.CSSProperties = { border: "1px solid var(--border)", padding: "5px 8px" };
const IN: React.CSSProperties = { background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 13, width: "100%", fontFamily: "inherit" };
const RM: React.CSSProperties = { background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 15, padding: "2px 6px" };
