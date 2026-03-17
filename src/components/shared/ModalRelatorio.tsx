import React, { useEffect } from "react";
import type { Report } from "../../types/report";
import { MOTIVO_COLORS } from "../../types/report";
import { exportarPdf } from "../../lib/exportPdf";
import { exportarXlsx } from "../../lib/exportXlsx";

interface Props {
  report: Report;
  onClose: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

export function ModalRelatorio({ report: r, onClose, onDelete, canDelete }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="modal-bg open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-sh">
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Cabeçalho */}
        <div className="view-hd">
          <h3>Relatório nº {r.relatorio_num}</h3>
          <div className="view-sub">Quartel em Arapiraca/AL, {r.relatorio_data}</div>
        </div>
        <div className="view-meta">
          <div className="vm-item"><label>Supervisor</label><span>{r.supervisor_nome}</span></div>
          <div className="vm-item"><label>Matrícula</label><span>{r.supervisor_matricula}</span></div>
        </div>

        {/* Efetivo */}
        <div className="view-sec">1 — Efetivo / Relação Nominal</div>
        {r.efetivo?.length ? (
          <div style={{ overflowX: "auto" }}>
            <table className="view-table">
              <thead><tr><th>Função</th><th>Nome</th></tr></thead>
              <tbody>
                {r.efetivo.map((e, i) => (
                  <tr key={i}><td>{e.label}</td><td>{e.value || "SEM RECURSO"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p style={{ color: "var(--muted)" }}>—</p>}

        {/* Alterações */}
        <div className="view-sec">1.3 — Alterações / Dispensas / Execuções</div>
        {r.alteracoes?.length ? (
          <div style={{ overflowX: "auto" }}>
            <table className="view-table" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th>Motivo</th><th>N.Ordem</th><th>Grad</th><th>Nome</th>
                  <th>Tempo</th><th>Guarnição</th><th>Nº Parte</th><th>Observação</th>
                </tr>
              </thead>
              <tbody>
                {r.alteracoes.map((a, i) => (
                  <tr key={i}>
                    <td style={{ color: MOTIVO_COLORS[a.motivo] || "var(--text)", fontWeight: 600, whiteSpace: "nowrap" }}>{a.motivo}</td>
                    <td>{a.ordem}</td>
                    <td>{a.grad}</td>
                    <td>{a.nome}</td>
                    <td>{a.tempo}</td>
                    <td>{a.guarnicao}</td>
                    <td>{a.numParte}</td>
                    <td style={{ fontSize: 12 }}>{a.observacao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p style={{ color: "var(--muted)" }}>Nenhum registro.</p>}

        {/* Observações */}
        {r.observacoes && (
          <>
            <div className="view-sec">Observações / Anexos</div>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>{r.observacoes}</p>
          </>
        )}

        {/* Ações */}
        <div className="modal-foot">
          <button className="btn sm primary" onClick={() => exportarPdf(r)}>📄 PDF</button>
          <button className="btn sm" onClick={() => exportarXlsx(r)}>📊 Excel</button>
          {canDelete && (
            <button className="btn sm danger" onClick={onDelete}>🗑 Excluir</button>
          )}
        </div>
      </div>
    </div>
  );
}
