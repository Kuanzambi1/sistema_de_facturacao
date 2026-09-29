import { describe, it } from "node:test";
import assert from "node:assert";
import { calculateLineValues, calculateInvoiceTotals } from "./fiscal-math.ts";

describe("fiscal-math", () => {
  it("calculates line values correctly without discount", () => {
    const result = calculateLineValues({
      quantity: 2,
      unitPrice: 100.5,
      vatRate: 14,
    });
    assert.strictEqual(result.grossAmount, 201);
    assert.strictEqual(result.discountAmount, 0);
    assert.strictEqual(result.subtotal, 201);
    assert.strictEqual(result.vatAmount, 28.14);
    assert.strictEqual(result.total, 229.14);
  });

  it("calculates line values correctly with discount", () => {
    const result = calculateLineValues({
      quantity: 5,
      unitPrice: 200,
      discountPercent: 10,
      vatRate: 14,
    });
    assert.strictEqual(result.grossAmount, 1000);
    assert.strictEqual(result.discountAmount, 100);
    assert.strictEqual(result.subtotal, 900);
    assert.strictEqual(result.vatAmount, 126);
    assert.strictEqual(result.total, 1026);
  });

  it("calculates invoice totals correctly", () => {
    const lines = [
      calculateLineValues({ quantity: 1, unitPrice: 1000, vatRate: 14 }),
      calculateLineValues({ quantity: 2, unitPrice: 500, discountPercent: 10, vatRate: 14 }),
      calculateLineValues({ quantity: 1, unitPrice: 300, vatRate: 0 }),
    ];
    const totals = calculateInvoiceTotals(lines, 0);

    assert.strictEqual(totals.grossTotal, 2300);
    assert.strictEqual(totals.discountAmount, 100);
    assert.strictEqual(totals.subtotal, 2200);
    assert.strictEqual(totals.vatAmount, 266);
    assert.strictEqual(totals.totalAmount, 2466);
  });
});
