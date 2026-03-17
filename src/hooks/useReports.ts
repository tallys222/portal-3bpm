import { useState, useEffect, useCallback } from "react";
import { listAllReports, listMyReports } from "../lib/reports";
import type { Report, UserProfile } from "../types/report";

export function useReports(user: UserProfile | null) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Usa role (campo real do Firestore) para decidir quais relatórios carregar
  const isGestor = ["ADMINISTRADOR", "DESENVOLVEDOR"].includes(user?.role ?? "");

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError(null);
    try {
      const data = isGestor
        ? await listAllReports()
        : await listMyReports(user.uid);
      setReports(data);
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [user?.uid, isGestor]);

  useEffect(() => { fetch(); }, [fetch]);
  return { reports, loading, error, refresh: fetch };
}