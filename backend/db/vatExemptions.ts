import { eq, and } from "drizzle-orm";
import { getDb } from "./connection";
import { vatExemptionReasons } from "../drizzle/schema";

export async function listVatExemptions(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vatExemptionReasons).where(eq(vatExemptionReasons.tenantId, tenantId)).orderBy(vatExemptionReasons.code);
}

export async function createVatExemption(tenantId: number, data: { code: string; description: string; legalBasis: string }) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(vatExemptionReasons).values({
    tenantId,
    code: data.code,
    description: data.description,
    legalBasis: data.legalBasis,
  });
  return result.insertId;
}

export async function deleteVatExemption(tenantId: number, id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(vatExemptionReasons).where(and(
    eq(vatExemptionReasons.tenantId, tenantId),
    eq(vatExemptionReasons.id, id)
  ));
}
