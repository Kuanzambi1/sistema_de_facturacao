/**
 * Validação estrutural de NIF angolano (10 dígitos).
 * É uma validação de forma (advisory): não bloqueia a gravação, mas alerta
 * o utilizador para erros de digitação.
 */

export type NifValidation = { ok: boolean; message?: string };

export function validateNif(nif?: string | null): NifValidation {
  if (!nif || !nif.trim()) {
    return { ok: true, message: "NIF opcional" };
  }
  const trimmed = nif.trim();
  if (!/^\d{10}$/.test(trimmed)) {
    return { ok: false, message: "NIF deve ter 10 dígitos (apenas números)" };
  }
  return { ok: true };
}

export function isValidAngolanNif(nif?: string | null): boolean {
  return validateNif(nif).ok;
}
