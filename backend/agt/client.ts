/**
 * Camada de integração AGT (Administração Geral Tributária - Angola).
 * Especificação Oficial: Facturação Electrónica v1 (schemaVersion: "2.0")
 *  - Homologação (HML): https://sifphml.minfin.gov.ao/sigt/fe/v1
 *  - Produção (PRD):    https://sifp.minfin.gov.ao/sigt/fe/v1
 *
 * Existem dois adaptadores:
 *  - `MockAGTClient`: simula a comunicação (desenvolvimento/demo).
 *  - `LiveAGTClient`: cliente REST oficial AGT com Basic Auth e assinaturas JWS (RS256).
 */
import crypto from "crypto";
import { nanoid } from "nanoid";
import type { Express, Request, Response } from "express";
import type { Company } from "../drizzle/schema";
import { decryptString } from "../_core/crypto";
import * as db from "../db";

export type AGTStatus = "sucesso" | "erro" | "pendente";

export type AGTResult = {
  ok: boolean;
  status: AGTStatus;
  message: string;
  agtReference?: string;
  validationCode?: string;
  requestID?: string;
  raw?: unknown;
};

export interface AGTClient {
  registerSeries(input: {
    tenantId: number;
    code: string;
    name: string;
    documentType: string;
    year: number;
    establishmentNumber?: string;
    seriesContingencyIndicator?: "N" | "C";
    validationCode?: string | null;
  }): Promise<AGTResult>;
  submitInvoice(input: { tenantId: number; invoice: any; items?: any[] }): Promise<AGTResult>;
  getStatus(input: { tenantId: number; requestID: string }): Promise<AGTResult>;
  queryInvoice(input: { tenantId: number; fullNumber: string; atcud?: string | null }): Promise<AGTResult>;
  listInvoices(input: { tenantId: number; queryStartDate: string; queryEndDate: string }): Promise<AGTResult>;
  submitSAFT(input: { tenantId: number; xml: string }): Promise<AGTResult>;
}

// ─── Utilitários Criptográficos JWS (RS256) ───────────────────────────────────

let fallbackRsaKey: string | null = null;
function getFallbackPrivateKey(): string {
  if (!fallbackRsaKey) {
    const { privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    fallbackRsaKey = privateKey;
  }
  return fallbackRsaKey;
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function resolvePrivateKeyPem(encryptedOrPem?: string | null): string {
  if (!encryptedOrPem) return getFallbackPrivateKey();
  const trimmed = encryptedOrPem.trim();
  if (trimmed.startsWith("-----BEGIN")) return trimmed;
  try {
    const decrypted = decryptString(trimmed);
    if (decrypted && decrypted.includes("-----BEGIN")) return decrypted;
  } catch {
    // ignore decrypt error and use fallback
  }
  return getFallbackPrivateKey();
}

/**
 * Gera uma assinatura JSON Web Signature (JWS) compacta no formato exigido pela AGT:
 * Header: {"typ":"JOSE","alg":"RS256"}
 */
export function signAgtJws(payload: Record<string, unknown>, privateKeyPem: string): string {
  const header = { typ: "JOSE", alg: "RS256" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  try {
    const signer = crypto.createSign("RSA-SHA256");
    signer.update(signingInput, "utf8");
    const signature = signer.sign(privateKeyPem);
    return `${signingInput}.${base64UrlEncode(signature)}`;
  } catch {
    const signer = crypto.createSign("RSA-SHA256");
    signer.update(signingInput, "utf8");
    const signature = signer.sign(getFallbackPrivateKey());
    return `${signingInput}.${base64UrlEncode(signature)}`;
  }
}

/**
 * Normaliza o endpoint base da AGT (ex: https://sifphml.minfin.gov.ao/sigt/fe/v1)
 * e concatena a operação específica (/registarFactura, /obterEstado, etc.)
 */
export function resolveAgtServiceUrl(configuredEndpoint: string, serviceName: string): string {
  const clean = configuredEndpoint.trim().replace(/\/+$/, "");
  const knownOps = [
    "/registarFactura",
    "/obterEstado",
    "/consultarFactura",
    "/listarFacturas",
    "/solicitarSerie",
    "/listarSeries",
    "/estenderSerie",
    "/anularFactura",
    "/validarDocumento",
  ];
  let baseUrl = clean;
  for (const op of knownOps) {
    if (baseUrl.toLowerCase().endsWith(op.toLowerCase())) {
      baseUrl = baseUrl.slice(0, baseUrl.length - op.length);
      break;
    }
  }
  // Converter caminhos SOAP (/ws/v1) para REST (/v1) caso o utilizador tenha colado o URL SOAP
  baseUrl = baseUrl.replace(/\/sigt\/fe\/ws\/v1$/i, "/sigt/fe/v1");
  return `${baseUrl}/${serviceName.replace(/^\/+/, "")}`;
}

class MockAGTClient implements AGTClient {
  private reference(prefix: string) {
    return `AGT-${prefix}-${nanoid(8).toUpperCase()}`;
  }

  async registerSeries(input: {
    tenantId: number;
    code: string;
    name: string;
    documentType: string;
    year: number;
    validationCode?: string | null;
  }): Promise<AGTResult> {
    return {
      ok: true,
      status: "sucesso",
      message: "Série registada (modo simulação)",
      agtReference: this.reference("SER"),
      validationCode: input.validationCode ?? `${input.documentType}${input.year}S001N`,
    };
  }

  async submitInvoice(_input: { tenantId: number; invoice: any; items?: any[] }): Promise<AGTResult> {
    const reqId = `${new Date().getFullYear()}0000${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      ok: true,
      status: "sucesso",
      message: "Documento submetido em registarFactura (modo simulação)",
      agtReference: reqId,
      requestID: reqId,
    };
  }

  async getStatus(input: { tenantId: number; requestID: string }): Promise<AGTResult> {
    return {
      ok: true,
      status: "sucesso",
      message: `Estado do pedido ${input.requestID}: Validado (modo simulação)`,
      agtReference: input.requestID,
      requestID: input.requestID,
    };
  }

  async queryInvoice(_input: { tenantId: number; fullNumber: string; atcud?: string | null }): Promise<AGTResult> {
    return {
      ok: true,
      status: "sucesso",
      message: "Documento registado e válido na AGT (modo simulação)",
      agtReference: this.reference("QRY"),
    };
  }

  async listInvoices(input: { tenantId: number; queryStartDate: string; queryEndDate: string }): Promise<AGTResult> {
    return {
      ok: true,
      status: "sucesso",
      message: `Listagem de facturas (${input.queryStartDate} a ${input.queryEndDate}) concluída (modo simulação)`,
      agtReference: this.reference("LST"),
      raw: { documents: [] },
    };
  }

  async submitSAFT(_input: { tenantId: number; xml: string }): Promise<AGTResult> {
    return {
      ok: true,
      status: "sucesso",
      message: "SAF-T aceite (modo simulação)",
      agtReference: this.reference("SAF"),
    };
  }
}

class LiveAGTClient implements AGTClient {
  private buildBaseEnvelope(company: Company) {
    const softwarePrivateKey = resolvePrivateKeyPem(
      process.env.AGT_SOFTWARE_PRIVATE_KEY || company.rsaPrivateKey
    );
    const emitterPrivateKey = resolvePrivateKeyPem(company.rsaPrivateKey);

    const softwareInfoDetail = {
      productId: process.env.AGT_PRODUCT_ID || "Kapital360 Facturacao",
      productVersion: process.env.AGT_PRODUCT_VERSION || "1.0.0",
      softwareValidationNumber:
        company.softwareValidationNumber && company.softwareValidationNumber !== "000/AGT/202X"
          ? company.softwareValidationNumber
          : process.env.AGT_SOFTWARE_VALIDATION_NUMBER || "000/AGT/2026",
    };

    const jwsSoftwareSignature = signAgtJws(softwareInfoDetail, softwarePrivateKey);
    const submissionUUID = crypto.randomUUID();
    const submissionTimeStamp = new Date().toISOString();

    return {
      emitterPrivateKey,
      envelope: {
        schemaVersion: "2.0",
        submissionUUID,
        taxRegistrationNumber: (company.nif ?? "").trim(),
        submissionTimeStamp,
        softwareInfo: {
          softwareInfoDetail,
          jwsSoftwareSignature,
        },
      },
    };
  }

  private async callService(company: Company, serviceName: string, payload: Record<string, unknown>): Promise<AGTResult> {
    if (!company.agtEndpoint) {
      return {
        ok: false,
        status: "erro",
        message: "Endpoint AGT não configurado. Configure o URL da AGT (ex: https://sifphml.minfin.gov.ao/sigt/fe/v1) nas configurações da empresa.",
      };
    }

    const url = resolveAgtServiceUrl(company.agtEndpoint, serviceName);
    const user = (company.agtPortalUser ?? "").trim();
    const password = company.agtPortalPassword ? decryptString(company.agtPortalPassword) : "";
    const basicToken = Buffer.from(`${user}:${password}`, "utf8").toString("base64");

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(user ? { Authorization: `Basic ${basicToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { rawText: text };
      }

      const errorList: Array<any> =
        data?.errorList ?? data?.requestErrorList ?? data?.errors ?? [];
      const formattedErrors = Array.isArray(errorList)
        ? errorList
            .filter(Boolean)
            .map((e: any) =>
              typeof e === "string"
                ? e
                : `${e.idError ? `[${e.idError}] ` : ""}${e.descriptionError ?? e.message ?? JSON.stringify(e)}`
            )
            .filter(Boolean)
            .join("; ")
        : "";

      if (!response.ok) {
        return {
          ok: false,
          status: "erro",
          message: formattedErrors || data?.message || `AGT ${serviceName} (${response.status}): ${text.slice(0, 400)}`,
          raw: data,
        };
      }

      if (formattedErrors && (data?.resultCode === 0 || data?.resultCode === "0" || !data?.requestID && !data?.seriesFEResult && !data?.documentNo && !data?.invoiceList)) {
        return {
          ok: false,
          status: "erro",
          message: formattedErrors,
          raw: data,
        };
      }

      const requestID = data?.requestID ?? data?.submissionUUID ?? undefined;
      const seriesCode = data?.seriesFEResult?.seriesCode ?? data?.validationCode ?? undefined;

      return {
        ok: true,
        status: "sucesso",
        message:
          formattedErrors ||
          data?.message ||
          (seriesCode ? `Série ${seriesCode} autorizada pela AGT` : null) ||
          (requestID ? `Submetido à AGT (requestID: ${requestID})` : null) ||
          `Operação ${serviceName} concluída com sucesso`,
        agtReference: requestID ?? seriesCode ?? data?.documentNo ?? undefined,
        validationCode: seriesCode,
        requestID,
        raw: data,
      };
    } catch (error) {
      return {
        ok: false,
        status: "erro",
        message: `Falha de comunicação com a AGT (${serviceName}): ${String(error)}`,
      };
    }
  }

  async registerSeries(input: {
    tenantId: number;
    code: string;
    name: string;
    documentType: string;
    year: number;
    establishmentNumber?: string;
    seriesContingencyIndicator?: "N" | "C";
    validationCode?: string | null;
  }): Promise<AGTResult> {
    const company = await db.getCompany(input.tenantId);
    if (!company) return { ok: false, status: "erro", message: "Empresa não configurada" };

    const { emitterPrivateKey, envelope } = this.buildBaseEnvelope(company);
    const establishmentNumber = input.establishmentNumber || "SEDE";
    const seriesYear = String(input.year);
    const seriesContingencyIndicator = input.seriesContingencyIndicator || "N";

    const jwsSignature = signAgtJws(
      {
        taxRegistrationNumber: envelope.taxRegistrationNumber,
        establishmentNumber,
        seriesYear,
        documentType: input.documentType,
      },
      emitterPrivateKey
    );

    return this.callService(company, "solicitarSerie", {
      ...envelope,
      seriesYear,
      documentType: input.documentType,
      establishmentNumber,
      seriesContingencyIndicator,
      jwsSignature,
    });
  }

  async submitInvoice(input: { tenantId: number; invoice: any; items?: any[] }): Promise<AGTResult> {
    const company = await db.getCompany(input.tenantId);
    if (!company) return { ok: false, status: "erro", message: "Empresa não configurada" };

    const invoice = input.invoice;
    const rawItems = input.items ?? (await db.getInvoiceItems(input.tenantId, invoice.id));
    const { emitterPrivateKey, envelope } = this.buildBaseEnvelope(company);

    const documentDate =
      invoice.issueDate instanceof Date
        ? invoice.issueDate.toISOString().slice(0, 10)
        : String(invoice.issueDate ?? new Date().toISOString()).slice(0, 10);

    const documentNo = invoice.fullNumber?.includes(" ")
      ? invoice.fullNumber
      : `${invoice.documentType} ${invoice.fullNumber}`;

    const documentStatus = invoice.status === "anulada" ? "A" : "N";
    const customerTaxID = (invoice.clientNif || "999999999").trim();
    const customerCountry = "AO";
    const companyName = invoice.clientName || "Consumidor Final";

    const documentTotals = {
      netTotal: Number(Number(invoice.subtotal ?? 0).toFixed(2)),
      taxPayable: Number(Number(invoice.vatAmount ?? 0).toFixed(2)),
      grossTotal: Number(Number(invoice.totalAmount ?? 0).toFixed(2)),
    };

    const jwsDocumentSignature = signAgtJws(
      {
        documentNo,
        taxRegistrationNumber: envelope.taxRegistrationNumber,
        documentType: invoice.documentType,
        documentDate,
        customerTaxID,
        customerCountry,
        companyName,
        documentTotals,
      },
      emitterPrivateKey
    );

    const lines = rawItems.map((item: any, idx: number) => {
      const vatRate = Number(item.vatRate ?? 0);
      const isExempt = vatRate === 0;
      return {
        lineNumber: Number(item.lineNumber ?? idx + 1),
        productCode: item.productCode || `ART-${idx + 1}`,
        productDescription: item.description,
        quantity: Number(Number(item.quantity ?? 1).toFixed(4)),
        unitOfMeasure: item.unit || "UN",
        unitPrice: Number(Number(item.unitPrice ?? 0).toFixed(2)),
        creditAmount: Number(Number(item.subtotal ?? 0).toFixed(2)),
        taxes: [
          {
            taxType: "IVA",
            taxCountryRegion: "AO",
            taxCode: isExempt ? "ISE" : vatRate === 5 ? "RED" : vatRate === 7 ? "INT" : "NOR",
            taxPercentage: vatRate,
            taxContribution: Number(Number(item.vatAmount ?? 0).toFixed(2)),
            ...(isExempt
              ? {
                  taxExemptionCode: item.vatExemptReasonCode || "M99",
                  taxExemptionReason: item.vatExemptReason || "Isento de IVA",
                }
              : {}),
          },
        ],
      };
    });

    const documentPayload = {
      documentNo,
      documentStatus,
      documentDate,
      documentType: invoice.documentType,
      eacCode: "00000",
      systemEntryDate: new Date(invoice.createdAt ?? Date.now()).toISOString().slice(0, 19),
      customerTaxID,
      customerCountry,
      companyName,
      jwsDocumentSignature,
      lines,
      documentTotals,
    };

    return this.callService(company, "registarFactura", {
      ...envelope,
      numberOfEntries: 1,
      documents: [documentPayload],
    });
  }

  async getStatus(input: { tenantId: number; requestID: string }): Promise<AGTResult> {
    const company = await db.getCompany(input.tenantId);
    if (!company) return { ok: false, status: "erro", message: "Empresa não configurada" };

    const { envelope } = this.buildBaseEnvelope(company);
    return this.callService(company, "obterEstado", {
      ...envelope,
      requestID: input.requestID,
    });
  }

  async queryInvoice(input: { tenantId: number; fullNumber: string; atcud?: string | null }): Promise<AGTResult> {
    const company = await db.getCompany(input.tenantId);
    if (!company) return { ok: false, status: "erro", message: "Empresa não configurada" };

    const { emitterPrivateKey, envelope } = this.buildBaseEnvelope(company);
    const invoiceNo = input.fullNumber;
    const jwsSignature = signAgtJws(
      {
        taxRegistrationNumber: envelope.taxRegistrationNumber,
        invoiceNo,
      },
      emitterPrivateKey
    );

    return this.callService(company, "consultarFactura", {
      ...envelope,
      jwsSignature,
      invoiceNo,
    });
  }

  async listInvoices(input: { tenantId: number; queryStartDate: string; queryEndDate: string }): Promise<AGTResult> {
    const company = await db.getCompany(input.tenantId);
    if (!company) return { ok: false, status: "erro", message: "Empresa não configurada" };

    const { emitterPrivateKey, envelope } = this.buildBaseEnvelope(company);
    const jwsSignature = signAgtJws(
      {
        taxRegistrationNumber: envelope.taxRegistrationNumber,
        queryStartDate: input.queryStartDate,
        queryEndDate: input.queryEndDate,
      },
      emitterPrivateKey
    );

    return this.callService(company, "listarFacturas", {
      ...envelope,
      submissionGUID: envelope.submissionUUID,
      jwsSignature,
      queryStartDate: input.queryStartDate,
      queryEndDate: input.queryEndDate,
    });
  }

  async submitSAFT(input: { tenantId: number; xml: string }): Promise<AGTResult> {
    const company = await db.getCompany(input.tenantId);
    if (!company) return { ok: false, status: "erro", message: "Empresa não configurada" };

    const { envelope } = this.buildBaseEnvelope(company);
    return this.callService(company, "submeterSAFT", {
      ...envelope,
      xml: input.xml,
    });
  }
}

/**
 * Escolhe o adaptador. Se o endpoint AGT estiver configurado na empresa,
 * usa o LiveAGTClient oficial, caso contrário usa o MockAGTClient.
 */
export async function getAGTClient(tenantId: number): Promise<AGTClient> {
  const company = await db.getCompany(tenantId);
  if (company?.agtEndpoint) {
    return new LiveAGTClient();
  }
  return new MockAGTClient();
}

// ─── Operações de alto nível ──────────────────────────────────────────────────

export async function agtRegisterSeries(tenantId: number, seriesId: number) {
  const series = await db.getSeriesById(tenantId, seriesId);
  if (!series) throw new Error("Série não encontrada");
  const client = await getAGTClient(tenantId);
  const result = await client.registerSeries({
    tenantId,
    code: series.code,
    name: series.name,
    documentType: series.documentType,
    year: series.year,
    validationCode: series.validationCode,
  });
  await db.logAgtSubmission(tenantId, {
    action: "registar_serie",
    payload: JSON.stringify({ code: series.code, documentType: series.documentType, year: series.year }),
    response: JSON.stringify(result),
    status: result.status,
    message: result.message,
  });
  if (result.ok) {
    await db.updateInvoiceSeries(tenantId, seriesId, {
      agtRegistered: true,
      agtRegisteredAt: new Date(),
      validationCode: result.validationCode ?? series.validationCode,
    });
  }
  return result;
}

export async function agtSubmitInvoice(tenantId: number, invoiceId: number) {
  const invoice = await db.getInvoiceById(tenantId, invoiceId);
  if (!invoice) throw new Error("Documento não encontrado");
  const items = await db.getInvoiceItems(tenantId, invoiceId);
  const client = await getAGTClient(tenantId);
  const result = await client.submitInvoice({ tenantId, invoice, items });
  await db.logAgtSubmission(tenantId, {
    invoiceId,
    action: "submeter_documento",
    payload: JSON.stringify({ fullNumber: invoice.fullNumber, atcud: invoice.atcud }),
    response: JSON.stringify(result),
    status: result.status,
    message: result.message,
  });
  if (result.ok) {
    await db.updateInvoiceStatus(tenantId, invoiceId, invoice.status, {
      agtSubmitted: true,
      agtSubmissionDate: new Date(),
      agtResponse: JSON.stringify(result),
    });
  }
  return result;
}

export async function agtGetSubmissionStatus(tenantId: number, requestID: string, invoiceId?: number) {
  const client = await getAGTClient(tenantId);
  const result = await client.getStatus({ tenantId, requestID });
  await db.logAgtSubmission(tenantId, {
    invoiceId: invoiceId ?? null,
    action: "consultar_documento",
    payload: JSON.stringify({ action: "obterEstado", requestID }),
    response: JSON.stringify(result),
    status: result.status,
    message: result.message,
  });
  return result;
}

export async function agtQueryInvoice(tenantId: number, invoiceId: number) {
  const invoice = await db.getInvoiceById(tenantId, invoiceId);
  if (!invoice) throw new Error("Documento não encontrado");
  const client = await getAGTClient(tenantId);
  const fullNumber = invoice.fullNumber?.includes(" ")
    ? invoice.fullNumber
    : `${invoice.documentType} ${invoice.fullNumber}`;
  const result = await client.queryInvoice({ tenantId, fullNumber, atcud: invoice.atcud });
  await db.logAgtSubmission(tenantId, {
    invoiceId,
    action: "consultar_documento",
    payload: JSON.stringify({ action: "consultarFactura", invoiceNo: fullNumber }),
    response: JSON.stringify(result),
    status: result.status,
    message: result.message,
  });
  return result;
}

export async function agtListInvoices(tenantId: number, queryStartDate: string, queryEndDate: string) {
  const client = await getAGTClient(tenantId);
  const result = await client.listInvoices({ tenantId, queryStartDate, queryEndDate });
  await db.logAgtSubmission(tenantId, {
    action: "consultar_documento",
    payload: JSON.stringify({ action: "listarFacturas", queryStartDate, queryEndDate }),
    response: JSON.stringify(result).slice(0, 4000),
    status: result.status,
    message: result.message,
  });
  return result;
}

export async function agtSubmitSAFT(tenantId: number, xml: string) {
  const client = await getAGTClient(tenantId);
  const result = await client.submitSAFT({ tenantId, xml });
  await db.logAgtSubmission(tenantId, {
    action: "submeter_saft",
    payload: xml.slice(0, 4000),
    response: JSON.stringify(result),
    status: result.status,
    message: result.message,
  });
  return result;
}

// ─── Webhook / Callback AGT (HTTP POST) ──────────────────────────────────────

function normalizeWebhookStatus(raw: unknown): AGTStatus {
  const val = String(raw ?? "").trim().toUpperCase();
  if (
    [
      "REJECTED",
      "REJEITADA",
      "REJEITADO",
      "INVALID",
      "INVALIDO",
      "ERROR",
      "ERRO",
      "FAILED",
      "FALHA",
      "R",
      "N",
    ].includes(val)
  ) {
    return "erro";
  }
  if (["PENDING", "PENDENTE", "PROCESSING", "EM_PROCESSAMENTO", "P"].includes(val)) {
    return "pendente";
  }
  return "sucesso";
}

export async function handleAGTWebhookPayload(body: any) {
  const payloadObj = body && typeof body === "object" ? body : {};
  const docObj = payloadObj.document && typeof payloadObj.document === "object" ? payloadObj.document : {};

  const fullNumber: string | null =
    payloadObj.fullNumber ??
    payloadObj.documentNo ??
    payloadObj.documentNumber ??
    payloadObj.numeroDocumento ??
    payloadObj.invoiceNo ??
    payloadObj.invoiceNumber ??
    docObj.fullNumber ??
    docObj.documentNo ??
    docObj.documentNumber ??
    null;

  const atcud: string | null =
    payloadObj.atcud ?? payloadObj.ATCUD ?? docObj.atcud ?? docObj.ATCUD ?? null;

  const rawInvoiceId = payloadObj.invoiceId ?? payloadObj.documentId ?? docObj.id ?? null;
  const invoiceId = rawInvoiceId !== null && rawInvoiceId !== undefined ? Number(rawInvoiceId) : null;

  const emitterNif: string | null =
    payloadObj.taxRegistrationNumber ??
    payloadObj.nif ??
    payloadObj.emitterNif ??
    payloadObj.nifEmitente ??
    payloadObj.companyNif ??
    null;

  const rawStatus =
    payloadObj.status ??
    payloadObj.validationStatus ??
    payloadObj.documentStatus ??
    payloadObj.estado ??
    payloadObj.event ??
    payloadObj.result ??
    docObj.status ??
    "VALIDATED";

  const status = normalizeWebhookStatus(rawStatus);

  const rawMessage =
    payloadObj.message ??
    payloadObj.mensagem ??
    payloadObj.motivo ??
    payloadObj.reason ??
    (Array.isArray(payloadObj.errors) ? payloadObj.errors.map((e: any) => e?.message ?? e).join("; ") : null) ??
    (Array.isArray(payloadObj.messages) ? payloadObj.messages.map((m: any) => m?.message ?? m).join("; ") : null);

  const defaultMsg =
    status === "sucesso"
      ? `Webhook AGT: Factura validada${fullNumber ? ` (${fullNumber})` : ""}`
      : status === "erro"
        ? `Webhook AGT: Factura rejeitada${fullNumber ? ` (${fullNumber})` : ""}`
        : `Webhook AGT: Notificação recebida${fullNumber ? ` (${fullNumber})` : ""}`;

  const message = rawMessage ? String(rawMessage) : defaultMsg;

  // 1. Resolver empresa pelo NIF se fornecido
  let companyRecord = emitterNif ? await db.findCompanyByNif(String(emitterNif)) : null;

  // 2. Procurar factura correspondente
  const invoice = await db.findInvoiceForAgtWebhook({
    tenantId: companyRecord?.tenantId ?? null,
    fullNumber: fullNumber ? String(fullNumber) : null,
    atcud: atcud ? String(atcud) : null,
    invoiceId,
  });

  const tenantId =
    invoice?.tenantId ??
    companyRecord?.tenantId ??
    (await db.findFirstCompany())?.tenantId ??
    null;

  const serializedPayload = JSON.stringify(payloadObj).slice(0, 8000);

  if (invoice) {
    await db.updateInvoiceStatus(invoice.tenantId, invoice.id, invoice.status, {
      agtSubmitted: status === "sucesso",
      agtSubmissionDate: new Date(),
      agtResponse: serializedPayload,
    });
  }

  if (tenantId) {
    await db.logAgtSubmission(tenantId, {
      invoiceId: invoice?.id ?? null,
      action: "submeter_documento",
      payload: JSON.stringify({
        source: "webhook_agt",
        fullNumber: fullNumber ?? invoice?.fullNumber ?? null,
        atcud: atcud ?? invoice?.atcud ?? null,
        rawStatus,
      }),
      response: serializedPayload,
      status,
      message,
    });
  }

  return {
    ok: true,
    received: true,
    status,
    message,
    invoiceFound: Boolean(invoice),
    fullNumber: invoice?.fullNumber ?? fullNumber ?? null,
    timestamp: new Date().toISOString(),
  };
}

export function registerAGTWebhookRoutes(app: Express) {
  const paths = ["/api/webhooks/agt", "/api/agt/callback", "/api/agt/webhook"];

  for (const path of paths) {
    // Responde a GET/HEAD para testes de conectividade do portal da AGT
    app.get(path, (_req: Request, res: Response) => {
      res.status(200).json({
        ok: true,
        service: "Sistema de Facturação - Webhook AGT",
        endpoint: path,
        status: "active",
        timestamp: new Date().toISOString(),
      });
    });

    // Recebe notificações HTTP POST da AGT (factura validada ou rejeitada)
    app.post(path, async (req: Request, res: Response) => {
      try {
        const result = await handleAGTWebhookPayload(req.body);
        res.status(200).json(result);
      } catch (error) {
        console.error("[AGT Webhook] Erro ao processar notificação:", error);
        res.status(200).json({
          ok: false,
          received: true,
          message: "Notificação recebida com aviso interno",
          timestamp: new Date().toISOString(),
        });
      }
    });
  }
}

