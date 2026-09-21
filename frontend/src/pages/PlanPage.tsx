import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { PLANS, BILLING_CYCLES, formatPlanPrice, getMonthlyEquivalent, type PlanId, type BillingCycleId } from "@shared/const";
import { Check, Building2, CreditCard, FileText, Users, Sparkles, Rocket, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

const PLAN_ICONS: Record<string, any> = {
  gratis: Sparkles,
  pro: Rocket,
  escritorio: Gem,
};

const PLAN_COLORS: Record<string, string> = {
  gratis: "from-slate-500 to-slate-600",
  pro: "from-[#e66a00] to-[#e66a00]/80",
  escritorio: "from-[#004b36] to-[#004b36]/80",
};

export default function PlanPage() {
  const [selectedCycle, setSelectedCycle] = useState<BillingCycleId>("mensal");
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
      toast.success("Plano e ciclo de facturação actualizados!");
    },
    onError: (e) => toast.error(e.message),
  });

  const pct = usage?.limit ? Math.min((usage.used / usage.limit) * 100, 100) : 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in-up max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Subscrição e Plano</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Escolha o plano e ciclo de facturação ideal para o seu negócio</p>
      </div>

      {/* Status cards */}
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
          <p className="text-base font-semibold text-foreground">{usage?.planLabel ?? "—"}</p>
          <p className="text-sm text-muted-foreground capitalize">
            Ciclo: {BILLING_CYCLES[(tenant as any)?.billingCycle as BillingCycleId] ? BILLING_CYCLES[(tenant as any)?.billingCycle as BillingCycleId].label : "Mensal"} · Estado: {usage?.status ?? "—"}
          </p>
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

      {/* Billing cycle selector */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border/60">
          {Object.entries(BILLING_CYCLES).map(([key, cycle]) => (
            <button
              key={key}
              onClick={() => setSelectedCycle(key as BillingCycleId)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                selectedCycle === key
                  ? "bg-[#004b36] text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
              )}
            >
              {cycle.label}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards — FactPlus inspired */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(Object.entries(PLANS) as [PlanId, typeof PLANS[PlanId]][]).map(([key, plan]) => {
          const current = usage?.plan === key;
          const price = plan.prices[selectedCycle];
          const monthly = getMonthlyEquivalent(key, selectedCycle);
          const Icon = PLAN_ICONS[key];
          const savings = selectedCycle !== "mensal" && price > 0
            ? Math.round(((plan.prices.mensal * BILLING_CYCLES[selectedCycle].months - price) / (plan.prices.mensal * BILLING_CYCLES[selectedCycle].months)) * 100)
            : 0;

          return (
            <div
              key={key}
              className={cn(
                "relative rounded-2xl border bg-card flex flex-col transition-all duration-300 overflow-hidden",
                current
                  ? "border-[#004b36]/40 shadow-lg shadow-[#004b36]/10 ring-2 ring-[#004b36]/20"
                  : key === "pro"
                    ? "border-[#e66a00]/30 shadow-xl shadow-[#e66a00]/8 scale-[1.02]"
                    : "border-border/60 hover:border-border hover:shadow-lg"
              )}
            >
              {/* Popular badge */}
              {key === "pro" && (
                <div className="absolute -top-0 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-gradient-to-r from-[#e66a00] to-[#e66a00]/85 text-white text-[11px] font-bold tracking-wider rounded-b-xl shadow-md shadow-[#e66a00]/25">
                  MAIS POPULAR
                </div>
              )}

              {/* Header */}
              <div className={cn("px-6 pt-7 pb-5 bg-gradient-to-br text-white", PLAN_COLORS[key])}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{plan.label}</h3>
                    <p className="text-white/70 text-xs">{plan.desc}</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">{formatPlanPrice(price)}</span>
                  {price > 0 && (
                    <span className="text-white/60 text-sm font-medium">
                      /{BILLING_CYCLES[selectedCycle].months === 1 ? "mês" : `${BILLING_CYCLES[selectedCycle].months} meses`}
                    </span>
                  )}
                </div>
                {price > 0 && (
                  <p className="text-white/50 text-xs mt-1">
                    ≈ {monthly.toLocaleString("pt-AO")} Kz/mês
                    {savings > 0 && <span className="ml-1 text-emerald-300 font-semibold"> poupe {savings}%</span>}
                  </p>
                )}
                {current && (
                  <span className="inline-flex items-center mt-3 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">
                    Plano Actual
                  </span>
                )}
              </div>

              {/* Features */}
              <ul className="px-6 py-5 space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/80">
                    <Check className="h-4 w-4 text-[#004b36] mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="px-6 pb-6">
                {isAdmin && !current ? (
                  <Button
                    className={cn(
                      "w-full h-11 rounded-xl font-semibold text-sm transition-all",
                      key === "pro"
                        ? "bg-gradient-to-r from-[#e66a00] to-[#e66a00]/85 text-white hover:brightness-110 shadow-md shadow-[#e66a00]/20"
                        : "bg-[#004b36] text-white hover:brightness-110"
                    )}
                    onClick={() => {
                      const cycleLabel = BILLING_CYCLES[selectedCycle].label;
                      const priceLabel = price === 0 ? "Grátis" : `${formatPlanPrice(price)} Kz`;
                      if (confirm(`Activar plano ${plan.label} — ${cycleLabel} (${priceLabel})?`)) {
                        updatePlan.mutate({ plan: key, billingCycle: selectedCycle });
                      }
                    }}
                    disabled={updatePlan.isPending}
                  >
                    {updatePlan.isPending ? "A processar..." : "Seleccionar Plano"}
                  </Button>
                ) : current ? (
                  <div className="w-full h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                    Plano Activо
                  </div>
                ) : (
                  <Button className="w-full h-11 rounded-xl" variant="outline" disabled>
                    Contactar
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center">
        {tenant?.trialEndsAt ? `Período de avaliação termina em ${new Date(tenant.trialEndsAt).toLocaleDateString("pt-AO")}. ` : ""}
        Todos os planos incluem conformidade AGT, SAFT-AO e suporte técnico. Preços em Kwanza (AOA).
      </p>
    </div>
  );
}
