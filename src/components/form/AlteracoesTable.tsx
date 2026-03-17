import React, { useState, useRef, useEffect } from "react";
import type { Alteracao } from "../../types/report";
import { MOTIVOS_LIST, GRADS_LIST, MOTIVO_COLORS } from "../../types/report";
import type { NomeConhecido } from "../../hooks/useNomesConhecidos";

const GUARNICOES_LIST = [
  "RADIOPATRULHA", "PELOPES", "ROCAM", "CANIL", "CAVALARIA",
  "ÁGUIAS", "FORÇA TAREFA", "POLICIAMENTO COMUNITÁRIO",
  "PATRULHA MARIA DA PENHA", "FÓRUM", "MINISTÉRIO PÚBLICO",
  "HOSPITAL DO AGRESTE", "COMPLEXO DE JUSTIÇA", "ARMEIRO",
  "CAVALARIÇO", "COPOM", "VISTORIADOR", "GUARDA DO QUARTEL",
  "AUXILIAR DO SUPERVISOR",
] as const;

interface Props {
  value: Alteracao[];
  onChange: (v: Alteracao[]) => void;
  nomesConhecidos?: NomeConhecido[];
}

const empty = (): Alteracao => ({
  grad: "", guarnicao: "", motivo: "DISPENSA DE SERVIÇO",
  nome: "", numParte: "", observacao: "", ordem: "", tempo: "24 Horas",
});

// ── Autocomplete component ────────────────────────────────────
function AutocompleteNome({
  value, onChange, onSelect, nomesConhecidos,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (n: NomeConhecido) => void;
  nomesConhecidos: NomeConhecido[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = value.length >= 2
    ? nomesConhecidos.filter(n =>
        n.nome.toLowerCase().includes(value.toLowerCase()) ||
        n.label.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8)
    : [];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <input
        style={IN}
        value={value}
        placeholder="Nome de guerra"
        onChange={(e) => { onChange(e.target.value.toUpperCase()); setOpen(true); }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, zIndex: 100,
          background: "#0d1530", border: "1px solid var(--border)",
          borderRadius: 8, minWidth: 220, maxHeight: 220, overflowY: "auto",
          boxShadow: "0 8px 24px rgba(0,0,0,.5)",
        }}>
          {filtered.map((n, i) => (
            <div key={i}
              onMouseDown={(e) => { e.preventDefault(); onSelect(n); setOpen(false); }}
              style={{
                padding: "8px 12px", cursor: "pointer", fontSize: 13,
                borderBottom: "1px solid rgba(26,45,90,.4)",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(37,99,235,.12)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ color: "var(--text)", fontWeight: 600 }}>{n.grad} {n.nome}</span>
              {n.guarnicao && <span style={{ color: "var(--muted)", fontSize: 11, marginLeft: 6 }}>({n.guarnicao})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

export function AlteracoesTable({ value, onChange, nomesConhecidos = [] }: Props) {
  const upd = (i: number, f: keyof Alteracao, v: string) =>
    onChange(value.map((x, j) => j === i ? { ...x, [f]: v } : x));
  const updMulti = (i: number, fields: Partial<Alteracao>) =>
    onChange(value.map((x, j) => j === i ? { ...x, ...fields } : x));
  const add = () => onChange([...value, empty()]);
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));

  if (!value.length) return (
    <div>
      <div style={{ textAlign: "center", padding: 20, color: "var(--muted)", border: "1px dashed var(--border)", borderRadius: 10, marginBottom: 10, fontSize: 13 }}>
        Nenhum registro.
      </div>
      <button onClick={add} className="btn sm">＋ Adicionar Registro</button>
    </div>
  );

  return (
    <div>
      <div style={{ border: "1px solid var(--border)", borderRadius: 10, marginBottom: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th style={{ ...TH, width: "16%" }}>Motivo</th>
              <th style={{ ...TH, width: "9%" }}>N. Ordem</th>
              <th style={{ ...TH, width: "9%" }}>Grad</th>
              <th style={{ ...TH, width: "13%" }}>Nome</th>
              <th style={{ ...TH, width: "9%" }}>Tempo</th>
              <th style={{ ...TH, width: "12%" }}>Guarnição</th>
              <th style={{ ...TH, width: "10%" }}>Nº Parte</th>
              <th style={TH}>Observação</th>
              <th style={{ ...TH, width: "3%" }}></th>
            </tr>
          </thead>
          <tbody>
            {value.map((a, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(26,45,90,.5)" }}>

                {/* Motivo */}
                <td style={TD}>
                  <select value={a.motivo} onChange={(e) => upd(i, "motivo", e.target.value)}
                    style={{ ...DROPSTYLE, color: MOTIVO_COLORS[a.motivo] || "var(--text)" }}>
                    {MOTIVOS_LIST.map((m) => (
                      <option key={m} value={m} style={{ background: "#0d1530", color: "var(--text)" }}>{m}</option>
                    ))}
                  </select>
                </td>

                {/* N. Ordem */}
                <td style={TD}>
                  <input style={IN} value={a.ordem} placeholder="Nº Ordem"
                    onChange={(e) => upd(i, "ordem", e.target.value)} />
                </td>

                {/* Grad */}
                <td style={TD}>
                  <select value={a.grad} onChange={(e) => upd(i, "grad", e.target.value)}
                    style={{ ...DROPSTYLE, color: "var(--text)" }}>
                    <option value="" style={{ background: "#0d1530" }}>—</option>
                    {GRADS_LIST.map((g) => (
                      <option key={g} value={g} style={{ background: "#0d1530", color: "var(--text)" }}>{g}</option>
                    ))}
                  </select>
                </td>

                {/* Nome com autocomplete */}
                <td style={{ ...TD, overflow: "visible" }}>
                  <AutocompleteNome
                    value={a.nome}
                    onChange={(v) => upd(i, "nome", v)}
                    nomesConhecidos={nomesConhecidos}
                    onSelect={(n) => updMulti(i, {
                      nome: n.nome,
                      grad: n.grad || a.grad,
                      guarnicao: n.guarnicao || a.guarnicao,
                    })}
                  />
                </td>

                {/* Tempo */}
                <td style={TD}>
                  <select value={a.tempo} onChange={(e) => upd(i, "tempo", e.target.value)}
                    style={{ ...DROPSTYLE, color: "var(--text)" }}>
                    {["06 Horas", "12 Horas", "24 Horas", "Parcial"].map((t) => (
                      <option key={t} value={t} style={{ background: "#0d1530", color: "var(--text)" }}>{t}</option>
                    ))}
                  </select>
                </td>

                {/* Guarnição */}
                <td style={TD}>
                  <select value={a.guarnicao} onChange={(e) => upd(i, "guarnicao", e.target.value)}
                    style={{ ...DROPSTYLE, color: a.guarnicao ? "var(--text)" : "var(--muted)" }}>
                    <option value="" style={{ background: "#0d1530", color: "var(--muted)" }}>Guarnição…</option>
                    {GUARNICOES_LIST.map((g) => (
                      <option key={g} value={g} style={{ background: "#0d1530", color: "var(--text)" }}>{g}</option>
                    ))}
                  </select>
                </td>

                {/* Nº Parte */}
                <td style={TD}>
                  <input style={IN} value={a.numParte} placeholder="Ex.: 408/2026"
                    onChange={(e) => upd(i, "numParte", e.target.value)} />
                </td>

                {/* Observação */}
                <td style={TD}>
                  <input style={{ ...IN, minWidth: 0 }} value={a.observacao} placeholder="Observação"
                    onChange={(e) => upd(i, "observacao", e.target.value)} />
                </td>

                {/* Remover */}
                <td style={{ ...TD, textAlign: "center" }}>
                  <button onClick={() => remove(i)} style={RM}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={add} className="btn sm">＋ Adicionar Registro</button>
    </div>
  );
}

const TH: React.CSSProperties = {
  background: "rgba(37,99,235,.1)", borderBottom: "1px solid var(--border)",
  padding: "10px 12px", fontSize: 11, fontWeight: 600, letterSpacing: ".6px",
  textTransform: "uppercase", color: "var(--muted)", textAlign: "left", whiteSpace: "nowrap",
};
const TD: React.CSSProperties = { padding: "7px 8px", verticalAlign: "middle" };
const IN: React.CSSProperties = {
  background: "transparent", border: "none", outline: "none",
  color: "var(--text)", fontSize: 13, width: "100%", fontFamily: "inherit",
};
const DROPSTYLE: React.CSSProperties = {
  background: "var(--surf)", border: "1px solid var(--border)", borderRadius: 7,
  padding: "5px 7px", width: "100%", fontSize: 12, fontFamily: "inherit",
  fontWeight: 600, outline: "none", cursor: "pointer",
};
const RM: React.CSSProperties = {
  background: "none", border: "none", color: "var(--muted)",
  cursor: "pointer", fontSize: 15, padding: "3px 5px",
};
