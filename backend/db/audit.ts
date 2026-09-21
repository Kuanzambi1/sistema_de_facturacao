import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { auditLogs } from "../drizzle/schema";
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

export async function listAuditLogs(
  tenantId: number,
  page = 1,
  limit = 50,
  filters?: { action?: string; entityType?: string; search?: string }
) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const offset = (page - 1) * limit;
  const conditions = [eq(auditLogs.tenantId, tenantId)];

  if (filters?.action) {
    conditions.push(eq(auditLogs.action, filters.action));
  }
  if (filters?.entityType) {
    conditions.push(eq(auditLogs.entityType, filters.entityType));
  }
  if (filters?.search) {
    const s = `%${filters.search}%`;
    conditions.push(
      or(
        like(auditLogs.userName, s),
        like(auditLogs.action, s),
        like(auditLogs.entityType, s),
        like(auditLogs.entityLabel, s),
        like(auditLogs.details, s)
      )!
    );
  }

  const where = and(...conditions)!;
  const [data, countResult] = await Promise.all([
    db.select().from(auditLogs).where(where).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(where),
  ]);
  return { data, total: Number(countResult[0]?.count ?? 0) };
}
