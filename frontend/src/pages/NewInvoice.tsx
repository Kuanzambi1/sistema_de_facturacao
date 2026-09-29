import { Fragment, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, DOCUMENT_TYPE_LABELS, PAYMENT_METHODS, VAT_RATES } from "@/lib/utils";
import { calculateLineValues, calculateInvoiceTotals } from "@shared/fiscal-math";
import { cn } from "@/lib/utils";
import { ArrowLeft, Plus, Trash2, Calculator, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLocation } from "wouter";

type LineItem = {
  productId?: number;
  productCode?: string;
  type?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discount: number;
  vatExemptReasonCode?: string;
};

export default function NewInvoice() {
  const [, navigate] = useLocation();
  const [documentType, setDocumentType] = useState("FT");
  const [seriesId, setSeriesId] = useState<number | undefined>();
  const [clientId, setClientId] = useState<number | undefined>();
  const [clientRef, setClientRef] = useState("");
  const [operationDate, setOperationDate] = useState(new Date().toISOString().substring(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("transferencia");
  const [notes, setNotes] = useState("");
  const [relatedInvoiceNumber, setRelatedInvoiceNumber] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [rectificationType, setRectificationType] = useState<"anulacao_total" | "rectificacao_parcial">("anulacao_total");
  const [applyWithholdingTax, setApplyWithholdingTax] = useState(false);
  const [lines, setLines] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0, vatRate: 14, discount: 0 }]);

  const todayISO = new Date().toISOString().substring(0, 10);

  const { data: clients } = trpc.clients.list.useQuery({ limit: 500 });
  const { data: products } = trpc.products.list.useQuery({ limit: 500 });
  const { data: series } = trpc.series.list.useQuery({ documentType });
  const { data: company } = trpc.company.get.useQuery();
  const { data: vatExemptions } = trpc.vatExemptions.list.useQuery();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    const ref = params.get("ref");
    const client = params.get("clientId");
    
    if (type && DOCUMENT_TYPE_LABELS[type]) setDocumentType(type);
    if (ref) setRelatedInvoiceNumber(ref);
    if (client) setClientId(Number(client));
  }, []);

  // Auto-select first active series when type changes
  useEffect(() => {
    const activeSeries = series?.find(s => s.isActive);
    if (activeSeries) setSeriesId(activeSeries.id);
    else setSeriesId(undefined);
  }, [series]);

  useEffect(() => {
    if (lines.some(l => l.type === "servico")) {
      setApplyWithholdingTax(true);
    }
  }, [lines]);

  const createInvoice = trpc.invoices.create.useMutation({
    onSuccess: (inv) => {
      toast.success(`${DOCUMENT_TYPE_LABELS[documentType]} emitida com sucesso!`);
      if (inv) navigate(`/documentos/${inv.id}`);
      else navigate("/documentos");
    },
    onError: (e) => toast.error(e.message),
  });

  function addLine() {
    setLines(l => [...l, { description: "", quantity: 1, unitPrice: 0, vatRate: 14, discount: 0 }]);
  }

  function removeLine(i: number) {
    setLines(l => l.filter((_, idx) => idx !== i));
  }

  function updateLine(i: number, field: keyof LineItem, value: any) {
    setLines(l => l.map((line, idx) => idx === i ? { ...line, [field]: value } : line));
  }

  function selectProduct(i: number, productId: number) {
    const p = products?.data.find(p => p.id === productId);
    if (p) {
      setLines(l => l.map((line, idx) => idx === i ? {
        ...line,
        productId: p.id,
        productCode: p.code,
        description: p.name,
        unitPrice: Number(p.price),
        vatRate: p.isVatExempt ? 0 : Number(p.vatRate),
        type: p.type,
      } : line));
    }
  }

  // Calculations
  const calculatedLines = lines.map((l) => calculateLineValues({
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    discountPercent: l.discount,
    vatRate: l.vatRate,
    isService: l.type === "servico"
  }));
  const totals = calculateInvoiceTotals(calculatedLines, applyWithholdingTax ? 6.5 : 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!seriesId) { toast.error("Seleccione uma série de facturação."); return; }
    if (lines.some(l => !l.description)) { toast.error("Preencha a descrição de todos os artigos."); return; }

    // Validar motivo de isenção quando IVA é 0%
    const missingExemption = lines.some(l => l.vatRate === 0 && !l.vatExemptReasonCode);
    if (missingExemption) {
      toast.error("Seleccione o Motivo Legal de Isenção de IVA para todas as linhas com IVA a 0%.");
      return;
    }

    createInvoice.mutate({
      documentType: documentType as any,
      seriesId,
      clientId,
      clientRef: clientRef || undefined,
      issueDate: new Date(),
      operationDate: new Date(operationDate),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      paymentMethod: paymentMethod as any,
      notes,
      relatedInvoiceNumber: ["NC", "ND", "RC", "RG"].includes(documentType) && relatedInvoiceNumber ? relatedInvoiceNumber : undefined,
      cancelReason: documentType === "NC" ? cancelReason : undefined,
      rectificationType: documentType === "NC" ? rectificationType : undefined,
      withholdingTaxPercent: applyWithholdingTax ? 6.5 : 0,
      items: lines.map(l => ({
        productId: l.productId,
        productCode: l.productCode,
        type: l.type,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        vatRate: documentType === "ND" ? 0 : l.vatRate,
        discountPercent: l.discount,
        vatExemptReasonCode: documentType === "ND" ? "M99" : (l.vatRate === 0 ? l.vatExemptReasonCode : undefined),
        vatExemptReason: documentType === "ND" ? "Não sujeito (Nota de Débito)" : (l.vatRate === 0 && l.vatExemptReasonCode
          ? (vatExemptions || []).find(r => r.code === l.vatExemptReasonCode)?.description
          : undefined),
      })),
    });
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in-up max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate("/documentos")}>
          <ArrowLeft className="h-4 w-4" />Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Novo Documento Fiscal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Emissão conforme legislação AGT</p>
        </div>
      </div>

      {!company?.nif && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          ⚠️ Configure os dados da empresa em <a href="/configuracoes" className="underline font-medium">Configurações</a> antes de emitir documentos.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cabeçalho do documento */}
        <div className="card-elevated p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Dados do Documento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4">
            <div className="space-y-1.5 min-w-0">
              <Label>Tipo de Documento *</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{k} — {v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 min-w-0">
              <Label>Série *</Label>
              <Select key={seriesId || 'empty'} value={seriesId ? String(seriesId) : undefined} onValueChange={v => setSeriesId(Number(v))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar série..." /></SelectTrigger>
                <SelectContent>
                  {series?.filter(s => s.isActive).map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.code} — {s.name}</SelectItem>
                  ))}
                  {(!series || series.length === 0) && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">Nenhuma série activa para este tipo.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 min-w-0">
              <Label>Data de Emissão</Label>
              <Input type="date" value={todayISO} readOnly disabled className="bg-muted/50 cursor-not-allowed" />
              <p className="text-xs text-muted-foreground">Gerada automaticamente pelo sistema.</p>
            </div>
            <div className="space-y-1.5 min-w-0">
              <Label>Data da Operação *</Label>
              <Input type="date" value={operationDate} onChange={e => setOperationDate(e.target.value)} max={todayISO} required />
              <p className="text-xs text-muted-foreground">Data em que os bens/serviços foram prestados.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4 mt-4">
            <div className="space-y-1.5 min-w-0">
              <Label>{["OR", "PP", "FP", "CM"].includes(documentType) ? "Validade da Proposta" : "Data de Vencimento"}</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} min={todayISO} />
            </div>
          </div>
          
          {(documentType === "PP" || documentType === "FP" || documentType === "OR" || documentType === "CM") && (
            <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center gap-2.5 text-xs text-blue-900">
              <span className="text-base shrink-0">📄</span>
              <span>
                <strong>{DOCUMENT_TYPE_LABELS[documentType]}:</strong> Este documento tem natureza orçamental/previsional e não possui valor fiscal imediato nem consome a numeração das facturas fiscais. Após a aceitação, terá a opção de <strong>transformá-lo em Factura (FT) definitiva</strong>.
              </span>
            </div>
          )}

          {["NC", "ND", "RC", "RG"].includes(documentType) && (
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Documento de Origem (Nº da Fatura) *</Label>
                <Input type="text" value={relatedInvoiceNumber} onChange={e => setRelatedInvoiceNumber(e.target.value)} placeholder="Ex: FT 2026/1" required={["NC", "ND"].includes(documentType)} />
                <p className="text-xs text-muted-foreground mt-1">Obrigatório por lei ao emitir Nota de Crédito/Débito.</p>
              </div>
              
              {documentType === "NC" && (
                <>
                  <div className="col-span-2 lg:col-span-2 space-y-1.5">
                    <Label>Tipo de Rectificação *</Label>
                    <Select value={rectificationType} onValueChange={(v: any) => setRectificationType(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anulacao_total">Anulação Total</SelectItem>
                        <SelectItem value="rectificacao_parcial">Rectificação Parcial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 lg:col-span-4 space-y-1.5">
                    <Label>Motivo da Rectificação/Anulação *</Label>
                    <Input type="text" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Descreva o motivo legal ou comercial para esta anulação..." required />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Cliente */}
        <div className="card-elevated p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Entidade Destinatária</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Cliente</Label>
              <Select value={clientId ? String(clientId) : "consumidor"} onValueChange={v => setClientId(v === "consumidor" ? undefined : Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consumidor">Consumidor Final</SelectItem>
                  {clients?.data.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}{c.nif ? ` — NIF: ${c.nif}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>V/ Referência (do cliente, opcional)</Label>
              <Input type="text" value={clientRef} onChange={e => setClientRef(e.target.value)} placeholder="Ex: CONTABILIDADE2026" />
              <p className="text-xs text-muted-foreground mt-1">Referência interna do cliente que aparecerá na factura.</p>
            </div>
          </div>
        </div>

        {/* Linhas de artigos */}
        <div className="card-elevated">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Artigos / Serviços</h2>
          </div>
          <div className="overflow-x-auto pb-4">
            <table className="w-full table-fixed min-w-[1400px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5 w-64">Produto</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-2 py-2.5">Descrição *</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-2 py-2.5 w-24">Qtd.</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-2 py-2.5 w-40">Preço Unit.</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-2 py-2.5 w-20">Desc. %</th>
                  {documentType !== "ND" && <th className="text-center text-xs font-semibold text-muted-foreground px-2 py-2.5 w-24">IVA %</th>}
                  {documentType !== "ND" && <th className="text-left text-xs font-semibold text-muted-foreground px-2 py-2.5 w-48">Motivo de Isenção</th>}
                  <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-2.5 w-56">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => {
                  const lineResult = calculatedLines[i];
                  return (
                    <Fragment key={i}>
                      <tr className="border-b border-border/50 align-top">
                        <td className="px-4 py-2">
                          <Select value={line.productId ? String(line.productId) : ""} onValueChange={v => selectProduct(i, Number(v))}>
                            <SelectTrigger className="h-8 text-xs w-full max-w-full overflow-hidden [&_span]:truncate [&_span]:block text-left">
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              {products?.data.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.code} — {p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-2 align-top">
                          <Textarea 
                            className="min-h-[32px] w-full text-xs py-1.5 resize-none leading-tight overflow-hidden break-words whitespace-pre-wrap" 
                            rows={1}
                            value={line.description} 
                            onChange={e => {
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                              updateLine(i, "description", e.target.value);
                            }} 
                            ref={el => {
                              if (el) {
                                el.style.height = 'auto';
                                el.style.height = `${el.scrollHeight}px`;
                              }
                            }}
                            placeholder="Descrição do artigo" 
                            required 
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input className="h-8 text-xs text-right w-full" type="number" step="0.001" min="0.001" value={line.quantity} onChange={e => updateLine(i, "quantity", Number(e.target.value))} onFocus={e => e.target.select()} />
                        </td>
                        <td className="px-2 py-2">
                          <Input className="h-8 text-xs text-right w-full" type="number" step="0.01" min="0" value={line.unitPrice} onChange={e => updateLine(i, "unitPrice", Number(e.target.value))} onFocus={e => e.target.select()} />
                        </td>
                        <td className="px-2 py-2">
                          <Input className="h-8 text-xs text-right w-full" type="number" step="0.01" min="0" max="100" value={line.discount} onChange={e => updateLine(i, "discount", Number(e.target.value))} onFocus={e => e.target.select()} />
                        </td>
                        {documentType !== "ND" && (
                          <td className="px-2 py-2">
                            <Select value={String(line.vatRate)} onValueChange={v => updateLine(i, "vatRate", Number(v))}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {VAT_RATES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </td>
                        )}
                        {documentType !== "ND" && (
                          <td className="px-2 py-2">
                            <Select disabled={line.vatRate !== 0} value={line.vatRate === 0 ? (line.vatExemptReasonCode || "") : ""} onValueChange={v => updateLine(i, "vatExemptReasonCode", v)}>
                              <SelectTrigger className={cn("h-8 text-xs", line.vatRate === 0 && !line.vatExemptReasonCode && "border-amber-400 bg-amber-50")}>
                                <SelectValue placeholder={line.vatRate === 0 ? "Seleccione..." : "Não aplicável"} />
                              </SelectTrigger>
                              <SelectContent>
                                {(vatExemptions || []).map(r => (
                                  <SelectItem key={r.code} value={r.code}>
                                    <span className="font-mono">{r.code}</span> - {r.description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        )}
                        <td className="px-4 py-2 text-right text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                          {formatCurrency(lineResult.total)}
                        </td>
                        <td className="pr-2">
                          {lines.length > 1 && (
                            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeLine(i)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
                <tr className="border-t border-border/50">
                  <td colSpan={9} className="px-4 py-3">
                    <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1.5">
                      <Plus className="h-3.5 w-3.5" />Adicionar Linha
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totais */}
          <div className="flex justify-end px-5 py-4 border-t border-border">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal (s/IVA)</span>
                <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA</span>
                <span className="font-medium">{formatCurrency(totals.vatAmount)}</span>
              </div>
              {applyWithholdingTax && (
                <div className="flex justify-between text-sm text-amber-700">
                  <span>Retenção na Fonte (6.5%)</span>
                  <span className="font-medium">-{formatCurrency(totals.withholdingTaxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold border-t border-border pt-2">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(totals.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pagamento e notas */}
        <div className="card-elevated p-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHODS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Notas ou condições especiais..." />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input type="checkbox" id="withholding" checked={applyWithholdingTax} onChange={e => setApplyWithholdingTax(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
            <Label htmlFor="withholding" className="font-normal cursor-pointer">Aplicar Retenção na Fonte (IRT 6.5%) - Apenas para prestação de serviços</Label>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            O documento será emitido com ATCUD e assinatura digital conforme legislação AGT.
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/documentos")}>Cancelar</Button>
            <Button type="submit" disabled={createInvoice.isPending} className="gap-2">
              <FileText className="h-4 w-4" />
              {createInvoice.isPending ? "A emitir..." : `Emitir ${DOCUMENT_TYPE_LABELS[documentType]}`}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
