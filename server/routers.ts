import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { COOKIE_NAME, NOT_TENANT_ERR_MSG, PLANS, type PlanId } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { sdk } from "./_core/sdk";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import {
  DOCUMENT_TYPES, VAT_RATES, ANGOLA_PROVINCES, generateATCUD,
  generateValidationCode, generateDocumentHash, getHashControl,
  calculateLineValues, calculateInvoiceTotals, generateSAFTXML,
  generateSAFTInventoryXML, generateVATDeclarationCSV,
} from "./fiscal";
import { agtRegisterSeries, agtSubmitInvoice, agtQueryInvoice, agtSubmitSAFT } from "./agt/client";
import { sendEmail, invoiceEmailHtml, reminderEmailHtml } from "./_core/email";
import { generateInvoicePdf } from "./pdf";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function requireTenant(user: { tenantId?: number | null }): number {
  if (!user?.tenantId) {
    throw new TRPCError({ code: "FORBIDDEN", message: NOT_TENANT_ERR_MSG });
  }
  return user.tenantId;
}

function portalUrlFor(req: any, token: string): string {
  const protocol = req.protocol ?? (req.headers?.["x-forwarded-proto"] ?? "http");
  const host = req.get?.("host") ?? req.headers?.host ?? "localhost:3000";
  return `${protocol}://${host}/p/${token}`;
}

async function sendInvoiceEmail(req: any, invoice: any, tenantId: number) {
  console.log(`[Email] sendInvoiceEmail() — invoiceId=${invoice.id} clientEmail=${invoice.clientEmail ?? "(vazio)"}`);
  if (!invoice?.clientEmail) {
    console.warn(`[Email] Factura ${invoice.fullNumber} sem email do cliente — email ignorado.`);
    return;
  }
  const client = invoice.clientId ? await db.getClientById(tenantId, invoice.clientId) : null;
  const url = client?.portalToken ? portalUrlFor(req, client.portalToken) : undefined;

  // Gerar PDF para anexar
  let attachments: import("./_core/email").EmailAttachment[] = [];
  try {
    const company = await db.getCompany(tenantId);
    const items = await db.getInvoiceItems(tenantId, invoice.id);
    const pdfBuffer = generateInvoicePdf({ ...invoice, items }, company ?? ({} as any));
    const filename = `${(invoice.fullNumber ?? "Factura").replace(/\//g, "_")}.pdf`;
    attachments = [{ filename, content: pdfBuffer, contentType: "application/pdf" }];
    console.log(`[Email] PDF gerado: ${filename} (${pdfBuffer.length} bytes)`);
  } catch (e) {
    console.error(`[Email] Falha ao gerar PDF para factura ${invoice.id}:`, e);
  }

  console.log(`[Email] A enviar factura ${invoice.fullNumber} para ${invoice.clientEmail}...`);
  await sendEmail({
    to: invoice.clientEmail,
    subject: `Factura ${invoice.fullNumber} emitida`,
    html: invoiceEmailHtml(invoice, url),
    attachments,
  });
  await db.updateInvoiceStatus(tenantId, invoice.id, invoice.status, { emailedAt: new Date() })
    .catch((e) => console.warn(`[Email] Failed to update emailedAt for invoice ${invoice.id}:`, e));
}

async function assertCanIssueDocument(tenantId: number) {
  const tenant = await db.getTenant(tenantId);
  const plan = PLANS[(tenant?.plan ?? "gratis") as PlanId];
  const used = await db.countMonthlyDocuments(tenantId);
  if (used >= plan.monthlyDocs) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Limite mensal do plano ${plan.label} atingido (${used}/${plan.monthlyDocs} documentos). Faça upgrade do plano.`,
    });
  }
}

async function runRecurringRule(tenantId: number, ruleId: number, userId: number) {
  const rule = (await db.listRecurringRules(tenantId)).find(r => r.id === ruleId);
  if (!rule) throw new TRPCError({ code: "NOT_FOUND" });
  if (!rule.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: "Regra inactiva." });

  await assertCanIssueDocument(tenantId);

  const year = new Date().getFullYear();
  let seriesList = await db.listInvoiceSeries(tenantId, rule.documentType);
  if (!seriesList || seriesList.length === 0) {
    const code = `${year}`;
    const validationCode = generateValidationCode(code, year, rule.documentType);
    const created = await db.createInvoiceSeries(tenantId, {
      code,
      name: `Série Automática ${year}`,
      documentType: rule.documentType as any,
      year,
      validationCode,
    });
    seriesList = created ? [created] : [];
  }
  const series = seriesList[0];
  if (!series) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Sem série disponível." });

  const number = await db.incrementSeriesNumber(tenantId, series.id);
  const fullNumber = `${series.code}${series.year}/${number}`;
  const atcud = generateATCUD(series.validationCode ?? "DEMO0000", number);

  const rawItems = (rule.items as any[]) ?? [];
  const calculatedItems = rawItems.map((item, idx) => {
    const vals = calculateLineValues({
      quantity: Number(item.quantity ?? 1),
      unitPrice: Number(item.unitPrice ?? 0),
      discountPercent: Number(item.discountPercent ?? 0),
      vatRate: Number(item.vatRate ?? 14),
    });
    return {
      lineNumber: idx + 1,
      productId: item.productId ?? null,
      productCode: item.productCode ?? null,
      description: item.description,
      unit: item.unit ?? "UN",
      quantity: String(item.quantity ?? 1),
      unitPrice: String(item.unitPrice ?? 0),
      discountPercent: String(item.discountPercent ?? 0),
      discountAmount: String(vals.discountAmount),
      vatRate: String(item.vatRate ?? 14),
      vatExemptReason: item.vatExemptReason ?? null,
      vatAmount: String(vals.vatAmount),
      subtotal: String(vals.subtotal),
      total: String(vals.total),
    };
  });

  const totals = calculateInvoiceTotals(calculatedItems.map((i, idx) => ({
    subtotal: Number(i.subtotal),
    vatAmount: Number(i.vatAmount),
    discountAmount: Number(i.discountAmount),
    total: Number(i.total),
    isService: rawItems[idx]?.type === "servico",
  })), Number(rule.withholdingTaxPercent ?? 0));

  const now = new Date();
  const previousHash = (await db.getPreviousInvoiceHash(tenantId, series.id, number)) ?? "";
  const hash = generateDocumentHash({
    issueDate: now.toISOString().substring(0, 10),
    systemDate: now.toISOString().substring(0, 10),
    fullNumber,
    grossTotal: totals.totalAmount,
    previousHash,
  });

  const invoice = await db.createInvoice(tenantId, {
    seriesId: series.id,
    documentType: rule.documentType as any,
    number,
    fullNumber,
    atcud,
    hash,
    hashControl: getHashControl(hash),
    clientId: rule.clientId ?? null,
    clientName: rule.clientName ?? null,
    clientNif: rule.clientNif ?? null,
    clientEmail: rule.clientEmail ?? null,
    issueDate: now,
    dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    subtotal: String(totals.subtotal),
    vatAmount: String(totals.vatAmount),
    discountAmount: String(totals.discountAmount),
    withholdingTaxAmount: String(totals.withholdingTaxAmount),
    totalAmount: String(totals.totalAmount),
    currency: "AOA",
    status: "emitida",
    recurringRuleId: rule.id,
    createdBy: userId,
  } as any, calculatedItems as any);

  if (invoice) {
    await db.applyStockMovementsForInvoice({
      tenantId,
      invoiceId: invoice.id,
      items: calculatedItems,
      documentType: rule.documentType,
      reference: fullNumber,
      createdBy: userId,
    });
    await db.updateRecurringRule(tenantId, rule.id, {
      lastRunDate: now,
      lastInvoiceId: invoice.id,
      lastError: null,
      nextRunDate: db.computeNextRunDate(rule.frequency, now),
    });
    await db.addAuditLog(tenantId, {
      userId,
      action: "emitir",
      entityType: "invoice",
      entityId: invoice.id,
      entityLabel: fullNumber,
      details: JSON.stringify({ recurring: true, ruleId: rule.id }),
    });
  }
  return invoice;
}

// ─── Router Principal ─────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => {
      const user = opts.ctx.user;
      if (!user) return null;
      const { passwordHash, ...safeUser } = user as any;
      return safeUser;
    }),
    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string().min(1, "Password actual é obrigatória"),
        newPassword: z.string().min(8, "Mínimo 8 caracteres").regex(/[A-Z]/, "Deve conter pelo menos uma maiúscula").regex(/[0-9]/, "Deve conter pelo menos um número"),
      }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const user = await db.getUserById(tenantId, ctx.user.id);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Utilizador não encontrado" });
        }
        const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Password actual incorrecta" });
        }
        const passwordHash = await bcrypt.hash(input.newPassword, 12);
        const updated = await db.resetUserPassword(tenantId, user.id, passwordHash);
        if (!updated) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao actualizar password" });
        await db.addAuditLog(tenantId, { userId: ctx.user.id, userName: ctx.user.name ?? null, action: "alterar_password", entityType: "user", entityId: user.id, entityLabel: user.name ?? user.email });
        return { success: true };
      }),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(8).regex(/[A-Z]/, "Deve conter pelo menos uma maiúscula").regex(/[0-9]/, "Deve conter pelo menos um número") }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
        }
        const isValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
        }

        const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name ?? "" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

        return { success: true, user };
      }),
    register: publicProcedure
      .input(z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(8).regex(/[A-Z]/, "Deve conter pelo menos uma maiúscula").regex(/[0-9]/, "Deve conter pelo menos um número"), nif: z.string().min(1), phone: z.string().min(1), terms: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        const existing = await db.getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Email já registado" });
        }
        const passwordHash = await bcrypt.hash(input.password, 12);
        const openId = `local_${nanoid(10)}`;

        const tenant = await db.createTenant({ name: input.name, nif: input.nif });
        if (!tenant) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível criar a conta." });
        const tenantId = tenant.id;

        const user = await db.createUser({
          openId,
          tenantId,
          name: input.name,
          email: input.email,
          passwordHash,
          loginMethod: "local",
          role: "admin",
        });

        await db.upsertCompany(tenantId, {
          name: input.name,
          nif: input.nif,
          phone: input.phone,
          email: input.email,
        });

        const sessionToken = await sdk.createSessionToken(openId, { name: input.name });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

        return { success: true, user };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Constantes Fiscais ─────────────────────────────────────────────────────
  fiscal: router({
    constants: publicProcedure.query(() => ({
      documentTypes: DOCUMENT_TYPES,
      vatRates: VAT_RATES,
      provinces: ANGOLA_PROVINCES,
    })),
  }),

  // ─── Conta / Tenant ─────────────────────────────────────────────────────────
  tenant: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getTenant(requireTenant(ctx.user));
    }),
    usage: protectedProcedure.query(async ({ ctx }) => {
      const tenantId = requireTenant(ctx.user);
      const tenant = await db.getTenant(tenantId);
      const plan = PLANS[(tenant?.plan ?? "gratis") as PlanId];
      const used = await db.countMonthlyDocuments(tenantId);
      return { plan: tenant?.plan ?? "gratis", planLabel: plan.label, used, limit: plan.monthlyDocs, maxUsers: plan.maxUsers, recurring: plan.recurring, portal: plan.portal, status: tenant?.status ?? "trial" };
    }),
    updatePlan: adminProcedure
      .input(z.object({ plan: z.enum(["gratis", "pro", "escritorio"]) }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const tenant = await db.updateTenant(tenantId, { plan: input.plan });
        await db.addAuditLog(tenantId, { userId: ctx.user.id, userName: ctx.user.name ?? null, action: "plano", entityType: "tenant", entityId: tenantId, entityLabel: input.plan });
        return tenant;
      }),
  }),

  // ─── Empresa ────────────────────────────────────────────────────────────────
  company: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getCompany(requireTenant(ctx.user));
    }),
    upsert: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        nif: z.string().min(1),
        address: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
        country: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        website: z.string().optional(),
        taxRegime: z.enum(["geral", "simplificado", "exclusao"]).optional(),
        vatNumber: z.string().optional(),
        bankName: z.string().optional(),
        bankIban: z.string().optional(),
        bankSwift: z.string().optional(),
        agtPortalUser: z.string().optional(),
        agtPortalPassword: z.string().optional(),
        agtEndpoint: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const updated = await db.upsertCompany(tenantId, input);
        await db.addAuditLog(tenantId, { userId: ctx.user.id, userName: ctx.user.name ?? null, action: "actualizar", entityType: "company", entityId: updated?.id ?? null, entityLabel: input.name });
        return updated;
      }),
  }),

  // ─── Clientes ───────────────────────────────────────────────────────────────
  clients: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional(), page: z.number().default(1), limit: z.number().default(20) }))
      .query(async ({ input, ctx }) => db.listClients(requireTenant(ctx.user), input.search, input.page, input.limit)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const client = await db.getClientById(requireTenant(ctx.user), input.id);
        if (!client) throw new TRPCError({ code: "NOT_FOUND" });
        return client;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        nif: z.string().optional(),
        type: z.enum(["singular", "colectivo", "estrangeiro"]).optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
        country: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        contactPerson: z.string().optional(),
        paymentTerms: z.number().optional(),
        creditLimit: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const created = await db.createClient(tenantId, input as any);
        await db.addAuditLog(tenantId, { userId: ctx.user.id, userName: ctx.user.name ?? null, action: "criar", entityType: "client", entityId: created?.id ?? null, entityLabel: input.name });
        return created;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        nif: z.string().optional(),
        type: z.enum(["singular", "colectivo", "estrangeiro"]).optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
        country: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        contactPerson: z.string().optional(),
        paymentTerms: z.number().optional(),
        creditLimit: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const { id, ...data } = input;
        const updated = await db.updateClient(tenantId, id, data as any);
        await db.addAuditLog(tenantId, { userId: ctx.user.id, userName: ctx.user.name ?? null, action: "actualizar", entityType: "client", entityId: id, entityLabel: data.name ?? null });
        return updated;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        await db.deleteClient(tenantId, input.id);
        await db.addAuditLog(tenantId, { userId: ctx.user.id, userName: ctx.user.name ?? null, action: "eliminar", entityType: "client", entityId: input.id });
        return true;
      }),

    regeneratePortalToken: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const client = await db.regenerateClientPortalToken(tenantId, input.id);
        if (!client) throw new TRPCError({ code: "NOT_FOUND" });
        const url = portalUrlFor(ctx.req, client.portalToken ?? "");
        return { client, url };
      }),

    invoiceHistory: protectedProcedure
      .input(z.object({ clientId: z.number(), page: z.number().default(1) }))
      .query(async ({ input, ctx }) => db.listInvoices(requireTenant(ctx.user), { clientId: input.clientId, page: input.page })),
  }),

  // ─── Fornecedores ───────────────────────────────────────────────────────────
  suppliers: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional(), page: z.number().default(1), limit: z.number().default(20) }))
      .query(async ({ input, ctx }) => db.listSuppliers(requireTenant(ctx.user), input.search, input.page, input.limit)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const supplier = await db.getSupplierById(requireTenant(ctx.user), input.id);
        if (!supplier) throw new TRPCError({ code: "NOT_FOUND" });
        return supplier;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        nif: z.string().optional(),
        type: z.enum(["singular", "colectivo", "estrangeiro"]).optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
        country: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        contactPerson: z.string().optional(),
        paymentTerms: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const created = await db.createSupplier(tenantId, input as any);
        await db.addAuditLog(tenantId, { userId: ctx.user.id, userName: ctx.user.name ?? null, action: "criar", entityType: "supplier", entityId: created?.id ?? null, entityLabel: input.name });
        return created;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        nif: z.string().optional(),
        type: z.enum(["singular", "colectivo", "estrangeiro"]).optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
        country: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        contactPerson: z.string().optional(),
        paymentTerms: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const { id, ...data } = input;
        const updated = await db.updateSupplier(tenantId, id, data as any);
        await db.addAuditLog(tenantId, { userId: ctx.user.id, userName: ctx.user.name ?? null, action: "actualizar", entityType: "supplier", entityId: id, entityLabel: data.name ?? null });
        return updated;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        await db.deleteSupplier(tenantId, input.id);
        await db.addAuditLog(tenantId, { userId: ctx.user.id, userName: ctx.user.name ?? null, action: "eliminar", entityType: "supplier", entityId: input.id });
        return true;
      }),
  }),

  // ─── Produtos / Serviços ────────────────────────────────────────────────────
  products: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional(), type: z.string().optional(), page: z.number().default(1), limit: z.number().default(20) }))
      .query(async ({ input, ctx }) => db.listProducts(requireTenant(ctx.user), input.search, input.type, input.page, input.limit)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const product = await db.getProductById(requireTenant(ctx.user), input.id);
        if (!product) throw new TRPCError({ code: "NOT_FOUND" });
        return product;
      }),

    categories: protectedProcedure.query(async ({ ctx }) => db.listProductCategories(requireTenant(ctx.user))),

    getNextCode: protectedProcedure
      .input(z.object({ type: z.enum(["produto", "servico"]) }))
      .query(async ({ input, ctx }) => db.getNextProductCode(requireTenant(ctx.user), input.type)),

    createCategory: protectedProcedure
      .input(z.object({ name: z.string().min(1), description: z.string().optional() }))
      .mutation(async ({ input, ctx }) => db.createProductCategory(requireTenant(ctx.user), input)),

    create: protectedProcedure
      .input(z.object({
        code: z.string().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        categoryId: z.number().optional(),
        type: z.enum(["produto", "servico"]),
        unit: z.string().optional(),
        price: z.string(),
        costPrice: z.string().optional(),
        vatRate: z.string().default("14.00"),
        vatExemptReason: z.string().optional(),
        isVatExempt: z.boolean().default(false),
        stockControl: z.boolean().default(true),
        minStock: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        if (!input.code) {
          input.code = await db.getNextProductCode(tenantId, input.type);
        }
        const created = await db.createProduct(tenantId, input as any);
        await db.addAuditLog(tenantId, { userId: ctx.user.id, userName: ctx.user.name ?? null, action: "criar", entityType: "product", entityId: created?.id ?? null, entityLabel: input.name });
        return created;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        code: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        categoryId: z.number().optional(),
        type: z.enum(["produto", "servico"]).optional(),
        unit: z.string().optional(),
        price: z.string().optional(),
        costPrice: z.string().optional(),
        vatRate: z.string().optional(),
        vatExemptReason: z.string().optional(),
        isVatExempt: z.boolean().optional(),
        stockControl: z.boolean().optional(),
        minStock: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const { id, ...data } = input;
        const updated = await db.updateProduct(tenantId, id, data as any);
        await db.addAuditLog(tenantId, { userId: ctx.user.id, userName: ctx.user.name ?? null, action: "actualizar", entityType: "product", entityId: id, entityLabel: data.name ?? null });
        return updated;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        await db.deleteProduct(tenantId, input.id);
        await db.addAuditLog(tenantId, { userId: ctx.user.id, userName: ctx.user.name ?? null, action: "eliminar", entityType: "product", entityId: input.id });
        return true;
      }),
  }),

  // ─── Séries de Facturação ───────────────────────────────────────────────────
  series: router({
    list: protectedProcedure
      .input(z.object({ documentType: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        let list = await db.listInvoiceSeries(tenantId, input.documentType);

        // Auto-create default series for the current year if missing
        if (input.documentType && (!list || list.length === 0)) {
          const year = new Date().getFullYear();
          const code = `${year}`;
          const validationCode = generateValidationCode(code, year, input.documentType);
          const newSeries = await db.createInvoiceSeries(tenantId, {
            code,
            name: `Série Automática ${year}`,
            documentType: input.documentType as any,
            year,
            validationCode,
          });
          if (newSeries) {
            list = [newSeries];
          }
        }

        return list;
      }),

    create: protectedProcedure
      .input(z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        documentType: z.enum(["FT", "FR", "FS", "FA", "NC", "ND", "RC", "RG", "OR"]),
        year: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const validationCode = generateValidationCode(input.code, input.year, input.documentType);
        const created = await db.createInvoiceSeries(tenantId, { ...input, validationCode });
        if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await agtRegisterSeries(tenantId, created.id);
        await db.addAuditLog(tenantId, { userId: ctx.user.id, userName: ctx.user.name ?? null, action: "criar", entityType: "series", entityId: created.id, entityLabel: input.code });
        return created;
      }),
  }),

  // ─── Documentos Fiscais ─────────────────────────────────────────────────────
  invoices: router({
    list: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        status: z.string().optional(),
        documentType: z.string().optional(),
        clientId: z.number().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }))
      .query(async ({ input, ctx }) => db.listInvoices(requireTenant(ctx.user), input)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const invoice = await db.getInvoiceById(tenantId, input.id);
        if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });
        const items = await db.getInvoiceItems(tenantId, input.id);
        const payments = await db.listPayments(tenantId, input.id);
        return { ...invoice, items, payments };
      }),

    create: protectedProcedure
      .input(z.object({
        seriesId: z.number(),
        documentType: z.enum(["FT", "FR", "FS", "FA", "NC", "ND", "RC", "RG", "OR"]),
        clientId: z.number().optional(),
        clientName: z.string().optional(),
        clientNif: z.string().optional(),
        clientAddress: z.string().optional(),
        clientRef: z.string().optional(),
        issueDate: z.date(),
        dueDate: z.date().optional(),
        operationDate: z.date().optional(),
        relatedInvoiceId: z.number().optional(),
        relatedInvoiceNumber: z.string().optional(),
        paymentMethod: z.enum(["numerario", "transferencia", "cheque", "cartao", "outro"]).optional(),
        notes: z.string().optional(),
        currency: z.string().default("AOA"),
        withholdingTaxPercent: z.number().optional().default(0),
        items: z.array(z.object({
          productId: z.number().optional(),
          productCode: z.string().optional(),
          description: z.string().min(1),
          unit: z.string().default("UN"),
          quantity: z.number().positive(),
          unitPrice: z.number().positive(),
          discountPercent: z.number().min(0).max(100).default(0),
          vatRate: z.number().min(0).max(100),
          vatExemptReason: z.string().optional(),
          type: z.string().optional(),
        })).min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);

        // Orçamentos (OR) não contam para o limite nem vão para AGT
        const isQuotation = input.documentType === "OR";
        if (!isQuotation) {
          await assertCanIssueDocument(tenantId);
        }

        const series = await db.getSeriesById(tenantId, input.seriesId);
        if (!series) throw new TRPCError({ code: "NOT_FOUND", message: "Série não encontrada" });

        const number = await db.incrementSeriesNumber(tenantId, input.seriesId);
        const fullNumber = `${series.code}${series.year}/${number}`;
        const atcud = generateATCUD(series.validationCode ?? "DEMO0000", number);

        const calculatedItems = input.items.map((item, idx) => {
          const vals = calculateLineValues({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent,
            vatRate: item.vatRate,
          });
          return {
            lineNumber: idx + 1,
            productId: item.productId ?? null,
            productCode: item.productCode ?? null,
            description: item.description,
            unit: item.unit,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            discountPercent: String(item.discountPercent),
            discountAmount: String(vals.discountAmount),
            vatRate: String(item.vatRate),
            vatExemptReason: item.vatExemptReason ?? null,
            vatAmount: String(vals.vatAmount),
            subtotal: String(vals.subtotal),
            total: String(vals.total),
          };
        });

        const totals = calculateInvoiceTotals(calculatedItems.map((i, idx) => ({
          subtotal: Number(i.subtotal),
          vatAmount: Number(i.vatAmount),
          discountAmount: Number(i.discountAmount),
          total: Number(i.total),
          isService: input.items[idx].type === "servico" || (i.productCode?.startsWith("SVC") ?? false),
        })), input.withholdingTaxPercent);

        const now = new Date();
        const previousHash = (await db.getPreviousInvoiceHash(tenantId, input.seriesId, number)) ?? "";
        const hash = generateDocumentHash({
          issueDate: input.issueDate.toISOString().substring(0, 10),
          systemDate: now.toISOString().substring(0, 10),
          fullNumber,
          grossTotal: totals.totalAmount,
          previousHash,
        });
        const hashControl = getHashControl(hash);

        let clientName = input.clientName ?? null;
        let clientNif = input.clientNif ?? null;
        let clientAddress = input.clientAddress ?? null;
        let clientEmail: string | null = null;
        if (input.clientId) {
          const selectedClient = await db.getClientById(tenantId, input.clientId);
          if (selectedClient) {
            clientName = selectedClient.name;
            clientNif = selectedClient.nif ?? null;
            clientAddress = selectedClient.address ?? null;
            clientEmail = selectedClient.email ?? null;
          }
        }

        const invoiceData = {
          seriesId: input.seriesId,
          documentType: input.documentType,
          number,
          fullNumber,
          atcud,
          hash,
          hashControl,
          clientId: input.clientId ?? null,
          clientName,
          clientNif,
          clientAddress,
          clientEmail,
          clientRef: input.clientRef ?? null,
          issueDate: input.issueDate,
          dueDate: input.dueDate ?? null,
          operationDate: input.operationDate ?? null,
          subtotal: String(totals.subtotal),
          vatAmount: String(totals.vatAmount),
          discountAmount: String(totals.discountAmount),
          withholdingTaxAmount: String(totals.withholdingTaxAmount),
          totalAmount: String(totals.totalAmount),
          currency: input.currency,
          status: isQuotation ? ("emitida" as const) : ("emitida" as const),
          relatedInvoiceId: input.relatedInvoiceId ?? null,
          relatedInvoiceNumber: input.relatedInvoiceNumber ?? null,
          paymentMethod: input.paymentMethod ?? null,
          notes: input.notes ?? null,
          createdBy: ctx.user.id,
        };

        const invoice = await db.createInvoice(tenantId, invoiceData as any, calculatedItems as any);
        if (!invoice) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        if (!isQuotation) {
          await db.applyStockMovementsForInvoice({
            tenantId,
            invoiceId: invoice.id,
            items: calculatedItems,
            documentType: input.documentType,
            reference: fullNumber,
            createdBy: ctx.user.id,
          });
          await agtSubmitInvoice(tenantId, invoice.id).catch((e) => console.error("[AGT] submit failed:", e));
          await sendInvoiceEmail(ctx.req, invoice, tenantId);
        }

        await db.addAuditLog(tenantId, {
          userId: ctx.user.id,
          userName: ctx.user.name ?? null,
          action: "emitir",
          entityType: "invoice",
          entityId: invoice.id,
          entityLabel: fullNumber,
          details: JSON.stringify({ documentType: input.documentType, total: totals.totalAmount }),
        });

        return invoice;
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["rascunho", "emitida", "paga", "parcialmente_paga", "anulada", "vencida", "convertida", "expirada"]),
        paymentDate: z.date().optional(),
        paidAmount: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const current = await db.getInvoiceById(tenantId, input.id);
        if (!current) throw new TRPCError({ code: "NOT_FOUND" });

        if (current.status === "anulada" && input.status !== "anulada") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Um documento anulado não pode mudar de estado." });
        }

        if (input.status === "anulada") {
          if (current.status === "anulada") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Documento já está anulado." });
          }
          if (current.status === "paga" || current.status === "parcialmente_paga") {
            const ncCount = await db.countCreditNotesForInvoice(tenantId, current.id, current.fullNumber ?? null);
            if (ncCount === 0) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Documento pago só pode ser anulado mediante a emissão de uma nota de crédito (NC) que o referencie.",
              });
            }
          }
        }

        const { id, status, ...extra } = input;
        const updated = await db.updateInvoiceStatus(tenantId, id, status, extra as any);
        await db.addAuditLog(tenantId, { userId: ctx.user.id, userName: ctx.user.name ?? null, action: status, entityType: "invoice", entityId: id, entityLabel: current.fullNumber ?? null });
        return updated;
      }),

    convertQuotation: protectedProcedure
      .input(z.object({ quotationId: z.number(), seriesId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        await assertCanIssueDocument(tenantId);
        const invoice = await db.convertQuotation(tenantId, input.quotationId, input.seriesId, ctx.user.id);
        if (!invoice) throw new TRPCError({ code: "BAD_REQUEST", message: "Não foi possível converter o orçamento." });
        await db.addAuditLog(tenantId, { userId: ctx.user.id, userName: ctx.user.name ?? null, action: "converter", entityType: "invoice", entityId: invoice.id, entityLabel: invoice.fullNumber ?? null });
        return invoice;
      }),

    submitAGT: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const result = await agtSubmitInvoice(tenantId, input.id);
        if (!result.ok) throw new TRPCError({ code: "BAD_REQUEST", message: result.message });
        return result;
      }),

    queryAGT: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return agtQueryInvoice(requireTenant(ctx.user), input.id);
      }),

    exportSAFT: protectedProcedure
      .input(z.object({ dateFrom: z.date(), dateTo: z.date() }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const company = await db.getCompany(tenantId);
        if (!company) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configure a empresa primeiro" });

        const { data: invList } = await db.listInvoices(tenantId, {
          dateFrom: input.dateFrom,
          dateTo: input.dateTo,
          limit: 9999,
        });

        const itemsMap: Record<number, any[]> = {};
        for (const inv of invList) {
          itemsMap[inv.id] = await db.getInvoiceItems(tenantId, inv.id);
        }

        const xml = generateSAFTXML({
          company,
          invoices: invList,
          items: itemsMap,
          dateFrom: input.dateFrom.toISOString().substring(0, 10),
          dateTo: input.dateTo.toISOString().substring(0, 10),
        });

        return { xml, filename: `SAFT-AO_${input.dateFrom.toISOString().substring(0, 10)}_${input.dateTo.toISOString().substring(0, 10)}.xml` };
      }),

    exportSAFTInventory: protectedProcedure
      .input(z.object({ date: z.date() }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const company = await db.getCompany(tenantId);
        if (!company) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configure a empresa primeiro" });
        const products = await db.getInventoryForSAFT(tenantId);
        const xml = generateSAFTInventoryXML({
          company,
          products,
          date: input.date.toISOString().substring(0, 10),
        });
        return { xml, filename: `SAFT-AO-Inventario_${input.date.toISOString().substring(0, 10)}.xml` };
      }),

    vatDeclaration: protectedProcedure
      .input(z.object({ dateFrom: z.date(), dateTo: z.date() }))
      .query(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const report = await db.getVatReport(tenantId, input.dateFrom, input.dateTo);
        const period = `${input.dateFrom.toISOString().substring(0, 7)}_${input.dateTo.toISOString().substring(0, 7)}`;
        return { rows: report, csv: generateVATDeclarationCSV(report, period), totalTaxable: report.reduce((s, r) => s + r.taxableBase, 0), totalVat: report.reduce((s, r) => s + r.vatTotal, 0) };
      }),
  }),

  // ─── Portal do Cliente (público) ────────────────────────────────────────────
  portal: router({
    client: publicProcedure
      .input(z.object({ token: z.string().min(1) }))
      .query(async ({ input }) => {
        const client = await db.getClientByPortalToken(input.token);
        if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Link inválido" });
        const company = await db.getCompany(client.tenantId);
        return {
          clientName: client.name,
          companyName: company?.name ?? "",
          documents: await db.listInvoicesByClientToken(input.token),
        };
      }),
  }),

  // ─── Pagamentos ─────────────────────────────────────────────────────────────
  payments: router({
    list: protectedProcedure
      .input(z.object({ invoiceId: z.number() }))
      .query(async ({ input, ctx }) => db.listPayments(requireTenant(ctx.user), input.invoiceId)),

    create: protectedProcedure
      .input(z.object({
        invoiceId: z.number(),
        amount: z.number().positive(),
        paymentDate: z.date(),
        method: z.enum(["numerario", "transferencia", "cheque", "cartao", "outro"]).default("outro"),
        reference: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const invoice = await db.getInvoiceById(tenantId, input.invoiceId);
        if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });
        if (invoice.status === "anulada") throw new TRPCError({ code: "BAD_REQUEST", message: "Documento anulado." });

        const payment = await db.createPayment(tenantId, { ...input, createdBy: ctx.user.id });
        await db.refreshInvoicePaymentStatus(tenantId, input.invoiceId);
        await db.addAuditLog(tenantId, { userId: ctx.user.id, userName: ctx.user.name ?? null, action: "pagar", entityType: "invoice", entityId: input.invoiceId, entityLabel: invoice.fullNumber ?? null, details: JSON.stringify({ amount: input.amount, method: input.method }) });
        return payment;
      }),
  }),

  // ─── Facturação Recorrente ──────────────────────────────────────────────────
  recurring: router({
    list: protectedProcedure.query(async ({ ctx }) => db.listRecurringRules(requireTenant(ctx.user))),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        clientId: z.number().optional(),
        clientName: z.string().optional(),
        clientNif: z.string().optional(),
        clientEmail: z.string().email().optional().or(z.literal("")),
        documentType: z.enum(["FT", "FR"]).default("FT"),
        frequency: z.enum(["semanal", "mensal", "bimestral", "trimestral", "semestral", "anual"]).default("mensal"),
        dayOfMonth: z.number().min(1).max(31).default(1),
        nextRunDate: z.date(),
        items: z.array(z.object({
          productId: z.number().optional(),
          productCode: z.string().optional(),
          description: z.string().min(1),
          unit: z.string().default("UN"),
          quantity: z.number().positive(),
          unitPrice: z.number().positive(),
          discountPercent: z.number().min(0).max(100).default(0),
          vatRate: z.number().min(0).max(100),
          type: z.string().optional(),
        })).min(1),
        withholdingTaxPercent: z.number().min(0).max(100).default(0),
      }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const plan = await db.getTenant(tenantId);
        if (!PLANS[(plan?.plan ?? "gratis") as PlanId].recurring) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Recorrência disponível nos planos Pro e Escritório." });
        }
        let clientEmail = input.clientEmail ?? null;
        if (input.clientId) {
          const client = await db.getClientById(tenantId, input.clientId);
          if (client) {
            clientEmail = client.email ?? null;
            input.clientName = input.clientName ?? client.name;
            input.clientNif = input.clientNif ?? client.nif ?? undefined;
          }
        }
        const rule = await db.createRecurringRule(tenantId, {
          ...input,
          clientEmail,
          items: input.items as any,
        } as any);
        await db.addAuditLog(tenantId, { userId: ctx.user.id, userName: ctx.user.name ?? null, action: "criar", entityType: "recurring", entityId: rule?.id ?? null, entityLabel: input.name });
        return rule;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        frequency: z.enum(["semanal", "mensal", "bimestral", "trimestral", "semestral", "anual"]).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        nextRunDate: z.date().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const { id, ...data } = input;
        return db.updateRecurringRule(tenantId, id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => db.deleteRecurringRule(requireTenant(ctx.user), input.id)),

    runNow: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const invoice = await runRecurringRule(tenantId, input.id, ctx.user.id);
        return invoice;
      }),

    runDue: protectedProcedure.mutation(async ({ ctx }) => {
      const tenantId = requireTenant(ctx.user);
      const due = await db.getRecurringRulesDue(tenantId, new Date());
      const results: any[] = [];
      for (const rule of due) {
        try {
          const invoice = await runRecurringRule(tenantId, rule.id, ctx.user.id);
          results.push({ rule: rule.name, invoiceId: invoice?.id ?? null, ok: true });
        } catch (e: any) {
          await db.updateRecurringRule(tenantId, rule.id, { lastError: String(e?.message ?? e) });
          results.push({ rule: rule.name, ok: false, error: String(e?.message ?? e) });
        }
      }
      return results;
    }),
  }),

  // ─── AGT ─────────────────────────────────────────────────────────────────────
  agt: router({
    submissions: protectedProcedure
      .input(z.object({ page: z.number().default(1) }))
      .query(async ({ input, ctx }) => db.listAgtSubmissions(requireTenant(ctx.user), input.page)),

    registerSeries: protectedProcedure
      .input(z.object({ seriesId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const result = await agtRegisterSeries(tenantId, input.seriesId);
        if (!result.ok) throw new TRPCError({ code: "BAD_REQUEST", message: result.message });
        return result;
      }),

    submitSAFT: protectedProcedure
      .input(z.object({ xml: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const result = await agtSubmitSAFT(requireTenant(ctx.user), input.xml);
        if (!result.ok) throw new TRPCError({ code: "BAD_REQUEST", message: result.message });
        return result;
      }),

    status: protectedProcedure.query(async ({ ctx }) => {
      const tenantId = requireTenant(ctx.user);
      const company = await db.getCompany(tenantId);
      return {
        configured: Boolean(company?.agtEndpoint && company?.agtPortalUser),
        mode: company?.agtEndpoint ? "live" : "simulacao",
        user: company?.agtPortalUser ?? null,
      };
    }),
  }),

  // ─── Inventário ─────────────────────────────────────────────────────────────
  inventory: router({
    list: protectedProcedure
      .input(z.object({ productId: z.number().optional(), page: z.number().default(1) }))
      .query(async ({ input, ctx }) => db.listInventoryMovements(requireTenant(ctx.user), input.productId, input.page)),

    stockAlerts: protectedProcedure.query(async ({ ctx }) => {
      const tenantId = requireTenant(ctx.user);
      const { data } = await db.listProducts(tenantId, undefined, undefined, 1, 100);
      return data.filter(p => p.stockControl && Number(p.currentStock) <= Number(p.minStock));
    }),

    addMovement: protectedProcedure
      .input(z.object({
        productId: z.number(),
        type: z.enum(["entrada", "saida", "ajuste", "transferencia"]),
        quantity: z.number().positive(),
        unitCost: z.number().optional(),
        reference: z.string().optional(),
        supplierId: z.number().optional(),
        notes: z.string().optional(),
        movementDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const created = await db.createInventoryMovement(tenantId, {
          ...input,
          quantity: String(input.quantity),
          unitCost: input.unitCost ? String(input.unitCost) : null,
          totalCost: input.unitCost ? String(input.quantity * input.unitCost) : null,
          movementDate: input.movementDate ?? new Date(),
          createdBy: ctx.user.id,
        } as any);
        await db.addAuditLog(tenantId, { userId: ctx.user.id, userName: ctx.user.name ?? null, action: "stock", entityType: "product", entityId: input.productId, details: JSON.stringify({ type: input.type, quantity: input.quantity }) });
        return created;
      }),
  }),

  // ─── Utilizadores (Admin) ────────────────────────────────────────────────────
  users: router({
    list: adminProcedure
      .input(z.object({ page: z.number().default(1), limit: z.number().default(50) }))
      .query(async ({ input, ctx }) => db.listUsers(requireTenant(ctx.user), input.page, input.limit)),

    get: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const user = await db.getUserById(requireTenant(ctx.user), input.id);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        return user;
      }),

    updateRole: adminProcedure
      .input(z.object({ id: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const user = await db.updateUserRole(tenantId, input.id, input.role);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        return user;
      }),

    update: adminProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), email: z.string().email().optional().or(z.literal("")) }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const user = await db.updateUser(tenantId, input.id, { name: input.name ?? null, email: input.email ?? null });
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        return user;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const user = await db.disableUser(tenantId, input.id);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        return { success: true };
      }),

    resetPassword: adminProcedure
      .input(z.object({ id: z.number(), password: z.string().min(8, "Mínimo 8 caracteres").regex(/[A-Z]/, "Deve conter pelo menos uma maiúscula").regex(/[0-9]/, "Deve conter pelo menos um número") }))
      .mutation(async ({ input, ctx }) => {
        const tenantId = requireTenant(ctx.user);
        const passwordHash = await bcrypt.hash(input.password, 12);
        const user = await db.resetUserPassword(tenantId, input.id, passwordHash);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        await db.addAuditLog(tenantId, { userId: ctx.user.id, userName: ctx.user.name ?? null, action: "redefinir_password", entityType: "user", entityId: user.id, entityLabel: user.name ?? user.email });
        return { success: true };
      }),
  }),

  // ─── Auditoria ──────────────────────────────────────────────────────────────
  audit: router({
    list: adminProcedure
      .input(z.object({ page: z.number().default(1) }))
      .query(async ({ input, ctx }) => db.listAuditLogs(requireTenant(ctx.user), input.page)),
  }),

  // ─── Dashboard e Relatórios ─────────────────────────────────────────────────
  reports: router({
    dashboard: protectedProcedure.query(async ({ ctx }) => db.getDashboardStats(requireTenant(ctx.user))),

    monthlySales: protectedProcedure
      .input(z.object({ year: z.number().default(new Date().getFullYear()) }))
      .query(async ({ input, ctx }) => db.getMonthlySales(requireTenant(ctx.user), input.year)),

    topClients: protectedProcedure
      .input(z.object({ limit: z.number().default(5) }))
      .query(async ({ input, ctx }) => db.getTopClients(requireTenant(ctx.user), input.limit)),

    vatReport: protectedProcedure
      .input(z.object({ dateFrom: z.date(), dateTo: z.date() }))
      .query(async ({ input, ctx }) => db.getVatReport(requireTenant(ctx.user), input.dateFrom, input.dateTo)),

    income: protectedProcedure
      .input(z.object({ dateFrom: z.date(), dateTo: z.date() }))
      .query(async ({ input, ctx }) => db.getIncomeReport(requireTenant(ctx.user), input.dateFrom, input.dateTo)),

    receivables: protectedProcedure.query(async ({ ctx }) => db.getReceivables(requireTenant(ctx.user))),

    recentInvoices: protectedProcedure
      .input(z.object({ limit: z.number().default(5) }))
      .query(async ({ input, ctx }) => {
        const { data } = await db.listInvoices(requireTenant(ctx.user), { limit: input.limit });
        return data;
      }),

    sendReminders: adminProcedure.mutation(async ({ ctx }) => {
      const tenantId = requireTenant(ctx.user);
      const receivables = await db.getReceivables(tenantId);
      const now = new Date();
      const overdue = receivables.filter((inv) => inv.dueDate && new Date(inv.dueDate) < now && inv.clientEmail);
      const sent: any[] = [];
      for (const inv of overdue) {
        const client = inv.clientId ? await db.getClientById(tenantId, inv.clientId) : null;
        const url = client?.portalToken ? portalUrlFor(ctx.req, client.portalToken) : undefined;
        const ok = await sendEmail({
          to: inv.clientEmail!,
          subject: `Lembrete de pagamento - ${inv.fullNumber}`,
          html: reminderEmailHtml(inv, url),
        });
        sent.push({ fullNumber: inv.fullNumber, emailed: ok });
      }
      await db.addAuditLog(tenantId, { userId: ctx.user.id, userName: ctx.user.name ?? null, action: "lembrete", entityType: "report", entityLabel: `${sent.length} emails`, details: JSON.stringify(sent) });
      return sent;
    }),
  }),
});

export type AppRouter = typeof appRouter;
