import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { inventoryMovements, products } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function listInventoryMovements(tenantId: number, productId?: number, page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const offset = (page - 1) * limit;
  const conditions = [eq(inventoryMovements.tenantId, tenantId)];
  if (productId) conditions.push(eq(inventoryMovements.productId, productId));
  const where = and(...conditions)!;
  const [data, countResult] = await Promise.all([
    db.select().from(inventoryMovements).where(where).orderBy(desc(inventoryMovements.movementDate)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(inventoryMovements).where(where),
  ]);
  return { data, total: Number(countResult[0]?.count ?? 0) };
}

export async function createInventoryMovement(tenantId: number, data: Omit<typeof inventoryMovements.$inferInsert, "tenantId">) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(inventoryMovements).values({ ...data, tenantId });
  const qty = Number(data.quantity);
  const delta = data.type === "entrada" ? qty : data.type === "saida" ? -qty : qty;
  await db.update(products).set({
    currentStock: sql`${products.currentStock} + ${delta}`,
    updatedAt: new Date(),
  }).where(and(eq(products.id, data.productId), eq(products.tenantId, tenantId)));
  return result;
}

/**
 * Aplica automaticamente os movimentos de stock decorrentes de um documento
 * fiscal. Em documentos de saída baixa o stock; numa Nota de Crédito repõe.
 */
export async function applyStockMovementsForInvoice(options: {
  tenantId: number;
  invoiceId: number;
  items: Array<{ productId?: number | null; quantity: string }>;
  documentType: string;
  reference: string;
  createdBy?: number | null;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const { tenantId, invoiceId, items, documentType, reference, createdBy } = options;

  const productIds = items.filter(i => i.productId).map(i => i.productId!);
  if (productIds.length === 0) return false;

  const productRows = await db.select().from(products).where(and(eq(products.tenantId, tenantId), inArray(products.id, productIds)));
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
      tenantId,
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
      .where(and(eq(products.id, product.id), eq(products.tenantId, tenantId)));
  }

  if (movements.length > 0) {
    await db.insert(inventoryMovements).values(movements as any);
  }
  return true;
}
