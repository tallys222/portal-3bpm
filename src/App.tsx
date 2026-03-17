import React, { useState, useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useAuth } from "./contexts/AuthContext";
import { Login } from "./pages/Login";
import { NovoRelatorio } from "./pages/NovoRelatorio";
import { Salvos } from "./pages/Salvos";
import { Historico } from "./pages/Historico";
import { ToastContainer } from "./components/shared/Toast";
import type { Report } from "./types/report";

type Tab = "novo" | "salvos" | "historico";

// Dados pré-preenchidos ao duplicar um relatório
interface DuplicarPayload {
  report: Report;
  key: number;
}

export default function App() {
  const { firebaseUser, userProfile, loading, isGestor } = useAuth();
  const [tab, setTab] = useState<Tab>("novo");
  const [salvosKey, setSalvosKey] = useState(0);
  const [duplicar, setDuplicar] = useState<DuplicarPayload | null>(null);

  // Gestor entra direto no Dashboard
  React.useEffect(() => {
    if (isGestor) setTab("historico");
  }, [isGestor]);

  const handleDuplicar = useCallback((report: Report) => {
    setDuplicar({ report, key: Date.now() });
    setTab("novo");
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
        <div style={{ color: "var(--muted)", fontFamily: "var(--fh)", fontSize: 18, letterSpacing: 1 }}>Carregando…</div>
      </div>
    );
  }

  if (!firebaseUser) return <Login />;

  return (
    <>
      <div className="wrap">
        {/* Header */}
        <header className="site-header">
          <div className="brand">
            <div className="emblem">3BPM</div>
            <div>
              <div className="site-title">RELATÓRIO DE SERVIÇO</div>
              <div className="site-sub">3º Batalhão de Polícia Militar · Alagoas</div>
            </div>
          </div>
          <div className="hdr-right">
            <strong>{userProfile?.fullName || firebaseUser.email}</strong>
            <span>
              {userProfile?.rankName}{" "}
              <span style={{
                display: "inline-block", padding: "1px 8px", borderRadius: 999,
                fontSize: 10, fontWeight: 700, letterSpacing: ".5px",
                background: isGestor ? "rgba(34,197,94,.12)" : "rgba(37,99,235,.12)",
                border: `1px solid ${isGestor ? "rgba(34,197,94,.3)" : "rgba(37,99,235,.3)"}`,
                color: isGestor ? "#22c55e" : "var(--accent2)",
              }}>
                {isGestor ? "GESTOR" : (userProfile?.role || "OPERADOR")}
              </span>
            </span>
            <button className="btn sm danger" onClick={() => signOut(auth)} style={{ marginTop: 6 }}>Sair</button>
          </div>
        </header>

        {/* Tabs */}
        <nav className="nav-tabs">
          {!isGestor && (
            <button className={`tab-btn${tab === "novo" ? " active" : ""}`} onClick={() => { setTab("novo"); setDuplicar(null); }}>
              ＋ Novo Relatório
            </button>
          )}
          {isGestor && (
            <button className={`tab-btn${tab === "historico" ? " active" : ""}`} onClick={() => setTab("historico")}>
              📊 Histórico & Dashboard
            </button>
          )}
          <button className={`tab-btn${tab === "salvos" ? " active" : ""}`} onClick={() => setTab("salvos")}>
            📋 Relatórios Salvos
          </button>
        </nav>

        {/* Aviso de duplicação */}
        {tab === "novo" && duplicar && (
          <div style={{
            background: "rgba(56,189,248,.08)", border: "1px solid rgba(56,189,248,.3)",
            borderRadius: 10, padding: "10px 16px", marginBottom: 16,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <span style={{ color: "var(--accent2)", fontSize: 13 }}>
              📋 Duplicando: <b>{duplicar.report.relatorio_num}</b> — efetivo e dados pré-carregados. Revise e salve.
            </span>
            <button className="btn sm danger" onClick={() => setDuplicar(null)}>✕</button>
          </div>
        )}

        {tab === "novo" && !isGestor && (
          <NovoRelatorio
            key={duplicar?.key}
            initialData={duplicar?.report}
            onSaved={() => { setSalvosKey(k => k + 1); setTab("salvos"); setDuplicar(null); }}
          />
        )}
        {tab === "historico" && isGestor && <Historico />}
        {tab === "salvos" && <Salvos key={salvosKey} onDuplicar={!isGestor ? handleDuplicar : undefined} />}
        
      </div>
      <ToastContainer />
    </>
  );
}