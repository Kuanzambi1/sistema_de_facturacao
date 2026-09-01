import { eq, sql } from "drizzle-orm";
import { tenants } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function createTenant(data: { name: string; nif?: string; plan?: "gratis" | "pro" | "escritorio" }) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(tenants).values({
    name: data.name,
    nif: data.nif ?? null,
    plan: data.plan ?? "gratis",
    status: "trial",
    trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  const [row] = await db.select().from(tenants).where(eq(tenants.id, (result as any).insertId)).limit(1);
  return row ?? null;
}

export async function getTenant(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  return row ?? null;
}

export async function updateTenant(id: number, data: Partial<typeof tenants.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(tenants).set({ ...data, updatedAt: new Date() }).where(eq(tenants.id, id));
  return getTenant(id);
}

export async function countMonthlyDocuments(tenantId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [res] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  return Number(res?.count ?? 0);
}
