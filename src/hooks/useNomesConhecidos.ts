import { useMemo } from "react";
import type { Report } from "../types/report";
import { normalizarNome } from "../lib/reports";

export interface NomeConhecido {
  grad: string;
  nome: string;
  guarnicao: string;
  label: string;
}

export function useNomesConhecidos(reports: Report[]): NomeConhecido[] {
  return useMemo(() => {
    const map = new Map<string, NomeConhecido>();
    for (const rep of reports) {
      for (const alt of rep.alteracoes ?? []) {
        if (!alt.nome) continue;
        const ordemLimpa = (alt.ordem ?? "").trim();
        const key = ordemLimpa
          ? `ordem:${ordemLimpa}`
          : `nome:${normalizarNome(alt.grad)}|${normalizarNome(alt.nome)}`;

        // Sempre atualiza com o registro mais recente (captura promoções)
        map.set(key, {
          grad: alt.grad.toUpperCase().trim(),
          nome: alt.nome.toUpperCase().trim(),
          guarnicao: alt.guarnicao,
          label: `${alt.grad ? alt.grad + " " : ""}${alt.nome}${alt.guarnicao ? " (" + alt.guarnicao + ")" : ""}`.toUpperCase(),
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [reports]);
}