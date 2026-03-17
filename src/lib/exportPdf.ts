import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Report } from "../types/report";
import { MOTIVO_COLORS } from "../types/report";

export function exportarPdf(r: Report): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  let y = 0;

  // Cabeçalho institucional
  doc.setFillColor(6, 12, 28);
  doc.rect(0, 0, pw, 38, "F");
  doc.setTextColor(220, 232, 255);
  doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
  [
    "SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA",
    "POLÍCIA MILITAR DE ALAGOAS",
    "COMANDO DE POLICIAMENTO DA REGIÃO AGRESTE",
    "3º BATALHÃO DE POLÍCIA MILITAR",
  ].forEach((t, i) => doc.text(t, pw / 2, 9 + i * 7, { align: "center" }));
  y = 45;

  // Identificação
  doc.setTextColor(30, 30, 30); doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  doc.text(`Relatório nº ${r.relatorio_num}`, pw / 2, y, { align: "center" }); y += 7;
  doc.setFontSize(10);
  doc.text(`Quartel em Arapiraca/AL, ${r.relatorio_data}`, pw / 2, y, { align: "center" }); y += 10;

  // Seção 1: Efetivo
  if (r.efetivo?.length) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(20, 60, 140);
    doc.text("1 - EFETIVO: DISTRIBUIÇÃO DO EFETIVO (RELAÇÃO NOMINAL)", 14, y); y += 4;
    autoTable(doc, {
      startY: y, theme: "grid",
      headStyles: { fillColor: [13, 21, 48], textColor: [220, 232, 255], fontSize: 9, fontStyle: "bold" },
      bodyStyles: { fontSize: 9, textColor: [30, 30, 30] },
      head: [["FUNÇÃO", "NOME"]],
      body: r.efetivo.map((e) => [e.label, e.value || "SEM RECURSO"]),
      columnStyles: { 0: { cellWidth: 90 } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 7;
  }

  // Seção 1.3: Alterações
  if (r.alteracoes?.length) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(20, 60, 140);
    doc.text("1.3 - PERMUTAS/EXECUÇÕES/DISPENSAS/FALTAS/ATRASO", 14, y); y += 4;
    autoTable(doc, {
      startY: y, theme: "grid",
      headStyles: { fillColor: [13, 21, 48], textColor: [220, 232, 255], fontSize: 7, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
      head: [["MOTIVO", "N.ORDEM", "GRAD", "NOME", "TEMPO", "GUARNICAO", "Nº PARTE", "OBSERVAÇÃO"]],
      body: r.alteracoes.map((a) => [
        a.motivo, a.ordem, a.grad, a.nome,
        a.tempo, a.guarnicao, a.numParte, a.observacao,
      ]),
      columnStyles: { 0: { cellWidth: 32 }, 7: { cellWidth: 46 } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 5;
  }

  // Observações
  if (r.observacoes) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(20, 60, 140);
    doc.text("ANEXOS/OBSERVAÇÕES", 14, (y += 4)); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(r.observacoes, pw - 28);
    doc.text(lines, 14, y); y += lines.length * 4.5 + 7;
  }

  // Assinatura
  if (y > 260) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(30, 30, 30);
  doc.text(r.supervisor_nome || "SUPERVISOR DE OPERAÇÕES", pw / 2, y, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
  doc.text(`MATRÍCULA: ${r.supervisor_matricula || "—"}`, pw / 2, y + 5, { align: "center" });
  doc.text("SUPERVISOR DE OPERAÇÕES", pw / 2, y + 10, { align: "center" });
  doc.setFontSize(7); doc.setTextColor(150, 150, 150);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")} | ID: ${r.id}`, 14, 289);

  doc.save(`relatorio_${r.relatorio_data.replace(/\//g, "-")}_${r.id.slice(0, 6)}.pdf`);
}
