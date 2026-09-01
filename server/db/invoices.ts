import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { invoices, invoiceItems, payments } from "../../drizzle/schema";
import { getDb, makeToken } from "./connection";

// ─── Listar facturas ─────────────────────────────────────────────────────────

export async function listInvoices(tenantId: number, filters: {
  search?: string;
  status?: string;
  documentType?: string;
  clientId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const { search, status, documentType, clientId, dateFrom, dateTo, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;
  const conditions = [eq(invoices.tenantId, tenantId)];
  if (search) conditions.push(or(like(invoices.fullNumber, `%${search}%`), like(invoices.clientName, `%${search}%`))!);
  if (status) conditions.push(eq(invoices.status, status as any));
  if (documentType) conditions.push(eq(invoices.documentType, documentType as any));
  if (clientId) conditions.push(eq(invoices.clientId, clientId));
  if (dateFrom) conditions.push(gte(invoices.issueDate, dateFrom));
  if (dateTo) conditions.push(lte(invoices.issueDate, dateTo));
  const where = and(...conditions)!;
  const [data, countResult] = await Promise.all([
    db.select().from(invoices).where(where).orderBy(desc(invoices.issueDate)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(invoices).where(where),
  ]);
  return { data, total: Number(countResult[0]?.count ?? 0) };
}

export async function getInvoiceById(tenantId: number, id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(invoices).where(and(eq(invoices.id, id), eq(invoices.tenantId, tenantId))).limit(1);
  return result[0] ?? null;
}

export async function getInvoiceItems(tenantId: number, invoiceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invoiceItems).where(and(eq(invoiceItems.invoiceId, invoiceId), eq(invoiceItems.tenantId, tenantId))).orderBy(invoiceItems.lineNumber);
}

export async function createInvoice(
  tenantId: number,
  data: Omit<typeof invoices.$inferInsert, "tenantId">,
  items: Array<Omit<typeof invoiceItems.$inferInsert, "tenantId">>
) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(invoices).values({ ...data, tenantId, portalToken: makeToken() });
  const invoiceId = (result as any).insertId;
  if (items.length > 0) {
    await db.insert(invoiceItems).values(items.map((item) => ({ ...item, invoiceId, tenantId })));
  }
  return getInvoiceById(tenantId, invoiceId);
}

export async function updateInvoiceStatus(tenantId: number, id: number, status: string, extra?: Partial<typeof invoices.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(invoices).set({ status: status as any, ...extra, updatedAt: new Date() }).where(and(eq(invoices.id, id), eq(invoices.tenantId, tenantId)));
  return getInvoiceById(tenantId, id);
}

export async function updateInvoicePdfUrl(tenantId: number, id: number, pdfUrl: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(invoices).set({ pdfUrl, updatedAt: new Date() }).where(and(eq(invoices.id, id), eq(invoices.tenantId, tenantId)));
}

export async function listInvoicesByClientToken(portalToken: string) {
  const db = await getDb();
  if (!db) return [];
  const { getClientByPortalToken } = await import("./clients");
  const client = await getClientByPortalToken(portalToken);
  if (!client) return [];
  return db
    .select()
    .from(invoices)
    .where(and(eq(invoices.clientId, client.id), eq(invoices.tenantId, client.tenantId), sql`${invoices.status} NOT IN ('rascunho','anulada')`))
    .orderBy(desc(invoices.issueDate));
}

export async function countCreditNotesForInvoice(tenantId: number, invoiceId: number, fullNumber: string | null): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const conditions = [eq(invoices.tenantId, tenantId), eq(invoices.documentType, "NC")];
  const orConds = [eq(invoices.relatedInvoiceId, invoiceId)];
  if (fullNumber) orConds.push(eq(invoices.relatedInvoiceNumber, fullNumber));
  const [res] = await db
    .select({ count: sql<number>`count(*)` })
    .from(invoices)
    .where(and(...conditions, or(...orConds)));
  return Number(res?.count ?? 0);
}

// ─── Orçamentos → Facturas ────────────────────────────────────────────────────

export async function convertQuotation(tenantId: number, quotationId: number, seriesId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const { incrementSeriesNumber, getSeriesById } = await import("./series");
  const quote = await getInvoiceById(tenantId, quotationId);
  if (!quote || quote.documentType !== "OR") throw new Error("Documento não é um orçamento");
  if (quote.status === "convertida") throw new Error("Orçamento já convertido");
  if (quote.status === "anulada" || quote.status === "expirada") throw new Error("Orçamento anulado/expirado");

  const items = await getInvoiceItems(tenantId, quotationId);
  const number = await incrementSeriesNumber(tenantId, seriesId);
  const series = await getSeriesById(tenantId, seriesId);
  if (!series) throw new Error("Série não encontrada");
  const fullNumber = `${series.code}${series.year}/${number}`;
  const atcud = series.validationCode ? `ATCUD:${series.validationCode}-${String(number).padStart(8, "0")}` : null;

  const [result] = await db.insert(invoices).values({
    tenantId,
    seriesId,
    documentType: "FT",
    number,
    fullNumber,
    atcud,
    clientId: quote.clientId,
    clientName: quote.clientName,
    clientNif: quote.clientNif,
    clientAddress: quote.clientAddress,
    clientEmail: quote.clientEmail,
    issueDate: new Date(),
    dueDate: quote.dueDate,
    subtotal: quote.subtotal,
    vatAmount: quote.vatAmount,
    discountAmount: quote.discountAmount,
    withholdingTaxAmount: quote.withholdingTaxAmount,
    totalAmount: quote.totalAmount,
    currency: quote.currency ?? "AOA",
    status: "emitida",
    relatedInvoiceId: quotationId,
    relatedInvoiceNumber: quote.fullNumber,
    notes: quote.notes,
    createdBy: userId,
    portalToken: makeToken(),
  });
  const newInvoiceId = (result as any).insertId;
  await db.insert(invoiceItems).values(items.map((it) => ({
    tenantId,
    invoiceId: newInvoiceId,
    lineNumber: it.lineNumber,
    productId: it.productId,
    productCode: it.productCode,
    description: it.description,
    unit: it.unit,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    discountPercent: it.discountPercent,
    discountAmount: it.discountAmount,
    vatRate: it.vatRate,
    vatExemptReason: it.vatExemptReason,
    vatAmount: it.vatAmount,
    subtotal: it.subtotal,
    total: it.total,
  })));

  await db.update(invoices).set({ status: "convertida", convertedInvoiceId: newInvoiceId, updatedAt: new Date() }).where(and(eq(invoices.id, quotationId), eq(invoices.tenantId, tenantId)));

  return getInvoiceById(tenantId, newInvoiceId);
}

// ─── Pagamentos ──────────────────────────────────────────────────────────────

export async function listPayments(tenantId: number, invoiceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments).where(and(eq(payments.tenantId, tenantId), eq(payments.invoiceId, invoiceId))).orderBy(desc(payments.paymentDate));
}

export async function createPayment(tenantId: number, data: {
  invoiceId: number;
  amount: number;
  paymentDate: Date;
  method: string;
  reference?: string;
  notes?: string;
  createdBy?: number;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(payments).values({
    tenantId,
    invoiceId: data.invoiceId,
    amount: String(data.amount),
    paymentDate: data.paymentDate,
    method: data.method as any,
    reference: data.reference ?? null,
    notes: data.notes ?? null,
    createdBy: data.createdBy ?? null,
  });
  const [row] = await db.select().from(payments).where(and(eq(payments.id, (result as any).insertId), eq(payments.tenantId, tenantId))).limit(1);
  return row ?? null;
}

export async function getInvoicePaidAmount(tenantId: number, invoiceId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const [res] = await db
    .select({ total: sql<string>`COALESCE(SUM(amount),0)` })
    .from(payments)
    .where(and(eq(payments.tenantId, tenantId), eq(payments.invoiceId, invoiceId)));
  return Number(res?.total ?? 0);
}

export async function refreshInvoicePaymentStatus(tenantId: number, invoiceId: number) {
  const db = await getDb();
  if (!db) return null;
  const invoice = await getInvoiceById(tenantId, invoiceId);
  if (!invoice) return null;
  const paid = await getInvoicePaidAmount(tenantId, invoiceId);
  const total = Number(invoice.totalAmount);
  let status = invoice.status;
  if (invoice.status !== "anulada" && invoice.status !== "rascunho") {
    status = paid >= total && total > 0 ? "paga" : paid > 0 ? "parcialmente_paga" : "emitida";
  }
  const paidAt = paid > 0 ? (invoice.paymentDate ?? new Date()) : invoice.paymentDate;
  await db.update(invoices).set({
    paidAmount: String(paid),
    status: status as any,
    paymentDate: paidAt ?? null,
    updatedAt: new Date(),
  }).where(and(eq(invoices.id, invoiceId), eq(invoices.tenantId, tenantId)));
  return getInvoiceById(tenantId, invoiceId);
}
