import { useRef } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, formatDateTime, DOCUMENT_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS, PAYMENT_METHODS, downloadFile, numeroPorExtenso } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ArrowLeft, Download, FileX, CheckCircle2, Printer, Shield, Hash, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const { data: invoice, isLoading } = trpc.invoices.get.useQuery({ id });
  const items = invoice?.items;
  const { data: company } = trpc.company.get.useQuery();

  const updateStatus = trpc.invoices.updateStatus.useMutation({
    onSuccess: () => { utils.invoices.get.invalidate({ id }); toast.success("Estado actualizado!"); },
    onError: (e) => toast.error(e.message),
  });

  const exportSAFT = trpc.invoices.exportSAFT.useMutation({
    onSuccess: (result) => {
      downloadFile(result.xml, result.filename, "application/xml");
      toast.success("SAF-T exportado!");
    },
    onError: (e) => toast.error(e.message),
  });

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

  const isEditable = invoice.status === "rascunho";
  const canPay = invoice.status === "emitida";
  const canCancel = invoice.status === "emitida" || invoice.status === "paga";

  async function downloadPDF() {
    if (!invoice) return;
    const filename = `${invoice.fullNumber ? invoice.fullNumber.replace(/\//g, "_") : "Rascunho"}.pdf`;
    const toastId = toast.loading("A gerar PDF nativo...");
    try {
      const doc = new jsPDF("p", "mm", "a4");
      
      const drawText = (text: string, x: number, y: number, size = 10, font = "helvetica", style = "normal", options?: any) => {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(size);
        doc.setFont(font, style);
        doc.text(text, x, y, options);
      };

      drawText("SISTEMA DE FACTURAÇÃO", 10, 15, 14, "helvetica", "bold");
      if (company) {
        drawText(company.name || "Sua Empresa", 10, 22, 10, "helvetica", "bold");
        drawText(`NIF: ${company.nif || ""}`, 10, 27, 9, "helvetica", "normal");
        drawText(`${company.address || ""}, ${company.city || ""}`, 10, 32, 9);
        drawText(`${company.phone || ""} | ${company.email || ""}`, 10, 37, 9);
      }

      doc.setDrawColor(220, 220, 220);
      doc.rect(130, 10, 70, 30, "S");
      drawText(DOCUMENT_TYPE_LABELS[invoice.documentType] || "Fatura", 135, 17, 12, "helvetica", "bold");
      drawText(`Nº: ${invoice.fullNumber || "Rascunho"}`, 135, 23, 10, "helvetica", "bold");
      drawText(`Emissão: ${formatDate(invoice.issueDate)}`, 135, 29, 9, "helvetica", "normal");
      if (invoice.dueDate) {
        drawText(`Vencimento: ${formatDate(invoice.dueDate)}`, 135, 34, 9);
      }

      if (invoice.atcud) {
        drawText(`ATCUD: ${invoice.atcud}`, 10, 48, 9, "helvetica", "bold");
        if (invoice.hashControl) {
          drawText(`Hash: ${invoice.hashControl}`, 10, 53, 8, "courier", "normal");
        }
      }
      
      if (invoice.relatedInvoiceNumber) {
        drawText(`Referente à fatura: ${invoice.relatedInvoiceNumber}`, 135, 48, 9, "helvetica", "bold");
      }

      doc.setDrawColor(220, 220, 220);
      doc.rect(10, 60, 95, 35, "S");
      drawText("DADOS DO CLIENTE", 15, 66, 8, "helvetica", "bold");
      drawText(invoice.clientName || "Consumidor Final", 15, 73, 10, "helvetica", "bold");
      if (invoice.clientNif) drawText(`NIF: ${invoice.clientNif}`, 15, 78, 9, "helvetica", "normal");
      if (invoice.clientAddress) drawText(invoice.clientAddress, 15, 83, 9, "helvetica", "normal");
      if (invoice.deliveryLocation) {
        drawText(`Local Entrega: ${invoice.deliveryLocation}`, 15, 88, 8, "helvetica", "normal");
      }

      doc.rect(110, 60, 90, 35, "S");
      drawText("DETALHES DO PAGAMENTO", 115, 66, 8, "helvetica", "bold");
      drawText(`Estado: ${STATUS_LABELS[invoice.status]}`, 115, 73, 9, "helvetica", "normal");
      if (invoice.paymentMethod) drawText(`Método: ${(PAYMENT_METHODS as any)[invoice.paymentMethod] ?? invoice.paymentMethod}`, 115, 78, 9);
      if (invoice.paymentDate) drawText(`Pago em: ${formatDate(invoice.paymentDate)}`, 115, 83, 9);

      const tableBody = items?.map((item: any) => [
        item.productCode || "",
        item.description,
        `${Number(item.quantity).toFixed(2)} ${item.unit || "un"}`,
        formatCurrency(Number(item.unitPrice)),
        `${Number(item.discountPercent || 0).toFixed(1)}%`,
        `${Number(item.vatRate || 0).toFixed(0)}%`,
        formatCurrency(Number(item.total))
      ]) || [];

      autoTable(doc, {
        startY: 100,
        head: [['Código', 'Descrição', 'Qtd', 'Preço Unit.', 'Desc.', 'IVA', 'Total']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'center' },
          6: { halign: 'right' }
        }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setDrawColor(200, 200, 200);
      doc.line(130, finalY, 200, finalY);
      
      drawText("Subtotal:", 130, finalY + 7, 9, "helvetica", "normal");
      drawText(formatCurrency(Number(invoice.subtotal)), 200, finalY + 7, 9, "helvetica", "normal", { align: "right" });
      
      drawText("Total IVA:", 130, finalY + 12, 9);
      drawText(formatCurrency(Number(invoice.vatAmount)), 200, finalY + 12, 9, "helvetica", "normal", { align: "right" });
      
      let nextY = finalY + 17;
      if (Number(invoice.discountAmount) > 0) {
        drawText("Desconto:", 130, nextY, 9);
        drawText(`-${formatCurrency(Number(invoice.discountAmount))}`, 200, nextY, 9, "helvetica", "normal", { align: "right" });
        nextY += 5;
      }
      
      if (Number(invoice.withholdingTaxAmount) > 0) {
        drawText("Retenção (6.5%):", 130, nextY, 9);
        drawText(`-${formatCurrency(Number(invoice.withholdingTaxAmount))}`, 200, nextY, 9, "helvetica", "normal", { align: "right" });
        nextY += 5;
      }

      doc.line(130, nextY, 200, nextY);
      drawText("TOTAL A PAGAR:", 130, nextY + 7, 10, "helvetica", "bold");
      drawText(formatCurrency(Number(invoice.totalAmount)), 200, nextY + 7, 10, "helvetica", "bold", { align: "right" });
      
      if (invoice.currency && invoice.currency !== "AOA") {
        drawText(`Moeda: ${invoice.currency}`, 200, nextY + 12, 8, "helvetica", "normal", { align: "right" });
      }
      
      // Valor por extenso
      drawText("Valor por extenso:", 10, finalY + 7, 8, "helvetica", "bold");
      drawText(numeroPorExtenso(Number(invoice.totalAmount)), 10, finalY + 12, 8, "helvetica", "italic");

      if (company?.bankIban) {
        drawText("Dados para Pagamento / IBAN:", 10, finalY + 22, 8, "helvetica", "bold");
        drawText(`${company.bankName ? company.bankName + " - " : ""}${company.bankIban}`, 10, finalY + 27, 8, "helvetica", "normal");
      }

      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const validationNumber = company?.softwareValidationNumber || "000/AGT/202X";
      doc.text(`Documento emitido electronicamente — Processado por Programa Validado nº ${validationNumber}`, 105, pageHeight - 15, { align: "center" });
      doc.text("Conforme legislação fiscal angolana — AGT", 105, pageHeight - 10, { align: "center" });
      if (invoice.createdAt) {
        doc.text(`Emitido em: ${formatDateTime(invoice.createdAt)}`, 10, pageHeight - 10);
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

  return (
    <div ref={invoiceRef} className="p-6 space-y-5 animate-fade-in-up max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate("/documentos")}>
            <ArrowLeft className="h-4 w-4" />Voltar
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{invoice.fullNumber}</h1>
              <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLORS[invoice.status])}>
                {STATUS_LABELS[invoice.status]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{DOCUMENT_TYPE_LABELS[invoice.documentType]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadPDF}>
            <Printer className="h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportSAFT.mutate({ dateFrom: new Date(invoice.issueDate), dateTo: new Date(invoice.issueDate) })} disabled={exportSAFT.isPending}>
            <Download className="h-4 w-4" />SAF-T
          </Button>
          {canPay && (
            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus.mutate({ id, status: "paga", paymentDate: new Date() })}>
              <CheckCircle2 className="h-4 w-4" />Marcar como Paga
            </Button>
          )}
          {canCancel && (
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive hover:bg-destructive/10"
              onClick={() => { if (confirm("Anular este documento? Esta acção não pode ser revertida.")) updateStatus.mutate({ id, status: "anulada" }); }}>
              <FileX className="h-4 w-4" />Anular
            </Button>
          )}
        </div>
      </div>

      {/* Informações Fiscais Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ATCUD e Assinatura */}
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
        
        {/* Documento Referente */}
        {invoice.relatedInvoiceNumber && (
          <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <FileText className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Documento Referente</p>
              <p className="text-sm text-foreground mt-0.5 font-medium">{invoice.relatedInvoiceNumber}</p>
            </div>
          </div>
        )}
      </div>

      {/* Dados do documento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Emitente */}
        <div className="card-elevated p-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Emitente</h2>
          {company ? (
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{company.name}</p>
              {company.nif && <p className="text-sm text-muted-foreground">NIF: {company.nif}</p>}
              {company.address && <p className="text-sm text-muted-foreground">{company.address}</p>}
              {(company.city || company.province) && <p className="text-sm text-muted-foreground">{[company.city, company.province].filter(Boolean).join(", ")}</p>}
              {company.phone && <p className="text-sm text-muted-foreground">{company.phone}</p>}
              {company.email && <p className="text-sm text-muted-foreground">{company.email}</p>}
            </div>
          ) : <p className="text-sm text-muted-foreground">Dados da empresa não configurados.</p>}
        </div>

        {/* Destinatário */}
        <div className="card-elevated p-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Destinatário</h2>
          {invoice.clientName ? (
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{invoice.clientName}</p>
              {invoice.clientNif && <p className="text-sm text-muted-foreground">NIF: {invoice.clientNif}</p>}
              {invoice.clientAddress && <p className="text-sm text-muted-foreground">{invoice.clientAddress}</p>}
              {invoice.deliveryLocation && <p className="text-sm text-muted-foreground">Local Entrega: {invoice.deliveryLocation}</p>}
            </div>
          ) : <p className="text-sm text-muted-foreground">Consumidor Final</p>}
        </div>
      </div>

      {/* Datas e pagamento */}
      <div className="card-elevated p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Data de Emissão</p>
            <p className="text-sm font-medium mt-0.5">{formatDate(invoice.issueDate)}</p>
          </div>
          {invoice.dueDate && (
            <div>
              <p className="text-xs text-muted-foreground">Data de Vencimento</p>
              <p className="text-sm font-medium mt-0.5">{formatDate(invoice.dueDate)}</p>
            </div>
          )}
          {invoice.paymentDate && (
            <div>
              <p className="text-xs text-muted-foreground">Data de Pagamento</p>
              <p className="text-sm font-medium mt-0.5">{formatDate(invoice.paymentDate)}</p>
            </div>
          )}
          {invoice.paymentMethod && (
            <div>
              <p className="text-xs text-muted-foreground">Forma de Pagamento</p>
              <p className="text-sm font-medium mt-0.5">{(PAYMENT_METHODS as any)[invoice.paymentMethod] ?? invoice.paymentMethod}</p>
            </div>
          )}
        </div>
      </div>

      {/* Linhas */}
      <div className="card-elevated">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Artigos / Serviços</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-2.5">Descrição</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-2.5">Qtd.</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-2.5">Preço Unit.</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-2.5">Desc. %</th>
                <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-2.5">IVA %</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-2.5">Total c/IVA</th>
              </tr>
            </thead>
            <tbody>
              {items?.map((item: any) => (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="px-5 py-3">
                    <p className="text-sm text-foreground">{item.description}</p>
                    {item.productCode && <p className="text-xs text-muted-foreground font-mono">{item.productCode}</p>}
                  </td>
                  <td className="px-3 py-3 text-right text-sm">{Number(item.quantity).toFixed(3)} {item.unit}</td>
                  <td className="px-3 py-3 text-right text-sm">{formatCurrency(Number(item.unitPrice))}</td>
                  <td className="px-3 py-3 text-right text-sm">{Number(item.discountPercent).toFixed(1)}%</td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{Number(item.vatRate).toFixed(0)}%</span>
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-semibold">{formatCurrency(Number(item.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totais */}
        <div className="flex justify-end px-5 py-4 border-t border-border">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal (s/IVA)</span>
              <span>{formatCurrency(Number(invoice.subtotal))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IVA</span>
              <span>{formatCurrency(Number(invoice.vatAmount))}</span>
            </div>
            {Number(invoice.discountAmount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desconto</span>
                <span className="text-emerald-600">-{formatCurrency(Number(invoice.discountAmount))}</span>
              </div>
            )}
            {Number(invoice.withholdingTaxAmount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Retenção (6.5%)</span>
                <span className="text-amber-700">-{formatCurrency(Number(invoice.withholdingTaxAmount))}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold border-t border-border pt-2">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(Number(invoice.totalAmount))}</span>
            </div>
            {invoice.currency && invoice.currency !== "AOA" && (
              <p className="text-xs text-muted-foreground text-right">Moeda: {invoice.currency}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notas */}
      {invoice.notes && (
        <div className="card-elevated p-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Observações</h2>
          <p className="text-sm text-foreground">{invoice.notes}</p>
        </div>
      )}

      {/* Dados de Pagamento */}
      {company?.bankIban && (
        <div className="card-elevated p-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Dados para Pagamento</h2>
          <p className="text-sm text-foreground">
            {company.bankName && <span className="font-medium mr-2">{company.bankName}</span>}
            IBAN: <span className="font-mono">{company.bankIban}</span>
          </p>
        </div>
      )}

      {/* Rodapé fiscal */}
      <div className="text-center text-xs text-muted-foreground space-y-1 py-2">
        <p>Documento emitido electronicamente — Processado por Programa Validado nº {company?.softwareValidationNumber || "000/AGT/202X"}</p>
        <p>Conforme legislação fiscal angolana — AGT | Decreto Presidencial n.º 71/25</p>
        {invoice.createdAt && <p>Emitido em: {formatDateTime(invoice.createdAt)}</p>}
      </div>
    </div>
  );
}
