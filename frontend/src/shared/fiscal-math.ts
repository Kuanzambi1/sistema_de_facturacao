export function toCents(value: number): number {
  return Math.round(value * 100);
}

export function toDecimals(cents: number): number {
  return cents / 100;
}

export interface LineParams {
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  vatRate: number;
  isService?: boolean;
}

export interface LineResult {
  grossAmount: number;
  discountAmount: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  isService: boolean;
  vatRate: number;
}

export function calculateLineValues(params: LineParams): LineResult {
  const unitPriceCents = toCents(params.unitPrice);
  const qty = params.quantity;
  
  const grossAmountCents = Math.round(qty * unitPriceCents);
  
  const discountPercent = params.discountPercent ?? 0;
  const discountAmountCents = Math.round(grossAmountCents * (discountPercent / 100));
  
  const taxableAmountCents = grossAmountCents - discountAmountCents;
  
  const vatAmountCents = Math.round(taxableAmountCents * (params.vatRate / 100));
  
  const totalAmountCents = taxableAmountCents + vatAmountCents;

  return {
    grossAmount: toDecimals(grossAmountCents),
    discountAmount: toDecimals(discountAmountCents),
    subtotal: toDecimals(taxableAmountCents),
    vatAmount: toDecimals(vatAmountCents),
    total: toDecimals(totalAmountCents),
    isService: !!params.isService,
    vatRate: params.vatRate
  };
}

export interface InvoiceTotals {
  grossTotal: number;
  discountAmount: number;
  subtotal: number;
  vatAmount: number;
  withholdingTaxAmount: number;
  totalAmount: number;
  vatBreakdown: Array<{ rate: number; taxable: number; vat: number }>;
}

export function calculateInvoiceTotals(lines: LineResult[], withholdingTaxPercent: number = 0): InvoiceTotals {
  let grossTotalCents = 0;
  let discountTotalCents = 0;
  let taxableTotalCents = 0;
  let vatTotalCents = 0;
  let serviceTaxableCents = 0;
  
  const breakdownMap = new Map<number, { taxableCents: number; vatCents: number }>();

  for (const line of lines) {
    const grossCents = toCents(line.grossAmount);
    const discCents = toCents(line.discountAmount);
    const taxCents = toCents(line.subtotal);
    const vatCents = toCents(line.vatAmount);
    
    grossTotalCents += grossCents;
    discountTotalCents += discCents;
    taxableTotalCents += taxCents;
    vatTotalCents += vatCents;
    
    if (line.isService) {
      serviceTaxableCents += taxCents;
    }
    
    const bd = breakdownMap.get(line.vatRate) || { taxableCents: 0, vatCents: 0 };
    bd.taxableCents += taxCents;
    bd.vatCents += vatCents;
    breakdownMap.set(line.vatRate, bd);
  }

  const withholdingTaxCents = withholdingTaxPercent > 0 
    ? Math.round(serviceTaxableCents * (withholdingTaxPercent / 100)) 
    : 0;
    
  const totalAmountCents = taxableTotalCents + vatTotalCents - withholdingTaxCents;

  const vatBreakdown = Array.from(breakdownMap.entries())
    .map(([rate, vals]) => ({
      rate,
      taxable: toDecimals(vals.taxableCents),
      vat: toDecimals(vals.vatCents)
    }))
    .sort((a, b) => a.rate - b.rate);

  return {
    grossTotal: toDecimals(grossTotalCents),
    discountAmount: toDecimals(discountTotalCents),
    subtotal: toDecimals(taxableTotalCents),
    vatAmount: toDecimals(vatTotalCents),
    withholdingTaxAmount: toDecimals(withholdingTaxCents),
    totalAmount: toDecimals(totalAmountCents),
    vatBreakdown
  };
}
