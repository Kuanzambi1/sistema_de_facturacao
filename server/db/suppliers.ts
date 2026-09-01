import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { suppliers } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function listSuppliers(tenantId: number, search?: string, page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const offset = (page - 1) * limit;
  const conditions = [eq(suppliers.tenantId, tenantId), eq(suppliers.isActive, true)];
  if (search) conditions.push(or(like(suppliers.name, `%${search}%`), like(suppliers.nif, `%${search}%`))!);
  const where = and(...conditions)!;
  const [data, countResult] = await Promise.all([
    db.select().from(suppliers).where(where).orderBy(desc(suppliers.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(suppliers).where(where),
  ]);
  return { data, total: Number(countResult[0]?.count ?? 0) };
}

export async function getSupplierById(tenantId: number, id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(suppliers).where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId))).limit(1);
  return result[0] ?? null;
}

export async function createSupplier(tenantId: number, data: Omit<typeof suppliers.$inferInsert, "tenantId">) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(suppliers).values({ ...data, tenantId });
  return getSupplierById(tenantId, (result as any).insertId);
}

export async function updateSupplier(tenantId: number, id: number, data: Partial<typeof suppliers.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(suppliers).set({ ...data, updatedAt: new Date() }).where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)));
  return getSupplierById(tenantId, id);
}

export async function deleteSupplier(tenantId: number, id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(suppliers).set({ isActive: false }).where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)));
  return true;
}
