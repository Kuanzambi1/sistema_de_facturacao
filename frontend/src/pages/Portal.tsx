import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, DOCUMENT_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { FileText, ShieldCheck, Loader2, Search, Download, Filter } from "lucide-react";
import { useParams } from "wouter";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function Portal() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const { data, isLoading, isError } = trpc.portal.client.useQuery({ token });

  const filteredDocs = useMemo(() => {
    if (!data?.documents) return [];
    return data.documents.filter((inv: any) => {
      const matchSearch = !search ||
        inv.fullNumber?.toLowerCase().includes(search.toLowerCase()) ||
        inv.clientName?.toLowerCase().includes(search.toLowerCase());
      const matchType = !typeFilter || inv.documentType === typeFilter;
      return matchSearch && matchType;
    });
  }, [data, search, typeFilter]);

  async function downloadPDF(invoiceId: number, fullNumber: string) {
    const toastId = toast.loading("A gerar PDF...");
    try {
      const result = await (trpc as any).portal.invoice.query({ token, invoiceId });
      const { invoice, company } = result;
      if (!invoice) { toast.error("Documento não encontrado"); return; }

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

      let y = 15;

      // Header box
      const boxX = right - 82;
      doc.setDrawColor(30, 30, 30);
      doc.setLineWidth(0.4);
      doc.rect(boxX, 12, 82, 34);
      drawText("ORIGINAL", boxX + 6, 17, 8, "helvetica", "bold");
      drawText(DOCUMENT_TYPE_LABELS[invoice.documentType] || "Documento", boxX + 6, 24, 12, "helvetica", "bold");
      drawText(`n.º ${invoice.fullNumber || "Rascunho"}`, boxX + 6, 31, 10, "helvetica", "bold");

      // Company
      const leftMax = boxX - mx - 6;
      let logoH = 0;
      if (company?.logoUrl) {
        try { doc.addImage(company.logoUrl, "PNG", mx, y - 10, 18, 18); logoH = 20; } catch {}
      }
      drawText((company?.name || "Empresa").toUpperCase(), mx + logoH, y, 13, "helvetica", "bold");
      y += 6;
      const addrLine = [company?.address, company?.city, company?.province].filter(Boolean).join(", ");
      if (addrLine) { y = drawWrapped(addrLine, mx + logoH, y, leftMax - logoH, 9) + 1; }
      const contacts = [company?.phone && `Tel: ${company.phone}`, company?.email && `E-mail: ${company.email}`].filter(Boolean).join("   |   ");
      if (contacts) { y = drawWrapped(contacts, mx + logoH, y, leftMax - logoH, 9) + 1; }
      if (company?.nif) { drawText(`Contribuinte: ${company.nif}`, mx + logoH, y, 9, "helvetica", "bold"); }
      y = Math.max(y, 47) + 6;

      // Client
      drawText("Exmo.(s) Sr(s)", mx, y, 9, "helvetica", "italic");
      y += 5;
      drawText(invoice.clientName || "Consumidor Final", mx, y, 11, "helvetica", "bold");
      y += 5.5;
      if (invoice.clientAddress) { y = drawWrapped(invoice.clientAddress, mx, y, contentW, 9) + 1; }
      if (invoice.clientNif) { drawText(`Contribuinte: ${invoice.clientNif}`, mx, y, 9, "helvetica", "normal"); }
      y += 6;

      // Metadata table
      autoTable(doc, {
        startY: y,
        head: [["Data do Documento", "Data Vencimento", "Data/Hora de Emissão", "Contribuinte", "V/ Ref."]],
        body: [[
          formatDate(invoice.issueDate),
          invoice.dueDate ? formatDate(invoice.dueDate) : "—",
          formatDate(invoice.createdAt ?? invoice.issueDate),
          invoice.clientNif || "—",
          invoice.clientRef || "—",
        ]],
        theme: "grid",
        styles: { fontSize: 8, halign: "center", cellPadding: 2.5, textColor: [30, 30, 30] },
        headStyles: { fillColor: [240, 240, 240], textColor: [60, 60, 60], fontStyle: "bold" },
        margin: { left: mx, right: mx },
      });
      y = (doc as any).lastAutoTable.finalY + 6;

      // Items
      const items = invoice.items ?? [];
      const tableBody = items.map((item: any) => [
        item.productCode || "",
        item.description,
        Number(item.unitPrice).toLocaleString("pt-AO") + " Kz",
        Number(item.quantity).toFixed(2),
        `${Number(item.vatRate).toFixed(2)}%`,
        `${Number(item.discountPercent || 0).toFixed(2)}%`,
        Number(item.total).toLocaleString("pt-AO") + " Kz",
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Código", "Descrição", "Preço Uni.", "Qtd.", "Taxa/IVA %", "Desc. %", "Total"]],
        body: tableBody,
        theme: "grid",
        headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
        columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } },
        margin: { left: mx, right: mx },
      });
      y = (doc as any).lastAutoTable.finalY + 6;

      // Summary
      const subtotalNum = Number(invoice.subtotal ?? 0);
      const vatNum = Number(invoice.vatAmount ?? 0);
      const totalComImpostos = subtotalNum + vatNum;

      const sumLeft = mx + 100;
      const sumRight = right;
      const summaryRows = [
        { label: "Total com Descontos:", value: Number(invoice.subtotal ?? 0).toLocaleString("pt-AO") + " Kz" },
        { label: "Total de Impostos:", value: Number(invoice.vatAmount ?? 0).toLocaleString("pt-AO") + " Kz" },
        { label: "Total:", value: totalComImpostos.toLocaleString("pt-AO") + " Kz" },
        { label: "Total a pagar:", value: Number(invoice.totalAmount).toLocaleString("pt-AO") + " Kz", bold: true },
      ];

      const sumTop = y - 3;
      doc.setDrawColor(160, 160, 160);
      doc.line(sumLeft, sumTop, sumRight, sumTop);
      let rowY = sumTop + 5;
      for (const r of summaryRows) {
        drawText(r.label, sumLeft, rowY, 8, "helvetica", r.bold ? "bold" : "normal");
        drawText(r.value, sumRight, rowY, 8, "helvetica", r.bold ? "bold" : "normal", { align: "right" });
        rowY += 5;
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("Conforme legislação fiscal angolana — AGT", 105, pageH - 11, { align: "center" });
        if (invoice.atcud) {
          doc.setFontSize(7);
          doc.text(`ATCUD: ${invoice.atcud}`, 10, pageH - 6);
        }
        doc.text(`${i} de ${pageCount}`, right, pageH - 6, { align: "right" });
      }

      const filename = `${(invoice.fullNumber || "Documento").replace(/\//g, "_")}.pdf`;
      doc.save(filename);
      toast.dismiss(toastId);
      toast.success("PDF descarregado!");
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(`Erro ao gerar PDF: ${e.message || "Erro"}`);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground">Link inválido</p>
          <p className="text-sm text-muted-foreground">Este link do portal do cliente não é válido ou expirou.</p>
        </div>
      </div>
    );
  }

  const docTypes = Array.from(new Set(data.documents.map((d: any) => d.documentType)));

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Portal do Cliente</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">{data.companyName}</h1>
        <p className="text-sm text-muted-foreground">Documentos de <span className="font-medium text-foreground">{data.clientName}</span></p>

        {/* Filters */}
        {data.documents.length > 0 && (
          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Pesquisar por número..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={typeFilter || "all"} onValueChange={v => setTypeFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Tipo de documento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {docTypes.map((t: any) => <SelectItem key={t} value={t}>{DOCUMENT_TYPE_LABELS[t] ?? t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Documents list */}
        <div className="mt-6 space-y-3">
          {filteredDocs.length === 0 && data.documents.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
              Nenhum documento encontrado com os filtros seleccionados.
            </div>
          )}
          {data.documents.length === 0 && (
            <div className="bg-card rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
              Ainda não existem documentos disponíveis.
            </div>
          )}
          {filteredDocs.map((inv: any) => (
            <div key={inv.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{inv.fullNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {DOCUMENT_TYPE_LABELS[inv.documentType] ?? inv.documentType} · {formatDate(inv.issueDate)}
                    {inv.dueDate ? ` · Venc: ${formatDate(inv.dueDate)}` : ""}
                  </p>
                  {inv.atcud && <p className="text-[11px] text-muted-foreground font-mono mt-0.5">ATCUD: {inv.atcud}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(Number(inv.totalAmount))}</p>
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1", STATUS_COLORS[inv.status])}>
                    {STATUS_LABELS[inv.status]}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                  title="Descarregar PDF"
                  onClick={() => downloadPDF(inv.id, inv.fullNumber)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Documentos emitidos electronicamente conforme legislação fiscal angolana — AGT.
        </p>
      </div>
    </div>
  );
}
