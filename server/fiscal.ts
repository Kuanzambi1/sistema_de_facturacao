import crypto from "crypto";

// ─── Tipos de Documentos Fiscais ──────────────────────────────────────────────
export const DOCUMENT_TYPES: Record<string, string> = {
  FT: "Factura",
  FR: "Factura-Recibo",
  FS: "Factura Simplificada",
  FA: "Factura de Adiantamento",
  NC: "Nota de Crédito",
  ND: "Nota de Débito",
  RC: "Recibo",
  RG: "Recibo Global",
};

// ─── Taxas de IVA em Angola ───────────────────────────────────────────────────
export const VAT_RATES = [
  { rate: 0, label: "Isento (0%)" },
  { rate: 5, label: "Reduzida (5%)" },
  { rate: 14, label: "Normal (14%)" },
];

// ─── Províncias de Angola ─────────────────────────────────────────────────────
export const ANGOLA_PROVINCES = [
  "Bengo", "Benguela", "Bié", "Cabinda", "Cuando Cubango",
  "Cuanza Norte", "Cuanza Sul", "Cunene", "Huambo", "Huíla",
  "Luanda", "Lunda Norte", "Lunda Sul", "Malanje", "Moxico",
  "Namibe", "Uíge", "Zaire",
];

// ─── Geração de ATCUD ─────────────────────────────────────────────────────────
/**
 * Gera o ATCUD conforme o formato AGT Angola:
 * ATCUD: {CódigoValidação}-{NúmeroSequencial}
 */
export function generateATCUD(validationCode: string, sequentialNumber: number): string {
  const paddedNumber = String(sequentialNumber).padStart(8, "0");
  return `ATCUD:${validationCode}-${paddedNumber}`;
}

/**
 * Gera um código de validação para uma série de facturação.
 * Em produção, este código deve ser obtido da AGT.
 * Para desenvolvimento, geramos um código baseado nos dados da série.
 */
export function generateValidationCode(seriesCode: string, year: number, documentType: string): string {
  const data = `${seriesCode}${year}${documentType}`;
  return crypto.createHash("sha256").update(data).digest("hex").substring(0, 8).toUpperCase();
}

// ─── Hash SHA-256 para Assinatura Digital ────────────────────────────────────
/**
 * Gera o hash SHA-256 do documento conforme os requisitos AGT.
 * O hash é calculado sobre os campos principais do documento.
 */
export function generateDocumentHash(params: {
  issueDate: string;
  systemDate: string;
  fullNumber: string;
  grossTotal: number;
  previousHash: string;
}): string {
  const data = [
    params.issueDate,
    params.systemDate,
    params.fullNumber,
    params.grossTotal.toFixed(2),
    params.previousHash,
  ].join(";");
  return crypto.createHash("sha256").update(data, "utf8").digest("base64");
}

/**
 * Extrai os primeiros 4 caracteres do hash para controlo visual.
 */
export function getHashControl(hash: string): string {
  return hash.substring(0, 4);
}

// ─── Cálculo de IVA ───────────────────────────────────────────────────────────
export function calculateLineValues(params: {
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  vatRate: number;
}) {
  const { quantity, unitPrice, discountPercent = 0, vatRate } = params;
  const grossAmount = quantity * unitPrice;
  const discountAmount = grossAmount * (discountPercent / 100);
  const subtotal = grossAmount - discountAmount;
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;
  return {
    discountAmount: round2(discountAmount),
    subtotal: round2(subtotal),
    vatAmount: round2(vatAmount),
    total: round2(total),
  };
}

export function calculateInvoiceTotals(
  items: Array<{
    subtotal: number;
    vatAmount: number;
    discountAmount: number;
    total: number;
    isService?: boolean;
  }>,
  withholdingTaxPercent: number = 0
) {
  const subtotal = round2(items.reduce((s, i) => s + i.subtotal, 0));
  const vatAmount = round2(items.reduce((s, i) => s + i.vatAmount, 0));
  const discountAmount = round2(items.reduce((s, i) => s + i.discountAmount, 0));
  
  let withholdingTaxAmount = 0;
  if (withholdingTaxPercent > 0) {
    const serviceSubtotal = items.reduce((s, i) => s + (i.isService ? i.subtotal : 0), 0);
    withholdingTaxAmount = round2(serviceSubtotal * (withholdingTaxPercent / 100));
  }
  
  const totalAmount = round2(subtotal + vatAmount - withholdingTaxAmount);
  
  return { subtotal, vatAmount, discountAmount, withholdingTaxAmount, totalAmount };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── Extenso (Kwanzas) ────────────────────────────────────────────────────────
export function numeroPorExtenso(valor: number): string {
  if (valor === 0) return "Zero Kwanzas";
  
  const unidades = ["", "Um", "Dois", "Três", "Quatro", "Cinco", "Seis", "Sete", "Oito", "Nove"];
  const dezenas10 = ["Dez", "Onze", "Doze", "Treze", "Catorze", "Quinze", "Dezasseis", "Dezassete", "Dezoito", "Dezanove"];
  const dezenas = ["", "Dez", "Vinte", "Trinta", "Quarenta", "Cinquenta", "Sessenta", "Setenta", "Oitenta", "Noventa"];
  const centenas = ["", "Cento", "Duzentos", "Trezentos", "Quatrocentos", "Quinhentos", "Seiscentos", "Setecentos", "Oitocentos", "Novecentos"];

  function converteGrupo(n: number): string {
    if (n === 0) return "";
    if (n === 100) return "Cem";
    
    let res = "";
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    
    if (c > 0) res += centenas[c] + (d > 0 || u > 0 ? " e " : "");
    if (d === 1) {
      res += dezenas10[u];
    } else {
      if (d > 1) res += dezenas[d] + (u > 0 ? " e " : "");
      if (u > 0 && d !== 1) res += unidades[u];
    }
    return res;
  }

  const inteiro = Math.floor(valor);
  const decimal = Math.round((valor - inteiro) * 100);
  let partes = [];

  const milhoes = Math.floor(inteiro / 1000000);
  const milhares = Math.floor((inteiro % 1000000) / 1000);
  const resto = inteiro % 1000;

  if (milhoes > 0) {
    partes.push(converteGrupo(milhoes) + (milhoes === 1 ? " Milhão" : " Milhões"));
  }
  if (milhares > 0) {
    partes.push(converteGrupo(milhares) + " Mil");
  }
  if (resto > 0) {
    if ((milhoes > 0 || milhares > 0) && resto < 100) partes.push("e " + converteGrupo(resto));
    else partes.push(converteGrupo(resto));
  }

  let texto = partes.join(", ").replace(/, e/g, " e");
  texto += inteiro === 1 ? " Kwanza" : " Kwanzas";

  if (decimal > 0) {
    texto += " e " + converteGrupo(decimal) + (decimal === 1 ? " Cêntimo" : " Cêntimos");
  }

  return texto.trim();
}

// ─── Formatação de Valores Monetários ────────────────────────────────────────
export function formatCurrency(amount: number, currency = "AOA"): string {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Geração de SAF-T (AO) XML ───────────────────────────────────────────────
export function generateSAFTXML(data: {
  company: any;
  invoices: any[];
  items: Record<number, any[]>;
  dateFrom: string;
  dateTo: string;
}): string {
  const { company, invoices, items, dateFrom, dateTo } = data;
  const now = new Date().toISOString();

  const invoiceLines = invoices.map((inv) => {
    const lines = items[inv.id] ?? [];
    const lineXML = lines.map((line: any, idx: number) => `
      <Line>
        <LineNumber>${idx + 1}</LineNumber>
        <ProductCode>${escapeXML(line.productCode ?? "SRV")}</ProductCode>
        <ProductDescription>${escapeXML(line.description)}</ProductDescription>
        <Quantity>${Number(line.quantity).toFixed(4)}</Quantity>
        <UnitOfMeasure>${escapeXML(line.unit ?? "UN")}</UnitOfMeasure>
        <UnitPrice>${Number(line.unitPrice).toFixed(4)}</UnitPrice>
        <TaxPointDate>${formatDateISO(inv.issueDate)}</TaxPointDate>
        <Description>${escapeXML(line.description)}</Description>
        <DebitAmount>${inv.documentType === "NC" ? "0.00" : Number(line.total).toFixed(2)}</DebitAmount>
        <CreditAmount>${inv.documentType === "NC" ? Number(line.total).toFixed(2) : "0.00"}</CreditAmount>
        <Tax>
          <TaxType>IVA</TaxType>
          <TaxCountryRegion>AO</TaxCountryRegion>
          <TaxCode>${Number(line.vatRate) === 0 ? "ISE" : "NOR"}</TaxCode>
          <TaxPercentage>${Number(line.vatRate).toFixed(2)}</TaxPercentage>
          <TaxAmount>${Number(line.vatAmount).toFixed(2)}</TaxAmount>
        </Tax>
      </Line>`).join("");

    return `
    <Invoice>
      <InvoiceNo>${escapeXML(inv.fullNumber)}</InvoiceNo>
      <ATCUD>${escapeXML(inv.atcud ?? "")}</ATCUD>
      <DocumentStatus>
        <InvoiceStatus>${getInvoiceStatus(inv.status)}</InvoiceStatus>
        <InvoiceStatusDate>${formatDateISO(inv.updatedAt)}</InvoiceStatusDate>
        <SourceID>Sistema</SourceID>
        <SourceBilling>P</SourceBilling>
      </DocumentStatus>
      <Hash>${escapeXML(inv.hash ?? "")}</Hash>
      <HashControl>${escapeXML(inv.hashControl ?? "")}</HashControl>
      <Period>${new Date(inv.issueDate).getMonth() + 1}</Period>
      <InvoiceDate>${formatDateISO(inv.issueDate)}</InvoiceDate>
      <InvoiceType>${inv.documentType}</InvoiceType>
      <SpecialRegimes>
        <SelfBillingIndicator>0</SelfBillingIndicator>
        <CashVATSchemeIndicator>0</CashVATSchemeIndicator>
        <ThirdPartiesBillingIndicator>0</ThirdPartiesBillingIndicator>
      </SpecialRegimes>
      <SourceID>Sistema</SourceID>
      <SystemEntryDate>${now.substring(0, 19)}</SystemEntryDate>
      <CustomerID>${inv.clientNif ?? "999999999"}</CustomerID>
      ${lines.length > 0 ? lineXML : ""}
      <DocumentTotals>
        <TaxPayable>${Number(inv.vatAmount).toFixed(2)}</TaxPayable>
        <NetTotal>${Number(inv.subtotal).toFixed(2)}</NetTotal>
        <GrossTotal>${Number(inv.totalAmount).toFixed(2)}</GrossTotal>
      </DocumentTotals>
      ${inv.status === "paga" || inv.status === "parcialmente_paga" ? getPaymentXML(inv) : ""}
    </Invoice>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:AO_1.01_01"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Header>
    <AuditFileVersion>1.01_01</AuditFileVersion>
    <CompanyID>${escapeXML(company.nif)}</CompanyID>
    <TaxRegistrationNumber>${escapeXML(company.nif)}</TaxRegistrationNumber>
    <TaxAccountingBasis>F</TaxAccountingBasis>
    <CompanyName>${escapeXML(company.name)}</CompanyName>
    <BusinessName>${escapeXML(company.name)}</BusinessName>
    <CompanyAddress>
      <AddressDetail>${escapeXML(company.address ?? "")}</AddressDetail>
      <City>${escapeXML(company.city ?? "")}</City>
      <Province>${escapeXML(company.province ?? "")}</Province>
      <Country>AO</Country>
    </CompanyAddress>
    <FiscalYear>${new Date(dateFrom).getFullYear()}</FiscalYear>
    <StartDate>${dateFrom}</StartDate>
    <EndDate>${dateTo}</EndDate>
    <CurrencyCode>AOA</CurrencyCode>
    <DateCreated>${now.substring(0, 10)}</DateCreated>
    <TaxEntity>Global</TaxEntity>
    <ProductCompanyTaxID>${escapeXML(company.nif ?? "")}</ProductCompanyTaxID>
    <SoftwareCertificateNumber>${escapeXML(company.softwareValidationNumber ?? "")}</SoftwareCertificateNumber>
    <ProductID>SistemaFacturacaoAGT</ProductID>
    <ProductVersion>1.0.0</ProductVersion>
  </Header>
  <SourceDocuments>
    <SalesInvoices>
      <NumberOfEntries>${invoices.length}</NumberOfEntries>
      <TotalDebit>${invoices.filter(i => i.documentType === "NC").reduce((s: number, i: any) => s + Number(i.totalAmount), 0).toFixed(2)}</TotalDebit>
      <TotalCredit>${invoices.filter(i => i.documentType !== "NC").reduce((s: number, i: any) => s + Number(i.totalAmount), 0).toFixed(2)}</TotalCredit>
      ${invoiceLines}
    </SalesInvoices>
  </SourceDocuments>
</AuditFile>`;
}

function getInvoiceStatus(status: string): string {
  if (status === "anulada") return "A";
  if (status === "paga") return "F";
  return "N";
}

function getPaymentXML(inv: any): string {
  const paymentDate = inv.paymentDate ? formatDateISO(inv.paymentDate) : formatDateISO(inv.issueDate);
  const paymentAmount = inv.paidAmount ?? inv.totalAmount;
  const paymentMethod = inv.paymentMethod ?? "outro";
  const methodLabels: Record<string, string> = {
    numerario: "Numerário",
    transferencia: "Transferência Bancária",
    cheque: "Cheque",
    cartao: "Cartão de Crédito/Débito",
    outro: "Outro",
  };
  return `
      <Payment>
        <PaymentDate>${paymentDate}</PaymentDate>
        <PaymentAmount>${Number(paymentAmount).toFixed(2)}</PaymentAmount>
        <PaymentMethod>${methodLabels[paymentMethod] ?? "Outro"}</PaymentMethod>
      </Payment>`;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDateISO(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().substring(0, 10);
}
