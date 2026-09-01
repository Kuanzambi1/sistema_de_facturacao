import { and, desc, eq, sql } from "drizzle-orm";
import { users } from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { getDb } from "./connection";

export async function upsertUser(user: { openId: string; name?: string | null; email?: string | null; loginMethod?: string | null; role?: string | null; tenantId?: number | null; lastSignedIn?: Date | null }) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: Record<string, unknown> = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value !== undefined) {
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (user.tenantId !== undefined) {
    values.tenantId = user.tenantId;
    updateSet.tenantId = user.tenantId;
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values as any).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function createUser(data: Record<string, unknown>) {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(users).values(data as any);
  return await getUserByOpenId(data.openId as string);
}

export async function listUsers(tenantId: number, page = 1, limit = 50) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const offset = (page - 1) * limit;
  const where = tenantId ? eq(users.tenantId, tenantId) : undefined;
  const [data, countResult] = await Promise.all([
    db.select().from(users).where(where).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(users).where(where),
  ]);
  return { data, total: Number(countResult[0]?.count ?? 0) };
}

export async function updateUserRole(tenantId: number, id: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return null;
  await db.update(users).set({ role, updatedAt: new Date() }).where(and(eq(users.id, id), eq(users.tenantId, tenantId)));
  const result = await db.select().from(users).where(and(eq(users.id, id), eq(users.tenantId, tenantId))).limit(1);
  return result[0] ?? null;
}

export async function getUserCount() {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(users);
  return Number(result?.count ?? 0);
}

export async function getUserById(tenantId: number, id: number) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.select().from(users).where(and(eq(users.id, id), eq(users.tenantId, tenantId))).limit(1);
  return result ?? null;
}

export async function updateUser(tenantId: number, id: number, data: { name?: string | null; email?: string | null }) {
  const db = await getDb();
  if (!db) return null;
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  await db.update(users).set(updateData).where(and(eq(users.id, id), eq(users.tenantId, tenantId)));
  return getUserById(tenantId, id);
}

export async function disableUser(tenantId: number, id: number) {
  const db = await getDb();
  if (!db) return null;
  await db.update(users).set({ passwordHash: null, updatedAt: new Date() }).where(and(eq(users.id, id), eq(users.tenantId, tenantId)));
  return getUserById(tenantId, id);
}

export async function resetUserPassword(tenantId: number, id: number, passwordHash: string) {
  const db = await getDb();
  if (!db) return null;
  await db
    .update(users)
    .set({ passwordHash, loginMethod: "local", updatedAt: new Date() })
    .where(and(eq(users.id, id), eq(users.tenantId, tenantId)));
  return getUserById(tenantId, id);
}
