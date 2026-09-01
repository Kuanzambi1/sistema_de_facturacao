export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';
export const NOT_TENANT_ERR_MSG = 'Conta sem subscrição activa (10003)';

// ─── Planos SaaS ──────────────────────────────────────────────────────────────
export const PLANS = {
  gratis: { label: "Gratuito", monthlyDocs: 100, maxUsers: 3, recurring: false, portal: true },
  pro: { label: "Pro", monthlyDocs: 5000, maxUsers: 20, recurring: true, portal: true },
  escritorio: { label: "Escritório", monthlyDocs: 100000, maxUsers: 100, recurring: true, portal: true },
} as const;

export type PlanId = keyof typeof PLANS;
