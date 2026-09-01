import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { numeroPorExtenso } from "./fiscal";

function formatKz(value: number): string {
  return value.toLocaleString("pt-AO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " AOA";
}

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("pt-AO");
}

function formatDateTime(date: Date | string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("pt-AO") + " " + d.toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" });
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  FT: "Factura",
  FR: "Factura-Recibo",
  FS: "Factura Simplificada",
  FA: "Factura de Abertura",
  NC: "Nota de Crédito",
  ND: "Nota de Débito",
  RC: "Recibo",
  RG: "Guia de Remessa",
  OR: "Orçamento",
};

type InvoiceData = {
  id: number;
  fullNumber: string | null;
  documentType: string;
  atcud: string | null;
  hashControl: string | null;
  clientName: string | null;
  clientNif: string | null;
  clientAddress: string | null;
  clientRef: string | null;
  issueDate: Date | string | null;
  dueDate: Date | string | null;
  createdAt: Date | string | null;
  subtotal: string | number;
  vatAmount: string | number;
  discountAmount: string | number;
  withholdingTaxAmount: string | number;
  totalAmount: string | number;
  notes: string | null;
  deliveryLocation: string | null;
  relatedInvoiceNumber: string | null;
  items: Array<{
    productCode: string | null;
    description: string;
    unitPrice: string | number;
    quantity: string | number;
    vatRate: string | number;
    discountPercent: string | number;
    vatAmount: string | number;
    subtotal: string | number;
    total: string | number;
  }>;
};

type CompanyData = {
  name: string;
  nif: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  phone: string | null;
  email: string | null;
  bankName: string | null;
  bankIban: string | null;
  softwareValidationNumber: string | null;
};

export function generateInvoicePdf(invoice: InvoiceData, company: CompanyData): Buffer {
  const doc = new jsPDF("p", "mm", "a4");
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const mx = 14;
  const right = pageW - mx;
  const contentW = right - mx;

  const drawText = (text: string, x: number, y: number, size = 10, font = "helvetica", style: any = "normal", options?: any) => {
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(size);
    doc.setFont(font, style);
    doc.text(text, x, y, options);
  };

  const drawWrapped = (text: string, x: number, y: number, maxWidth: number, size = 9, font = "helvetica", style: any = "normal") => {
    doc.setFontSize(size);
    doc.setFont(font, style);
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(text || "", maxWidth) as string[];
    doc.text(lines, x, y);
    return y + lines.length * (size * 0.45);
  };

  const subtotalNum = Number(invoice.subtotal ?? 0);
  const vatNum = Number(invoice.vatAmount ?? 0);
  const discountNum = Number(invoice.discountAmount ?? 0);
  const withholdingNum = Number(invoice.withholdingTaxAmount ?? 0);
  const grossTotal = subtotalNum + discountNum;
  const totalComImpostos = subtotalNum + vatNum;

  const vatBreakdown = (() => {
    const map = new Map<number, { taxa: number; incidencia: number; valor: number }>();
    (invoice.items ?? []).forEach((it) => {
      const rate = Number(it.vatRate);
      const g = map.get(rate) ?? { taxa: rate, incidencia: 0, valor: 0 };
      g.incidencia += Number(it.subtotal);
      g.valor += Number(it.vatAmount);
      map.set(rate, g);
    });
    return Array.from(map.values()).sort((a, b) => a.taxa - b.taxa);
  })();

  let y = 15;

  // ── Cabeçalho: título do documento (box à direita) ──
  const boxX = right - 82;
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.4);
  doc.rect(boxX, 12, 82, 34);
  drawText("ORIGINAL", boxX + 6, 17, 8, "helvetica", "bold");
  drawText(DOCUMENT_TYPE_LABELS[invoice.documentType] || "Documento", boxX + 6, 24, 12, "helvetica", "bold");
  drawText(`n.º ${invoice.fullNumber || "Rascunho"}`, boxX + 6, 31, 10, "helvetica", "bold");
  if (invoice.relatedInvoiceNumber) {
    drawText(`(Referente a ${invoice.relatedInvoiceNumber})`, boxX + 6, 37, 8, "helvetica", "italic");
  }

  // ── Emitente (esquerda) ──
  const leftMax = boxX - mx - 6;
  drawText((company.name || "Sua Empresa").toUpperCase(), mx, y, 13, "helvetica", "bold");
  y += 6;
  const addrLine = [company.address, company.city, company.province].filter(Boolean).join(", ");
  if (addrLine) { y = drawWrapped(addrLine, mx, y, leftMax, 9) + 1; }
  const contacts = [company.phone && `Tel: ${company.phone}`, company.email && `E-mail: ${company.email}`].filter(Boolean).join("   |   ");
  if (contacts) { y = drawWrapped(contacts, mx, y, leftMax, 9) + 1; }
  if (company.nif) { drawText(`Contribuinte: ${company.nif}`, mx, y, 9, "helvetica", "bold"); }
  y = Math.max(y, 47) + 6;

  // ── Destinatário ──
  drawText("Exmo.(s) Sr(s)", mx, y, 9, "helvetica", "italic");
  y += 5;
  drawText(invoice.clientName || "Consumidor Final", mx, y, 11, "helvetica", "bold");
  y += 5.5;
  if (invoice.clientAddress) { y = drawWrapped(invoice.clientAddress, mx, y, contentW, 9) + 1; }
  if (invoice.clientNif) { drawText(`Contribuinte: ${invoice.clientNif}`, mx, y, 9, "helvetica", "normal"); }
  y += 6;

  // ── Tabela de metadados ──
  autoTable(doc, {
    startY: y,
    head: [["Data do Documento", "Data Vencimento", "Data/Hora de Emissão", "Contribuinte", "V/ Ref."]],
    body: [[
      formatDate(invoice.issueDate),
      invoice.dueDate ? formatDate(invoice.dueDate) : "—",
      formatDateTime(invoice.createdAt ?? invoice.issueDate),
      invoice.clientNif || "—",
      invoice.clientRef || "—",
    ]],
    theme: "grid",
    styles: { fontSize: 8, halign: "center", cellPadding: 2.5, textColor: [30, 30, 30] },
    headStyles: { fillColor: [240, 240, 240], textColor: [60, 60, 60], fontStyle: "bold" },
    margin: { left: mx, right: mx },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // ── Observações ──
  if (invoice.notes) {
    drawText("Observações", mx, y, 9, "helvetica", "bold");
    y += 5;
    y = drawWrapped(invoice.notes, mx, y, contentW, 9) + 4;
  }

  // ── Linhas do documento ──
  const tableBody = (invoice.items ?? []).map((item) => [
    item.productCode || "",
    item.description,
    formatKz(Number(item.unitPrice)),
    `${Number(item.quantity).toFixed(2)}`,
    `${Number(item.vatRate).toFixed(2)}%`,
    `${Number(item.discountPercent || 0).toFixed(2)}%`,
    formatKz(Number(item.total)),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Código", "Descrição", "Preço Uni.", "Qtd.", "Taxa/IVA %", "Desc. %", "Total"]],
    body: tableBody,
    theme: "grid",
    headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
    },
    margin: { left: mx, right: mx },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // ── Impostos (esquerda) + Sumário (direita) ──
  const sumLeft = mx + 100;
  const sumRight = right;
  const vatRows = vatBreakdown.map((g) => [`IVA - ${g.taxa.toFixed(2)}`, formatKz(g.incidencia), formatKz(g.valor)]);
  if (vatRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Imposto/IVA %", "Incidência", "Valor"]],
      body: vatRows,
      theme: "grid",
      headStyles: { fillColor: [220, 220, 220], textColor: [30, 30, 30], fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
      margin: { left: mx },
      tableWidth: 95,
    });
  }

  // Sumário
  const summaryRows: Array<{ label: string; value: string; bold?: boolean }> = [
    { label: "Total ilíquido:", value: formatKz(grossTotal) },
    { label: "Desconto:", value: `-${formatKz(discountNum)}` },
    { label: "Desconto Global:", value: formatKz(0) },
    { label: "Total com Descontos:", value: formatKz(subtotalNum) },
    { label: "Total de Impostos:", value: formatKz(vatNum) },
  ];
  if (withholdingNum > 0) {
    summaryRows.push({ label: "Retenção: (6,50%)", value: `-${formatKz(withholdingNum)}` });
  }
  summaryRows.push(
    { label: "Total:", value: formatKz(totalComImpostos) },
    { label: "Total a pagar:", value: formatKz(Number(invoice.totalAmount)), bold: true },
  );

  const extenso = numeroPorExtenso(Number(invoice.totalAmount));
  const extLines = doc.splitTextToSize(extenso, sumRight - sumLeft) as string[];

  const sumTop = y - 3;
  doc.setDrawColor(160, 160, 160);
  doc.line(sumLeft, sumTop, sumRight, sumTop);
  let rowY = sumTop + 5;
  for (const r of summaryRows) {
    drawText(r.label, sumLeft, rowY, 8, "helvetica", r.bold ? "bold" : "normal");
    drawText(r.value, sumRight, rowY, 8, "helvetica", r.bold ? "bold" : "normal", { align: "right" });
    rowY += 5;
  }
  rowY += 1;
  doc.line(sumLeft, rowY, sumRight, rowY);
  rowY += 5;
  drawText("Valor por extenso:", sumLeft, rowY, 8, "helvetica", "bold");
  rowY += 6;
  rowY = drawWrapped(extenso, sumLeft, rowY, sumRight - sumLeft, 8, "helvetica", "italic") + 2;

  const ivaFinalY = (doc as any).lastAutoTable?.finalY ?? y;
  y = Math.max(ivaFinalY, rowY) + 5;

  // ── Bens e Serviços ──
  drawText("Bens e Serviços", mx, y, 9, "helvetica", "bold");
  y += 5;
  const deliveryLocal = invoice.deliveryLocation || company.city || company.province || "Luanda";
  y = drawWrapped(`Os bens/serviços foram colocados à disposição do adquirente na data e local do documento - ${deliveryLocal}`, mx, y, contentW, 9) + 4;

  // ── Dados Bancários ──
  if (company.bankIban) {
    drawText("Dados Bancários", mx, y, 9, "helvetica", "bold");
    y += 5;
    const bankLine = company.bankName ? `${company.bankName} - ` : "";
    y = drawWrapped(`${bankLine}IBAN: ${company.bankIban}`, mx, y, contentW, 9) + 4;
  }

  // ── Rodapé em todas as páginas ──
  const pageCount = doc.getNumberOfPages();
  const validationNumber = company.softwareValidationNumber || "000/AGT/202X";
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Processado por programa validado n.º ${validationNumber}`, 105, pageH - 15, { align: "center" });
    doc.text("Conforme legislação fiscal angolana — AGT", 105, pageH - 11, { align: "center" });
    if (invoice.atcud) {
      doc.setFontSize(7);
      doc.text(`ATCUD: ${invoice.atcud}`, 10, pageH - 6);
      if (invoice.hashControl) {
        doc.text(`Hash: ${invoice.hashControl}`, 10, pageH - 3);
      }
    }
    doc.text(`${i} de ${pageCount}`, right, pageH - 6, { align: "right" });
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
