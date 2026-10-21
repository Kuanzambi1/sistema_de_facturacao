import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, DOCUMENT_TYPE_LABELS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function AdvancedReports() {
  const now = new Date();
  const [period, setPeriod] = useState("mensal");
  const [dateFrom, setDateFrom] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10));
  const [dateTo, setDateTo] = useState(now.toISOString().substring(0, 10));
  const [groupBy, setGroupBy] = useState("documentType");
  
  useEffect(() => {
    const today = new Date();
    if (period === "diario") {
      setDateFrom(today.toISOString().substring(0, 10));
      setDateTo(today.toISOString().substring(0, 10));
    } else if (period === "semanal") {
      const first = today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1);
      const start = new Date(today.setDate(first));
      setDateFrom(start.toISOString().substring(0, 10));
      setDateTo(new Date().toISOString().substring(0, 10));
    } else if (period === "mensal") {
      setDateFrom(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().substring(0, 10));
      setDateTo(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().substring(0, 10));
    } else if (period === "trimestral") {
      const q = Math.floor(today.getMonth() / 3);
      setDateFrom(new Date(today.getFullYear(), q * 3, 1).toISOString().substring(0, 10));
      setDateTo(new Date(today.getFullYear(), q * 3 + 3, 0).toISOString().substring(0, 10));
    } else if (period === "semestral") {
      const s = Math.floor(today.getMonth() / 6);
      setDateFrom(new Date(today.getFullYear(), s * 6, 1).toISOString().substring(0, 10));
      setDateTo(new Date(today.getFullYear(), s * 6 + 6, 0).toISOString().substring(0, 10));
    } else if (period === "anual") {
      setDateFrom(new Date(today.getFullYear(), 0, 1).toISOString().substring(0, 10));
      setDateTo(new Date(today.getFullYear(), 11, 31).toISOString().substring(0, 10));
    }
  }, [period]);

  const { data: rawData, isLoading } = trpc.reports.advancedData.useQuery({ 
    dateFrom: new Date(dateFrom), 
    dateTo: new Date(dateTo) 
  });
  const { data: company } = trpc.company.get.useQuery();

  const groupedData = useMemo(() => {
    if (!rawData) return [];

    const validData = rawData.filter((r: any) => 
      !["rascunho", "PP", "OR", "FP", "CM"].includes(r.documentType)
    );

    const map = new Map<string, any>();

    for (const row of validData) {
      let key = "Desconhecido";
      if (groupBy === "documentType") key = DOCUMENT_TYPE_LABELS[row.documentType] || row.documentType;
      if (groupBy === "client") key = row.clientName || "Cliente Final";
      if (groupBy === "product") key = row.description || "Sem Artigo";
      if (groupBy === "vatRate") key = row.vatRate === 0 ? "Isento (0%)" : `${row.vatRate}%`;
      if (groupBy === "vatType") key = row.vatRate === 0 ? "Facturação Isenta/Sem IVA" : "Facturação com IVA";
      if (groupBy === "status") key = row.status === "anulada" ? "Facturas Anuladas" : "Facturas Válidas";
      
      const isAnulada = row.status === "anulada";
      const sign = row.documentType === "NC" ? -1 : (row.documentType === "ND" ? 1 : 1);
      
      const g = map.get(key) || { 
        label: key, 
        grossAmount: 0, 
        discount: 0, 
        subtotal: 0, 
        vatAmount: 0,
        otherTaxes: 0,
        withholdingTax: 0,
        totalAmount: 0, 
        docCount: new Set() 
      };

      if (!isAnulada) {
        const itemGross = (row.quantity * row.unitPrice);
        const itemDiscount = ((row.discountPercent || 0) / 100) * itemGross;

        g.grossAmount += itemGross * sign;
        g.discount += itemDiscount * sign;
        g.subtotal += row.itemSubtotal * sign;
        g.vatAmount += row.itemVat * sign;
        g.totalAmount += row.itemTotal * sign;
        
        if (!g.docCount.has(row.id)) {
          g.withholdingTax += (row.invoiceWithholdingTaxAmount || 0) * sign;
        }
      }
      
      g.docCount.add(row.id);
      map.set(key, g);
    }

    return Array.from(map.values()).map(g => ({
      ...g,
      docCount: g.docCount.size
    })).sort((a, b) => b.totalAmount - a.totalAmount);

  }, [rawData, groupBy]);

  const generatePDF = () => {
    const doc = new jsPDF("l", "mm", "a4");
    doc.setFontSize(14);
    doc.text(`Relatório Financeiro: ${company?.name || "Empresa"}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Período: ${dateFrom} a ${dateTo}`, 14, 28);
    
    let y = 35;
    autoTable(doc, {
      startY: y,
      head: [["Agrupamento", "Qtd", "Valor Bruto", "Descontos", "Sem Imposto", "IVA", "Outros", "Retenções", "Total"]],
      body: groupedData.map(row => [
        row.label,
        row.docCount.toString(),
        formatCurrency(row.grossAmount),
        formatCurrency(row.discount),
        formatCurrency(row.subtotal),
        formatCurrency(row.vatAmount),
        formatCurrency(row.otherTaxes),
        formatCurrency(row.withholdingTax),
        formatCurrency(row.totalAmount),
      ]),
      foot: [[
        "Total Geral", 
        groupedData.reduce((s, r) => s + r.docCount, 0).toString(),
        formatCurrency(groupedData.reduce((s, r) => s + r.grossAmount, 0)),
        formatCurrency(groupedData.reduce((s, r) => s + r.discount, 0)),
        formatCurrency(groupedData.reduce((s, r) => s + r.subtotal, 0)),
        formatCurrency(groupedData.reduce((s, r) => s + r.vatAmount, 0)),
        formatCurrency(groupedData.reduce((s, r) => s + r.otherTaxes, 0)),
        formatCurrency(groupedData.reduce((s, r) => s + r.withholdingTax, 0)),
        formatCurrency(groupedData.reduce((s, r) => s + r.totalAmount, 0)),
      ]],
      theme: "grid",
      headStyles: { fillColor: [40, 40, 40] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });
    
    doc.save(`Relatorio_${groupBy}_${dateFrom}_${dateTo}.pdf`);
  };

  return (
    <div className="card-elevated p-5 space-y-6">
      <div className="flex flex-col xl:flex-row items-end gap-4 flex-wrap">
        <div className="space-y-1 w-40 shrink-0">
          <Label className="text-xs">Período</Label>
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diario">Diário</SelectItem>
              <SelectItem value="semanal">Semanal</SelectItem>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="trimestral">Trimestral</SelectItem>
              <SelectItem value="semestral">Semestral</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
              <SelectItem value="personalizado">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 w-36 shrink-0">
          <Label className="text-xs">De</Label>
          <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPeriod("personalizado"); }} className="h-9" />
        </div>
        <div className="space-y-1 w-36 shrink-0">
          <Label className="text-xs">Até</Label>
          <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPeriod("personalizado"); }} className="h-9" />
        </div>
        <div className="space-y-1 flex-1 min-w-[200px]">
          <Label className="text-xs">Separar / Agrupar por</Label>
          <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="documentType">Tipo de Documento (Facturas, NC, ND...)</SelectItem>
              <SelectItem value="vatType">Facturação com IVA vs Isenta</SelectItem>
              <SelectItem value="vatRate">Facturação por Taxa de IVA</SelectItem>
              <SelectItem value="client">Facturação por Cliente</SelectItem>
              <SelectItem value="product">Facturação por Produto</SelectItem>
              <SelectItem value="status">Facturas Anuladas vs Válidas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 shrink-0 h-9" onClick={generatePDF} disabled={isLoading || groupedData.length === 0}>
            <Download className="h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" className="gap-2 shrink-0 h-9" onClick={() => window.print()} disabled={isLoading || groupedData.length === 0}>
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">A carregar dados...</div>
      ) : groupedData.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Sem resultados para o período e agrupamento seleccionados.</div>
      ) : (
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left py-3 px-2 font-semibold text-muted-foreground whitespace-nowrap">Agrupamento</th>
                <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Docs.</th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Valor Bruto</th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Descontos</th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Total s/ Imposto</th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">IVA</th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Outros Imp.</th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Retenções</th>
                <th className="text-right py-3 px-2 font-semibold text-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {groupedData.map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-2 font-medium">{row.label}</td>
                  <td className="py-3 px-2 text-center text-muted-foreground">{row.docCount}</td>
                  <td className="py-3 px-2 text-right text-muted-foreground">{formatCurrency(row.grossAmount)}</td>
                  <td className="py-3 px-2 text-right text-muted-foreground">{formatCurrency(row.discount)}</td>
                  <td className="py-3 px-2 text-right">{formatCurrency(row.subtotal)}</td>
                  <td className="py-3 px-2 text-right">{formatCurrency(row.vatAmount)}</td>
                  <td className="py-3 px-2 text-right text-muted-foreground">{formatCurrency(row.otherTaxes)}</td>
                  <td className="py-3 px-2 text-right text-muted-foreground">{formatCurrency(row.withholdingTax)}</td>
                  <td className="py-3 px-2 text-right font-semibold">{formatCurrency(row.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/40 font-semibold border-t-2 border-border">
                <td className="py-3 px-2">Total Global</td>
                <td className="py-3 px-2 text-center">{groupedData.reduce((s, r) => s + r.docCount, 0)}</td>
                <td className="py-3 px-2 text-right">{formatCurrency(groupedData.reduce((s, r) => s + r.grossAmount, 0))}</td>
                <td className="py-3 px-2 text-right">{formatCurrency(groupedData.reduce((s, r) => s + r.discount, 0))}</td>
                <td className="py-3 px-2 text-right">{formatCurrency(groupedData.reduce((s, r) => s + r.subtotal, 0))}</td>
                <td className="py-3 px-2 text-right text-primary">{formatCurrency(groupedData.reduce((s, r) => s + r.vatAmount, 0))}</td>
                <td className="py-3 px-2 text-right text-muted-foreground">{formatCurrency(groupedData.reduce((s, r) => s + r.otherTaxes, 0))}</td>
                <td className="py-3 px-2 text-right text-muted-foreground">{formatCurrency(groupedData.reduce((s, r) => s + r.withholdingTax, 0))}</td>
                <td className="py-3 px-2 text-right">{formatCurrency(groupedData.reduce((s, r) => s + r.totalAmount, 0))}</td>
              </tr>
            </tfoot>
          </table>
          <div className="mt-4 text-xs text-muted-foreground bg-amber-50 text-amber-800 p-3 rounded border border-amber-200">
            <strong>Nota:</strong> Documentos orçamentais (Pró-formas, Orçamentos) não entram nestes totais. Notas de Crédito são subtraídas aos totais, e facturas anuladas contam como zero. Retenções são atribuídas apenas uma vez por factura.
          </div>
        </div>
      )}
    </div>
  );
}
