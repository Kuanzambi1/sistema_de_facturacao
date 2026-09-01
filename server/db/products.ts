import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { productCategories, products } from "../../drizzle/schema";
import { getDb } from "./connection";

// ─── Categorias ──────────────────────────────────────────────────────────────

export async function listProductCategories(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productCategories).where(eq(productCategories.tenantId, tenantId)).orderBy(productCategories.name);
}

export async function createProductCategory(tenantId: number, data: Omit<typeof productCategories.$inferInsert, "tenantId">) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(productCategories).values({ ...data, tenantId });
  const rows = await db.select().from(productCategories).where(and(eq(productCategories.id, (result as any).insertId), eq(productCategories.tenantId, tenantId))).limit(1);
  return rows[0] ?? null;
}

// ─── Produtos / Serviços ─────────────────────────────────────────────────────

export async function getNextProductCode(tenantId: number, type: string) {
  const db = await getDb();
  if (!db) return type === "produto" ? "PRD0001" : "SVC0001";
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(products).where(and(eq(products.tenantId, tenantId), eq(products.type, type as any)));
  const count = Number(result?.count ?? 0) + 1;
  const prefix = type === "produto" ? "PRD" : "SVC";
  return `${prefix}${String(count).padStart(4, '0')}`;
}

export async function listProducts(tenantId: number, search?: string, type?: string, page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const offset = (page - 1) * limit;
  const conditions = [eq(products.tenantId, tenantId), eq(products.isActive, true)];
  if (search) conditions.push(or(like(products.name, `%${search}%`), like(products.code, `%${search}%`))!);
  if (type) conditions.push(eq(products.type, type as any));
  const where = and(...conditions)!;
  const [data, countResult] = await Promise.all([
    db.select().from(products).where(where).orderBy(products.name).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(products).where(where),
  ]);
  return { data, total: Number(countResult[0]?.count ?? 0) };
}

export async function getProductById(tenantId: number, id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(products).where(and(eq(products.id, id), eq(products.tenantId, tenantId))).limit(1);
  return result[0] ?? null;
}

export async function createProduct(tenantId: number, data: Omit<typeof products.$inferInsert, "tenantId">) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(products).values({ ...data, tenantId });
  return getProductById(tenantId, (result as any).insertId);
}

export async function updateProduct(tenantId: number, id: number, data: Partial<typeof products.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(products).set({ ...data, updatedAt: new Date() }).where(and(eq(products.id, id), eq(products.tenantId, tenantId)));
  return getProductById(tenantId, id);
}

export async function deleteProduct(tenantId: number, id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(products).set({ isActive: false }).where(and(eq(products.id, id), eq(products.tenantId, tenantId)));
  return true;
}
