import { and, desc, eq, lte } from "drizzle-orm";
import { recurringRules } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function listRecurringRules(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recurringRules).where(eq(recurringRules.tenantId, tenantId)).orderBy(recurringRules.name);
}

export async function createRecurringRule(tenantId: number, data: Omit<typeof recurringRules.$inferInsert, "tenantId">) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(recurringRules).values({ ...data, tenantId });
  const [row] = await db.select().from(recurringRules).where(and(eq(recurringRules.id, (result as any).insertId), eq(recurringRules.tenantId, tenantId))).limit(1);
  return row ?? null;
}

export async function updateRecurringRule(tenantId: number, id: number, data: Partial<typeof recurringRules.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(recurringRules).set({ ...data, updatedAt: new Date() }).where(and(eq(recurringRules.id, id), eq(recurringRules.tenantId, tenantId)));
  const [row] = await db.select().from(recurringRules).where(and(eq(recurringRules.id, id), eq(recurringRules.tenantId, tenantId))).limit(1);
  return row ?? null;
}

export async function deleteRecurringRule(tenantId: number, id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(recurringRules).set({ isActive: false }).where(and(eq(recurringRules.id, id), eq(recurringRules.tenantId, tenantId)));
  return true;
}

export async function getRecurringRulesDue(tenantId: number, now: Date) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(recurringRules)
    .where(and(eq(recurringRules.tenantId, tenantId), eq(recurringRules.isActive, true), lte(recurringRules.nextRunDate, now)));
}

export function computeNextRunDate(frequency: string, from: Date): Date {
  const d = new Date(from);
  switch (frequency) {
    case "semanal": d.setDate(d.getDate() + 7); break;
    case "mensal": d.setMonth(d.getMonth() + 1); break;
    case "bimestral": d.setMonth(d.getMonth() + 2); break;
    case "trimestral": d.setMonth(d.getMonth() + 3); break;
    case "semestral": d.setMonth(d.getMonth() + 6); break;
    case "anual": d.setFullYear(d.getFullYear() + 1); break;
    default: d.setMonth(d.getMonth() + 1);
  }
  return d;
}
