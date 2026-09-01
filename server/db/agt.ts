import { desc, eq, sql } from "drizzle-orm";
import { agtSubmissions } from "../../drizzle/schema";
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
    message: entry.message ?? null,
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
