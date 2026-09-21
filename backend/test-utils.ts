import { vi } from "vitest";
import type { TrpcContext } from "./_core/context";

type MockUser = NonNullable<TrpcContext["user"]>;

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 1,
    openId: "test-user-001",
    email: "test@example.com",
    name: "Test User",
    passwordHash: null,
    loginMethod: "local",
    role: "admin",
    tenantId: 1,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    lastSignedIn: new Date("2026-01-01"),
    ...overrides,
  };
}

export function createMockContext(userOverrides: Partial<MockUser> = {}): {
  ctx: TrpcContext;
  cookies: { set: Array<{ name: string; value: string; options: any }>; cleared: Array<{ name: string; options: any }> };
} {
  const cookies = {
    set: [] as Array<{ name: string; value: string; options: any }>,
    cleared: [] as Array<{ name: string; options: any }>,
  };

  const ctx: TrpcContext = {
    user: createMockUser(userOverrides),
    req: {
      protocol: "https",
      headers: {},
      get: (name: string) => (name === "host" ? "localhost:3000" : undefined),
    } as any,
    res: {
      cookie: (name: string, value: string, options: any) => cookies.set.push({ name, value, options }),
      clearCookie: (name: string, options: any) => cookies.cleared.push({ name, options }),
    } as any,
  };

  return { ctx, cookies };
}

/**
 * Mock the entire db module. Call this BEFORE importing the router.
 * Returns the mocked functions for assertions.
 *
 * Usage in test:
 *   const dbMock = mockDbModule();
 *   // ... tests ...
 */
export function mockDbModule() {
  const mock = {
    // Tenants
    createTenant: vi.fn(),
    getTenant: vi.fn(),
    updateTenant: vi.fn(),
    countMonthlyDocuments: vi.fn().mockResolvedValue(0),

    // Users
    upsertUser: vi.fn(),
    getUserByOpenId: vi.fn(),
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    listUsers: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    updateUserRole: vi.fn(),
    getUserCount: vi.fn().mockResolvedValue(0),
    getUserById: vi.fn(),
    updateUser: vi.fn(),
    disableUser: vi.fn(),
    resetUserPassword: vi.fn(),

    // Company
    getCompany: vi.fn(),
    upsertCompany: vi.fn(),

    // Clients
    listClients: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    getClientById: vi.fn(),
    createClient: vi.fn(),
    updateClient: vi.fn(),
    deleteClient: vi.fn(),
    getClientByPortalToken: vi.fn(),
    regenerateClientPortalToken: vi.fn(),

    // Suppliers
    listSuppliers: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    getSupplierById: vi.fn(),
    createSupplier: vi.fn(),
    updateSupplier: vi.fn(),
    deleteSupplier: vi.fn(),

    // Products
    listProductCategories: vi.fn().mockResolvedValue([]),
    createProductCategory: vi.fn(),
    getNextProductCode: vi.fn().mockResolvedValue("PRD0001"),
    listProducts: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    getProductById: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),

    // Series
    listInvoiceSeries: vi.fn().mockResolvedValue([]),
    getSeriesById: vi.fn(),
    createInvoiceSeries: vi.fn(),
    updateInvoiceSeries: vi.fn(),
    incrementSeriesNumber: vi.fn().mockResolvedValue(1),
    getPreviousInvoiceHash: vi.fn().mockResolvedValue(null),

    // Invoices
    listInvoices: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    getInvoiceById: vi.fn(),
    getInvoiceItems: vi.fn().mockResolvedValue([]),
    createInvoice: vi.fn(),
    updateInvoiceStatus: vi.fn(),
    updateInvoicePdfUrl: vi.fn(),
    listInvoicesByClientToken: vi.fn().mockResolvedValue([]),
    countCreditNotesForInvoice: vi.fn().mockResolvedValue(0),
    convertQuotation: vi.fn(),

    // Payments
    listPayments: vi.fn().mockResolvedValue([]),
    createPayment: vi.fn(),
    getInvoicePaidAmount: vi.fn().mockResolvedValue(0),
    refreshInvoicePaymentStatus: vi.fn(),

    // Recurring
    listRecurringRules: vi.fn().mockResolvedValue([]),
    createRecurringRule: vi.fn(),
    updateRecurringRule: vi.fn(),
    deleteRecurringRule: vi.fn(),
    getRecurringRulesDue: vi.fn().mockResolvedValue([]),
    computeNextRunDate: vi.fn(),

    // Audit
    addAuditLog: vi.fn(),
    listAuditLogs: vi.fn().mockResolvedValue({ data: [], total: 0 }),

    // AGT
    logAgtSubmission: vi.fn(),
    listAgtSubmissions: vi.fn().mockResolvedValue({ data: [], total: 0 }),

    // Inventory
    listInventoryMovements: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    createInventoryMovement: vi.fn(),
    applyStockMovementsForInvoice: vi.fn().mockResolvedValue(true),

    // Reports
    getDashboardStats: vi.fn(),
    getMonthlySales: vi.fn().mockResolvedValue([]),
    getTopClients: vi.fn().mockResolvedValue([]),
    getVatReport: vi.fn().mockResolvedValue([]),
    getIncomeReport: vi.fn().mockResolvedValue([]),
    getReceivables: vi.fn().mockResolvedValue([]),
    getInventoryForSAFT: vi.fn().mockResolvedValue([]),
  };

  return mock;
}
