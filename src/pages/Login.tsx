import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";

export function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !senha) return;
    setLoading(true); setError("");
    try {
      await signInWithEmailAndPassword(auth, email, senha);
    } catch (err: any) {
      const msg: Record<string, string> = {
        "auth/invalid-credential": "E-mail ou senha incorretos.",
        "auth/user-not-found": "Usuário não encontrado.",
        "auth/wrong-password": "Senha incorreta.",
        "auth/too-many-requests": "Muitas tentativas. Aguarde e tente novamente.",
      };
      setError(msg[err.code] ?? "Erro ao entrar. Verifique seus dados.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap" style={{ position: "relative", zIndex: 1 }}>
      <div className="login-card">
        <div className="login-logo">
          <div className="login-emblem">3BPM</div>
          <div className="login-title">RELATÓRIO DE SERVIÇO</div>
          <div className="login-sub">3º Batalhão de Polícia Militar · Alagoas</div>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="fg">
            <label>E-mail</label>
            <input
              type="email" value={email} autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
          <div className="fg">
            <label>Senha</label>
            <input
              type="password" value={senha} autoComplete="current-password"
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="login-err">⚠ {error}</p>}
          <button type="submit" className="btn primary" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
