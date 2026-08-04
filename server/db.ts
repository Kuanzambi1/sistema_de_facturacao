import { and, desc, eq, gte, inArray, like, lt, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  clients,
  company,
  inventoryMovements,
  invoiceItems,
  invoiceSeries,
  invoices,
  productCategories,
  products,
  suppliers,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Utilizadores ─────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
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
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
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

export async function createUser(data: Partial<typeof users.$inferInsert>) {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(users).values(data as any);
  return await getUserByOpenId(data.openId!);
}

export async function listUsers(page = 1, limit = 50) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const offset = (page - 1) * limit;
  const [data, countResult] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(users),
  ]);
  return { data, total: Number(countResult[0]?.count ?? 0) };
}

export async function updateUserRole(id: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return null;
  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getUserCount() {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(users);
  return Number(result?.count ?? 0);
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result ?? null;
}

export async function updateUser(id: number, data: { name?: string | null; email?: string | null }) {
  const db = await getDb();
  if (!db) return null;
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  await db.update(users).set(updateData).where(eq(users.id, id));
  return getUserById(id);
}

export async function disableUser(id: number) {
  const db = await getDb();
  if (!db) return null;
  // Remove passwordHash para impedir login, mas mantém o registo
  await db.update(users).set({ passwordHash: null, updatedAt: new Date() }).where(eq(users.id, id));
  return getUserById(id);
}

// ─── Empresa ──────────────────────────────────────────────────────────────────
export async function getCompany() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(company).limit(1);
  return result[0] ?? null;
}

export async function upsertCompany(data: Partial<typeof company.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  const existing = await getCompany();
  if (existing) {
    await db.update(company).set({ ...data, updatedAt: new Date() }).where(eq(company.id, existing.id));
    return { ...existing, ...data };
  } else {
    const vals = { name: "Empresa", nif: "000000000", ...data };
    await db.insert(company).values(vals as any);
    return getCompany();
  }
}

// ─── Clientes ─────────────────────────────────────────────────────────────────
export async function listClients(search?: string, page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const offset = (page - 1) * limit;
  const conditions = [];
  conditions.push(eq(clients.isActive, true));
  if (search) conditions.push(or(like(clients.name, `%${search}%`), like(clients.nif, `%${search}%`), like(clients.email, `%${search}%`)));
  const where = and(...conditions);
  const [data, countResult] = await Promise.all([
    db.select().from(clients).where(where).orderBy(desc(clients.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(clients).where(where),
  ]);
  return { data, total: Number(countResult[0]?.count ?? 0) };
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createClient(data: typeof clients.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(clients).values(data);
  return getClientById((result as any).insertId);
}

export async function updateClient(id: number, data: Partial<typeof clients.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(clients).set({ ...data, updatedAt: new Date() }).where(eq(clients.id, id));
  return getClientById(id);
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(clients).set({ isActive: false }).where(eq(clients.id, id));
  return true;
}

// ─── Fornecedores ─────────────────────────────────────────────────────────────
export async function listSuppliers(search?: string, page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const offset = (page - 1) * limit;
  const conditions = [];
  conditions.push(eq(suppliers.isActive, true));
  if (search) conditions.push(or(like(suppliers.name, `%${search}%`), like(suppliers.nif, `%${search}%`)));
  const where = and(...conditions);
  const [data, countResult] = await Promise.all([
    db.select().from(suppliers).where(where).orderBy(desc(suppliers.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(suppliers).where(where),
  ]);
  return { data, total: Number(countResult[0]?.count ?? 0) };
}

export async function getSupplierById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createSupplier(data: typeof suppliers.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(suppliers).values(data);
  return getSupplierById((result as any).insertId);
}

export async function updateSupplier(id: number, data: Partial<typeof suppliers.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(suppliers).set({ ...data, updatedAt: new Date() }).where(eq(suppliers.id, id));
  return getSupplierById(id);
}

export async function deleteSupplier(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(suppliers).set({ isActive: false }).where(eq(suppliers.id, id));
  return true;
}

// ─── Categorias de Produtos ───────────────────────────────────────────────────
export async function listProductCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productCategories).orderBy(productCategories.name);
}

export async function createProductCategory(data: typeof productCategories.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(productCategories).values(data);
  const rows = await db.select().from(productCategories).where(eq(productCategories.id, (result as any).insertId)).limit(1);
  return rows[0] ?? null;
}

// ─── Produtos / Serviços ──────────────────────────────────────────────────────
export async function getNextProductCode(type: string) {
  const db = await getDb();
  if (!db) return type === "produto" ? "PRD0001" : "SVC0001";
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.type, type as any));
  const count = Number(result?.count ?? 0) + 1;
  const prefix = type === "produto" ? "PRD" : "SVC";
  return `${prefix}${String(count).padStart(4, '0')}`;
}

export async function listProducts(search?: string, type?: string, page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const offset = (page - 1) * limit;
  const conditions = [];
  conditions.push(eq(products.isActive, true));
  if (search) conditions.push(or(like(products.name, `%${search}%`), like(products.code, `%${search}%`)));
  if (type) conditions.push(eq(products.type, type as any));
  const where = and(...conditions);
  const [data, countResult] = await Promise.all([
    db.select().from(products).where(where).orderBy(products.name).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(products).where(where),
  ]);
  return { data, total: Number(countResult[0]?.count ?? 0) };
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createProduct(data: typeof products.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(products).values(data);
  return getProductById((result as any).insertId);
}

export async function updateProduct(id: number, data: Partial<typeof products.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id));
  return getProductById(id);
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(products).set({ isActive: false }).where(eq(products.id, id));
  return true;
}

// ─── Séries de Facturação ─────────────────────────────────────────────────────
export async function listInvoiceSeries(documentType?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  conditions.push(eq(invoiceSeries.isActive, true));
  if (documentType) conditions.push(eq(invoiceSeries.documentType, documentType as any));
  const where = and(...conditions);
  return db.select().from(invoiceSeries).where(where).orderBy(invoiceSeries.code);
}

export async function getSeriesById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(invoiceSeries).where(eq(invoiceSeries.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createInvoiceSeries(data: typeof invoiceSeries.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(invoiceSeries).values(data);
  return getSeriesById((result as any).insertId);
}

export async function incrementSeriesNumber(seriesId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Transação + FOR UPDATE garante a exclusividade do número sob concorrência
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ lastNumber: invoiceSeries.lastNumber })
      .from(invoiceSeries)
      .where(eq(invoiceSeries.id, seriesId))
      .for("update");
    const next = (row?.lastNumber ?? 0) + 1;
    await tx
      .update(invoiceSeries)
      .set({ lastNumber: next, updatedAt: new Date() })
      .where(eq(invoiceSeries.id, seriesId));
    return next;
  });
}

/**
 * Devolve o hash do documento imediatamente anterior da série, para
 * encadear as assinaturas (imutabilidade) conforme os requisitos AGT.
 */
export async function getPreviousInvoiceHash(seriesId: number, number: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select({ hash: invoices.hash })
    .from(invoices)
    .where(and(eq(invoices.seriesId, seriesId), lt(invoices.number, number)))
    .orderBy(desc(invoices.number))
    .limit(1);
  return row?.hash ?? null;
}

// ─── Documentos Fiscais ───────────────────────────────────────────────────────
export async function listInvoices(filters: {
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
  const conditions = [];
  if (search) conditions.push(or(like(invoices.fullNumber, `%${search}%`), like(invoices.clientName, `%${search}%`)));
  if (status) conditions.push(eq(invoices.status, status as any));
  if (documentType) conditions.push(eq(invoices.documentType, documentType as any));
  if (clientId) conditions.push(eq(invoices.clientId, clientId));
  if (dateFrom) conditions.push(gte(invoices.issueDate, dateFrom));
  if (dateTo) conditions.push(lte(invoices.issueDate, dateTo));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [data, countResult] = await Promise.all([
    db.select().from(invoices).where(where).orderBy(desc(invoices.issueDate)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(invoices).where(where),
  ]);
  return { data, total: Number(countResult[0]?.count ?? 0) };
}

export async function getInvoiceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getInvoiceItems(invoiceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId)).orderBy(invoiceItems.lineNumber);
}

export async function createInvoice(
  data: typeof invoices.$inferInsert,
  items: typeof invoiceItems.$inferInsert[]
) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(invoices).values(data);
  const invoiceId = (result as any).insertId;
  if (items.length > 0) {
    await db.insert(invoiceItems).values(items.map((item) => ({ ...item, invoiceId })));
  }
  return getInvoiceById(invoiceId);
}

export async function updateInvoiceStatus(id: number, status: string, extra?: Partial<typeof invoices.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(invoices).set({ status: status as any, ...extra, updatedAt: new Date() }).where(eq(invoices.id, id));
  return getInvoiceById(id);
}

export async function updateInvoicePdfUrl(id: number, pdfUrl: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(invoices).set({ pdfUrl, updatedAt: new Date() }).where(eq(invoices.id, id));
}

/**
 * Aplica automaticamente os movimentos de stock decorrentes de um documento
 * fiscal. Em documentos de saída (FT/FR/FS/FA/ND/RC/RG) baixa o stock;
 * numa Nota de Crédito (NC) repõe o stock devolvido.
 */
export async function applyStockMovementsForInvoice(options: {
  invoiceId: number;
  items: Array<{ productId?: number | null; quantity: string; }>;
  documentType: string;
  reference: string;
  createdBy?: number | null;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const { invoiceId, items, documentType, reference, createdBy } = options;

  const productIds = items.filter(i => i.productId).map(i => i.productId!);
  if (productIds.length === 0) return false;

  const productRows = await db.select().from(products).where(inArray(products.id, productIds));
  const productMap = new Map(productRows.map(p => [p.id, p]));

  const isRestock = documentType === "NC";
  const movementType = isRestock ? "entrada" : "saida";

  const movements: Array<typeof inventoryMovements.$inferInsert> = [];
  for (const item of items) {
    if (!item.productId) continue;
    const product = productMap.get(item.productId);
    if (!product || product.type !== "produto" || !product.stockControl) continue;

    const qty = Number(item.quantity);
    const delta = isRestock ? qty : -qty;
    const unitCost = product.costPrice != null ? Number(product.costPrice) : null;

    movements.push({
      productId: product.id,
      type: movementType as any,
      quantity: String(qty),
      unitCost: unitCost != null ? String(unitCost) : null,
      totalCost: unitCost != null ? String(qty * unitCost) : null,
      reference,
      invoiceId,
      createdBy: createdBy ?? null,
      notes: `Doc. ${reference}`,
    });

    await db.update(products)
      .set({ currentStock: sql`${products.currentStock} + ${delta}`, updatedAt: new Date() })
      .where(eq(products.id, product.id));
  }

  if (movements.length > 0) {
    await db.insert(inventoryMovements).values(movements as any);
  }
  return true;
}

/**
 * Conta notas de crédito (NC) que referenciam uma fatura, para efeitos de
 * validação de anulação de documentos pagos.
 */
export async function countCreditNotesForInvoice(invoiceId: number, fullNumber: string | null): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const conditions = [eq(invoices.documentType, "NC")];
  if (fullNumber) conditions.push(eq(invoices.relatedInvoiceNumber, fullNumber));
  conditions.push(eq(invoices.relatedInvoiceId, invoiceId));
  const [res] = await db
    .select({ count: sql<number>`count(*)` })
    .from(invoices)
    .where(or(...conditions));
  return Number(res?.count ?? 0);
}

// ─── Inventário ───────────────────────────────────────────────────────────────
export async function listInventoryMovements(productId?: number, page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const offset = (page - 1) * limit;
  const where = productId ? eq(inventoryMovements.productId, productId) : undefined;
  const [data, countResult] = await Promise.all([
    db.select().from(inventoryMovements).where(where).orderBy(desc(inventoryMovements.movementDate)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(inventoryMovements).where(where),
  ]);
  return { data, total: Number(countResult[0]?.count ?? 0) };
}

export async function createInventoryMovement(data: typeof inventoryMovements.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(inventoryMovements).values(data);
  const qty = Number(data.quantity);
  const delta = data.type === "entrada" ? qty : data.type === "saida" ? -qty : qty;
  await db.update(products).set({
    currentStock: sql`${products.currentStock} + ${delta}`,
    updatedAt: new Date(),
  }).where(eq(products.id, data.productId));
  return result;
}

// ─── Relatórios / Dashboard ───────────────────────────────────────────────────
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [totalInvoiced, pendingInvoices, monthlyInvoiced, totalClients, totalProducts, lowStockProducts] = await Promise.all([
    db.select({ total: sql<string>`COALESCE(SUM(totalAmount),0)` }).from(invoices).where(sql`${invoices.status} NOT IN ('rascunho','anulada')`),
    db.select({ total: sql<string>`COALESCE(SUM(totalAmount),0)`, count: sql<number>`count(*)` }).from(invoices).where(or(eq(invoices.status, "emitida"), eq(invoices.status, "parcialmente_paga"))),
    db.select({ total: sql<string>`COALESCE(SUM(totalAmount),0)` }).from(invoices).where(and(gte(invoices.issueDate, startOfMonth), sql`${invoices.status} NOT IN ('rascunho','anulada')`)),
    db.select({ count: sql<number>`count(*)` }).from(clients).where(eq(clients.isActive, true)),
    db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.isActive, true)),
    db.select({ count: sql<number>`count(*)` }).from(products).where(and(eq(products.stockControl, true), sql`${products.currentStock} <= ${products.minStock}`)),
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

export async function getMonthlySales(year: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.execute(sql`
    SELECT MONTH(issueDate) as month, 
           COALESCE(SUM(totalAmount),0) as total,
           COALESCE(SUM(vatAmount),0) as vat,
           count(*) as count
    FROM invoices
    WHERE YEAR(issueDate) = ${year}
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

export async function getTopClients(limit = 5) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.execute(sql`
    SELECT clientId, clientName, 
           COALESCE(SUM(totalAmount),0) as total,
           count(*) as count
    FROM invoices
    WHERE status NOT IN ('rascunho','anulada')
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

export async function getVatReport(dateFrom: Date, dateTo: Date) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.execute(sql`
    SELECT ii.vatRate,
           COALESCE(SUM(ii.subtotal),0) as taxableBase,
           COALESCE(SUM(ii.vatAmount),0) as vatTotal
    FROM invoice_items ii
    JOIN invoices i ON i.id = ii.invoiceId
    WHERE i.issueDate BETWEEN ${dateFrom} AND ${dateTo}
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
