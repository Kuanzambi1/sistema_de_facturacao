import { describe, expect, it } from "vitest";
import {
  generateATCUD,
  generateDocumentHash,
  getHashControl,
  calculateLineValues,
  calculateInvoiceTotals,
  VAT_RATES,
  DOCUMENT_TYPES,
} from "./fiscal";

describe("Módulo Fiscal AGT", () => {
  // ─── ATCUD ────────────────────────────────────────────────────────────────
  describe("generateATCUD", () => {
    it("deve gerar ATCUD no formato correcto ATCUD:CODIGO-NUMERO", () => {
      const atcud = generateATCUD("DEMO0000", 1);
      expect(atcud).toMatch(/^ATCUD:DEMO0000-\d+$/);
    });

    it("deve incluir o número do documento no ATCUD com padding", () => {
      const atcud = generateATCUD("ABC12345", 42);
      expect(atcud).toBe("ATCUD:ABC12345-00000042");
    });

    it("deve funcionar com diferentes códigos de validação", () => {
      const atcud = generateATCUD("XYZ99999", 100);
      expect(atcud).toBe("ATCUD:XYZ99999-00000100");
    });
  });

  // ─── Hash SHA-256 ─────────────────────────────────────────────────────────
  describe("generateDocumentHash", () => {
    it("deve gerar um hash não vazio", () => {
      const hash = generateDocumentHash({
        issueDate: "2026-06-17",
        systemDate: "2026-06-17",
        fullNumber: "FT A/1",
        grossTotal: 11400,
        previousHash: "",
      });
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe("string");
      expect(hash.length).toBeGreaterThan(10);
    });

    it("deve gerar hashes diferentes para documentos diferentes", () => {
      const params = {
        issueDate: "2026-06-17",
        systemDate: "2026-06-17",
        grossTotal: 11400,
        previousHash: "",
      };
      const hash1 = generateDocumentHash({ ...params, fullNumber: "FT A/1" });
      const hash2 = generateDocumentHash({ ...params, fullNumber: "FT A/2" });
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("getHashControl", () => {
    it("deve retornar os primeiros 4 caracteres do hash", () => {
      const hash = "ABCDEFGHIJ";
      const control = getHashControl(hash);
      expect(control).toBe("ABCD");
    });
  });

  // ─── Cálculo de Linhas ────────────────────────────────────────────────────
  describe("calculateLineValues", () => {
    it("deve calcular correctamente IVA a 14%", () => {
      const result = calculateLineValues({
        quantity: 1,
        unitPrice: 10000,
        discountPercent: 0,
        vatRate: 14,
      });
      expect(result.subtotal).toBe(10000);
      expect(result.vatAmount).toBeCloseTo(1400, 2);
      expect(result.total).toBeCloseTo(11400, 2);
      expect(result.discountAmount).toBe(0);
    });

    it("deve calcular correctamente com desconto", () => {
      const result = calculateLineValues({
        quantity: 2,
        unitPrice: 5000,
        discountPercent: 10,
        vatRate: 14,
      });
      // Gross = 10000, desconto = 1000, taxable = 9000
      expect(result.subtotal).toBeCloseTo(9000, 2);
      expect(result.discountAmount).toBeCloseTo(1000, 2);
      expect(result.vatAmount).toBeCloseTo(1260, 2);
      expect(result.total).toBeCloseTo(10260, 2);
    });

    it("deve calcular correctamente IVA a 0% (isento)", () => {
      const result = calculateLineValues({
        quantity: 1,
        unitPrice: 5000,
        discountPercent: 0,
        vatRate: 0,
      });
      expect(result.vatAmount).toBe(0);
      expect(result.total).toBe(5000);
    });

    it("deve calcular correctamente IVA a 7% (reduzido)", () => {
      const result = calculateLineValues({
        quantity: 3,
        unitPrice: 1000,
        discountPercent: 0,
        vatRate: 7,
      });
      expect(result.subtotal).toBe(3000);
      expect(result.vatAmount).toBeCloseTo(210, 2);
      expect(result.total).toBeCloseTo(3210, 2);
    });
  });

  // ─── Totais da Factura ────────────────────────────────────────────────────
  describe("calculateInvoiceTotals", () => {
    it("deve somar correctamente múltiplas linhas", () => {
      const lines = [
        { subtotal: 10000, vatAmount: 1400, discountAmount: 0, total: 11400 },
        { subtotal: 5000, vatAmount: 700, discountAmount: 0, total: 5700 },
      ];
      const totals = calculateInvoiceTotals(lines);
      expect(totals.subtotal).toBe(15000);
      expect(totals.vatAmount).toBe(2100);
      expect(totals.totalAmount).toBe(17100);
    });

    it("deve calcular correctamente com descontos", () => {
      const lines = [
        { subtotal: 9000, vatAmount: 1260, discountAmount: 1000, total: 10260 },
      ];
      const totals = calculateInvoiceTotals(lines);
      expect(totals.subtotal).toBe(9000);
      expect(totals.discountAmount).toBe(1000);
      expect(totals.totalAmount).toBe(10260);
    });
  });

  // ─── Constantes Fiscais ───────────────────────────────────────────────────
  describe("Constantes Fiscais AGT", () => {
    it("deve ter as taxas de IVA correctas de Angola", () => {
      const rates = VAT_RATES.map(r => r.rate);
      expect(rates).toContain(0);   // Isento
      expect(rates).toContain(5);   // Reduzido
      expect(rates).toContain(14);  // Normal
    });

    it("deve ter os tipos de documento fiscais correctos", () => {
      // DOCUMENT_TYPES é um Record<string, string>
      expect(DOCUMENT_TYPES).toHaveProperty("FT");  // Factura
      expect(DOCUMENT_TYPES).toHaveProperty("FR");  // Factura-Recibo
      expect(DOCUMENT_TYPES).toHaveProperty("FS");  // Factura Simplificada
      expect(DOCUMENT_TYPES).toHaveProperty("NC");  // Nota de Crédito
      expect(DOCUMENT_TYPES).toHaveProperty("ND");  // Nota de Débito
      expect(DOCUMENT_TYPES).toHaveProperty("RC");  // Recibo
    });
  });
});
