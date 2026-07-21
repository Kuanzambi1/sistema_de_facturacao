import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, DOCUMENT_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  Package,
  TrendingUp,
  Users,
  Plus,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useState } from "react";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const PIE_COLORS = ["#1e3a5f", "#2d5a8e", "#4a7fb5", "#7ba7d4", "#b0cfe8"];

export default function Dashboard() {
  const [year] = useState(new Date().getFullYear());
  const { data: stats } = trpc.reports.dashboard.useQuery();
  const { data: monthlySales } = trpc.reports.monthlySales.useQuery({ year });
  const { data: topClients } = trpc.reports.topClients.useQuery({ limit: 5 });
  const { data: recentInvoices } = trpc.reports.recentInvoices.useQuery({ limit: 6 });
  const { data: stockAlerts } = trpc.inventory.stockAlerts.useQuery();

  const chartData = MONTHS.map((month, i) => {
    const found = monthlySales?.find((m) => m.month === i + 1);
    return { month, total: found?.total ?? 0, vat: found?.vat ?? 0 };
  });

  const kpis = [
    {
      label: "Total Facturado",
      value: formatCurrency(stats?.totalInvoiced ?? 0),
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-brand-light",
      sub: "Documentos emitidos",
    },
    {
      label: "Valores Pendentes",
      value: formatCurrency(stats?.pendingAmount ?? 0),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      sub: `${stats?.pendingCount ?? 0} documento(s)`,
    },
    {
      label: "Facturado este Mês",
      value: formatCurrency(stats?.monthlyInvoiced ?? 0),
      icon: ArrowUpRight,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      sub: new Date().toLocaleString("pt-AO", { month: "long", year: "numeric" }),
    },
    {
      label: "Clientes Activos",
      value: String(stats?.totalClients ?? 0),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      sub: "Clientes registados",
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("pt-AO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Link href="/documentos/novo">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Factura
          </Button>
        </Link>
      </div>

      {/* Alertas de conformidade */}
      {(stockAlerts?.length ?? 0) > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600" />
          <span>
            <strong>{stockAlerts?.length}</strong> produto(s) com stock abaixo do mínimo.{" "}
            <Link href="/inventario"><a className="underline font-medium">Ver inventário</a></Link>
          </span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card-elevated p-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                <p className="text-xl font-semibold text-foreground mt-1 truncate">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </div>
              <div className={cn("p-2 rounded-lg flex-shrink-0", kpi.bg)}>
                <kpi.icon className={cn("h-5 w-5", kpi.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Vendas Mensais */}
        <div className="card-elevated p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Vendas Mensais {year}</h2>
            <span className="text-xs text-muted-foreground">AOA</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.005 240)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "oklch(0.52 0.015 240)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "oklch(0.52 0.015 240)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), ""]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid oklch(0.9 0.005 240)" }}
              />
              <Bar dataKey="total" fill="oklch(0.32 0.08 240)" radius={[4, 4, 0, 0]} name="Total" />
              <Bar dataKey="vat" fill="oklch(0.72 0.12 75)" radius={[4, 4, 0, 0]} name="IVA" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Clientes */}
        <div className="card-elevated p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Top Clientes</h2>
          {topClients && topClients.length > 0 ? (
            <div className="space-y-3">
              {topClients.map((client, i) => (
                <div key={client.clientId} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{client.clientName}</p>
                    <p className="text-xs text-muted-foreground">{client.count} doc.</p>
                  </div>
                  <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                    {formatCurrency(client.total)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Users className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs">Sem dados</p>
            </div>
          )}
        </div>
      </div>

      {/* Últimas Facturas */}
      <div className="card-elevated">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Últimos Documentos Emitidos</h2>
          <Link href="/documentos">
            <a className="text-xs text-primary font-medium hover:underline">Ver todos</a>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-elegant">
            <thead>
              <tr>
                <th className="text-left">Número</th>
                <th className="text-left">Tipo</th>
                <th className="text-left">Cliente</th>
                <th className="text-left">Data</th>
                <th className="text-right">Total</th>
                <th className="text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices?.map((inv) => (
                <tr key={inv.id} className="cursor-pointer">
                  <td>
                    <Link href={`/documentos/${inv.id}`}>
                      <a className="font-mono text-xs font-medium text-primary hover:underline">{inv.fullNumber}</a>
                    </Link>
                  </td>
                  <td className="text-xs text-muted-foreground">{DOCUMENT_TYPE_LABELS[inv.documentType]}</td>
                  <td className="text-xs text-foreground">{inv.clientName ?? "—"}</td>
                  <td className="text-xs text-muted-foreground">{formatDate(inv.issueDate)}</td>
                  <td className="text-xs font-semibold text-right">{formatCurrency(Number(inv.totalAmount))}</td>
                  <td className="text-center">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLORS[inv.status])}>
                      {STATUS_LABELS[inv.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {(!recentInvoices || recentInvoices.length === 0) && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum documento emitido ainda.{" "}
                    <Link href="/documentos/novo"><a className="text-primary font-medium hover:underline">Emitir primeira factura</a></Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conformidade AGT */}
      <div className="card-elevated p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">Estado de Conformidade AGT</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "ATCUD em todos os documentos", ok: true },
            { label: "Assinatura digital activa", ok: true },
            { label: "Séries comunicadas à AGT", ok: false },
          ].map((item) => (
            <div key={item.label} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-xs", item.ok ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800")}>
              {item.ok
                ? <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                : <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />}
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
