import * as XLSX from "xlsx";
import type { Report } from "../types/report";

export function exportarXlsx(r: Report): void {
  const wb = XLSX.utils.book_new();

  // Aba 1: Efetivo
  const ws1 = XLSX.utils.aoa_to_sheet([
    [`RELATÓRIO DE SERVIÇO — 3º BPM`],
    [`Nº: ${r.relatorio_num}`],
    [`Data: ${r.relatorio_data} | Supervisor: ${r.supervisor_nome} | MAT: ${r.supervisor_matricula}`],
    [],
    ["1 — EFETIVO"],
    ["FUNÇÃO", "NOME"],
    ...(r.efetivo ?? []).map((e) => [e.label, e.value || "SEM RECURSO"]),
  ]);
  ws1["!cols"] = [{ wch: 38 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Efetivo");

  // Aba 2: Alterações
  const altRows: any[][] = [
    ["1.3 — PERMUTAS / EXECUÇÕES / DISPENSAS / FALTAS"],
    [],
    ["MOTIVO", "N.ORDEM", "GRAD", "NOME", "TEMPO", "GUARNIÇÃO", "Nº PARTE", "OBSERVAÇÃO"],
    ...(r.alteracoes ?? []).map((a) => [
      a.motivo, a.ordem, a.grad, a.nome,
      a.tempo, a.guarnicao, a.numParte, a.observacao,
    ]),
  ];
  if (r.observacoes) altRows.push([], ["OBSERVAÇÕES"], [r.observacoes]);
  const ws2 = XLSX.utils.aoa_to_sheet(altRows);
  ws2["!cols"] = [
    { wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 24 },
    { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 52 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Alterações");

  XLSX.writeFile(wb, `relatorio_${r.relatorio_data.replace(/\//g, "-")}_${r.id.slice(0, 6)}.xlsx`);
}

export function exportarConsolidadoXlsx(reports: Report[]): void {
  const wb = XLSX.utils.book_new();

  // Aba 1: Resumo geral
  const ws1 = XLSX.utils.aoa_to_sheet([
    ["Nº Relatório", "Data", "Supervisor", "Matrícula", "Qtd. Alterações"],
    ...reports.map((r) => [
      r.relatorio_num,
      r.relatorio_data,
      r.supervisor_nome,
      r.supervisor_matricula,
      r.alteracoes?.length ?? 0,
    ]),
  ]);
  ws1["!cols"] = [{ wch: 50 }, { wch: 12 }, { wch: 36 }, { wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Resumo Geral");

  // Aba 2: Todas as alterações
  const ws2 = XLSX.utils.aoa_to_sheet([
    ["Nº Relatório", "Data", "MOTIVO", "N.ORDEM", "GRAD", "NOME", "TEMPO", "GUARNIÇÃO", "Nº PARTE", "OBSERVAÇÃO"],
    ...reports.flatMap((r) =>
      (r.alteracoes ?? []).map((a) => [
        r.relatorio_num, r.relatorio_data,
        a.motivo, a.ordem, a.grad, a.nome,
        a.tempo, a.guarnicao, a.numParte, a.observacao,
      ])
    ),
  ]);
  ws2["!cols"] = [
    { wch: 50 }, { wch: 12 }, { wch: 22 }, { wch: 10 },
    { wch: 10 }, { wch: 22 }, { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 52 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Todas as Alterações");

  XLSX.writeFile(wb, `3bpm_consolidado_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
