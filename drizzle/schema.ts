import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  datetime,
  varchar,
  decimal,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

// ─── Utilizadores ────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Empresa Emitente ─────────────────────────────────────────────────────────
export const company = mysqlTable("company", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nif: varchar("nif", { length: 20 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  province: varchar("province", { length: 100 }),
  country: varchar("country", { length: 100 }).default("Angola"),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 255 }),
  logoUrl: text("logoUrl"),
  taxRegime: mysqlEnum("taxRegime", ["geral", "simplificado", "exclusao"]).default("geral"),
  vatNumber: varchar("vatNumber", { length: 20 }),
  bankName: varchar("bankName", { length: 100 }),
  bankIban: varchar("bankIban", { length: 50 }),
  bankSwift: varchar("bankSwift", { length: 20 }),
  digitalSignatureKey: text("digitalSignatureKey"),
  agtPortalUser: varchar("agtPortalUser", { length: 100 }),
  agtPortalPassword: text("agtPortalPassword"),
  softwareValidationNumber: varchar("softwareValidationNumber", { length: 50 }).default("000/AGT/202X"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof company.$inferSelect;

// ─── Séries de Facturação ─────────────────────────────────────────────────────
export const invoiceSeries = mysqlTable("invoice_series", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  documentType: mysqlEnum("documentType", [
    "FT", // Factura
    "FR", // Factura-Recibo
    "FS", // Factura Simplificada
    "FA", // Factura de Adiantamento
    "NC", // Nota de Crédito
    "ND", // Nota de Débito
    "RC", // Recibo
    "RG", // Recibo Global
  ]).notNull(),
  validationCode: varchar("validationCode", { length: 50 }),
  lastNumber: int("lastNumber").default(0).notNull(),
  year: int("year").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InvoiceSeries = typeof invoiceSeries.$inferSelect;

// ─── Clientes ─────────────────────────────────────────────────────────────────
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }),
  name: varchar("name", { length: 255 }).notNull(),
  nif: varchar("nif", { length: 20 }),
  type: mysqlEnum("type", ["singular", "colectivo", "estrangeiro"]).default("colectivo"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  province: varchar("province", { length: 100 }),
  country: varchar("country", { length: 100 }).default("Angola"),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 320 }),
  contactPerson: varchar("contactPerson", { length: 255 }),
  paymentTerms: int("paymentTerms").default(30),
  creditLimit: decimal("creditLimit", { precision: 15, scale: 2 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;

// ─── Fornecedores ─────────────────────────────────────────────────────────────
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }),
  name: varchar("name", { length: 255 }).notNull(),
  nif: varchar("nif", { length: 20 }),
  type: mysqlEnum("type", ["singular", "colectivo", "estrangeiro"]).default("colectivo"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  province: varchar("province", { length: 100 }),
  country: varchar("country", { length: 100 }).default("Angola"),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 320 }),
  contactPerson: varchar("contactPerson", { length: 255 }),
  paymentTerms: int("paymentTerms").default(30),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;

// ─── Categorias de Produtos ───────────────────────────────────────────────────
export const productCategories = mysqlTable("product_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductCategory = typeof productCategories.$inferSelect;

// ─── Produtos / Serviços ──────────────────────────────────────────────────────
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: int("categoryId"),
  type: mysqlEnum("type", ["produto", "servico"]).default("produto").notNull(),
  unit: varchar("unit", { length: 20 }).default("UN"),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  costPrice: decimal("costPrice", { precision: 15, scale: 2 }),
  vatRate: decimal("vatRate", { precision: 5, scale: 2 }).default("14.00").notNull(),
  vatExemptReason: varchar("vatExemptReason", { length: 255 }),
  isVatExempt: boolean("isVatExempt").default(false).notNull(),
  stockControl: boolean("stockControl").default(true).notNull(),
  minStock: decimal("minStock", { precision: 10, scale: 2 }).default("0"),
  currentStock: decimal("currentStock", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;

// ─── Documentos Fiscais ───────────────────────────────────────────────────────
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  seriesId: int("seriesId").notNull(),
  documentType: mysqlEnum("documentType", [
    "FT", "FR", "FS", "FA", "NC", "ND", "RC", "RG",
  ]).notNull(),
  number: int("number").notNull(),
  fullNumber: varchar("fullNumber", { length: 50 }).notNull().unique(),
  atcud: varchar("atcud", { length: 100 }),
  hash: varchar("hash", { length: 512 }),
  hashControl: varchar("hashControl", { length: 4 }),

  // Entidade
  clientId: int("clientId"),
  clientName: varchar("clientName", { length: 255 }),
  clientNif: varchar("clientNif", { length: 20 }),
  clientAddress: text("clientAddress"),

  // Datas
  issueDate: datetime("issueDate").notNull(),
  dueDate: datetime("dueDate"),
  operationDate: datetime("operationDate"),

  // Valores
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  vatAmount: decimal("vatAmount", { precision: 15, scale: 2 }).notNull(),
  discountAmount: decimal("discountAmount", { precision: 15, scale: 2 }).default("0"),
  withholdingTaxAmount: decimal("withholdingTaxAmount", { precision: 15, scale: 2 }).default("0"),
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("AOA"),
  exchangeRate: decimal("exchangeRate", { precision: 10, scale: 4 }).default("1.0000"),

  // Entrega
  deliveryLocation: text("deliveryLocation"),
  deliveryDate: datetime("deliveryDate"),

  // Estado
  status: mysqlEnum("status", [
    "rascunho",
    "emitida",
    "paga",
    "parcialmente_paga",
    "anulada",
    "vencida",
  ]).default("rascunho").notNull(),

  // Referências
  relatedInvoiceId: int("relatedInvoiceId"),
  relatedInvoiceNumber: varchar("relatedInvoiceNumber", { length: 50 }),
  paymentMethod: mysqlEnum("paymentMethod", [
    "numerario", "transferencia", "cheque", "cartao", "outro",
  ]),
  paymentDate: datetime("paymentDate"),
  paidAmount: decimal("paidAmount", { precision: 15, scale: 2 }).default("0"),

  notes: text("notes"),
  internalNotes: text("internalNotes"),
  pdfUrl: text("pdfUrl"),
  xmlUrl: text("xmlUrl"),
  agtSubmitted: boolean("agtSubmitted").default(false),
  agtSubmissionDate: datetime("agtSubmissionDate"),
  agtResponse: text("agtResponse"),

  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;

// ─── Linhas de Documentos Fiscais ─────────────────────────────────────────────
export const invoiceItems = mysqlTable("invoice_items", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  lineNumber: int("lineNumber").notNull(),
  productId: int("productId"),
  productCode: varchar("productCode", { length: 50 }),
  description: varchar("description", { length: 500 }).notNull(),
  unit: varchar("unit", { length: 20 }).default("UN"),
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 4 }).notNull(),
  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }).default("0"),
  discountAmount: decimal("discountAmount", { precision: 15, scale: 2 }).default("0"),
  vatRate: decimal("vatRate", { precision: 5, scale: 2 }).notNull(),
  vatExemptReason: varchar("vatExemptReason", { length: 255 }),
  vatAmount: decimal("vatAmount", { precision: 15, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  total: decimal("total", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvoiceItem = typeof invoiceItems.$inferSelect;

// ─── Inventário / Movimentos de Stock ─────────────────────────────────────────
export const inventoryMovements = mysqlTable("inventory_movements", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  type: mysqlEnum("type", ["entrada", "saida", "ajuste", "transferencia"]).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(),
  unitCost: decimal("unitCost", { precision: 15, scale: 4 }),
  totalCost: decimal("totalCost", { precision: 15, scale: 2 }),
  reference: varchar("reference", { length: 100 }),
  invoiceId: int("invoiceId"),
  supplierId: int("supplierId"),
  notes: text("notes"),
  movementDate: timestamp("movementDate").defaultNow().notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
