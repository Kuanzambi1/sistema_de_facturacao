import { desc, eq, sql } from "drizzle-orm";
import { auditLogs } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function addAuditLog(tenantId: number, entry: {
  userId?: number | null;
  userName?: string | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  entityLabel?: string | null;
  details?: string | null;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({
    tenantId,
    userId: entry.userId ?? null,
    userName: entry.userName ?? null,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    entityLabel: entry.entityLabel ?? null,
    details: entry.details ?? null,
  });
}

export async function listAuditLogs(tenantId: number, page = 1, limit = 50) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const offset = (page - 1) * limit;
  const where = eq(auditLogs.tenantId, tenantId);
  const [data, countResult] = await Promise.all([
    db.select().from(auditLogs).where(where).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(where),
  ]);
  return { data, total: Number(countResult[0]?.count ?? 0) };
}
