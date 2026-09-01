import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatKz, formatDate, formatDateTime, DOCUMENT_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS, PAYMENT_METHODS, downloadFile, numeroPorExtenso } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ArrowLeft, Download, FileX, CheckCircle2, Printer, Shield, Hash, Coins, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function InvoiceDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const id = Number(params.id);
  const utils = trpc.useUtils();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("transferencia");
  const [payDate, setPayDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [payRef, setPayRef] = useState("");

  const { data: invoice, isLoading } = trpc.invoices.get.useQuery({ id });
  const items = invoice?.items;
  const payments = invoice?.payments;
  const { data: company } = trpc.company.get.useQuery();

  const { data: ftSeries } = trpc.series.list.useQuery({ documentType: "FT" }, { enabled: invoice?.documentType === "OR" });

  const updateStatus = trpc.invoices.updateStatus.useMutation({
    onSuccess: () => { utils.invoices.get.invalidate({ id }); toast.success("Estado actualizado!"); },
    onError: (e) => toast.error(e.message),
  });

  const createPayment = trpc.payments.create.useMutation({
    onSuccess: () => {
      utils.invoices.get.invalidate({ id });
      setPayOpen(false);
      setPayAmount("");
      setPayRef("");
      toast.success("Pagamento registado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const convertQuotation = trpc.invoices.convertQuotation.useMutation({
    onSuccess: (inv) => {
      utils.invoices.list.invalidate();
      toast.success(`Orçamento convertido na factura ${inv.fullNumber}!`);
      navigate(`/documentos/${inv.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const exportSAFT = trpc.invoices.exportSAFT.useMutation({
    onSuccess: (result) => {
      downloadFile(result.xml, result.filename, "application/xml");
      toast.success("SAF-T exportado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const paidAmount = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const totalAmount = Number(invoice?.totalAmount ?? 0);
  const remaining = Math.max(totalAmount - paidAmount, 0);

  // ─── Cálculos para o sumário (estrutura da referência) ───
  const subtotalNum = Number(invoice?.subtotal ?? 0);
  const vatNum = Number(invoice?.vatAmount ?? 0);
  const discountNum = Number(invoice?.discountAmount ?? 0);
  const withholdingNum = Number(invoice?.withholdingTaxAmount ?? 0);
  const grossTotal = subtotalNum + discountNum; // Total ilíquido
  const totalComImpostos = subtotalNum + vatNum; // Total

  const vatBreakdown = (() => {
    const map = new Map<number, { taxa: number; incidencia: number; valor: number }>();
    (items ?? []).forEach((it: any) => {
      const rate = Number(it.vatRate);
      const g = map.get(rate) ?? { taxa: rate, incidencia: 0, valor: 0 };
      g.incidencia += Number(it.subtotal);
      g.valor += Number(it.vatAmount);
      map.set(rate, g);
    });
    return Array.from(map.values()).sort((a, b) => a.taxa - b.taxa);
  })();

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-muted-foreground text-sm">A carregar documento...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 gap-3">
        <p className="text-muted-foreground">Documento não encontrado.</p>
        <Button variant="outline" onClick={() => navigate("/documentos")}>Voltar à lista</Button>
      </div>
    );
  }

  async function downloadPDF() {
    if (!invoice) return;
    const filename = `${invoice.fullNumber ? invoice.fullNumber.replace(/\//g, "_") : "Rascunho"}.pdf`;
    const toastId = toast.loading("A gerar PDF nativo...");
    try {
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
      drawText((company?.name || "Sua Empresa").toUpperCase(), mx, y, 13, "helvetica", "bold");
      y += 6;
      const addrLine = [company?.address, company?.city, company?.province].filter(Boolean).join(", ");
      if (addrLine) { y = drawWrapped(addrLine, mx, y, leftMax, 9) + 1; }
      const contacts = [company?.phone && `Tel: ${company.phone}`, company?.email && `E-mail: ${company.email}`].filter(Boolean).join("   |   ");
      if (contacts) { y = drawWrapped(contacts, mx, y, leftMax, 9) + 1; }
      if (company?.nif) { drawText(`Contribuinte: ${company.nif}`, mx, y, 9, "helvetica", "bold"); }
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
      const tableBody = items?.map((item: any) => [
        item.productCode || "",
        item.description,
        formatKz(Number(item.unitPrice)),
        `${Number(item.quantity).toFixed(2)}`,
        `${Number(item.vatRate).toFixed(2)}%`,
        `${Number(item.discountPercent || 0).toFixed(2)}%`,
        formatKz(Number(item.total)),
      ]) || [];

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
      const deliveryLocal = invoice.deliveryLocation || company?.city || company?.province || "Luanda";
      y = drawWrapped(`Os bens/serviços foram colocados à disposição do adquirente na data e local do documento - ${deliveryLocal}`, mx, y, contentW, 9) + 4;

      // ── Dados Bancários ──
      if (company?.bankIban) {
        drawText("Dados Bancários", mx, y, 9, "helvetica", "bold");
        y += 5;
        const bankLine = company.bankName ? `${company.bankName} - ` : "";
        y = drawWrapped(`${bankLine}IBAN: ${company.bankIban}`, mx, y, contentW, 9) + 4;
      }

      // ── Rodapé em todas as páginas ──
      const pageCount = doc.getNumberOfPages();
      const validationNumber = company?.softwareValidationNumber || "000/AGT/202X";
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

      doc.save(filename);
      toast.dismiss(toastId);
      toast.success("PDF nativo gerado com sucesso!");
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(`Erro ao gerar PDF: ${e.message || "Erro desconhecido"}`);
      console.error("PDF Error:", e);
    }
  }

  const metaCells: Array<{ label: string; value: string }> = [
    { label: "Data do Documento", value: formatDate(invoice.issueDate) },
    { label: "Data Vencimento", value: invoice.dueDate ? formatDate(invoice.dueDate) : "—" },
    { label: "Data/Hora de Emissão", value: formatDateTime(invoice.createdAt ?? invoice.issueDate) },
    { label: "Contribuinte", value: invoice.clientNif || "—" },
    { label: "V/ Ref.", value: invoice.clientRef || "—" },
  ];

  const summaryRows: Array<{ label: string; value: string; bold?: boolean }> = [
    { label: "Total ilíquido", value: formatKz(grossTotal) },
    { label: "Desconto", value: `-${formatKz(discountNum)}` },
    { label: "Desconto Global", value: formatKz(0) },
    { label: "Total com Descontos", value: formatKz(subtotalNum) },
    { label: "Total de Impostos", value: formatKz(vatNum) },
  ];
  if (withholdingNum > 0) {
    summaryRows.push({ label: "Retenção (6,50%)", value: `-${formatKz(withholdingNum)}` });
  }
  summaryRows.push(
    { label: "Total", value: formatKz(totalComImpostos) },
    { label: "Total a pagar", value: formatKz(Number(invoice.totalAmount)), bold: true },
  );

  return (
    <div ref={invoiceRef} className="p-6 space-y-5 animate-fade-in-up max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" className="gap-1.5 shrink-0" onClick={() => navigate("/documentos")}>
            <ArrowLeft className="h-4 w-4" />Voltar
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground truncate">{invoice.fullNumber}</h1>
              <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0", STATUS_COLORS[invoice.status])}>
                {STATUS_LABELS[invoice.status]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{DOCUMENT_TYPE_LABELS[invoice.documentType]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadPDF}>
            <Printer className="h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportSAFT.mutate({ dateFrom: new Date(invoice.issueDate), dateTo: new Date(invoice.issueDate) })} disabled={exportSAFT.isPending}>
            <Download className="h-4 w-4" />SAF-T
          </Button>
          {invoice.documentType === "OR" && invoice.status === "emitida" && (
            <Button size="sm" className="gap-1.5 bg-violet-600 hover:bg-violet-700" disabled={convertQuotation.isPending} onClick={() => {
              const series = ftSeries?.[0];
              if (!series) { toast.error("Sem série FT disponível. Crie uma série Factura nas Configurações."); return; }
              if (confirm("Converter este orçamento numa factura (FT)?")) convertQuotation.mutate({ quotationId: id, seriesId: series.id });
            }}>
              <Repeat className="h-4 w-4" />Converter em Factura
            </Button>
          )}
          {(invoice.status === "emitida" || invoice.status === "vencida" || invoice.status === "parcialmente_paga") && (
            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={() => setPayOpen(true)}>
              <Coins className="h-4 w-4" />Registar Pagamento
            </Button>
          )}
          {invoice.status === "emitida" && totalAmount === 0 && (
            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus.mutate({ id, status: "paga", paymentDate: new Date() })}>
              <CheckCircle2 className="h-4 w-4" />Marcar como Paga
            </Button>
          )}
          {invoice.status === "anulada" && (
            <Button size="sm" className="gap-1.5" disabled>
              <FileX className="h-4 w-4" />Anulada
            </Button>
          )}
          {!["anulada", "rascunho", "convertida", "expirada"].includes(invoice.status) && (
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive hover:bg-destructive/10"
              onClick={() => { if (confirm("Anular este documento? Esta acção não pode ser revertida.")) updateStatus.mutate({ id, status: "anulada" }); }}>
              <FileX className="h-4 w-4" />Anular
            </Button>
          )}
        </div>
      </div>

      {/* Dialog registar pagamento */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registar pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/40 p-3 text-sm flex justify-between">
              <span>Total do documento</span>
              <span className="font-semibold">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 text-sm flex justify-between">
              <span>Já pago</span>
              <span className="font-semibold">{formatCurrency(paidAmount)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="payAmount">Montante (AOA)</Label>
                <Input id="payAmount" type="number" min="0" step="0.01" placeholder="0,00" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payDate">Data de pagamento</Label>
                <Input id="payDate" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payMethod">Método</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHODS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payRef">Referência (opcional)</Label>
              <Input id="payRef" placeholder="Nº de transferência / cheque" value={payRef} onChange={(e) => setPayRef(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancelar</Button>
            <Button
              disabled={createPayment.isPending || !Number(payAmount) || Number(payAmount) <= 0}
              onClick={() => createPayment.mutate({
                invoiceId: id,
                amount: Number(payAmount),
                paymentDate: new Date(payDate + "T12:00:00"),
                method: payMethod as any,
                reference: payRef || undefined,
              })}>
              <Coins className="h-4 w-4" />Guardar pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Informações Fiscais Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {invoice.atcud && (
          <div className="flex items-start gap-4 p-4 bg-brand-light border border-brand-border rounded-lg">
            <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">Código Único de Documento (ATCUD)</p>
              <p className="font-mono text-sm text-foreground mt-0.5 break-all">{invoice.atcud}</p>
              {invoice.hashControl && (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium">Hash:</span> <span className="font-mono">{invoice.hashControl}</span>
                </p>
              )}
            </div>
          </div>
        )}
        {company?.softwareValidationNumber && (
          <div className="flex items-start gap-4 p-4 bg-muted/40 border border-border rounded-lg">
            <Hash className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Programa Validado</p>
              <p className="text-sm text-foreground mt-0.5 font-medium">{company.softwareValidationNumber}</p>
            </div>
          </div>
        )}
      </div>

      {/* Corpo do documento — layout inspirado na referência */}
      <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
        {/* Cabeçalho: emitente + título */}
        <div className="p-6 flex flex-col sm:flex-row justify-between gap-6 border-b border-border">
          <div className="min-w-0">
            <h2 className="text-lg font-bold uppercase text-foreground leading-tight">{company?.name || "Sua Empresa"}</h2>
            <p className="text-xs text-muted-foreground mt-1">{[company?.address, company?.city, company?.province].filter(Boolean).join(", ")}</p>
            {[company?.phone && `Tel: ${company.phone}`, company?.email && `E-mail: ${company.email}`].filter(Boolean).length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{[company?.phone && `Tel: ${company.phone}`, company?.email && `E-mail: ${company.email}`].filter(Boolean).join("   |   ")}</p>
            )}
            {company?.nif && <p className="text-xs font-semibold text-foreground mt-1">Contribuinte: {company.nif}</p>}
          </div>
          <div className="shrink-0 border-2 border-slate-800 rounded-md px-5 py-3 text-center min-w-56">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Original</p>
            <p className="text-lg font-bold text-foreground leading-tight mt-0.5">{DOCUMENT_TYPE_LABELS[invoice.documentType]}</p>
            <p className="text-sm font-bold text-foreground">n.º {invoice.fullNumber || "Rascunho"}</p>
            {invoice.relatedInvoiceNumber && <p className="text-[11px] italic text-muted-foreground mt-0.5">(Referente a {invoice.relatedInvoiceNumber})</p>}
          </div>
        </div>

        {/* Destinatário */}
        <div className="px-6 py-4 border-b border-border">
          <p className="text-[11px] italic text-muted-foreground">Exmo.(s) Sr(s)</p>
          <p className="font-semibold text-foreground mt-0.5">{invoice.clientName || "Consumidor Final"}</p>
          {invoice.clientAddress && <p className="text-sm text-muted-foreground">{invoice.clientAddress}</p>}
          {invoice.clientNif && <p className="text-sm text-muted-foreground">Contribuinte: {invoice.clientNif}</p>}
        </div>

        {/* Tabela de metadados */}
        <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-border divide-x divide-y sm:divide-y-0 divide-border">
          {metaCells.map((c) => (
            <div key={c.label} className="px-3 py-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{c.label}</p>
              <p className="text-sm font-medium text-foreground mt-0.5 break-words">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Observações */}
        {invoice.notes && (
          <div className="px-6 py-4 border-b border-border">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Observações</p>
            <p className="text-sm text-foreground mt-1 whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}

        {/* Linhas do documento */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="text-left text-xs font-semibold px-4 py-2.5">Código</th>
                <th className="text-left text-xs font-semibold px-3 py-2.5">Descrição</th>
                <th className="text-right text-xs font-semibold px-3 py-2.5">Preço Uni.</th>
                <th className="text-right text-xs font-semibold px-3 py-2.5">Qtd.</th>
                <th className="text-right text-xs font-semibold px-3 py-2.5">Taxa/IVA %</th>
                <th className="text-right text-xs font-semibold px-3 py-2.5">Desc. %</th>
                <th className="text-right text-xs font-semibold px-4 py-2.5">Total</th>
              </tr>
            </thead>
            <tbody>
              {items?.map((item: any) => (
                <tr key={item.id} className="border-b border-border/60">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.productCode || "—"}</td>
                  <td className="px-3 py-3 text-sm text-foreground">{item.description}</td>
                  <td className="px-3 py-3 text-right text-sm whitespace-nowrap">{formatKz(Number(item.unitPrice))}</td>
                  <td className="px-3 py-3 text-right text-sm whitespace-nowrap">{Number(item.quantity).toFixed(2)}</td>
                  <td className="px-3 py-3 text-right text-sm whitespace-nowrap">{Number(item.vatRate).toFixed(2)}%</td>
                  <td className="px-3 py-3 text-right text-sm whitespace-nowrap">{Number(item.discountPercent || 0).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold whitespace-nowrap">{formatKz(Number(item.total))}</td>
                </tr>
              ))}
              {(!items || items.length === 0) && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">Sem linhas.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Impostos + Sumário */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-6 py-5 border-t border-border">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Imposto / IVA</p>
            <table className="w-full border border-border text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-3 py-2">Imposto/IVA %</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-2">Incidência</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {vatBreakdown.map((g) => (
                  <tr key={g.taxa} className="border-t border-border/60">
                    <td className="px-3 py-2 text-sm">IVA - {g.taxa.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right text-sm whitespace-nowrap">{formatKz(g.incidencia)}</td>
                    <td className="px-3 py-2 text-right text-sm whitespace-nowrap">{formatKz(g.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sm:justify-self-end sm:w-full sm:max-w-xs">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Sumário</p>
            <div className="border-t border-b border-border">
              {summaryRows.map((r) => (
                <div key={r.label} className={cn("flex justify-between py-1.5", r.bold && "font-bold")}>
                  <span className="text-sm text-muted-foreground">{r.label}</span>
                  <span className={cn("text-sm whitespace-nowrap", r.bold ? "text-primary" : "text-foreground")}>{r.value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground italic mt-3 leading-relaxed">Valor por extenso: {numeroPorExtenso(Number(invoice.totalAmount))}</p>
          </div>
        </div>

        {/* Bens e Serviços */}
        <div className="px-6 py-4 border-t border-border">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Bens e Serviços</p>
          <p className="text-sm text-foreground mt-1">Os bens/serviços foram colocados à disposição do adquirente na data e local do documento - {invoice.deliveryLocation || company?.city || company?.province || "Luanda"}.</p>
        </div>

        {/* Dados Bancários */}
        {company?.bankIban && (
          <div className="px-6 py-4 border-t border-border">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Dados Bancários</p>
            <p className="text-sm text-foreground mt-1">
              {company.bankName && <span className="font-medium mr-2">{company.bankName}</span>}
              IBAN: <span className="font-mono">{company.bankIban}</span>
            </p>
          </div>
        )}

        {/* Rodapé */}
        <div className="px-6 py-4 border-t border-border text-center text-xs text-muted-foreground space-y-1">
          <p>Documento emitido electronicamente — Processado por Programa Validado n.º {company?.softwareValidationNumber || "000/AGT/202X"}</p>
          <p>Conforme legislação fiscal angolana — AGT | Decreto Presidencial n.º 71/25</p>
          {invoice.createdAt && <p>Emitido em: {formatDateTime(invoice.createdAt)}</p>}
        </div>
      </div>

      {/* Histórico de pagamentos */}
      <div className="card-elevated">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" /> Pagamentos
          </h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Pago: <span className="font-semibold text-emerald-600">{formatCurrency(paidAmount)}</span></span>
            <span>Em dívida: <span className={`font-semibold ${remaining > 0 ? "text-amber-600" : "text-emerald-600"}`}>{formatCurrency(remaining)}</span></span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-2.5">Data</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-3 py-2.5">Método</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-3 py-2.5">Referência</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-2.5">Montante</th>
              </tr>
            </thead>
            <tbody>
              {(payments ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-sm text-muted-foreground">Sem pagamentos registados.</td>
                </tr>
              )}
              {payments?.map((p) => (
                <tr key={p.id} className="border-b border-border/50">
                  <td className="px-5 py-3 text-sm">{formatDate(p.paymentDate)}</td>
                  <td className="px-3 py-3 text-sm">{(PAYMENT_METHODS as any)[p.method ?? "outro"] ?? p.method ?? "Outro"}</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground font-mono">{p.reference || "—"}</td>
                  <td className="px-5 py-3 text-right text-sm font-semibold text-emerald-600">{formatCurrency(Number(p.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
