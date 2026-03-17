import React, { useMemo, useState } from "react";
import { useReports } from "../hooks/useReports";
import { buildHistorico } from "../lib/reports";
import { useAuth } from "../contexts/AuthContext";
import { MOTIVO_COLORS } from "../types/report";

const MOTIVOS_ORDEM = [
  "DISPENSA MÉDICA",
  "DISPENSA DE SERVIÇO",
  "FALTA",
  "ATRASO",
  "PERMUTA",
  "EXECUÇÃO",
  "APRESENTAÇÃO",
];

// ── Barra de progresso CSS ────────────────────────────────────
function BarChart({ data, max }: { data: { label: string; value: number; color: string }[]; max: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: "grid", gridTemplateColumns: "180px 1fr 36px", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--muted)", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.label}</span>
          <div style={{ background: "rgba(37,99,235,.1)", borderRadius: 999, height: 10, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 999,
              background: d.color,
              width: max > 0 ? `${(d.value / max) * 100}%` : "0%",
              transition: "width .4s ease",
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: d.color }}>{d.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Card de stat ──────────────────────────────────────────────
function StatCard({ v, l, c, sub }: { v: number; l: string; c: string; sub?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-val" style={{ color: c }}>{v}</div>
      <div className="stat-lbl">{l}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

export function Historico() {
  const { userProfile } = useAuth();
  const { reports, loading } = useReports(userProfile);
  const [search, setSearch] = useState("");
  const [filtroMotivo, setFiltroMotivo] = useState("");
  const [filtroMes, setFiltroMes] = useState(""); // "01/2026"
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [abaAtiva, setAbaAtiva] = useState<"dashboard" | "militares">("dashboard");

  // ── Períodos disponíveis (mês/ano) extraídos dos relatórios ──
  const periodosDisponiveis = useMemo(() => {
    const set = new Set<string>();
    for (const rep of reports) {
      const p = extrairPeriodo(rep.relatorio_data);
      if (p !== "??/????") set.add(p);
    }
    return Array.from(set).sort((a, b) => {
      const [ma, ya] = a.split("/");
      const [mb, yb] = b.split("/");
      return `${ya}${ma}`.localeCompare(`${yb}${mb}`);
    }).reverse();
  }, [reports]);

  // ── Filtra relatórios por mês ────────────────────────────
  const relsFiltrados = useMemo(() => {
    if (!filtroMes) return reports;
    return reports.filter(r => extrairPeriodo(r.relatorio_data) === filtroMes);
  }, [reports, filtroMes]);

  const historico = useMemo(() => buildHistorico(relsFiltrados), [relsFiltrados]);

  // ── Totais por motivo ────────────────────────────────────
  const totaisPorMotivo = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of historico) {
      for (const o of m.ocorrencias) {
        map[o.motivo] = (map[o.motivo] || 0) + 1;
      }
    }
    return map;
  }, [historico]);

  const totalAlteracoes = Object.values(totaisPorMotivo).reduce((s, v) => s + v, 0);
  const maxMotivo = Math.max(...Object.values(totaisPorMotivo), 1);

  // ── Ranking: militares com mais ocorrências ──────────────
  const ranking = useMemo(() => {
    return [...historico]
      .map(m => ({
        ...m,
        total: filtroMotivo
          ? m.ocorrencias.filter(o => o.motivo === filtroMotivo).length
          : m.ocorrencias.length,
      }))
      .filter(m => m.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [historico, filtroMotivo]);

  const maxRanking = ranking[0]?.total || 1;

  // ── Função auxiliar: extrai "MM/YYYY" de qualquer formato de data ──
  function extrairPeriodo(data: string | undefined): string {
    if (!data) return "??/????";
    const d = data.trim();
    if (d.includes("/")) {
      const p = d.split("/");
      if (p.length >= 3) return `${p[1]}/${p[2]}`; // "15/01/2026" → "01/2026"
      if (p.length === 2) return `${p[0]}/${p[1]}`;
    }
    if (/^\d{8}$/.test(d)) return `${d.slice(2, 4)}/${d.slice(4, 8)}`; // "08102025" → "10/2025"
    if (d.includes("-")) {
      const p = d.split("-");
      if (p.length >= 3) return `${p[1]}/${p[0]}`; // "2026-01-15" → "01/2026"
    }
    return "??/????";
  }

  // ── Evolução por mês (últimos 6 meses) ───────────────────
  const evolucaoMensal = useMemo(() => {
    const map: Record<string, number> = {};
    for (const rep of reports) {
      const key = extrairPeriodo(rep.relatorio_data);
      if (key === "??/????") continue;
      for (const alt of rep.alteracoes ?? []) {
        if (filtroMotivo && alt.motivo !== filtroMotivo) continue;
        map[key] = (map[key] || 0) + 1;
      }
    }
    return Object.entries(map)
      .sort((a, b) => {
        const [ma, ya] = a[0].split("/");
        const [mb, yb] = b[0].split("/");
        return `${ya}${ma}`.localeCompare(`${yb}${mb}`);
      })
      .slice(-6);
  }, [reports, filtroMotivo]);

  const maxEvolucao = Math.max(...evolucaoMensal.map(e => e[1]), 1);

  // ── Militares filtrados ──────────────────────────────────
  const militaresFiltrados = useMemo(() => {
    return historico.filter(m => {
      const matchNome = !search || m.nomeCompleto.toLowerCase().includes(search.toLowerCase());
      const matchMotivo = !filtroMotivo || m.ocorrencias.some(o => o.motivo === filtroMotivo);
      return matchNome && matchMotivo;
    });
  }, [historico, search, filtroMotivo]);

  function toggle(nome: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(nome) ? next.delete(nome) : next.add(nome);
      return next;
    });
  }

  if (loading) return <p style={{ color: "var(--muted)", padding: 24 }}>Carregando histórico…</p>;

  return (
    <div>
      {/* ── Filtros globais ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
          style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: 9, color: "var(--text)", padding: "9px 12px", fontSize: 14, outline: "none", fontFamily: "inherit" }}>
          <option value="">Todos os períodos</option>
          {periodosDisponiveis.map(p => {
            const [m, y] = p.split("/");
            const nomes = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
            return <option key={p} value={p}>{nomes[parseInt(m) - 1]}/{y}</option>;
          })}
        </select>
        <select value={filtroMotivo} onChange={e => setFiltroMotivo(e.target.value)}
          style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: 9, color: "var(--text)", padding: "9px 12px", fontSize: 14, outline: "none", fontFamily: "inherit" }}>
          <option value="">Todos os motivos</option>
          {MOTIVOS_ORDEM.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {(filtroMes || filtroMotivo) && (
          <button className="btn sm" onClick={() => { setFiltroMes(""); setFiltroMotivo(""); }}>✕ Limpar filtros</button>
        )}
      </div>

      {/* ── Sub-abas ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {(["dashboard", "militares"] as const).map(aba => (
          <button key={aba} className={`tab-btn${abaAtiva === aba ? " active" : ""}`} onClick={() => setAbaAtiva(aba)}>
            {aba === "dashboard" ? "📊 Dashboard" : "👤 Por Militar"}
          </button>
        ))}
      </div>

      {/* ══════════ DASHBOARD ══════════ */}
      {abaAtiva === "dashboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Stats gerais */}
          <div className="stats-grid">
            <StatCard v={relsFiltrados.length} l="Relatórios" c="#38bdf8" />
            <StatCard v={historico.length} l="Militares c/ registro" c="#a78bfa" />
            <StatCard v={totalAlteracoes} l="Total de alterações" c="#94a3b8" />
            <StatCard v={totaisPorMotivo["DISPENSA MÉDICA"] || 0} l="Dispensas Médicas" c="#38bdf8" />
            <StatCard v={totaisPorMotivo["DISPENSA DE SERVIÇO"] || 0} l="Dispensas de Serviço" c="#a78bfa" />
            <StatCard v={totaisPorMotivo["FALTA"] || 0} l="Faltas" c="#f87171" />
            <StatCard v={totaisPorMotivo["PERMUTA"] || 0} l="Permutas" c="#fbbf24" />
            <StatCard v={totaisPorMotivo["EXECUÇÃO"] || 0} l="Execuções" c="#34d399" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Alterações por motivo */}
            <div className="card" style={{ margin: 0 }}>
              <div className="card-hd">Alterações por Motivo</div>
              {totalAlteracoes === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 13 }}>Nenhuma alteração no período.</p>
              ) : (
                <BarChart
                  max={maxMotivo}
                  data={MOTIVOS_ORDEM
                    .filter(m => totaisPorMotivo[m] > 0)
                    .map(m => ({ label: m, value: totaisPorMotivo[m] || 0, color: MOTIVO_COLORS[m] || "#888" }))
                    .sort((a, b) => b.value - a.value)
                  }
                />
              )}
            </div>

            {/* Ranking top 10 */}
            <div className="card" style={{ margin: 0 }}>
              <div className="card-hd">Top 10 — Mais Registros{filtroMotivo ? ` (${filtroMotivo})` : ""}</div>
              {ranking.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 13 }}>Nenhum dado no período.</p>
              ) : (
                <BarChart
                  max={maxRanking}
                  data={ranking.map(m => ({
                    label: m.nomeCompleto,
                    value: m.total,
                    color: "#38bdf8",
                  }))}
                />
              )}
            </div>
          </div>

          {/* Evolução mensal */}
          {evolucaoMensal.length > 1 && (
            <div className="card" style={{ margin: 0 }}>
              <div className="card-hd">Evolução Mensal{filtroMotivo ? ` — ${filtroMotivo}` : " — Todas as alterações"}</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 100, padding: "0 8px" }}>
                {evolucaoMensal.map(([mes, val]) => (
                  <div key={mes} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent2)" }}>{val}</span>
                    <div style={{
                      width: "100%", borderRadius: "4px 4px 0 0",
                      background: "linear-gradient(to top, var(--accent), var(--accent2))",
                      height: `${Math.max((val / maxEvolucao) * 80, 4)}px`,
                      transition: "height .4s ease",
                    }} />
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>{mes}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════ POR MILITAR ══════════ */}
      {abaAtiva === "militares" && (
        <div>
          <div className="hist-search">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍  Buscar por nome ou graduação…" />
          </div>

          {!militaresFiltrados.length ? (
            <div className="empty"><div className="ei">👥</div>
              {search ? "Nenhum militar encontrado." : "Nenhuma alteração registrada ainda."}
            </div>
          ) : (
            militaresFiltrados.map((m) => {
              const isOpen = expanded.has(m.nomeCompleto);
              const counts: Record<string, number> = {};
              m.ocorrencias.forEach(o => { counts[o.motivo] = (counts[o.motivo] || 0) + 1; });
              const occsVisiveis = filtroMotivo
                ? m.ocorrencias.filter(o => o.motivo === filtroMotivo)
                : m.ocorrencias;

              return (
                <div key={m.nomeCompleto} className="mil-row">
                  <div className="mil-hd" onClick={() => toggle(m.nomeCompleto)}>
                    <div>
                      <div className="mil-name">{m.nomeCompleto}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                        {m.ocorrencias.length} registro{m.ocorrencias.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="mil-chips">
                      {Object.entries(counts).map(([mot, cnt]) => (
                        <span key={mot} className="chip-count"
                          style={{ background: `${MOTIVO_COLORS[mot] || "#888"}18`, border: `1px solid ${MOTIVO_COLORS[mot] || "#888"}44`, color: MOTIVO_COLORS[mot] || "var(--text)" }}>
                          {mot}: {cnt}
                        </span>
                      ))}
                      <span style={{ color: "var(--muted)", fontSize: 18, marginLeft: 8 }}>{isOpen ? "∨" : "›"}</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="mil-body open">
                      <div className="mil-occs">
                        {occsVisiveis.map((o, i) => (
                          <div key={i} className="mil-occ-item">
                            <span className="mil-occ-date">{o.relatorio_data}</span>
                            <span className="mil-occ-tipo" style={{ color: MOTIVO_COLORS[o.motivo] || "var(--text)" }}>{o.motivo}</span>
                            <span className="mil-occ-obs">
                              {o.guarnicao}{o.tempo ? ` · ${o.tempo}` : ""}{o.numParte ? ` · Parte ${o.numParte}` : ""}{o.observacao ? ` — ${o.observacao}` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}