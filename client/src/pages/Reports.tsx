import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const COLORS = ["#1e3a5f", "#2d5a8e", "#4a7fb5", "#7ba7d4", "#b0cfe8", "#d4e6f5"];

export default function Reports() {
  const [year, setYear] = useState(new Date().getFullYear());
  const now = new Date();
  const [dateFrom, setDateFrom] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10));
  const [dateTo, setDateTo] = useState(now.toISOString().substring(0, 10));

  const { data: monthly } = trpc.reports.monthlySales.useQuery({ year });
  const { data: topClients } = trpc.reports.topClients.useQuery({ limit: 10 });
  const { data: vatReport } = trpc.reports.vatReport.useQuery({ dateFrom: new Date(dateFrom), dateTo: new Date(dateTo) });
  const { data: stats } = trpc.reports.dashboard.useQuery();

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
                    <td className="py-2">{r.vatRate === 0 ? "Isento (0%)" : r.vatRate === 5 ? "Reduzida (5%)" : `Normal (${r.vatRate}%)`}</td>
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
    </div>
  );
}
