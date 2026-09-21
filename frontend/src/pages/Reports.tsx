import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const COLORS = ["#1e3a5f", "#2d5a8e", "#4a7fb5", "#7ba7d4", "#b0cfe8", "#d4e6f5"];

const DOC_TYPE_LABELS: Record<string, string> = {
  FT: "Factura",
  FR: "Factura-Recibo",
  FS: "Factura Simplificada",
  FA: "Factura de Adiantamento",
  NC: "Nota de Crédito",
  ND: "Nota de Débito",
  RC: "Recibo",
  RG: "Recibo Global",
  OR: "Orçamento",
};

const STATUS_COLORS: Record<string, string> = {
  emitida: "bg-blue-100 text-blue-800",
  paga: "bg-green-100 text-green-800",
  parcialmente_paga: "bg-yellow-100 text-yellow-800",
  vencida: "bg-red-100 text-red-800",
  anulada: "bg-gray-100 text-gray-800",
  rascunho: "bg-gray-100 text-gray-600",
};

export default function Reports() {
  const [year, setYear] = useState(new Date().getFullYear());
  const now = new Date();
  const [dateFrom, setDateFrom] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10));
  const [dateTo, setDateTo] = useState(now.toISOString().substring(0, 10));
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [docSearch, setDocSearch] = useState("");

  const { data: monthly } = trpc.reports.monthlySales.useQuery({ year });
  const { data: topClients } = trpc.reports.topClients.useQuery({ limit: 10 });
  const { data: vatReport } = trpc.reports.vatReport.useQuery({ dateFrom: new Date(dateFrom), dateTo: new Date(dateTo) });
  const { data: stats } = trpc.reports.dashboard.useQuery();
  const { data: financialSummary } = trpc.reports.financialSummary.useQuery({ dateFrom: new Date(dateFrom), dateTo: new Date(dateTo) });
  const { data: clientsList } = trpc.clients.list.useQuery({ limit: 200 });
  const { data: suppliersList } = trpc.suppliers.list.useQuery({ limit: 200 });
  const { data: clientStatement } = trpc.reports.clientStatement.useQuery(
    { clientId: Number(selectedClientId) },
    { enabled: !!selectedClientId }
  );
  const { data: supplierStatement } = trpc.reports.supplierStatement.useQuery(
    { supplierId: Number(selectedSupplierId) },
    { enabled: !!selectedSupplierId }
  );

  const chartData = MONTHS.map((month, i) => {
    const found = monthly?.find((m) => m.month === i + 1);
    return { month, total: found?.total ?? 0, vat: found?.vat ?? 0, count: found?.count ?? 0 };
  });

  const totalYear = chartData.reduce((s, m) => s + m.total, 0);
  const totalVatYear = chartData.reduce((s, m) => s + m.vat, 0);

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Relatórios & Estatísticas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Análise financeira e fiscal</p>
      </div>

      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
        </TabsList>

        {/* ─── TAB: Resumo ─────────────────────────────────────────── */}
        <TabsContent value="resumo" className="space-y-6">
          {/* Resumo anual */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: `Total Facturado ${year}`, value: formatCurrency(totalYear), sub: "Excluindo documentos anulados" },
              { label: `IVA Liquidado ${year}`, value: formatCurrency(totalVatYear), sub: "Total de IVA cobrado" },
              { label: "Clientes Activos", value: String(stats?.totalClients ?? 0), sub: "Clientes com documentos emitidos" },
            ].map(k => (
              <div key={k.label} className="card-elevated p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{k.label}</p>
                <p className="text-2xl font-semibold text-foreground mt-1">{k.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Gráfico de vendas mensais */}
          <div className="card-elevated p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Vendas Mensais</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setYear(y => y - 1)}>‹</Button>
                <span className="text-sm font-medium w-12 text-center">{year}</span>
                <Button variant="outline" size="sm" onClick={() => setYear(y => y + 1)}>›</Button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.005 240)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number, name: string) => [formatCurrency(v), name === "total" ? "Total Facturado" : "IVA"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend formatter={(v) => v === "total" ? "Total Facturado" : "IVA"} />
                <Bar dataKey="total" fill="oklch(0.32 0.08 240)" radius={[4, 4, 0, 0]} name="total" />
                <Bar dataKey="vat" fill="oklch(0.72 0.12 75)" radius={[4, 4, 0, 0]} name="vat" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Clientes */}
            <div className="card-elevated p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Top 10 Clientes por Volume</h2>
              {topClients && topClients.length > 0 ? (
                <div className="space-y-2">
                  {topClients.map((c, i) => {
                    const maxTotal = topClients[0]?.total ?? 1;
                    const pct = (c.total / maxTotal) * 100;
                    return (
                      <div key={c.clientId} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground truncate max-w-xs">{i + 1}. {c.clientName}</span>
                          <span className="text-muted-foreground ml-2 whitespace-nowrap">{formatCurrency(c.total)}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados disponíveis.</p>
              )}
            </div>

            {/* Apuramento de IVA */}
            <div className="card-elevated p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Apuramento de IVA</h2>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">De</Label>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Até</Label>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
              {vatReport && vatReport.length > 0 ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-semibold text-muted-foreground">Taxa IVA</th>
                      <th className="text-right py-2 font-semibold text-muted-foreground">Base Tributável</th>
                      <th className="text-right py-2 font-semibold text-muted-foreground">IVA Liquidado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vatReport.map((r) => (
                      <tr key={r.vatRate} className="border-b border-border/50">
                        <td className="py-2">{r.vatRate === 0 ? "Isento (0%)" : r.vatRate === 5 ? "Reduzida (5%)" : r.vatRate === 7 ? "Intermédia (7%)" : `Normal (${r.vatRate}%)`}</td>
                        <td className="py-2 text-right">{formatCurrency(r.taxableBase)}</td>
                        <td className="py-2 text-right font-semibold">{formatCurrency(r.vatTotal)}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold">
                      <td className="py-2">Total</td>
                      <td className="py-2 text-right">{formatCurrency(vatReport.reduce((s, r) => s + r.taxableBase, 0))}</td>
                      <td className="py-2 text-right text-primary">{formatCurrency(vatReport.reduce((s, r) => s + r.vatTotal, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados para o período seleccionado.</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB: Financeiro ─────────────────────────────────────── */}
        <TabsContent value="financeiro" className="space-y-6">
          <div className="card-elevated p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Resumo Financeiro por Período</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">De</Label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Até</Label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>

            {financialSummary ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Facturado</p>
                  <p className="text-xl font-semibold text-foreground mt-1">{formatCurrency(financialSummary.totalWithVat)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{financialSummary.documentCount} documentos • c/ IVA</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Base Tributável</p>
                  <p className="text-xl font-semibold text-foreground mt-1">{formatCurrency(financialSummary.totalWithoutVat)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total sem imposto</p>
                </div>
                <div className="p-4 rounded-lg bg-orange-50 border border-orange-100">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">IVA Liquidado</p>
                  <p className="text-xl font-semibold text-foreground mt-1">{formatCurrency(financialSummary.totalVat)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Imposto cobrado</p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Recebível</p>
                  <p className="text-xl font-semibold text-foreground mt-1">{formatCurrency(financialSummary.netAmount)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Após descontos e retenção</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">A seleccionar período...</p>
            )}
          </div>
        </TabsContent>

        {/* ─── TAB: Clientes ───────────────────────────────────────── */}
        <TabsContent value="clientes" className="space-y-6">
          <div className="card-elevated p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Conta Corrente de Clientes</h2>
            <div className="space-y-1 mb-4">
              <Label className="text-xs">Seleccionar Cliente</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Escolha um cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientsList?.data?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} {c.nif ? `(${c.nif})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {clientStatement && clientStatement.client ? (
              <div className="space-y-4">
                {/* Resumo do cliente */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground">Total Facturado</p>
                    <p className="text-lg font-semibold">{formatCurrency(clientStatement.totalInvoiced)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                    <p className="text-xs text-muted-foreground">Total Pago</p>
                    <p className="text-lg font-semibold">{formatCurrency(clientStatement.totalPaid)}</p>
                  </div>
                  <div className={`p-3 rounded-lg border ${clientStatement.balance > 0 ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
                    <p className="text-xs text-muted-foreground">Saldo</p>
                    <p className={`text-lg font-semibold ${clientStatement.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                      {formatCurrency(clientStatement.balance)}
                    </p>
                  </div>
                </div>

                {/* Documentos */}
                {(() => {
                  const sortedInvoices = [...clientStatement.invoices].sort((a, b) => {
                    const statusOrder: Record<string, number> = { paga: 0, parcialmente_paga: 1, emitida: 2, vencida: 3, rascunho: 4, anulada: 5 };
                    const oa = statusOrder[a.status] ?? 99;
                    const ob = statusOrder[b.status] ?? 99;
                    if (oa !== ob) return oa - ob;
                    return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
                  });
                  const q = docSearch.toLowerCase().trim();
                  const filtered = q
                    ? sortedInvoices.filter(
                        (inv) =>
                          inv.fullNumber.toLowerCase().includes(q) ||
                          (DOC_TYPE_LABELS[inv.documentType] ?? inv.documentType).toLowerCase().includes(q) ||
                          inv.status.toLowerCase().includes(q)
                      )
                    : sortedInvoices;

                  return filtered.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Documentos</h3>
                        <Input
                          value={docSearch}
                          onChange={(e) => setDocSearch(e.target.value)}
                          placeholder="Pesquisar documento..."
                          className="h-7 w-56 text-xs"
                        />
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 font-semibold text-muted-foreground">Documento</th>
                              <th className="text-left py-2 font-semibold text-muted-foreground">Tipo</th>
                              <th className="text-left py-2 font-semibold text-muted-foreground">Data</th>
                              <th className="text-right py-2 font-semibold text-muted-foreground">Total</th>
                              <th className="text-right py-2 font-semibold text-muted-foreground">Pago</th>
                              <th className="text-center py-2 font-semibold text-muted-foreground">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((inv) => (
                              <tr key={inv.id} className="border-b border-border/50">
                                <td className="py-2 font-medium">{inv.fullNumber}</td>
                                <td className="py-2">{DOC_TYPE_LABELS[inv.documentType] ?? inv.documentType}</td>
                                <td className="py-2">{formatDate(inv.issueDate)}</td>
                                <td className="py-2 text-right">{formatCurrency(inv.totalAmount)}</td>
                                <td className="py-2 text-right">{formatCurrency(inv.paidAmount ?? 0)}</td>
                                <td className="py-2 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[inv.status] ?? "bg-gray-100"}`}>
                                    {inv.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Pagamentos */}
                {clientStatement.payments.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Pagamentos Recebidos</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 font-semibold text-muted-foreground">Data</th>
                            <th className="text-left py-2 font-semibold text-muted-foreground">Método</th>
                            <th className="text-left py-2 font-semibold text-muted-foreground">Referência</th>
                            <th className="text-right py-2 font-semibold text-muted-foreground">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientStatement.payments.map((p) => (
                            <tr key={p.id} className="border-b border-border/50">
                              <td className="py-2">{formatDate(p.paymentDate)}</td>
                              <td className="py-2 capitalize">{p.method}</td>
                              <td className="py-2 text-muted-foreground">{p.reference ?? "-"}</td>
                              <td className="py-2 text-right font-medium text-green-600">{formatCurrency(p.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : selectedClientId ? (
              <p className="text-sm text-muted-foreground text-center py-8">A carregar dados...</p>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Seleccione um cliente para ver a conta corrente.</p>
            )}
          </div>
        </TabsContent>

        {/* ─── TAB: Fornecedores ───────────────────────────────────── */}
        <TabsContent value="fornecedores" className="space-y-6">
          <div className="card-elevated p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Conta Corrente de Fornecedores</h2>
            <div className="space-y-1 mb-4">
              <Label className="text-xs">Seleccionar Fornecedor</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Escolha um fornecedor..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliersList?.data?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name} {s.nif ? `(${s.nif})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {supplierStatement && supplierStatement.supplier ? (
              <div className="space-y-4">
                {/* Resumo do fornecedor */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground">Total Entradas</p>
                    <p className="text-lg font-semibold">{supplierStatement.totalEntered} unidades</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <p className="text-xs text-muted-foreground">Custo Total</p>
                    <p className="text-lg font-semibold">{formatCurrency(supplierStatement.totalCost)}</p>
                  </div>
                </div>

                {/* Movimentos */}
                {supplierStatement.movements.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Movimentos de Stock</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 font-semibold text-muted-foreground">Data</th>
                            <th className="text-left py-2 font-semibold text-muted-foreground">Tipo</th>
                            <th className="text-right py-2 font-semibold text-muted-foreground">Quantidade</th>
                            <th className="text-right py-2 font-semibold text-muted-foreground">Custo Unit.</th>
                            <th className="text-right py-2 font-semibold text-muted-foreground">Custo Total</th>
                            <th className="text-left py-2 font-semibold text-muted-foreground">Referência</th>
                          </tr>
                        </thead>
                        <tbody>
                          {supplierStatement.movements.map((m) => (
                            <tr key={m.id} className="border-b border-border/50">
                              <td className="py-2">{formatDate(m.movementDate)}</td>
                              <td className="py-2">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  m.type === "entrada" ? "bg-green-100 text-green-800" :
                                  m.type === "saida" ? "bg-red-100 text-red-800" :
                                  "bg-yellow-100 text-yellow-800"
                                }`}>
                                  {m.type}
                                </span>
                              </td>
                              <td className="py-2 text-right">{m.quantity}</td>
                              <td className="py-2 text-right">{m.unitCost ? formatCurrency(m.unitCost) : "-"}</td>
                              <td className="py-2 text-right font-medium">{m.totalCost ? formatCurrency(m.totalCost) : "-"}</td>
                              <td className="py-2 text-muted-foreground">{m.reference ?? m.notes ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : selectedSupplierId ? (
              <p className="text-sm text-muted-foreground text-center py-8">A carregar dados...</p>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Seleccione um fornecedor para ver a conta corrente.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}