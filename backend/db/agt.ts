import { and, desc, eq, or, sql } from "drizzle-orm";
import { agtSubmissions, company, invoices } from "../drizzle/schema";
import { getDb } from "./connection";

export async function logAgtSubmission(tenantId: number, entry: {
  invoiceId?: number | null;
  action: "registar_serie" | "submeter_documento" | "consultar_documento" | "submeter_saft";
  payload?: string | null;
  response?: string | null;
  status: "sucesso" | "erro" | "pendente";
  message?: string | null;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(agtSubmissions).values({
    tenantId,
    invoiceId: entry.invoiceId ?? null,
    action: entry.action,
    payload: entry.payload ?? null,
    response: entry.response ?? null,
    status: entry.status,
    message: (entry.message ?? "").slice(0, 500) || null,
    submittedAt: new Date(),
  });
}

export async function listAgtSubmissions(tenantId: number, page = 1, limit = 50) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const offset = (page - 1) * limit;
  const where = eq(agtSubmissions.tenantId, tenantId);
  const [data, countResult] = await Promise.all([
    db.select().from(agtSubmissions).where(where).orderBy(desc(agtSubmissions.submittedAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(agtSubmissions).where(where),
  ]);
  return { data, total: Number(countResult[0]?.count ?? 0) };
}

export async function findCompanyByNif(nif: string) {
  const db = await getDb();
  if (!db || !nif) return null;
  const cleanNif = nif.trim();
  const result = await db.select().from(company).where(eq(company.nif, cleanNif)).limit(1);
  return result[0] ?? null;
}

export async function findFirstCompany() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(company).limit(1);
  return result[0] ?? null;
}

export async function findInvoiceForAgtWebhook(params: {
  tenantId?: number | null;
  fullNumber?: string | null;
  atcud?: string | null;
  invoiceId?: number | null;
}) {
  const db = await getDb();
  if (!db) return null;

  const matchConds = [];
  if (params.invoiceId && Number.isFinite(params.invoiceId)) {
    matchConds.push(eq(invoices.id, Number(params.invoiceId)));
  }
  if (params.fullNumber) {
    matchConds.push(eq(invoices.fullNumber, params.fullNumber.trim()));
  }
  if (params.atcud) {
    matchConds.push(eq(invoices.atcud, params.atcud.trim()));
  }
  if (matchConds.length === 0) return null;

  const where = params.tenantId
    ? and(eq(invoices.tenantId, params.tenantId), or(...matchConds))
    : or(...matchConds);

  const result = await db.select().from(invoices).where(where).limit(1);
  return result[0] ?? null;
}

