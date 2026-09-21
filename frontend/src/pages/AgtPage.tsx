import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatDateTime, DOCUMENT_TYPE_LABELS, downloadFile } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Shield, RefreshCw, Download, Send, FileSpreadsheet, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AgtPage() {
  const utils = trpc.useUtils();
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));

  const { data: status } = trpc.agt.status.useQuery();
  const { data: series } = trpc.series.list.useQuery({});
  const { data: submissions, isLoading } = trpc.agt.submissions.useQuery({ page: 1 });

  const registerSeries = trpc.agt.registerSeries.useMutation({
    onSuccess: (r) => {
      utils.series.list.invalidate();
      utils.agt.submissions.invalidate();
      toast.success(r.message || "Série registada na AGT!");
    },
    onError: (e) => toast.error(e.message),
  });

  const exportSAFTInventory = trpc.invoices.exportSAFTInventory.useMutation({
    onSuccess: (result) => {
      downloadFile(result.xml, result.filename, "application/xml");
      toast.success("SAF-T Inventário exportado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const submitSAFT = trpc.agt.submitSAFT.useMutation({
    onSuccess: (r) => {
      utils.agt.submissions.invalidate();
      toast.success(r.message || "SAF-T submetido à AGT!");
    },
    onError: (e) => toast.error(e.message),
  });

  function handleExportAndSubmit() {
    exportSAFTInventory.mutate(
      { date: new Date(date + "T12:00:00") },
      {
        onSuccess: (result) => submitSAFT.mutate({ xml: result.xml }),
      }
    );
  }

  const actionLabels: Record<string, string> = {
    registar_serie: "Registar série",
    submeter_documento: "Submeter documento",
    consultar_documento: "Consultar documento",
    submeter_saft: "Submeter SAF-T",
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Integração AGT</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registo de séries, submissão de documentos e SAF-T</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", status?.mode === "live" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
            <Radio className="h-3.5 w-3.5" />
            {status?.mode === "live" ? "Modo Real (AGT)" : "Modo Simulação (Demo)"}
          </span>
        </div>
      </div>

      {status && !status.configured && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <Shield className="h-4 w-4 mt-0.5" />
          <div>
            <p className="font-medium">Modo de simulação activo.</p>
            <p className="text-amber-700/80 text-xs mt-1">Os documentos são submetidos a um simulador local. Para produção real, configure o endpoint AGT e o utilizador do portal em Configurações → Empresa (campos "Endpoint AGT" e "Utilizador AGT"). A certificação da AGT é um processo externo.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Séries */}
        <div className="card-elevated">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Séries de Facturação</h2>
          </div>
          <div className="divide-y divide-border">
            {series?.map((s) => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.code} — {s.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">Validação: {s.validationCode}</p>
                </div>
                {s.agtRegistered ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">Registada</span>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => registerSeries.mutate({ seriesId: s.id })} disabled={registerSeries.isPending}>
                    <Shield className="h-3.5 w-3.5 mr-1" />Registar na AGT
                  </Button>
                )}
              </div>
            ))}
            {series?.length === 0 && <p className="px-5 py-6 text-sm text-muted-foreground">Sem séries. Crie séries nas Configurações.</p>}
          </div>
        </div>

        {/* SAF-T */}
        <div className="card-elevated">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">SAF-T (AO)</h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="saftDate">Data de referência do inventário</Label>
              <Input id="saftDate" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2" disabled={exportSAFTInventory.isPending} onClick={() => exportSAFTInventory.mutate({ date: new Date(date + "T12:00:00") })}>
                <Download className="h-4 w-4" />Exportar Inventário
              </Button>
              <Button className="gap-2" disabled={submitSAFT.isPending || exportSAFTInventory.isPending} onClick={handleExportAndSubmit}>
                <Send className="h-4 w-4" />Exportar + Submeter à AGT
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              O ficheiro SAF-T de inventário é gerado a partir dos artigos e stock actual. A submissão registra o envio no histórico.
            </p>
          </div>
        </div>
      </div>

      {/* Histórico de submissões */}
      <div className="card-elevated">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Histórico de submissões</h2>
          <Button variant="ghost" size="sm" onClick={() => utils.agt.submissions.invalidate()} className="gap-1"><RefreshCw className="h-3.5 w-3.5" />Actualizar</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-elegant">
            <thead><tr>
              <th className="text-left">Data</th>
              <th className="text-left">Acção</th>
              <th className="text-left">Documento</th>
              <th className="text-center">Estado</th>
              <th className="text-left">Mensagem</th>
            </tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">A carregar...</td></tr>}
              {!isLoading && submissions?.data.map((s) => (
                <tr key={s.id}>
                  <td className="text-xs text-muted-foreground">{formatDateTime(s.submittedAt)}</td>
                  <td className="text-sm">{actionLabels[s.action] ?? s.action}</td>
                  <td className="text-xs font-mono text-primary">{s.invoiceId ?? "—"}</td>
                  <td className="text-center">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                      s.status === "sucesso" ? "bg-emerald-50 text-emerald-700" : s.status === "erro" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700")}>
                      {s.status}
                    </span>
                  </td>
                  <td className="text-xs text-muted-foreground max-w-64 truncate">{s.message ?? "—"}</td>
                </tr>
              ))}
              {!isLoading && submissions?.data.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Sem submissões ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
