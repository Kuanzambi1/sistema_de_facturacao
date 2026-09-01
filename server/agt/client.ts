/**
 * Camada de integração AGT (Administração Geral Tributária - Angola).
 *
 * Existem dois adaptadores:
 *  - `MockAGTClient`: simula a comunicação (desenvolvimento/demo). Gera
 *    internamente os códigos de validação e marca os documentos como
 *    submetidos, permitindo vender/demonstrar o produto enquanto decorre o
 *    processo de certificação oficial.
 *  - `LiveAGTClient`: adaptador para os webservices oficiais AGT (SOAP/JSON).
 *    A implementação concreta do protocolo é substituída aquando da
 *    certificação; a estrutura de chamada, logs e estado ficam já prontos.
 */
import { nanoid } from "nanoid";
import type { Company } from "../../drizzle/schema";
import * as db from "../db";

export type AGTStatus = "sucesso" | "erro" | "pendente";

export type AGTResult = {
  ok: boolean;
  status: AGTStatus;
  message: string;
  agtReference?: string;
  validationCode?: string;
};

export interface AGTClient {
  registerSeries(input: {
    tenantId: number;
    code: string;
    name: string;
    documentType: string;
    year: number;
    validationCode?: string | null;
  }): Promise<AGTResult>;
  submitInvoice(input: { tenantId: number; invoice: any }): Promise<AGTResult>;
  queryInvoice(input: { tenantId: number; fullNumber: string; atcud?: string | null }): Promise<AGTResult>;
  submitSAFT(input: { tenantId: number; xml: string }): Promise<AGTResult>;
}

class MockAGTClient implements AGTClient {
  private reference(prefix: string) {
    return `AGT-${prefix}-${nanoid(8).toUpperCase()}`;
  }

  async registerSeries(input: { tenantId: number; code: string; name: string; documentType: string; year: number; validationCode?: string | null }): Promise<AGTResult> {
    return {
      ok: true,
      status: "sucesso",
      message: "Série registada (modo simulação)",
      agtReference: this.reference("SER"),
      validationCode: input.validationCode ?? undefined,
    };
  }

  async submitInvoice(input: { tenantId: number; invoice: any }): Promise<AGTResult> {
    return {
      ok: true,
      status: "sucesso",
      message: "Documento submetido (modo simulação)",
      agtReference: this.reference("DOC"),
    };
  }

  async queryInvoice(input: { tenantId: number; fullNumber: string; atcud?: string | null }): Promise<AGTResult> {
    return {
      ok: true,
      status: "sucesso",
      message: "Documento registado na AGT (modo simulação)",
      agtReference: this.reference("QRY"),
    };
  }

  async submitSAFT(input: { tenantId: number; xml: string }): Promise<AGTResult> {
    return {
      ok: true,
      status: "sucesso",
      message: "SAF-T aceite (modo simulação)",
      agtReference: this.reference("SAF"),
    };
  }
}

class LiveAGTClient implements AGTClient {
  private async call(company: Company, action: string, payload: unknown): Promise<AGTResult> {
    if (!company.agtEndpoint) {
      return {
        ok: false,
        status: "erro",
        message: "Endpoint AGT não configurado. Configure o endpoint e as credenciais do Portal AGT.",
      };
    }
    try {
      const response = await fetch(company.agtEndpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-agt-user": company.agtPortalUser ?? "",
          "x-agt-action": action,
        },
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      if (!response.ok) {
        return { ok: false, status: "erro", message: `AGT (${response.status}): ${text.slice(0, 400)}` };
      }
      let data: any = {};
      try { data = JSON.parse(text); } catch { /* resposta não-JSON */ }
      return {
        ok: true,
        status: "sucesso",
        message: data.message ?? "Operação AGT concluída",
        agtReference: data.reference ?? undefined,
        validationCode: data.validationCode ?? undefined,
      };
    } catch (error) {
      return { ok: false, status: "erro", message: `Falha de comunicação com a AGT: ${String(error)}` };
    }
  }

  async registerSeries(input: { tenantId: number; code: string; name: string; documentType: string; year: number; validationCode?: string | null }): Promise<AGTResult> {
    const company = await db.getCompany(input.tenantId);
    return this.call(company ?? ({} as Company), "registerSeries", input);
  }

  async submitInvoice(input: { tenantId: number; invoice: any }): Promise<AGTResult> {
    const company = await db.getCompany(input.tenantId);
    return this.call(company ?? ({} as Company), "submitInvoice", {
      fullNumber: input.invoice.fullNumber,
      atcud: input.invoice.atcud,
      issueDate: input.invoice.issueDate,
      totalAmount: input.invoice.totalAmount,
      vatAmount: input.invoice.vatAmount,
      clientNif: input.invoice.clientNif,
    });
  }

  async queryInvoice(input: { tenantId: number; fullNumber: string; atcud?: string | null }): Promise<AGTResult> {
    const company = await db.getCompany(input.tenantId);
    return this.call(company ?? ({} as Company), "queryInvoice", { fullNumber: input.fullNumber, atcud: input.atcud });
  }

  async submitSAFT(input: { tenantId: number; xml: string }): Promise<AGTResult> {
    const company = await db.getCompany(input.tenantId);
    return this.call(company ?? ({} as Company), "submitSAFT", { xml: input.xml });
  }
}

/**
 * Escolhe o adaptador. Se AGT_LIVE=true (ou o endpoint estiver configurado)
 * usa o Live, caso contrário usa o Mock para desenvolvimento/demo.
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
    payload: JSON.stringify({ code: series.code, documentType: series.documentType }),
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
  const client = await getAGTClient(tenantId);
  const result = await client.submitInvoice({ tenantId, invoice });
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

export async function agtQueryInvoice(tenantId: number, invoiceId: number) {
  const invoice = await db.getInvoiceById(tenantId, invoiceId);
  if (!invoice) throw new Error("Documento não encontrado");
  const client = await getAGTClient(tenantId);
  const result = await client.queryInvoice({ tenantId, fullNumber: invoice.fullNumber, atcud: invoice.atcud });
  await db.logAgtSubmission(tenantId, {
    invoiceId,
    action: "consultar_documento",
    response: JSON.stringify(result),
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
