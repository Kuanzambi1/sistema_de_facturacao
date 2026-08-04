import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { sdk } from "./_core/sdk";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createClient, createInventoryMovement, createInvoice, createInvoiceSeries,
  createProduct, createProductCategory, createSupplier, deleteClient,
  deleteProduct, deleteSupplier, getClientById, getCompany, getDashboardStats,
  getInvoiceById, getInvoiceItems, getMonthlySales, getProductById, getNextProductCode,
  getPreviousInvoiceHash, getSeriesById, getSupplierById, getTopClients, getVatReport,
  incrementSeriesNumber, listClients, listInventoryMovements, listInvoiceSeries,
  listInvoices, listProductCategories, listProducts, listSuppliers,
  updateClient, updateInvoicePdfUrl, updateInvoiceStatus, updateProduct,
  updateSupplier, upsertCompany, getUserByEmail, createUser,
  listUsers, updateUserRole, getUserCount, getUserById,
  updateUser, disableUser, applyStockMovementsForInvoice, countCreditNotesForInvoice
} from "./db";
import {
  DOCUMENT_TYPES, VAT_RATES, ANGOLA_PROVINCES, generateATCUD,
  generateValidationCode, generateDocumentHash, getHashControl,
  calculateLineValues, calculateInvoiceTotals, generateSAFTXML,
} from "./fiscal";

// ─── Router Principal ─────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(6) }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
        }
        const isValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
        }
        
        // Use existing sdk logic to create session cookie
        const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name ?? "" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);
        
        return { success: true, user };
      }),
    register: publicProcedure
      .input(z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(6), nif: z.string().min(1), phone: z.string().min(1), terms: z.boolean() }))
      .mutation(async ({ input }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Email já registado" });
        }
        const passwordHash = await bcrypt.hash(input.password, 10);
        const openId = `local_${nanoid(10)}`;
        
        // O primeiro utilizador a registar-se é automaticamente admin
        const userCount = await getUserCount();
        const role = userCount === 0 ? "admin" : "user";
        
        const user = await createUser({
          openId,
          name: input.name,
          email: input.email,
          passwordHash,
          loginMethod: "local",
          role,
        });
        
        await upsertCompany({
          name: input.name,
          nif: input.nif,
          phone: input.phone,
          email: input.email
        });
        
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

  // ─── Empresa ────────────────────────────────────────────────────────────────
  company: router({
    get: protectedProcedure.query(async () => {
      return await getCompany();
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
      }))
      .mutation(async ({ input }) => {
        return await upsertCompany(input);
      }),
  }),

  // ─── Clientes ───────────────────────────────────────────────────────────────
  clients: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional(), page: z.number().default(1), limit: z.number().default(20) }))
      .query(async ({ input }) => listClients(input.search, input.page, input.limit)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const client = await getClientById(input.id);
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
      .mutation(async ({ input }) => createClient(input as any)),

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
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateClient(id, data as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => deleteClient(input.id)),

    invoiceHistory: protectedProcedure
      .input(z.object({ clientId: z.number(), page: z.number().default(1) }))
      .query(async ({ input }) => listInvoices({ clientId: input.clientId, page: input.page })),
  }),

  // ─── Fornecedores ───────────────────────────────────────────────────────────
  suppliers: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional(), page: z.number().default(1), limit: z.number().default(20) }))
      .query(async ({ input }) => listSuppliers(input.search, input.page, input.limit)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const supplier = await getSupplierById(input.id);
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
      .mutation(async ({ input }) => createSupplier(input as any)),

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
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateSupplier(id, data as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => deleteSupplier(input.id)),
  }),

  // ─── Produtos / Serviços ────────────────────────────────────────────────────
  products: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional(), type: z.string().optional(), page: z.number().default(1), limit: z.number().default(20) }))
      .query(async ({ input }) => listProducts(input.search, input.type, input.page, input.limit)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const product = await getProductById(input.id);
        if (!product) throw new TRPCError({ code: "NOT_FOUND" });
        return product;
      }),

    categories: protectedProcedure.query(() => listProductCategories()),

    getNextCode: protectedProcedure
      .input(z.object({ type: z.enum(["produto", "servico"]) }))
      .query(async ({ input }) => {
        return getNextProductCode(input.type);
      }),

    createCategory: protectedProcedure
      .input(z.object({ name: z.string().min(1), description: z.string().optional() }))
      .mutation(async ({ input }) => createProductCategory(input)),

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
      .mutation(async ({ input }) => {
        if (!input.code) {
          input.code = await getNextProductCode(input.type);
        }
        return createProduct(input as any);
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
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateProduct(id, data as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => deleteProduct(input.id)),
  }),

  // ─── Séries de Facturação ───────────────────────────────────────────────────
  series: router({
    list: protectedProcedure
      .input(z.object({ documentType: z.string().optional() }))
      .query(async ({ input }) => {
        let list = await listInvoiceSeries(input.documentType);
        
        // Auto-create default series for the current year if missing
        if (input.documentType && (!list || list.length === 0)) {
          const year = new Date().getFullYear();
          const code = `${year}`;
          const validationCode = generateValidationCode(code, year, input.documentType);
          const newSeries = await createInvoiceSeries({
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
        documentType: z.enum(["FT", "FR", "FS", "FA", "NC", "ND", "RC", "RG"]),
        year: z.number(),
      }))
      .mutation(async ({ input }) => {
        const validationCode = generateValidationCode(input.code, input.year, input.documentType);
        return createInvoiceSeries({ ...input, validationCode });
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
      .query(async ({ input }) => listInvoices(input)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const invoice = await getInvoiceById(input.id);
        if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });
        const items = await getInvoiceItems(input.id);
        return { ...invoice, items };
      }),

    create: protectedProcedure
      .input(z.object({
        seriesId: z.number(),
        documentType: z.enum(["FT", "FR", "FS", "FA", "NC", "ND", "RC", "RG"]),
        clientId: z.number().optional(),
        clientName: z.string().optional(),
        clientNif: z.string().optional(),
        clientAddress: z.string().optional(),
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
        const series = await getSeriesById(input.seriesId);
        if (!series) throw new TRPCError({ code: "NOT_FOUND", message: "Série não encontrada" });

        const number = await incrementSeriesNumber(input.seriesId);
        const fullNumber = `${series.code}/${number}`;
        const atcud = generateATCUD(series.validationCode ?? "DEMO0000", number);

        // Calcular linhas
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

        // Gerar hash (com encadeamento sobre o documento anterior da série)
        const now = new Date();
        const previousHash = (await getPreviousInvoiceHash(input.seriesId, number)) ?? "";
        const hash = generateDocumentHash({
          issueDate: input.issueDate.toISOString().substring(0, 10),
          systemDate: now.toISOString().substring(0, 10),
          fullNumber,
          grossTotal: totals.totalAmount,
          previousHash,
        });
        const hashControl = getHashControl(hash);

        // Buscar dados do cliente se seleccionado
        let clientName = input.clientName ?? null;
        let clientNif = input.clientNif ?? null;
        let clientAddress = input.clientAddress ?? null;
        if (input.clientId) {
          const selectedClient = await getClientById(input.clientId);
          if (selectedClient) {
            clientName = selectedClient.name;
            clientNif = selectedClient.nif ?? null;
            clientAddress = selectedClient.address ?? null;
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
          issueDate: input.issueDate,
          dueDate: input.dueDate ?? null,
          operationDate: input.operationDate ?? null,
          subtotal: String(totals.subtotal),
          vatAmount: String(totals.vatAmount),
          discountAmount: String(totals.discountAmount),
          withholdingTaxAmount: String(totals.withholdingTaxAmount),
          totalAmount: String(totals.totalAmount),
          currency: input.currency,
          status: "emitida" as const,
          relatedInvoiceId: input.relatedInvoiceId ?? null,
          relatedInvoiceNumber: input.relatedInvoiceNumber ?? null,
          paymentMethod: input.paymentMethod ?? null,
          notes: input.notes ?? null,
          createdBy: ctx.user.id,
        };

        const invoice = await createInvoice(invoiceData as any, calculatedItems as any);
        if (invoice) {
          await applyStockMovementsForInvoice({
            invoiceId: invoice.id,
            items: calculatedItems,
            documentType: input.documentType,
            reference: fullNumber,
            createdBy: ctx.user.id,
          });
        }
        return invoice;
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["rascunho", "emitida", "paga", "parcialmente_paga", "anulada", "vencida"]),
        paymentDate: z.date().optional(),
        paidAmount: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const current = await getInvoiceById(input.id);
        if (!current) throw new TRPCError({ code: "NOT_FOUND" });

        // Um documento anulado não pode voltar a ter estado activo
        if (current.status === "anulada" && input.status !== "anulada") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Um documento anulado não pode mudar de estado." });
        }

        // Anular exige nota de crédito quando o documento já foi pago, por lei.
        if (input.status === "anulada") {
          if (current.status === "anulada") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Documento já está anulado." });
          }
          if (current.status === "paga" || current.status === "parcialmente_paga") {
            const ncCount = await countCreditNotesForInvoice(current.id, current.fullNumber ?? null);
            if (ncCount === 0) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Documento pago só pode ser anulado mediante a emissão de uma nota de crédito (NC) que o referencie.",
              });
            }
          }
        }

        const { id, status, ...extra } = input;
        return updateInvoiceStatus(id, status, extra as any);
      }),

    exportSAFT: protectedProcedure
      .input(z.object({
        dateFrom: z.date(),
        dateTo: z.date(),
      }))
      .mutation(async ({ input }) => {
        const company = await getCompany();
        if (!company) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configure a empresa primeiro" });

        const { data: invList } = await listInvoices({
          dateFrom: input.dateFrom,
          dateTo: input.dateTo,
          limit: 9999,
        });

        const itemsMap: Record<number, any[]> = {};
        for (const inv of invList) {
          itemsMap[inv.id] = await getInvoiceItems(inv.id);
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
  }),

  // ─── Inventário ─────────────────────────────────────────────────────────────
  inventory: router({
    list: protectedProcedure
      .input(z.object({ productId: z.number().optional(), page: z.number().default(1) }))
      .query(async ({ input }) => listInventoryMovements(input.productId, input.page)),

    stockAlerts: protectedProcedure.query(async () => {
      const { data } = await listProducts(undefined, undefined, 1, 100);
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
        return createInventoryMovement({
          ...input,
          quantity: String(input.quantity),
          unitCost: input.unitCost ? String(input.unitCost) : null,
          totalCost: input.unitCost ? String(input.quantity * input.unitCost) : null,
          movementDate: input.movementDate ?? new Date(),
          createdBy: ctx.user.id,
        } as any);
      }),
  }),

  // ─── Utilizadores (Admin) ────────────────────────────────────────────────────
  users: router({
    list: adminProcedure
      .input(z.object({ page: z.number().default(1), limit: z.number().default(50) }))
      .query(async ({ input }) => listUsers(input.page, input.limit)),

    get: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const user = await getUserById(input.id);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        return user;
      }),

    updateRole: adminProcedure
      .input(z.object({ id: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ input }) => {
        const user = await updateUserRole(input.id, input.role);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        return user;
      }),

    update: adminProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), email: z.string().email().optional().or(z.literal("")) }))
      .mutation(async ({ input }) => {
        const user = await updateUser(input.id, { name: input.name ?? null, email: input.email ?? null });
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        return user;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const user = await disableUser(input.id);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        return { success: true };
      }),
  }),

  // ─── Dashboard e Relatórios ─────────────────────────────────────────────────
  reports: router({
    dashboard: protectedProcedure.query(() => getDashboardStats()),

    monthlySales: protectedProcedure
      .input(z.object({ year: z.number().default(new Date().getFullYear()) }))
      .query(async ({ input }) => getMonthlySales(input.year)),

    topClients: protectedProcedure
      .input(z.object({ limit: z.number().default(5) }))
      .query(async ({ input }) => getTopClients(input.limit)),

    vatReport: protectedProcedure
      .input(z.object({ dateFrom: z.date(), dateTo: z.date() }))
      .query(async ({ input }) => getVatReport(input.dateFrom, input.dateTo)),

    recentInvoices: protectedProcedure
      .input(z.object({ limit: z.number().default(5) }))
      .query(async ({ input }) => {
        const { data } = await listInvoices({ limit: input.limit });
        return data;
      }),
  }),
});

export type AppRouter = typeof appRouter;
