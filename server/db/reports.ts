import { and, desc, eq, gte, or, sql } from "drizzle-orm";
import { clients, invoices, payments, products } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getDashboardStats(tenantId: number) {
  const db = await getDb();
  if (!db) return null;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const scope = eq(invoices.tenantId, tenantId);
  const [totalInvoiced, pendingInvoices, monthlyInvoiced, totalClients, totalProducts, lowStockProducts] = await Promise.all([
    db.select({ total: sql<string>`COALESCE(SUM(totalAmount),0)` }).from(invoices).where(and(scope, sql`${invoices.status} NOT IN ('rascunho','anulada')`)),
    db.select({ total: sql<string>`COALESCE(SUM(totalAmount),0)`, count: sql<number>`count(*)` }).from(invoices).where(and(scope, or(eq(invoices.status, "emitida"), eq(invoices.status, "parcialmente_paga")))),
    db.select({ total: sql<string>`COALESCE(SUM(totalAmount),0)` }).from(invoices).where(and(scope, gte(invoices.issueDate, startOfMonth), sql`${invoices.status} NOT IN ('rascunho','anulada')`)),
    db.select({ count: sql<number>`count(*)` }).from(clients).where(and(eq(clients.tenantId, tenantId), eq(clients.isActive, true))),
    db.select({ count: sql<number>`count(*)` }).from(products).where(and(eq(products.tenantId, tenantId), eq(products.isActive, true))),
    db.select({ count: sql<number>`count(*)` }).from(products).where(and(eq(products.tenantId, tenantId), eq(products.stockControl, true), sql`${products.currentStock} <= ${products.minStock}`)),
  ]);
  return {
    totalInvoiced: Number(totalInvoiced[0]?.total ?? 0),
    pendingAmount: Number(pendingInvoices[0]?.total ?? 0),
    pendingCount: Number(pendingInvoices[0]?.count ?? 0),
    monthlyInvoiced: Number(monthlyInvoiced[0]?.total ?? 0),
    totalClients: Number(totalClients[0]?.count ?? 0),
    totalProducts: Number(totalProducts[0]?.count ?? 0),
    lowStockCount: Number(lowStockProducts[0]?.count ?? 0),
  };
}

export async function getMonthlySales(tenantId: number, year: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.execute(sql`
    SELECT MONTH(issueDate) as month,
           COALESCE(SUM(totalAmount),0) as total,
           COALESCE(SUM(vatAmount),0) as vat,
           count(*) as count
    FROM invoices
    WHERE tenantId = ${tenantId}
      AND YEAR(issueDate) = ${year}
      AND status NOT IN ('rascunho','anulada')
    GROUP BY MONTH(issueDate)
    ORDER BY MONTH(issueDate)
  `);
  return ((result as unknown as any[][])[0] ?? []).map((r: any) => ({
    month: Number(r.month),
    total: Number(r.total),
    vat: Number(r.vat),
    count: Number(r.count),
  }));
}

export async function getTopClients(tenantId: number, limit = 5) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.execute(sql`
    SELECT clientId, clientName,
           COALESCE(SUM(totalAmount),0) as total,
           count(*) as count
    FROM invoices
    WHERE tenantId = ${tenantId}
      AND status NOT IN ('rascunho','anulada')
      AND clientId IS NOT NULL
    GROUP BY clientId, clientName
    ORDER BY total DESC
    LIMIT ${limit}
  `);
  return ((result as unknown as any[][])[0] ?? []).map((r: any) => ({
    clientId: r.clientId,
    clientName: r.clientName,
    total: Number(r.total),
    count: Number(r.count),
  }));
}

export async function getVatReport(tenantId: number, dateFrom: Date, dateTo: Date) {
  const db = await getDb();
  if (!db) return [];
  const { invoiceItems } = await import("../../drizzle/schema");
  const result = await db.execute(sql`
    SELECT ii.vatRate,
           COALESCE(SUM(ii.subtotal),0) as taxableBase,
           COALESCE(SUM(ii.vatAmount),0) as vatTotal
    FROM invoice_items ii
    JOIN invoices i ON i.id = ii.invoiceId
    WHERE i.tenantId = ${tenantId}
      AND ii.tenantId = ${tenantId}
      AND i.issueDate BETWEEN ${dateFrom} AND ${dateTo}
      AND i.status NOT IN ('rascunho','anulada')
    GROUP BY ii.vatRate
    ORDER BY ii.vatRate
  `);
  return ((result as unknown as any[][])[0] ?? []).map((r: any) => ({
    vatRate: Number(r.vatRate),
    taxableBase: Number(r.taxableBase),
    vatTotal: Number(r.vatTotal),
  }));
}

export async function getIncomeReport(tenantId: number, dateFrom: Date, dateTo: Date) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.execute(sql`
    SELECT p.paymentDate, p.method, p.reference, p.amount,
           i.fullNumber, i.clientName
    FROM payments p
    JOIN invoices i ON i.id = p.invoiceId AND i.tenantId = ${tenantId}
    WHERE p.tenantId = ${tenantId}
      AND p.paymentDate BETWEEN ${dateFrom} AND ${dateTo}
    ORDER BY p.paymentDate
  `);
  return ((result as unknown as any[][])[0] ?? []).map((r: any) => ({
    paymentDate: r.paymentDate,
    method: r.method,
    reference: r.reference,
    amount: Number(r.amount),
    fullNumber: r.fullNumber,
    clientName: r.clientName,
  }));
}

export async function getReceivables(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(invoices)
    .where(and(
      eq(invoices.tenantId, tenantId),
      sql`${invoices.status} IN ('emitida','parcialmente_paga','vencida')`,
    ))
    .orderBy(invoices.dueDate);
}

export async function getInventoryForSAFT(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.tenantId, tenantId)).orderBy(products.code);
}
