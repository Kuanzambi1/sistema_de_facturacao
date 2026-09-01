import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { clients } from "../../drizzle/schema";
import { getDb, makeToken } from "./connection";

export async function listClients(tenantId: number, search?: string, page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const offset = (page - 1) * limit;
  const conditions = [eq(clients.tenantId, tenantId), eq(clients.isActive, true)];
  if (search) conditions.push(or(like(clients.name, `%${search}%`), like(clients.nif, `%${search}%`), like(clients.email, `%${search}%`))!);
  const where = and(...conditions)!;
  const [data, countResult] = await Promise.all([
    db.select().from(clients).where(where).orderBy(desc(clients.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(clients).where(where),
  ]);
  return { data, total: Number(countResult[0]?.count ?? 0) };
}

export async function getClientById(tenantId: number, id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.tenantId, tenantId))).limit(1);
  return result[0] ?? null;
}

export async function createClient(tenantId: number, data: Omit<typeof clients.$inferInsert, "tenantId">) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(clients).values({ ...data, tenantId, portalToken: makeToken() });
  return getClientById(tenantId, (result as any).insertId);
}

export async function updateClient(tenantId: number, id: number, data: Partial<typeof clients.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(clients).set({ ...data, updatedAt: new Date() }).where(and(eq(clients.id, id), eq(clients.tenantId, tenantId)));
  return getClientById(tenantId, id);
}

export async function deleteClient(tenantId: number, id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(clients).set({ isActive: false }).where(and(eq(clients.id, id), eq(clients.tenantId, tenantId)));
  return true;
}

export async function getClientByPortalToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(clients).where(eq(clients.portalToken, token)).limit(1);
  return result[0] ?? null;
}

export async function regenerateClientPortalToken(tenantId: number, id: number) {
  const db = await getDb();
  if (!db) return null;
  const token = makeToken();
  await db.update(clients).set({ portalToken: token, updatedAt: new Date() }).where(and(eq(clients.id, id), eq(clients.tenantId, tenantId)));
  return getClientById(tenantId, id);
}
