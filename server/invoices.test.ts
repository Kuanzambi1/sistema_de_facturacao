import { vi, describe, expect, it, beforeEach } from "vitest";

const dbMock = vi.hoisted(() => ({
  createTenant: vi.fn(), getTenant: vi.fn(), updateTenant: vi.fn(),
  countMonthlyDocuments: vi.fn().mockResolvedValue(0),
  upsertUser: vi.fn(), getUserByOpenId: vi.fn(), getUserByEmail: vi.fn(),
  createUser: vi.fn(), listUsers: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  updateUserRole: vi.fn(), getUserCount: vi.fn().mockResolvedValue(0),
  getUserById: vi.fn(), updateUser: vi.fn(), disableUser: vi.fn(), resetUserPassword: vi.fn(),
  getCompany: vi.fn(), upsertCompany: vi.fn(),
  listClients: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  getClientById: vi.fn(), createClient: vi.fn(), updateClient: vi.fn(), deleteClient: vi.fn(),
  getClientByPortalToken: vi.fn(), regenerateClientPortalToken: vi.fn(),
  listSuppliers: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  getSupplierById: vi.fn(), createSupplier: vi.fn(), updateSupplier: vi.fn(), deleteSupplier: vi.fn(),
  listProducts: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  getProductById: vi.fn(), createProduct: vi.fn(), updateProduct: vi.fn(), deleteProduct: vi.fn(),
  getNextProductCode: vi.fn().mockResolvedValue("PRD0001"),
  listProductCategories: vi.fn().mockResolvedValue([]), createProductCategory: vi.fn(),
  listInvoiceSeries: vi.fn().mockResolvedValue([]), getSeriesById: vi.fn(),
  createInvoiceSeries: vi.fn(), updateInvoiceSeries: vi.fn(),
  incrementSeriesNumber: vi.fn().mockResolvedValue(1), getPreviousInvoiceHash: vi.fn().mockResolvedValue(null),
  listInvoices: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  getInvoiceById: vi.fn(), getInvoiceItems: vi.fn().mockResolvedValue([]),
  createInvoice: vi.fn(), updateInvoiceStatus: vi.fn(), updateInvoicePdfUrl: vi.fn(),
  listInvoicesByClientToken: vi.fn().mockResolvedValue([]),
  countCreditNotesForInvoice: vi.fn().mockResolvedValue(0), convertQuotation: vi.fn(),
  listPayments: vi.fn().mockResolvedValue([]), createPayment: vi.fn(),
  getInvoicePaidAmount: vi.fn().mockResolvedValue(0), refreshInvoicePaymentStatus: vi.fn(),
  listRecurringRules: vi.fn().mockResolvedValue([]), createRecurringRule: vi.fn(),
  updateRecurringRule: vi.fn(), deleteRecurringRule: vi.fn(),
  getRecurringRulesDue: vi.fn().mockResolvedValue([]), computeNextRunDate: vi.fn(),
  addAuditLog: vi.fn(), listAuditLogs: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  logAgtSubmission: vi.fn(), listAgtSubmissions: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  listInventoryMovements: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  createInventoryMovement: vi.fn(), applyStockMovementsForInvoice: vi.fn().mockResolvedValue(true),
  getDashboardStats: vi.fn(), getMonthlySales: vi.fn().mockResolvedValue([]),
  getTopClients: vi.fn().mockResolvedValue([]), getVatReport: vi.fn().mockResolvedValue([]),
  getIncomeReport: vi.fn().mockResolvedValue([]), getReceivables: vi.fn().mockResolvedValue([]),
  getInventoryForSAFT: vi.fn().mockResolvedValue([]),
}));

vi.mock("./db", () => dbMock);
vi.mock("./_core/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
  invoiceEmailHtml: vi.fn().mockReturnValue(""),
  reminderEmailHtml: vi.fn().mockReturnValue(""),
}));
vi.mock("./agt/client", () => ({
  agtRegisterSeries: vi.fn().mockResolvedValue({ ok: true, status: "sucesso", message: "ok" }),
  agtSubmitInvoice: vi.fn().mockResolvedValue({ ok: true, status: "sucesso", message: "ok" }),
  agtQueryInvoice: vi.fn().mockResolvedValue({ ok: true, status: "sucesso", message: "ok" }),
  agtSubmitSAFT: vi.fn().mockResolvedValue({ ok: true, status: "sucesso", message: "ok" }),
}));

import { appRouter } from "./routers";

function createMockCtx() {
  const cookies = { set: [] as any[], cleared: [] as any[] };
  const ctx = {
    user: {
      id: 1, openId: "test-user", email: "test@example.com", name: "Test User",
      loginMethod: "local", role: "admin", tenantId: 1,
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {}, get: () => "localhost:3000" } as any,
    res: {
      cookie: (n: string, v: string, o: any) => cookies.set.push({ name: n, value: v, options: o }),
      clearCookie: (n: string, o: any) => cookies.cleared.push({ name: n, options: o }),
    } as any,
  };
  return { ctx, cookies };
}

describe("invoices router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists invoices with filters", async () => {
    dbMock.listInvoices.mockResolvedValue({ data: [{ id: 1, fullNumber: "FT2026/1" }], total: 1 });
    const { ctx } = createMockCtx();
    const result = await appRouter.createCaller(ctx).invoices.list({ status: "emitida" });
    expect(result.data).toHaveLength(1);
    expect(dbMock.listInvoices).toHaveBeenCalledWith(1, expect.objectContaining({ status: "emitida" }));
  });

  it("gets invoice with items and payments", async () => {
    dbMock.getInvoiceById.mockResolvedValue({ id: 1, fullNumber: "FT2026/1", tenantId: 1 });
    dbMock.getInvoiceItems.mockResolvedValue([{ id: 1, description: "Item" }]);
    dbMock.listPayments.mockResolvedValue([{ id: 1, amount: "5000" }]);
    const { ctx } = createMockCtx();
    const result = await appRouter.createCaller(ctx).invoices.get({ id: 1 });
    expect(result.items).toHaveLength(1);
    expect(result.payments).toHaveLength(1);
  });

  it("throws if invoice not found", async () => {
    dbMock.getInvoiceById.mockResolvedValue(null);
    const { ctx } = createMockCtx();
    await expect(appRouter.createCaller(ctx).invoices.get({ id: 999 })).rejects.toThrow();
  });

  it("updates status and logs audit", async () => {
    dbMock.getInvoiceById.mockResolvedValue({ id: 1, status: "emitida", fullNumber: "FT 1", tenantId: 1 });
    dbMock.updateInvoiceStatus.mockResolvedValue({ id: 1, status: "paga" });
    const { ctx } = createMockCtx();
    const result = await appRouter.createCaller(ctx).invoices.updateStatus({ id: 1, status: "paga" });
    expect(result.status).toBe("paga");
    expect(dbMock.addAuditLog).toHaveBeenCalledWith(1, expect.objectContaining({ action: "paga" }));
  });

  it("prevents changing status of annulled document", async () => {
    dbMock.getInvoiceById.mockResolvedValue({ id: 1, status: "anulada", tenantId: 1 });
    const { ctx } = createMockCtx();
    await expect(appRouter.createCaller(ctx).invoices.updateStatus({ id: 1, status: "emitida" }))
      .rejects.toThrow("Um documento anulado não pode mudar de estado.");
  });

  it("prevents annulment of paid doc without credit note", async () => {
    dbMock.getInvoiceById.mockResolvedValue({ id: 1, status: "paga", fullNumber: "FT 1", tenantId: 1 });
    dbMock.countCreditNotesForInvoice.mockResolvedValue(0);
    const { ctx } = createMockCtx();
    await expect(appRouter.createCaller(ctx).invoices.updateStatus({ id: 1, status: "anulada" }))
      .rejects.toThrow("nota de crédito");
  });

  it("creates quotation (OR) without checking limit or stock", async () => {
    dbMock.getSeriesById.mockResolvedValue({ id: 1, code: "2026", year: 2026, validationCode: "DEMO" });
    dbMock.incrementSeriesNumber.mockResolvedValue(1);
    dbMock.getPreviousInvoiceHash.mockResolvedValue(null);
    dbMock.createInvoice.mockResolvedValue({ id: 1, fullNumber: "OR2026/1", documentType: "OR" });
    const { ctx } = createMockCtx();
    const result = await appRouter.createCaller(ctx).invoices.create({
      seriesId: 1, documentType: "OR", issueDate: new Date(),
      items: [{ description: "Consultoria", quantity: 1, unitPrice: 50000, vatRate: 14 }],
    });
    expect(result.documentType).toBe("OR");
    expect(dbMock.countMonthlyDocuments).not.toHaveBeenCalled();
    expect(dbMock.applyStockMovementsForInvoice).not.toHaveBeenCalled();
  });
});

describe("tenant router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns tenant data", async () => {
    dbMock.getTenant.mockResolvedValue({ id: 1, name: "Co", plan: "pro", status: "ativo" });
    const { ctx } = createMockCtx();
    const result = await appRouter.createCaller(ctx).tenant.get();
    expect(result.name).toBe("Co");
  });

  it("returns usage stats", async () => {
    dbMock.getTenant.mockResolvedValue({ id: 1, plan: "pro", status: "ativo" });
    dbMock.countMonthlyDocuments.mockResolvedValue(42);
    const { ctx } = createMockCtx();
    const result = await appRouter.createCaller(ctx).tenant.usage();
    expect(result.plan).toBe("pro");
    expect(result.used).toBe(42);
    expect(result.limit).toBe(5000);
  });
});

describe("reports router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns dashboard stats", async () => {
    dbMock.getDashboardStats.mockResolvedValue({ totalInvoiced: 500000, lowStockCount: 3 });
    const { ctx } = createMockCtx();
    const result = await appRouter.createCaller(ctx).reports.dashboard();
    expect(result.totalInvoiced).toBe(500000);
    expect(result.lowStockCount).toBe(3);
  });
});

describe("audit router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns paginated audit logs", async () => {
    dbMock.listAuditLogs.mockResolvedValue({ data: [{ id: 1, action: "criar" }], total: 1 });
    const { ctx } = createMockCtx();
    const result = await appRouter.createCaller(ctx).audit.list({});
    expect(result.data).toHaveLength(1);
  });
});
