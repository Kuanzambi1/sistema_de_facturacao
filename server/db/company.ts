import { eq } from "drizzle-orm";
import { company } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getCompany(tenantId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(company).where(eq(company.tenantId, tenantId)).limit(1);
  return result[0] ?? null;
}

export async function upsertCompany(tenantId: number, data: Partial<typeof company.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  const existing = await getCompany(tenantId);
  if (existing) {
    await db.update(company).set({ ...data, updatedAt: new Date() }).where(eq(company.id, existing.id));
    return getCompany(tenantId);
  } else {
    const vals = { tenantId, name: "Empresa", nif: "000000000", ...data };
    await db.insert(company).values(vals as any);
    return getCompany(tenantId);
  }
}
