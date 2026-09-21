import { and, desc, eq, gte, or, sql } from "drizzle-orm";
import { clients, invoices, payments, products, suppliers, inventoryMovements } from "../drizzle/schema";
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
  const { invoiceItems } = await import("../drizzle/schema");
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

export async function getFinancialSummary(tenantId: number, dateFrom: Date, dateTo: Date) {
  const db = await getDb();
  if (!db) return null;
  const scope = eq(invoices.tenantId, tenantId);
  const dateFilter = and(gte(invoices.issueDate, dateFrom), sql`${invoices.issueDate} <= ${dateTo}`);
  const statusFilter = sql`${invoices.status} NOT IN ('rascunho','anulada')`;

  const [totals] = await db
    .select({
      totalWithVat: sql<string>`COALESCE(SUM(totalAmount),0)`,
      totalWithoutVat: sql<string>`COALESCE(SUM(subtotal),0)`,
      totalVat: sql<string>`COALESCE(SUM(vatAmount),0)`,
      totalDiscount: sql<string>`COALESCE(SUM(discountAmount),0)`,
      totalWithholdingTax: sql<string>`COALESCE(SUM(withholdingTaxAmount),0)`,
      documentCount: sql<number>`count(*)`,
    })
    .from(invoices)
    .where(and(scope, dateFilter, statusFilter));

  const totalWithoutVat = Number(totals?.totalWithoutVat ?? 0);
  const totalDiscount = Number(totals?.totalDiscount ?? 0);
  const totalWithholdingTax = Number(totals?.totalWithholdingTax ?? 0);

  return {
    totalWithVat: Number(totals?.totalWithVat ?? 0),
    totalWithoutVat,
    totalVat: Number(totals?.totalVat ?? 0),
    totalDiscount,
    totalWithholdingTax,
    netAmount: totalWithoutVat - totalDiscount - totalWithholdingTax,
    documentCount: Number(totals?.documentCount ?? 0),
  };
}

export async function getClientStatement(tenantId: number, clientId: number) {
  const db = await getDb();
  if (!db) return { client: null, invoices: [], payments: [], balance: 0 };

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.tenantId, tenantId), eq(clients.id, clientId)))
    .limit(1);

  if (!client) return { client: null, invoices: [], payments: [], balance: 0 };

  const clientInvoices = await db
    .select({
      id: invoices.id,
      fullNumber: invoices.fullNumber,
      documentType: invoices.documentType,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      subtotal: invoices.subtotal,
      vatAmount: invoices.vatAmount,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      paidAmount: invoices.paidAmount,
    })
    .from(invoices)
    .where(and(eq(invoices.tenantId, tenantId), eq(invoices.clientId, clientId), sql`${invoices.status} NOT IN ('rascunho','anulada')`))
    .orderBy(invoices.issueDate);

  const clientPayments = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      paymentDate: payments.paymentDate,
      method: payments.method,
      reference: payments.reference,
      invoiceId: payments.invoiceId,
    })
    .from(payments)
    .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
    .where(and(eq(payments.tenantId, tenantId), eq(invoices.clientId, clientId)))
    .orderBy(payments.paymentDate);

  const totalInvoiced = clientInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  const totalPaid = clientPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = totalInvoiced - totalPaid;

  return {
    client,
    invoices: clientInvoices,
    payments: clientPayments,
    totalInvoiced,
    totalPaid,
    balance,
  };
}

export async function getSupplierStatement(tenantId: number, supplierId: number) {
  const db = await getDb();
  if (!db) return { supplier: null, movements: [], totalEntered: 0, totalCost: 0 };

  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.tenantId, tenantId), eq(suppliers.id, supplierId)))
    .limit(1);

  if (!supplier) return { supplier: null, movements: [], totalEntered: 0, totalCost: 0 };

  const movements = await db
    .select({
      id: inventoryMovements.id,
      type: inventoryMovements.type,
      quantity: inventoryMovements.quantity,
      unitCost: inventoryMovements.unitCost,
      totalCost: inventoryMovements.totalCost,
      reference: inventoryMovements.reference,
      movementDate: inventoryMovements.movementDate,
      notes: inventoryMovements.notes,
    })
    .from(inventoryMovements)
    .where(and(eq(inventoryMovements.tenantId, tenantId), eq(inventoryMovements.supplierId, supplierId)))
    .orderBy(inventoryMovements.movementDate);

  const totalEntered = movements
    .filter((m) => m.type === "entrada")
    .reduce((sum, m) => sum + Number(m.quantity), 0);
  const totalCost = movements
    .filter((m) => m.type === "entrada")
    .reduce((sum, m) => sum + Number(m.totalCost ?? 0), 0);

  return {
    supplier,
    movements,
    totalEntered,
    totalCost,
  };
}
