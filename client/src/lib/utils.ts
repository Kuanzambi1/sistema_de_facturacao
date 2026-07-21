import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = "AOA"): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(n)) return "0,00 AOA";
  return new Intl.NumberFormat("pt-AO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n) + " " + currency;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("pt-AO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleString("pt-AO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  FT: "Factura",
  FR: "Factura-Recibo",
  FS: "Factura Simplificada",
  FA: "Factura de Adiantamento",
  NC: "Nota de Crédito",
  ND: "Nota de Débito",
  RC: "Recibo",
  RG: "Recibo Global",
};

export const STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  emitida: "Emitida",
  paga: "Paga",
  parcialmente_paga: "Parcialmente Paga",
  anulada: "Anulada",
  vencida: "Vencida",
};

export const STATUS_COLORS: Record<string, string> = {
  rascunho: "badge-rascunho",
  emitida: "badge-emitida",
  paga: "badge-paga",
  parcialmente_paga: "badge-parcialmente_paga",
  anulada: "badge-anulada",
  vencida: "badge-vencida",
};

export const ANGOLA_PROVINCES = [
  "Bengo", "Benguela", "Bié", "Cabinda", "Cuando Cubango",
  "Cuanza Norte", "Cuanza Sul", "Cunene", "Huambo", "Huíla",
  "Luanda", "Lunda Norte", "Lunda Sul", "Malanje", "Moxico",
  "Namibe", "Uíge", "Zaire",
];

export const VAT_RATES = [
  { value: "0", label: "Isento (0%)" },
  { value: "5", label: "Reduzida (5%)" },
  { value: "14", label: "Normal (14%)" },
];

export const PAYMENT_METHODS: Record<string, string> = {
  numerario: "Numerário",
  transferencia: "Transferência Bancária",
  cheque: "Cheque",
  cartao: "Cartão",
  outro: "Outro",
};

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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
