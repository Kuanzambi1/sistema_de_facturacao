import { and, desc, eq, lt, sql } from "drizzle-orm";
import { invoiceSeries } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function listInvoiceSeries(tenantId: number, documentType?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(invoiceSeries.tenantId, tenantId), eq(invoiceSeries.isActive, true)];
  if (documentType) conditions.push(eq(invoiceSeries.documentType, documentType as any));
  const where = and(...conditions)!;
  return db.select().from(invoiceSeries).where(where).orderBy(invoiceSeries.code);
}

export async function getSeriesById(tenantId: number, id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(invoiceSeries).where(and(eq(invoiceSeries.id, id), eq(invoiceSeries.tenantId, tenantId))).limit(1);
  return result[0] ?? null;
}

export async function createInvoiceSeries(tenantId: number, data: Omit<typeof invoiceSeries.$inferInsert, "tenantId">) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(invoiceSeries).values({ ...data, tenantId });
  return getSeriesById(tenantId, (result as any).insertId);
}

export async function updateInvoiceSeries(tenantId: number, id: number, data: Partial<typeof invoiceSeries.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(invoiceSeries).set({ ...data, updatedAt: new Date() }).where(and(eq(invoiceSeries.id, id), eq(invoiceSeries.tenantId, tenantId)));
  return getSeriesById(tenantId, id);
}

export async function incrementSeriesNumber(tenantId: number, seriesId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ lastNumber: invoiceSeries.lastNumber, tenantId: invoiceSeries.tenantId })
      .from(invoiceSeries)
      .where(eq(invoiceSeries.id, seriesId))
      .for("update");
    if (!row || row.tenantId !== tenantId) throw new Error("Série não encontrada");
    const next = (row.lastNumber ?? 0) + 1;
    await tx
      .update(invoiceSeries)
      .set({ lastNumber: next, updatedAt: new Date() })
      .where(eq(invoiceSeries.id, seriesId));
    return next;
  });
}

/**
 * Devolve o hash do documento imediatamente anterior da série, para
 * encadear as assinaturas (imutabilidade) conforme os requisitos AGT.
 */
export async function getPreviousInvoiceHash(tenantId: number, seriesId: number, number: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const { invoices } = await import("../../drizzle/schema");
  const [row] = await db
    .select({ hash: invoices.hash })
    .from(invoices)
    .where(and(eq(invoices.tenantId, tenantId), eq(invoices.seriesId, seriesId), lt(invoices.number, number)))
    .orderBy(desc(invoices.number))
    .limit(1);
  return row?.hash ?? null;
}
