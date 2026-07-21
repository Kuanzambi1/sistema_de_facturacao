import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, DOCUMENT_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS, downloadFile } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Plus, Search, Eye, Download, FileX, Filter, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function Invoices() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [docType, setDocType] = useState("");
  const [page, setPage] = useState(1);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.invoices.list.useQuery({ search, status: status || undefined, documentType: docType || undefined, page, limit: 15 });

  const updateStatus = trpc.invoices.updateStatus.useMutation({
    onSuccess: () => { utils.invoices.list.invalidate(); toast.success("Estado actualizado!"); },
    onError: (e) => toast.error(e.message),
  });

  const exportSAFT = trpc.invoices.exportSAFT.useMutation({
    onSuccess: (result) => {
      downloadFile(result.xml, result.filename, "application/xml");
      toast.success("Ficheiro SAF-T exportado!");
    },
    onError: (e) => toast.error(e.message),
  });

  function handleExportSAFT() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    exportSAFT.mutate({ dateFrom: start, dateTo: now });
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Documentos Fiscais</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} documentos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportSAFT} disabled={exportSAFT.isPending}>
            <Download className="h-4 w-4" />
            {exportSAFT.isPending ? "A exportar..." : "SAF-T (AO)"}
          </Button>
          <Link href="/documentos/novo">
            <Button className="gap-2"><Plus className="h-4 w-4" />Novo Documento</Button>
          </Link>
        </div>
      </div>

      <div className="card-elevated">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar por número, cliente..." className="pl-9 h-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select value={docType || "all"} onValueChange={v => { setDocType(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Tipo de documento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status || "all"} onValueChange={v => { setStatus(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-elegant">
            <thead><tr>
              <th className="text-left">Número</th>
              <th className="text-left">Tipo</th>
              <th className="text-left">Cliente</th>
              <th className="text-left">Data Emissão</th>
              <th className="text-left">Vencimento</th>
              <th className="text-right">Total</th>
              <th className="text-center">Estado</th>
              <th className="text-center">Acções</th>
            </tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">A carregar...</td></tr>}
              {!isLoading && data?.data.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <Link href={`/documentos/${inv.id}`}>
                      <a className="font-mono text-xs font-semibold text-primary hover:underline">{inv.fullNumber}</a>
                    </Link>
                    {inv.atcud && <p className="text-xs text-muted-foreground font-mono">{inv.atcud.substring(0, 20)}...</p>}
                  </td>
                  <td className="text-xs text-muted-foreground">{DOCUMENT_TYPE_LABELS[inv.documentType]}</td>
                  <td>
                    <p className="text-sm text-foreground">{inv.clientName ?? "Consumidor Final"}</p>
                    {inv.clientNif && <p className="text-xs text-muted-foreground font-mono">NIF: {inv.clientNif}</p>}
                  </td>
                  <td className="text-xs text-muted-foreground">{formatDate(inv.issueDate)}</td>
                  <td className="text-xs text-muted-foreground">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</td>
                  <td className="text-sm font-semibold text-right">{formatCurrency(Number(inv.totalAmount))}</td>
                  <td className="text-center">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLORS[inv.status])}>
                      {STATUS_LABELS[inv.status]}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <Link href={`/documentos/${inv.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="h-3.5 w-3.5" /></Button>
                      </Link>
                      {inv.status === "emitida" && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-emerald-600" title="Marcar como paga"
                          onClick={() => updateStatus.mutate({ id: inv.id, status: "paga", paymentDate: new Date() })}>
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {(inv.status === "emitida" || inv.status === "paga") && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" title="Anular"
                          onClick={() => { if (confirm("Anular este documento?")) updateStatus.mutate({ id: inv.id, status: "anulada" }); }}>
                          <FileX className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && data?.data.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                  Nenhum documento encontrado.{" "}
                  <Link href="/documentos/novo"><a className="text-primary font-medium hover:underline">Emitir primeiro documento</a></Link>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {(data?.total ?? 0) > 15 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Página {page} de {Math.ceil((data?.total ?? 0) / 15)}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil((data?.total ?? 0) / 15)} onClick={() => setPage(p => p + 1)}>Seguinte</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
