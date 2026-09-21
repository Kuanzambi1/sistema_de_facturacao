import aoTaxes from "./ao-taxes.json";
import aoTaxExemptions from "./ao-tax-exemptions.json";
import aoCae from "./ao-cae.json";
import aoIec from "./ao-iec.json";
import aoCabinda from "./ao-cabinda-anexo-iii.json";

export const TAX_RATES = aoTaxes;
export const TAX_EXEMPTIONS = aoTaxExemptions;
export const CAE_CODES = aoCae;
export const IEC_CODES = aoIec;
export const CABINDA_EXEMPTIONS = aoCabinda;

export type TaxRate = typeof aoTaxes[number];
export type TaxExemption = typeof aoTaxExemptions[number];
export type CaeCode = typeof aoCae[number];
export type IecCode = typeof aoIec[number];
