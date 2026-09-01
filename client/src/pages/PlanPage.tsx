import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Check, Building2, CreditCard, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PLAN_META = {
  gratis: { label: "Gratuito", desc: "Para começar", monthlyDocs: 100, maxUsers: 3, features: ["100 documentos/mês", "3 utilizadores", "Facturação AGT completa", "Portal do cliente"] },
  pro: { label: "Pro", desc: "Para PME em crescimento", monthlyDocs: 5000, maxUsers: 20, features: ["5.000 documentos/mês", "20 utilizadores", "Facturação recorrente", "Pagamentos & dunning", "Portal do cliente"] },
  escritorio: { label: "Escritório", desc: "Para contabilistas e escritórios", monthlyDocs: 100000, maxUsers: 100, features: ["100.000 documentos/mês", "100 utilizadores", "Tudo do plano Pro", "Suporte prioritário"] },
} as const;

export default function PlanPage() {
  const utils = trpc.useUtils();
  const { data: usage } = trpc.tenant.usage.useQuery();
  const { data: tenant } = trpc.tenant.get.useQuery();
  const { data: company } = trpc.company.get.useQuery();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";

  const updatePlan = trpc.tenant.updatePlan.useMutation({
    onSuccess: () => {
      utils.tenant.usage.invalidate();
      utils.tenant.get.invalidate();
      toast.success("Plano actualizado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const pct = usage?.limit ? Math.min((usage.used / usage.limit) * 100, 100) : 0;

  return (
    <div className="p-6 space-y-5 animate-fade-in-up max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Subscrição e Plano</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestão do plano, limites e utilização</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-elevated p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Building2 className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide font-semibold">Empresa</span>
          </div>
          <p className="text-base font-semibold text-foreground">{company?.name ?? "—"}</p>
          <p className="text-sm text-muted-foreground">NIF: {company?.nif ?? "—"}</p>
        </div>
        <div className="card-elevated p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CreditCard className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide font-semibold">Plano actual</span>
          </div>
          <p className="text-base font-semibold text-foreground capitalize">{usage?.planLabel ?? "—"}</p>
          <p className="text-sm text-muted-foreground">Estado: <span className="capitalize">{usage?.status ?? "—"}</span></p>
        </div>
        <div className="card-elevated p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide font-semibold">Documentos este mês</span>
          </div>
          <p className="text-base font-semibold text-foreground">{usage?.used ?? 0} / {usage?.limit ?? 0}</p>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full", pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1"><Users className="h-3 w-3" /> Até {usage?.maxUsers ?? 0} utilizadores</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(PLAN_META).map(([key, plan]) => {
          const current = usage?.plan === key;
          return (
            <div key={key} className={cn("card-elevated p-5 flex flex-col", current && "ring-2 ring-primary")}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">{plan.label}</h3>
                {current && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Actual</span>}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{plan.desc}</p>
              <ul className="mt-4 space-y-2 text-sm flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-foreground/80">
                    <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              {isAdmin && !current && (
                <Button className="mt-5" onClick={() => { if (confirm(`Mudar para o plano ${plan.label}?`)) updatePlan.mutate({ plan: key as any }); }} disabled={updatePlan.isPending}>
                  Seleccionar {plan.label}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {tenant?.trialEndsAt ? `Período de avaliação termina em ${new Date(tenant.trialEndsAt).toLocaleDateString("pt-AO")}. ` : ""}
        A facturação recorrente está disponível nos planos Pro e Escritório.
      </p>
    </div>
  );
}
