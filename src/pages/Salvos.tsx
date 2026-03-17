import React, { useState, useMemo } from "react";
import { useReports } from "../hooks/useReports";
import { deleteReport } from "../lib/reports";
import { exportarConsolidadoXlsx } from "../lib/exportXlsx";
import { useAuth } from "../contexts/AuthContext";
import { ModalRelatorio } from "../components/shared/ModalRelatorio";
import { toast } from "../components/shared/Toast";
import type { Report } from "../types/report";

const NOMES_MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

interface Props {
  onDuplicar?: (report: Report) => void;
}

export function Salvos({ onDuplicar }: Props) {
  const { userProfile, isGestor } = useAuth();
  const { reports, loading, error, refresh } = useReports(userProfile);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Report | null>(null);
  // Conjunto de períodos expandidos ("01/2026", "03/2026", ...)
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  // ── Filtra por busca ──────────────────────────────────────
  const filtrados = useMemo(() => {
    if (!search.trim()) return reports;
    const q = search.toLowerCase();
    return reports.filter(r =>
      `${r.relatorio_num} ${r.relatorio_data} ${r.supervisor_nome}`.toLowerCase().includes(q)
    );
  }, [reports, search]);

  // ── Normaliza data para "MM/YYYY" independente do formato ──
  function extrairMesAno(data: string | undefined): string {
    if (!data) return "??/????";
    const d = data.trim();

    // Formato esperado: "15/01/2026" → MM/YYYY = "01/2026"
    if (d.includes("/")) {
      const partes = d.split("/");
      if (partes.length >= 3) return `${partes[1]}/${partes[2]}`;
      if (partes.length === 2) return `${partes[0]}/${partes[1]}`;
    }

    // Formato legado sem barras: "08102025" (DDMMYYYY)
    if (/^\d{8}$/.test(d)) {
      return `${d.slice(2, 4)}/${d.slice(4, 8)}`;
    }

    // Formato ISO: "2026-01-15"
    if (d.includes("-")) {
      const partes = d.split("-");
      if (partes.length >= 3) return `${partes[1]}/${partes[0]}`;
    }

    return "??/????";
  }

  // ── Agrupa por mês/ano ────────────────────────────────────
  const grupos = useMemo(() => {
    const map = new Map<string, { label: string; items: Report[] }>();
    for (const r of filtrados) {
      const chave = extrairMesAno(r.relatorio_data);
      if (!map.has(chave)) {
        const [m, y] = chave.split("/");
        const mesNome = NOMES_MESES[parseInt(m) - 1] ?? m;
        const label = `${mesNome}/${y}`;
        map.set(chave, { label, items: [] });
      }
      map.get(chave)!.items.push(r);
    }
    return Array.from(map.entries()).sort((a, b) => {
      const [ma, ya] = a[0].split("/");
      const [mb, yb] = b[0].split("/");
      return `${yb}${mb}`.localeCompare(`${ya}${ma}`);
    });
  }, [filtrados]);

  // Expande automaticamente o primeiro grupo (mês mais recente)
  const primeiraChave = grupos[0]?.[0];
  const expandidosEfetivos = useMemo(() => {
    if (expandidos.size > 0) return expandidos;
    if (primeiraChave) return new Set([primeiraChave]);
    return new Set<string>();
  }, [expandidos, primeiraChave]);

  function toggleGrupo(chave: string) {
    setExpandidos(prev => {
      const next = new Set(prev.size > 0 ? prev : [primeiraChave ?? ""]);
      next.has(chave) ? next.delete(chave) : next.add(chave);
      return next;
    });
  }

  function expandirTodos() {
    setExpandidos(new Set(grupos.map(([k]) => k)));
  }

  function recolherTodos() {
    setExpandidos(new Set());
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este relatório? Ação irreversível.")) return;
    await deleteReport(id);
    toast("Relatório excluído.", "ok");
    refresh();
    if (selected?.id === id) setSelected(null);
  }

  if (loading) return <p style={{ color: "var(--muted)", padding: 24 }}>Carregando relatórios…</p>;
  if (error)   return <p style={{ color: "var(--danger)", padding: 24 }}>Erro: {error}</p>;

  return (
    <div>
      {/* Toolbar */}
      <div className="saved-bar">
        <input
          placeholder="🔍  Buscar por número, data, supervisor…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {isGestor && (
          <button className="btn sm" onClick={() => exportarConsolidadoXlsx(filtrados)}>
            📊 Excel Consolidado
          </button>
        )}
        <button className="btn sm" onClick={expandirTodos}>↕ Expandir todos</button>
        <button className="btn sm" onClick={recolherTodos}>↕ Recolher todos</button>
      </div>

      {/* Contagem total */}
      {filtrados.length > 0 && (
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
          {filtrados.length} relatório{filtrados.length !== 1 ? "s" : ""} em {grupos.length} período{grupos.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Grupos por mês */}
      {!grupos.length ? (
        <div className="empty"><div className="ei">📭</div>Nenhum relatório encontrado.</div>
      ) : (
        grupos.map(([chave, { label, items }]) => {
          const isOpen = expandidosEfetivos.has(chave);
          return (
            <div key={chave} style={{ marginBottom: 12 }}>
              {/* Cabeçalho do grupo */}
              <button
                onClick={() => toggleGrupo(chave)}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  justifyContent: "space-between", gap: 12,
                  background: isOpen ? "rgba(37,99,235,.1)" : "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: isOpen ? "10px 10px 0 0" : 10,
                  padding: "12px 18px", cursor: "pointer",
                  transition: "background .15s, border-radius .15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    fontFamily: "var(--fh)", fontSize: 17, fontWeight: 700,
                    letterSpacing: ".5px", color: isOpen ? "var(--accent2)" : "var(--text)",
                  }}>
                    📅 {label}
                  </span>
                  <span style={{
                    background: "rgba(37,99,235,.15)", border: "1px solid rgba(37,99,235,.3)",
                    borderRadius: 999, padding: "2px 10px",
                    fontSize: 12, fontWeight: 700, color: "var(--accent2)",
                  }}>
                    {items.length} relatório{items.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <span style={{ color: "var(--muted)", fontSize: 20, lineHeight: 1 }}>
                  {isOpen ? "∨" : "›"}
                </span>
              </button>

              {/* Itens do grupo */}
              {isOpen && (
                <div style={{
                  border: "1px solid var(--border)", borderTop: "none",
                  borderRadius: "0 0 10px 10px",
                  overflow: "hidden",
                }}>
                  {items.map((r, idx) => {
                    const nAlt = r.alteracoes?.length ?? 0;
                    const canDel = isGestor || r.createdBy === userProfile?.uid;
                    return (
                      <div
                        key={r.id}
                        className="rep-row"
                        style={{
                          borderRadius: 0,
                          borderLeft: "none", borderRight: "none", borderTop: "none",
                          borderBottom: idx < items.length - 1 ? "1px solid var(--border)" : "none",
                          marginBottom: 0,
                        }}
                      >
                        <div className="rep-icon">📋</div>
                        <div className="rep-info">
                          <div className="rep-title">{r.relatorio_num}</div>
                          <div className="rep-meta">
                            📅 {r.relatorio_data}&nbsp;·&nbsp;
                            👤 {r.supervisor_nome}&nbsp;·&nbsp;
                            📝 {nAlt} alteraç{nAlt !== 1 ? "ões" : "ão"}
                          </div>
                        </div>
                        <div className="rep-actions">
                          <button className="btn sm" onClick={() => setSelected(r)}>👁 Ver</button>
                          <button
                            className="btn sm"
                            onClick={() => onDuplicar?.(r)}
                            style={{ borderColor: "rgba(56,189,248,.3)", color: "var(--accent2)" }}
                          >
                            📋 Duplicar
                          </button>
                          {canDel && (
                            <button className="btn sm danger" onClick={() => handleDelete(r.id)}>🗑</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}

      {selected && (
        <ModalRelatorio
          report={selected}
          onClose={() => setSelected(null)}
          onDelete={() => handleDelete(selected.id)}
          canDelete={isGestor || selected.createdBy === userProfile?.uid}
        />
      )}
    </div>
  );
}