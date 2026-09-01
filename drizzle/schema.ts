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
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ─── Contas / Tenants (SaaS) ───────────────────────────────────────────────
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nif: varchar("nif", { length: 20 }),
  plan: mysqlEnum("plan", ["gratis", "pro", "escritorio"]).default("gratis").notNull(),
  status: mysqlEnum("status", ["trial", "ativo", "suspenso", "cancelado"]).default("trial").notNull(),
  trialEndsAt: datetime("trialEndsAt"),
  nextBillingDate: datetime("nextBillingDate"),
  portalEnabled: boolean("portalEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;

// ─── Utilizadores ────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  tenantId: int("tenantId"),
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

// ─── Empresa Emitente (1 por tenant) ─────────────────────────────────────────
export const company = mysqlTable("company", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
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
  agtEndpoint: varchar("agtEndpoint", { length: 255 }),
  softwareValidationNumber: varchar("softwareValidationNumber", { length: 50 }).default("000/AGT/202X"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof company.$inferSelect;

// ─── Séries de Facturação ─────────────────────────────────────────────────────
export const invoiceSeries = mysqlTable(
  "invoice_series",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenantId").notNull(),
    code: varchar("code", { length: 20 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    documentType: mysqlEnum("documentType", [
      "FT", "FR", "FS", "FA", "NC", "ND", "RC", "RG", "OR",
    ]).notNull(),
    validationCode: varchar("validationCode", { length: 50 }),
    lastNumber: int("lastNumber").default(0).notNull(),
    year: int("year").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    agtRegistered: boolean("agtRegistered").default(false).notNull(),
    agtRegisteredAt: datetime("agtRegisteredAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("uq_series_tenant_code").on(table.tenantId, table.code)],
);

export type InvoiceSeries = typeof invoiceSeries.$inferSelect;

// ─── Clientes ─────────────────────────────────────────────────────────────────
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
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
  portalToken: varchar("portalToken", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;

// ─── Fornecedores ─────────────────────────────────────────────────────────────
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
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
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductCategory = typeof productCategories.$inferSelect;

// ─── Produtos / Serviços ──────────────────────────────────────────────────────
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  code: varchar("code", { length: 50 }).notNull(),
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
export const invoices = mysqlTable(
  "invoices",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenantId").notNull(),
    seriesId: int("seriesId").notNull(),
    documentType: mysqlEnum("documentType", [
      "FT", "FR", "FS", "FA", "NC", "ND", "RC", "RG", "OR",
    ]).notNull(),
    number: int("number").notNull(),
    fullNumber: varchar("fullNumber", { length: 50 }).notNull(),
    atcud: varchar("atcud", { length: 100 }),
    hash: varchar("hash", { length: 512 }),
    hashControl: varchar("hashControl", { length: 4 }),

    // Entidade
    clientId: int("clientId"),
    clientName: varchar("clientName", { length: 255 }),
    clientNif: varchar("clientNif", { length: 20 }),
    clientAddress: text("clientAddress"),
    clientEmail: varchar("clientEmail", { length: 320 }),
    clientRef: varchar("clientRef", { length: 100 }),

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
      "convertida",
      "expirada",
    ]).default("rascunho").notNull(),

    // Referências
    relatedInvoiceId: int("relatedInvoiceId"),
    relatedInvoiceNumber: varchar("relatedInvoiceNumber", { length: 50 }),
    convertedInvoiceId: int("convertedInvoiceId"),
    recurringRuleId: int("recurringRuleId"),
    paymentMethod: mysqlEnum("paymentMethod", [
      "numerario", "transferencia", "cheque", "cartao", "outro",
    ]),
    paymentDate: datetime("paymentDate"),
    paidAmount: decimal("paidAmount", { precision: 15, scale: 2 }).default("0"),
    portalToken: varchar("portalToken", { length: 64 }),
    emailedAt: datetime("emailedAt"),

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
  },
  (table) => [uniqueIndex("uq_invoice_tenant_fullnumber").on(table.tenantId, table.fullNumber)],
);

export type Invoice = typeof invoices.$inferSelect;

// ─── Linhas de Documentos Fiscais ─────────────────────────────────────────────
export const invoiceItems = mysqlTable("invoice_items", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
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
  tenantId: int("tenantId").notNull(),
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

// ─── Pagamentos ───────────────────────────────────────────────────────────────
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  invoiceId: int("invoiceId").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  paymentDate: datetime("paymentDate").notNull(),
  method: mysqlEnum("method", ["numerario", "transferencia", "cheque", "cartao", "outro"]).default("outro"),
  reference: varchar("reference", { length: 100 }),
  notes: text("notes"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;

// ─── Regras de Facturação Recorrente ──────────────────────────────────────────
export const recurringRules = mysqlTable("recurring_rules", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  clientId: int("clientId"),
  clientName: varchar("clientName", { length: 255 }),
  clientNif: varchar("clientNif", { length: 20 }),
  clientEmail: varchar("clientEmail", { length: 320 }),
  documentType: mysqlEnum("documentType", ["FT", "FR"]).default("FT").notNull(),
  frequency: mysqlEnum("frequency", ["semanal", "mensal", "bimestral", "trimestral", "semestral", "anual"]).default("mensal").notNull(),
  dayOfMonth: int("dayOfMonth").default(1).notNull(),
  startDate: datetime("startDate"),
  nextRunDate: datetime("nextRunDate").notNull(),
  items: json("items").notNull(),
  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }).default("0"),
  withholdingTaxPercent: decimal("withholdingTaxPercent", { precision: 5, scale: 2 }).default("0"),
  isActive: boolean("isActive").default(true).notNull(),
  lastRunDate: datetime("lastRunDate"),
  lastInvoiceId: int("lastInvoiceId"),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RecurringRule = typeof recurringRules.$inferSelect;

// ─── Trilha de Auditoria ──────────────────────────────────────────────────────
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  userId: int("userId"),
  userName: varchar("userName", { length: 255 }),
  action: varchar("action", { length: 50 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId"),
  entityLabel: varchar("entityLabel", { length: 255 }),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;

// ─── Submissões AGT ───────────────────────────────────────────────────────────
export const agtSubmissions = mysqlTable("agt_submissions", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  invoiceId: int("invoiceId"),
  action: mysqlEnum("action", [
    "registar_serie", "submeter_documento", "consultar_documento", "submeter_saft",
  ]).notNull(),
  payload: text("payload"),
  response: text("response"),
  status: mysqlEnum("status", ["sucesso", "erro", "pendente"]).default("pendente"),
  message: varchar("message", { length: 500 }),
  submittedAt: datetime("submittedAt").notNull(),
});

export type AgtSubmission = typeof agtSubmissions.$inferSelect;
