import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatDateTime, downloadFile } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  User,
  Activity,
  Calendar,
  Layers,
  ArrowUpDown,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  criar: { label: "Criação", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  emitir: { label: "Emissão", color: "bg-blue-50 text-blue-700 border-blue-200" },
  converter: { label: "Conversão", color: "bg-violet-50 text-violet-700 border-violet-200" },
  actualizar: { label: "Actualização", color: "bg-amber-50 text-amber-700 border-amber-200" },
  pagar: { label: "Pagamento", color: "bg-teal-50 text-teal-700 border-teal-200" },
  anulada: { label: "Anulação", color: "bg-rose-50 text-rose-700 border-rose-200" },
  eliminar: { label: "Eliminação", color: "bg-red-50 text-red-700 border-red-200" },
  redefinir_password: { label: "Redefinir Password", color: "bg-orange-50 text-orange-700 border-orange-200" },
  actualizar_permissao: { label: "Alterar Cargo", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  stock: { label: "Movimento Stock", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  lembrete: { label: "Lembrete", color: "bg-purple-50 text-purple-700 border-purple-200" },
};

const ENTITY_LABELS: Record<string, string> = {
  invoice: "Documento Fiscal",
  product: "Produto / Serviço",
  client: "Cliente",
  supplier: "Fornecedor",
  user: "Utilizador",
  series: "Série Facturação",
  recurring: "Factura Recorrente",
  company: "Empresa",
};

export default function Audit() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);
  const [detailEntry, setDetailEntry] = useState<any | null>(null);

  const { data, isLoading } = trpc.audit.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    action: action || undefined,
    entityType: entityType || undefined,
  });

  const totalLogs = data?.total ?? 0;
  const logs = data?.data ?? [];

  function exportAuditCSV() {
    if (!logs || logs.length === 0) {
      toast.error("Não existem registos para exportar.");
      return;
    }

    const header = "ID;Data/Hora;Utilizador;Accao;Entidade;Alvo;Detalhes\n";
    const rows = logs.map((l) => {
      const date = formatDateTime(l.createdAt);
      const user = (l.userName || "Sistema").replace(/;/g, ",");
      const act = l.action;
      const ent = ENTITY_LABELS[l.entityType] || l.entityType;
      const target = (l.entityLabel || `#${l.entityId || "—"}`).replace(/;/g, ",");
      const det = (l.details || "").replace(/[\r\n]+/g, " ").replace(/;/g, ",");
      return `${l.id};${date};${user};${act};${ent};${target};"${det}"`;
    });

    const csvContent = header + rows.join("\n");
    downloadFile(csvContent, `Auditoria_FacturasK360_${new Date().toISOString().substring(0, 10)}.csv`, "text/csv");
    toast.success("Registo de auditoria exportado com sucesso!");
  }

  function formatDetailsJSON(details: string | null) {
    if (!details) return null;
    try {
      const parsed = JSON.parse(details);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return details;
    }
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in-up max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-50 text-violet-700 border border-violet-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Trilha de Auditoria</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Registo contínuo e imutável de todas as actividades realizadas no sistema
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 text-xs"
            onClick={exportAuditCSV}
            disabled={isLoading || totalLogs === 0}
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-elevated p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total de Registos</p>
            <p className="text-xl font-bold text-foreground mt-0.5">{totalLogs.toLocaleString("pt-AO")}</p>
          </div>
        </div>

        <div className="card-elevated p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Eventos Nesta Página</p>
            <p className="text-xl font-bold text-foreground mt-0.5">{logs.length}</p>
          </div>
        </div>

        <div className="card-elevated p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Documentos Fiscais</p>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {logs.filter((l) => l.entityType === "invoice").length} <span className="text-xs font-normal text-muted-foreground">nesta pág.</span>
            </p>
          </div>
        </div>

        <div className="card-elevated p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-violet-50 text-violet-700 border border-violet-100">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Utilizadores Activos</p>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {new Set(logs.map((l) => l.userName).filter(Boolean)).size} <span className="text-xs font-normal text-muted-foreground">nesta pág.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabela & Filtros */}
      <div className="card-elevated">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por utilizador, acção, número de documento..."
              className="pl-9 h-9 text-xs"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <Select
            value={action || "all"}
            onValueChange={(v) => {
              setAction(v === "all" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44 h-9 text-xs">
              <SelectValue placeholder="Tipo de Acção" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as acções</SelectItem>
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={entityType || "all"}
            onValueChange={(v) => {
              setEntityType(v === "all" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44 h-9 text-xs">
              <SelectValue placeholder="Módulo / Entidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os módulos</SelectItem>
              {Object.entries(ENTITY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(search || action || entityType) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSearch("");
                setAction("");
                setEntityType("");
                setPage(1);
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Limpar Filtros
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-elegant text-xs">
            <thead>
              <tr>
                <th className="text-left w-44">Data & Hora</th>
                <th className="text-left">Utilizador</th>
                <th className="text-left">Acção</th>
                <th className="text-left">Módulo</th>
                <th className="text-left">Identificador / Alvo</th>
                <th className="text-center w-20">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                    A carregar registos de auditoria...
                  </td>
                </tr>
              )}

              {!isLoading && logs.map((log) => {
                const actionInfo = ACTION_LABELS[log.action] || {
                  label: log.action,
                  color: "bg-muted text-muted-foreground border-border",
                };
                return (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="font-mono text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                          {(log.userName || "U")[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{log.userName || "Sistema"}</span>
                      </div>
                    </td>
                    <td>
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", actionInfo.color)}>
                        {actionInfo.label}
                      </span>
                    </td>
                    <td>
                      <span className="text-muted-foreground font-medium">
                        {ENTITY_LABELS[log.entityType] || log.entityType}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono font-medium text-foreground">
                        {log.entityLabel || (log.entityId ? `#${log.entityId}` : "—")}
                      </span>
                    </td>
                    <td className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Ver payload completo"
                        onClick={() => setDetailEntry(log)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {!isLoading && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                    Nenhum registo de auditoria encontrado com os filtros actuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalLogs > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Página {page} de {Math.ceil(totalLogs / 20)} (total: {totalLogs} registos)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={page >= Math.ceil(totalLogs / 20)}
                onClick={() => setPage((p) => p + 1)}
              >
                Seguinte
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Log */}
      <Dialog open={Boolean(detailEntry)} onOpenChange={(open) => !open && setDetailEntry(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-violet-600" />
              Registo de Auditoria #{detailEntry?.id}
            </DialogTitle>
          </DialogHeader>

          {detailEntry && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg border border-border">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Data e Hora:</span>
                  <span className="font-semibold text-foreground">{formatDateTime(detailEntry.createdAt)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Utilizador:</span>
                  <span className="font-semibold text-foreground">{detailEntry.userName || "Sistema"} (ID: {detailEntry.userId || "—"})</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Acção:</span>
                  <span className="font-semibold text-foreground uppercase">{detailEntry.action}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Módulo:</span>
                  <span className="font-semibold text-foreground">{ENTITY_LABELS[detailEntry.entityType] || detailEntry.entityType}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block text-[11px]">Alvo / Referência:</span>
                  <span className="font-mono font-bold text-foreground">{detailEntry.entityLabel || (detailEntry.entityId ? `#${detailEntry.entityId}` : "—")}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-foreground block">Detalhes Adicionais (Payload):</span>
                {detailEntry.details ? (
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto text-[11px] font-mono leading-relaxed border border-slate-800 max-h-60">
                    {formatDetailsJSON(detailEntry.details)}
                  </pre>
                ) : (
                  <p className="text-muted-foreground italic">Sem detalhes adicionais registados para esta acção.</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDetailEntry(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
