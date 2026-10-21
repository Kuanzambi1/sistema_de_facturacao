import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function formatKz(value: number): string {
  return value.toLocaleString("pt-AO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " AOA";
}

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("pt-AO");
}

export async function generateLedgerPdf(
  company: any,
  entityName: string,
  entityNif: string | null,
  entityType: "Cliente" | "Fornecedor",
  data: {
    totalInvoiced: number;
    totalPaid: number;
    balance: number;
    movements: Array<{
      date: string | Date;
      document: string;
      debit: number;
      credit: number;
      balance: number;
    }>;
  }
): Promise<Buffer> {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const pageW = 210;
  const pageH = 297;
  const mx = 14;
  const right = pageW - mx;
  let y = 20;

  // Helpers
  const drawText = (txt: string, x: number, yPos: number, size: number, font = "helvetica", style = "normal", options: any = {}) => {
    doc.setFont(font, style);
    doc.setFontSize(size);
    doc.text(txt, x, yPos, options);
  };

  // Header - Company info
  drawText((company.name || "Sua Empresa").toUpperCase(), mx, y, 14, "helvetica", "bold");
  y += 6;
  if (company.nif) drawText(`NIF: ${company.nif}`, mx, y, 9);
  y += 5;
  const addr = [company.address, company.city, company.province].filter(Boolean).join(", ");
  if (addr) drawText(addr, mx, y, 9);
  
  // Document Title
  y += 15;
  doc.setFillColor(245, 245, 245);
  doc.rect(mx, y, right - mx, 10, "F");
  drawText(`EXTRACTO DE CONTA CORRENTE - ${entityType.toUpperCase()}`, 105, y + 6, 11, "helvetica", "bold", { align: "center" });
  
  y += 18;
  // Entity Info
  drawText(`${entityType}:`, mx, y, 9, "helvetica", "bold");
  drawText(entityName, mx + 25, y, 9);
  y += 5;
  if (entityNif) {
    drawText("NIF:", mx, y, 9, "helvetica", "bold");
    drawText(entityNif, mx + 25, y, 9);
  }
  
  y += 10;
  
  // Summary
  doc.setDrawColor(200, 200, 200);
  doc.line(mx, y, right, y);
  y += 6;
  drawText("Total Facturado/Comprado:", mx, y, 9, "helvetica", "bold");
  drawText(formatKz(data.totalInvoiced), mx + 50, y, 9);
  
  drawText("Total Pago/Recebido:", mx + 90, y, 9, "helvetica", "bold");
  drawText(formatKz(data.totalPaid), mx + 130, y, 9);
  
  y += 6;
  drawText("Saldo Actual:", mx, y, 9, "helvetica", "bold");
  drawText(formatKz(data.balance), mx + 50, y, 9, "helvetica", "bold");
  y += 4;
  doc.line(mx, y, right, y);
  
  y += 10;

  // Table
  const tableData = data.movements.map(m => [
    formatDate(m.date),
    m.document,
    m.debit > 0 ? formatKz(m.debit) : "",
    m.credit > 0 ? formatKz(m.credit) : "",
    formatKz(m.balance)
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Data", "Documento", "Débito", "Crédito", "Saldo"]],
    body: tableData,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 3, textColor: [40, 40, 40] },
    headStyles: { fillColor: [240, 240, 240], textColor: [20, 20, 20], fontStyle: "bold" },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" }
    }
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${pageCount}`, right, pageH - 10, { align: "right" });
    doc.text(`Processado por K360 Facturas`, 105, pageH - 10, { align: "center" });
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
