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

describe("clients router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists clients with pagination", async () => {
    dbMock.listClients.mockResolvedValue({ data: [{ id: 1, name: "A" }], total: 1 });
    const { ctx } = createMockCtx();
    const result = await appRouter.createCaller(ctx).clients.list({});
    expect(result.data).toHaveLength(1);
    expect(dbMock.listClients).toHaveBeenCalledWith(1, undefined, 1, 20);
  });

  it("gets a client by id", async () => {
    dbMock.getClientById.mockResolvedValue({ id: 1, name: "A" });
    const { ctx } = createMockCtx();
    const result = await appRouter.createCaller(ctx).clients.get({ id: 1 });
    expect(result.name).toBe("A");
  });

  it("throws if client not found", async () => {
    dbMock.getClientById.mockResolvedValue(null);
    const { ctx } = createMockCtx();
    await expect(appRouter.createCaller(ctx).clients.get({ id: 999 })).rejects.toThrow();
  });

  it("creates a client and logs audit", async () => {
    dbMock.createClient.mockResolvedValue({ id: 10, name: "New" });
    const { ctx } = createMockCtx();
    const result = await appRouter.createCaller(ctx).clients.create({ name: "New" });
    expect(result.name).toBe("New");
    expect(dbMock.addAuditLog).toHaveBeenCalledWith(1, expect.objectContaining({ action: "criar", entityType: "client" }));
  });

  it("updates a client and logs audit", async () => {
    dbMock.updateClient.mockResolvedValue({ id: 1, name: "Upd" });
    const { ctx } = createMockCtx();
    const result = await appRouter.createCaller(ctx).clients.update({ id: 1, name: "Upd" });
    expect(result.name).toBe("Upd");
    expect(dbMock.addAuditLog).toHaveBeenCalledWith(1, expect.objectContaining({ action: "actualizar" }));
  });

  it("deletes a client and logs audit", async () => {
    dbMock.deleteClient.mockResolvedValue(true);
    const { ctx } = createMockCtx();
    const result = await appRouter.createCaller(ctx).clients.delete({ id: 1 });
    expect(result).toBe(true);
    expect(dbMock.addAuditLog).toHaveBeenCalledWith(1, expect.objectContaining({ action: "eliminar" }));
  });
});

describe("products router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists products", async () => {
    dbMock.listProducts.mockResolvedValue({ data: [{ id: 1, name: "P" }], total: 1 });
    const { ctx } = createMockCtx();
    const result = await appRouter.createCaller(ctx).products.list({});
    expect(result.data).toHaveLength(1);
  });

  it("auto-generates code when not provided", async () => {
    dbMock.getNextProductCode.mockResolvedValue("PRD0005");
    dbMock.createProduct.mockResolvedValue({ id: 1, code: "PRD0005", name: "W" });
    const { ctx } = createMockCtx();
    await appRouter.createCaller(ctx).products.create({ name: "W", type: "produto", price: "1000" });
    expect(dbMock.getNextProductCode).toHaveBeenCalledWith(1, "produto");
  });

  it("uses provided code when given", async () => {
    dbMock.createProduct.mockResolvedValue({ id: 1, code: "C1" });
    const { ctx } = createMockCtx();
    await appRouter.createCaller(ctx).products.create({ code: "C1", name: "C", type: "servico", price: "5000" });
    expect(dbMock.getNextProductCode).not.toHaveBeenCalled();
  });
});

describe("series router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("auto-creates default series if none exist", async () => {
    dbMock.listInvoiceSeries.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 1 }]);
    dbMock.createInvoiceSeries.mockResolvedValue({ id: 1, code: "2026" });
    const { ctx } = createMockCtx();
    await appRouter.createCaller(ctx).series.list({ documentType: "FT" });
    expect(dbMock.createInvoiceSeries).toHaveBeenCalledOnce();
  });

  it("returns existing series without creating", async () => {
    dbMock.listInvoiceSeries.mockResolvedValue([{ id: 1, code: "2026" }]);
    const { ctx } = createMockCtx();
    await appRouter.createCaller(ctx).series.list({ documentType: "FT" });
    expect(dbMock.createInvoiceSeries).not.toHaveBeenCalled();
  });
});
