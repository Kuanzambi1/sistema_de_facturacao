// Converte um valor monetário em Kwanzas para a sua representação por
// extenso, em português — exigido no documento fiscal (Art. 10.º do
// Decreto Presidencial n.º 71/25: "preço unitário e total, incluindo por extenso").

const UNIDADES = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const DEZ_A_DEZANOVE = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezasseis', 'dezassete', 'dezoito', 'dezanove'];
const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CENTENAS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

function grupoPorExtenso(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cem';

  const c = Math.floor(n / 100);
  const resto = n % 100;
  const partes: string[] = [];

  if (c > 0) partes.push(CENTENAS[c]);

  if (resto > 0) {
    if (resto < 10) partes.push(UNIDADES[resto]);
    else if (resto < 20) partes.push(DEZ_A_DEZANOVE[resto - 10]);
    else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      partes.push(u > 0 ? `${DEZENAS[d]} e ${UNIDADES[u]}` : DEZENAS[d]);
    }
  }

  return partes.join(' e ');
}

function inteiroPorExtenso(n: number): string {
  if (n === 0) return 'zero';

  const milhoes = Math.floor(n / 1_000_000);
  const milhares = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;

  const partes: string[] = [];
  if (milhoes > 0) partes.push(milhoes === 1 ? 'um milhão' : `${inteiroPorExtenso(milhoes)} milhões`);
  if (milhares > 0) partes.push(milhares === 1 ? 'mil' : `${grupoPorExtenso(milhares)} mil`);
  if (resto > 0) partes.push(grupoPorExtenso(resto));

  return partes.join(', ').replace(/,([^,]*)$/, resto > 0 && (milhoes > 0 || milhares > 0) ? ' e$1' : '$1');
}

export function valorPorExtenso(valor: number): string {
  const kwanzas = Math.floor(Math.abs(valor));
  const centimos = Math.round((Math.abs(valor) - kwanzas) * 100);

  const precisaDe = kwanzas >= 1_000_000 && kwanzas % 1_000_000 === 0;
  const parteKwanzas = `${inteiroPorExtenso(kwanzas)}${precisaDe ? ' de' : ''} ${kwanzas === 1 ? 'kwanza' : 'kwanzas'}`;
  if (centimos === 0) return capitalize(parteKwanzas);

  const parteCentimos = `${inteiroPorExtenso(centimos)} ${centimos === 1 ? 'cêntimo' : 'cêntimos'}`;
  return capitalize(`${parteKwanzas} e ${parteCentimos}`);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
