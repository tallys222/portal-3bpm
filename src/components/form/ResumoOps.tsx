import React from "react";
import type { Resumo, ResumoCategoria } from "../../types/report";
import { RESUMO_ROWS, RESUMO_COLS, RESUMO_COL_LABELS } from "../../types/report";

interface Props { value: Resumo; onChange: (r: Resumo) => void; }

export function ResumoOps({ value, onChange }: Props) {
  const upd = (row: keyof Resumo, col: keyof ResumoCategoria, v: string) => {
    const newRow = { ...value[row], [col]: v };
    const tot = RESUMO_COLS.reduce((s, c) => s + (parseInt(newRow[c] as string) || 0), 0);
    newRow.total = String(tot).padStart(2, "0");
    onChange({ ...value, [row]: newRow });
  };

  return (
    <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 10 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...TH, textAlign: "left", width: 140 }}>Tipo</th>
            {RESUMO_COLS.map((c) => <th key={c} style={TH}>{RESUMO_COL_LABELS[c]}</th>)}
            <th style={{ ...TH, color: "var(--text)" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {RESUMO_ROWS.map((row) => (
            <tr key={row}>
              <td style={{ ...TD, textAlign: "left", fontWeight: 600, textTransform: "capitalize" }}>{row}</td>
              {RESUMO_COLS.map((col) => (
                <td key={col} style={{ ...TD, textAlign: "center" }}>
                  <input type="number" min={0} value={parseInt(value[row][col] as string) || 0}
                    onChange={(e) => upd(row, col, e.target.value)}
                    style={{ background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 14, textAlign: "center", width: 60, fontFamily: "inherit", fontWeight: 600 }} />
                </td>
              ))}
              <td style={{ ...TD, textAlign: "center", fontWeight: 700, color: "var(--dim)" }}>{value[row].total}</td>
            </tr>
          ))}
          <tr style={{ background: "rgba(37,99,235,.06)" }}>
            <td style={{ ...TD, textAlign: "left", fontWeight: 700 }}>TOTAL</td>
            {RESUMO_COLS.map((col) => (
              <td key={col} style={{ ...TD, textAlign: "center", fontWeight: 700 }}>
                {RESUMO_ROWS.reduce((s, row) => s + (parseInt(value[row][col] as string) || 0), 0)}
              </td>
            ))}
            <td style={{ ...TD, textAlign: "center", fontWeight: 700 }}>
              {RESUMO_ROWS.reduce((s, row) => s + (parseInt(value[row].total) || 0), 0)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const TH: React.CSSProperties = { background: "rgba(37,99,235,.1)", border: "1px solid var(--border)", padding: "9px 10px", fontSize: 11, fontWeight: 600, letterSpacing: ".6px", textTransform: "uppercase", color: "var(--muted)", textAlign: "center" };
const TD: React.CSSProperties = { border: "1px solid var(--border)", padding: "7px 10px", textAlign: "center" };
