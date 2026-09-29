import { useState, useMemo } from "react";
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
  const [dateFrom, setDateFrom] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10));
  const [dateTo, setDateTo] = useState(now.toISOString().substring(0, 10));
  const [groupBy, setGroupBy] = useState<"documentType" | "client" | "product" | "vatRate" | "daily">("documentType");
  
  const { data: rawData, isLoading } = trpc.reports.advancedData.useQuery({ 
    dateFrom: new Date(dateFrom), 
    dateTo: new Date(dateTo) 
  });
  const { data: company } = trpc.company.get.useQuery();

  const groupedData = useMemo(() => {
    if (!rawData) return [];

    // Filters: We exclude 'rascunho'. We need to handle 'anulada' and 'NC' correctly.
    // The requirement says "pró-formas não entram nos relatórios fiscais; NC e anuladas tratadas correctamente nos totais."
    const validData = rawData.filter((r: any) => 
      !["rascunho", "PP", "OR", "FP", "CM"].includes(r.documentType)
    );

    const map = new Map<string, any>();

    for (const row of validData) {
      // Basic grouping key
      let key = "Desconhecido";
      if (groupBy === "documentType") key = DOCUMENT_TYPE_LABELS[row.documentType] || row.documentType;
      if (groupBy === "client") key = row.clientName || "Cliente Final";
      if (groupBy === "product") key = row.description || "Sem Artigo";
      if (groupBy === "vatRate") key = row.vatRate === 0 ? "Isento (0%)" : `${row.vatRate}%`;
      if (groupBy === "daily") key = new Date(row.issueDate).toLocaleDateString("pt-AO");

      // For document and client level, avoid multiplying invoice totals by the number of items
      // We will sum items to be perfectly granular.
      // Wait, NC should be negative! Anulada should be 0.
      const isAnulada = row.status === "anulada";
      const sign = row.documentType === "NC" ? -1 : 1;
      
      const g = map.get(key) || { 
        label: key, 
        grossAmount: 0, 
        discount: 0, 
        subtotal: 0, 
        vatAmount: 0, 
        totalAmount: 0, 
        docCount: new Set() 
      };

      if (!isAnulada) {
        g.grossAmount += (row.itemSubtotal) * sign;
        g.discount += 0; // Se houver desconto de linha na DB pode ser adicionado aqui
        g.subtotal += row.itemSubtotal * sign;
        g.vatAmount += row.itemVat * sign;
        g.totalAmount += row.itemTotal * sign;
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
    const doc = new jsPDF("p", "mm", "a4");
    doc.setFontSize(14);
    doc.text(`Relatório Avançado: ${company?.name || "Empresa"}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Período: ${dateFrom} a ${dateTo}`, 14, 28);
    
    let y = 35;
    autoTable(doc, {
      startY: y,
      head: [["Agrupamento", "Qtd Doc.", "Valor Bruto", "Desc.", "Base Tributável", "IVA", "Total"]],
      body: groupedData.map(row => [
        row.label,
        row.docCount.toString(),
        formatCurrency(row.grossAmount),
        formatCurrency(row.discount),
        formatCurrency(row.subtotal),
        formatCurrency(row.vatAmount),
        formatCurrency(row.totalAmount),
      ]),
      foot: [[
        "Total Geral", 
        groupedData.reduce((s, r) => s + r.docCount, 0).toString(),
        formatCurrency(groupedData.reduce((s, r) => s + r.grossAmount, 0)),
        formatCurrency(groupedData.reduce((s, r) => s + r.discount, 0)),
        formatCurrency(groupedData.reduce((s, r) => s + r.subtotal, 0)),
        formatCurrency(groupedData.reduce((s, r) => s + r.vatAmount, 0)),
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
      <div className="flex flex-col sm:flex-row items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs">De</Label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Até</Label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9" />
        </div>
        <div className="space-y-1 flex-1">
          <Label className="text-xs">Agrupar por</Label>
          <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="documentType">Tipo de Documento</SelectItem>
              <SelectItem value="client">Cliente</SelectItem>
              <SelectItem value="product">Artigo / Serviço</SelectItem>
              <SelectItem value="vatRate">Taxa de IVA</SelectItem>
              <SelectItem value="daily">Diário</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 shrink-0" onClick={generatePDF} disabled={isLoading || groupedData.length === 0}>
            <Download className="h-4 w-4" /> Exportar PDF
          </Button>
          <Button variant="outline" className="gap-2 shrink-0" onClick={() => window.print()} disabled={isLoading || groupedData.length === 0}>
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
              <tr className="border-b border-border">
                <th className="text-left py-3 font-semibold text-muted-foreground">Agrupamento</th>
                <th className="text-center py-3 font-semibold text-muted-foreground">Docs.</th>
                <th className="text-right py-3 font-semibold text-muted-foreground">Valor Bruto</th>
                <th className="text-right py-3 font-semibold text-muted-foreground">Desc.</th>
                <th className="text-right py-3 font-semibold text-muted-foreground">Base Tributável</th>
                <th className="text-right py-3 font-semibold text-muted-foreground">IVA Liquidado</th>
                <th className="text-right py-3 font-semibold text-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {groupedData.map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 font-medium">{row.label}</td>
                  <td className="py-3 text-center text-muted-foreground">{row.docCount}</td>
                  <td className="py-3 text-right text-muted-foreground">{formatCurrency(row.grossAmount)}</td>
                  <td className="py-3 text-right text-muted-foreground">{formatCurrency(row.discount)}</td>
                  <td className="py-3 text-right">{formatCurrency(row.subtotal)}</td>
                  <td className="py-3 text-right">{formatCurrency(row.vatAmount)}</td>
                  <td className="py-3 text-right font-semibold">{formatCurrency(row.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/40 font-semibold border-t-2 border-border">
                <td className="py-3 px-2">Total Global (Período)</td>
                <td className="py-3 text-center">{groupedData.reduce((s, r) => s + r.docCount, 0)}</td>
                <td className="py-3 text-right">{formatCurrency(groupedData.reduce((s, r) => s + r.grossAmount, 0))}</td>
                <td className="py-3 text-right">{formatCurrency(groupedData.reduce((s, r) => s + r.discount, 0))}</td>
                <td className="py-3 text-right">{formatCurrency(groupedData.reduce((s, r) => s + r.subtotal, 0))}</td>
                <td className="py-3 text-right text-primary">{formatCurrency(groupedData.reduce((s, r) => s + r.vatAmount, 0))}</td>
                <td className="py-3 text-right">{formatCurrency(groupedData.reduce((s, r) => s + r.totalAmount, 0))}</td>
              </tr>
            </tfoot>
          </table>
          <div className="mt-4 text-xs text-muted-foreground bg-amber-50 text-amber-800 p-3 rounded border border-amber-200">
            <strong>Nota:</strong> Documentos orçamentais (Pró-formas, Orçamentos) não estão incluídos nestes totais. Notas de Crédito são subtraídas aos totais, e facturas anuladas contam como zero.
          </div>
        </div>
      )}
    </div>
  );
}
