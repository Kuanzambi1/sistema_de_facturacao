import { describe, it, expect } from "vitest";
import { calculateLineValues, calculateInvoiceTotals } from "./fiscal-math";

describe("fiscal-math", () => {
  it("calculates line values correctly without discount", () => {
    const result = calculateLineValues({
      quantity: 2,
      unitPrice: 100.5,
      vatRate: 14,
    });
    expect(result.grossAmount).toBe(201);
    expect(result.discountAmount).toBe(0);
    expect(result.subtotal).toBe(201);
    expect(result.vatAmount).toBe(28.14); // 201 * 0.14 = 28.14
    expect(result.total).toBe(229.14);
  });

  it("calculates line values correctly with discount", () => {
    const result = calculateLineValues({
      quantity: 5,
      unitPrice: 200,
      discountPercent: 10,
      vatRate: 14,
    });
    expect(result.grossAmount).toBe(1000);
    expect(result.discountAmount).toBe(100);
    expect(result.subtotal).toBe(900);
    expect(result.vatAmount).toBe(126); // 900 * 0.14
    expect(result.total).toBe(1026);
  });

  it("calculates invoice totals correctly", () => {
    const lines = [
      calculateLineValues({ quantity: 1, unitPrice: 1000, vatRate: 14 }),
      calculateLineValues({ quantity: 2, unitPrice: 500, discountPercent: 10, vatRate: 14 }),
      calculateLineValues({ quantity: 1, unitPrice: 300, vatRate: 0 }),
    ];

    const totals = calculateInvoiceTotals(lines, 0);

    // Gross: 1000 + 1000 + 300 = 2300
    // Discount: 0 + 100 + 0 = 100
    // Subtotal: 1000 + 900 + 300 = 2200
    // VAT: 140 + 126 + 0 = 266
    // Total: 2200 + 266 = 2466

    expect(totals.grossTotal).toBe(2300);
    expect(totals.discountAmount).toBe(100);
    expect(totals.subtotal).toBe(2200);
    expect(totals.vatAmount).toBe(266);
    expect(totals.totalAmount).toBe(2466);
    
    // VAT Breakdown check
    const vat14 = totals.vatBreakdown.find(v => v.rate === 14);
    expect(vat14).toBeDefined();
    expect(vat14?.taxable).toBe(1900);
    expect(vat14?.vat).toBe(266);
    
    const vat0 = totals.vatBreakdown.find(v => v.rate === 0);
    expect(vat0).toBeDefined();
    expect(vat0?.taxable).toBe(300);
    expect(vat0?.vat).toBe(0);
  });
});
