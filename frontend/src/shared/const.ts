export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';
export const NOT_TENANT_ERR_MSG = 'Conta sem subscrição activa (10003)';

// ─── Planos SaaS ──────────────────────────────────────────────────────────────
export const BILLING_CYCLES = {
  mensal: { label: "Mensal", months: 1 },
  trimestral: { label: "Trimestral", months: 3 },
  semestral: { label: "Semestral", months: 6 },
  anual: { label: "Anual", months: 12 },
} as const;

export type BillingCycleId = keyof typeof BILLING_CYCLES;

export const PLANS = {
  gratis: {
    label: "Gratuito",
    desc: "Para experimentar",
    monthlyDocs: 100,
    maxUsers: 3,
    recurring: false,
    portal: true,
    prices: { mensal: 0, trimestral: 0, semestral: 0, anual: 0 },
    features: ["100 documentos/mês", "3 utilizadores", "Facturação AGT completa", "Portal do cliente"],
  },
  pro: {
    label: "Pro",
    desc: "Para PME em crescimento",
    monthlyDocs: 5000,
    maxUsers: 20,
    recurring: true,
    portal: true,
    prices: { mensal: 15000, trimestral: 38000, semestral: 72000, anual: 130000 },
    features: ["5.000 documentos/mês", "20 utilizadores", "Facturação recorrente", "Pagamentos & dunning", "Portal do cliente"],
  },
  escritorio: {
    label: "Escritório",
    desc: "Para contabilistas e escritórios",
    monthlyDocs: 100000,
    maxUsers: 100,
    recurring: true,
    portal: true,
    prices: { mensal: 35000, trimestral: 90000, semestral: 170000, anual: 310000 },
    features: ["100.000 documentos/mês", "100 utilizadores", "Tudo do plano Pro", "Suporte prioritário", "Multi-empresa"],
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function getPlanPrice(planId: PlanId, cycle: BillingCycleId): number {
  return PLANS[planId].prices[cycle];
}

export function formatPlanPrice(price: number): string {
  if (price === 0) return "Grátis";
  return price.toLocaleString("pt-AO");
}

export function getMonthlyEquivalent(planId: PlanId, cycle: BillingCycleId): number {
  const total = PLANS[planId].prices[cycle];
  const months = BILLING_CYCLES[cycle].months;
  return months > 0 ? Math.round(total / months) : 0;
}
