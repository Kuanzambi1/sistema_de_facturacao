import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, DOCUMENT_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { FileText, ShieldCheck, Loader2 } from "lucide-react";
import { useParams } from "wouter";

export default function Portal() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const { data, isLoading, isError } = trpc.portal.client.useQuery({ token });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground">Link inválido</p>
          <p className="text-sm text-muted-foreground">Este link do portal do cliente não é válido ou expirou.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Portal do Cliente</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">{data.companyName}</h1>
        <p className="text-sm text-muted-foreground">Documentos de <span className="font-medium text-foreground">{data.clientName}</span></p>

        <div className="mt-6 space-y-3">
          {data.documents.length === 0 && (
            <div className="bg-card rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
              Ainda não existem documentos disponíveis.
            </div>
          )}
          {data.documents.map((inv: any) => (
            <div key={inv.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{inv.fullNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {DOCUMENT_TYPE_LABELS[inv.documentType] ?? inv.documentType} · {formatDate(inv.issueDate)}
                    {inv.dueDate ? ` · Venc: ${formatDate(inv.dueDate)}` : ""}
                  </p>
                  {inv.atcud && <p className="text-[11px] text-muted-foreground font-mono mt-0.5">ATCUD: {inv.atcud}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{formatCurrency(Number(inv.totalAmount))}</p>
                <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1", STATUS_COLORS[inv.status])}>
                  {STATUS_LABELS[inv.status]}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Documentos emitidos electronicamente conforme legislação fiscal angolana — AGT.
        </p>
      </div>
    </div>
  );
}
