import { vi, describe, expect, it, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

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
  invoiceEmailHtml: vi.fn().mockReturnValue("<html></html>"),
  reminderEmailHtml: vi.fn().mockReturnValue("<html></html>"),
}));
vi.mock("./agt/client", () => ({
  agtRegisterSeries: vi.fn().mockResolvedValue({ ok: true, status: "sucesso", message: "ok" }),
  agtSubmitInvoice: vi.fn().mockResolvedValue({ ok: true, status: "sucesso", message: "ok" }),
  agtQueryInvoice: vi.fn().mockResolvedValue({ ok: true, status: "sucesso", message: "ok" }),
  agtSubmitSAFT: vi.fn().mockResolvedValue({ ok: true, status: "sucesso", message: "ok" }),
}));
vi.mock("./_core/sdk", () => ({
  sdk: { createSessionToken: vi.fn().mockResolvedValue("mock-token-123") },
}));

import { appRouter } from "./routers";

function createMockCtx(overrides: Record<string, any> = {}) {
  const cookies = { set: [] as any[], cleared: [] as any[] };
  const ctx = {
    user: {
      id: 1, openId: "test-user", email: "test@example.com", name: "Test User",
      loginMethod: "local", role: "admin", tenantId: 1,
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: {}, get: () => "localhost:3000" } as any,
    res: {
      cookie: (n: string, v: string, o: any) => cookies.set.push({ name: n, value: v, options: o }),
      clearCookie: (n: string, o: any) => cookies.cleared.push({ name: n, options: o }),
    } as any,
  };
  return { ctx, cookies };
}

describe("auth router", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("auth.me", () => {
    it("returns the current user when authenticated", async () => {
      const { ctx } = createMockCtx({ name: "Test" });
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.me();
      expect(result).toMatchObject({ name: "Test" });
    });

    it("returns null when not authenticated", async () => {
      const { ctx } = createMockCtx();
      ctx.user = null;
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.me();
      expect(result).toBeNull();
    });
  });

  describe("auth.login", () => {
    it("logs in with valid credentials", async () => {
      const hashed = await bcrypt.hash("Password123", 12);
      dbMock.getUserByEmail.mockResolvedValue({ id: 1, email: "test@example.com", passwordHash: hashed, name: "T", role: "admin", tenantId: 1 });
      dbMock.getTenant.mockResolvedValue({ id: 1, plan: "gratis", status: "ativo" });
      const { ctx, cookies } = createMockCtx();
      const result = await appRouter.createCaller(ctx).auth.login({ email: "test@example.com", password: "Password123" });
      expect(result.success).toBe(true);
      expect(cookies.set.length).toBe(1);
      expect(cookies.set[0].name).toBe("app_session_id");
    });

    it("throws on invalid email", async () => {
      dbMock.getUserByEmail.mockResolvedValue(undefined);
      const { ctx } = createMockCtx();
      await expect(appRouter.createCaller(ctx).auth.login({ email: "x@x.com", password: "Password123" }))
        .rejects.toThrow("Credenciais inválidas");
    });

    it("throws on invalid password", async () => {
      const hashed = await bcrypt.hash("Correct1password", 12);
      dbMock.getUserByEmail.mockResolvedValue({ id: 1, email: "t@t.com", passwordHash: hashed, role: "user", tenantId: 1 });
      const { ctx } = createMockCtx();
      await expect(appRouter.createCaller(ctx).auth.login({ email: "t@t.com", password: "Wrongpass1" }))
        .rejects.toThrow("Credenciais inválidas");
    });
  });

  describe("auth.register", () => {
    it("registers a new user and creates tenant", async () => {
      dbMock.getUserByEmail.mockResolvedValue(undefined);
      dbMock.createTenant.mockResolvedValue({ id: 1 });
      dbMock.createUser.mockImplementation(async (d: any) => ({ id: 1, ...d }));
      dbMock.upsertCompany.mockResolvedValue({ id: 1 });
      const { ctx, cookies } = createMockCtx();
      const result = await appRouter.createCaller(ctx).auth.register({
        name: "New Co", email: "new@co.com", password: "Password123", nif: "123", phone: "900", terms: true,
      });
      expect(result.success).toBe(true);
      expect(dbMock.createTenant).toHaveBeenCalledOnce();
      expect(cookies.set.length).toBe(1);
    });

    it("throws on duplicate email", async () => {
      dbMock.getUserByEmail.mockResolvedValue({ id: 1 });
      const { ctx } = createMockCtx();
      await expect(appRouter.createCaller(ctx).auth.register({
        name: "Dup", email: "dup@dup.com", password: "Password123", nif: "123", phone: "900", terms: true,
      })).rejects.toThrow("Email já registado");
    });
  });

  describe("auth.logout", () => {
    it("clears the session cookie", async () => {
      const { ctx, cookies } = createMockCtx();
      const result = await appRouter.createCaller(ctx).auth.logout();
      expect(result.success).toBe(true);
      expect(cookies.cleared.length).toBe(1);
      expect(cookies.cleared[0].name).toBe("app_session_id");
    });
  });
});
