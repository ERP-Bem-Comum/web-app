/**
 * Helper puro de CNPJ — fonte única de normalização/formato/máscara no front (feature 027,
 * CNPJ alfanumérico Serpro/2026, espelhando o kernel do core-api: `^[0-9A-Z]{12}[0-9]{2}$`).
 *
 * NÃO valida dígito verificador (DV) — isso é regra de domínio e vive no VO de CNPJ
 * (`modules/partners/server/domain/value-objects/cnpj.value-object.ts`). Aqui só formato/máscara.
 * Funções puras e idempotentes. Sem I/O, sem `throw`.
 */

const PUNCTUATION = /[.\-/\s]/g
const NON_ALNUM = /[^0-9A-Za-z]/g
const CNPJ_SHAPE = /^[0-9A-Z]{12}[0-9]{2}$/
const DEGENERATE = /^(.)\1{13}$/
const onlyDigits = (value: string): string => value.replace(/\D/g, '')

/** Remove pontuação/espaços e aplica maiúsculas. Espelha o core-api (`replace(/[.\-/\s]/g,'').toUpperCase()`). */
export function normalizeCnpj(raw: string): string {
  return raw.replace(PUNCTUATION, '').toUpperCase()
}

/** Forma "crua" do CNPJ no estado do input: só alfanuméricos, uppercase, no máximo 14 caracteres. */
export function unmaskCnpj(raw: string): string {
  return raw.replace(NON_ALNUM, '').toUpperCase().slice(0, 14)
}

/** Apenas FORMATO: 12 alfanuméricos + 2 dígitos, rejeitando 14 caracteres idênticos. Não valida DV. */
export function isValidCnpjFormat(raw: string): boolean {
  const value = normalizeCnpj(raw)
  return CNPJ_SHAPE.test(value) && !DEGENERATE.test(value)
}

/** true quando o valor normalizado tem exatamente 14 caracteres. */
export function isCnpjLength(raw: string): boolean {
  return normalizeCnpj(raw).length === 14
}

/** Máscara CNPJ alfanumérica: XX.XXX.XXX/XXXX-NN (X=[0-9A-Z], N=[0-9]). Agrupa parcialmente na digitação. */
export function maskCnpj(raw: string): string {
  const x = unmaskCnpj(raw)
  let out = x.slice(0, 2)
  if (x.length > 2) out += `.${x.slice(2, 5)}`
  if (x.length > 5) out += `.${x.slice(5, 8)}`
  if (x.length > 8) out += `/${x.slice(8, 12)}`
  if (x.length > 12) out += `-${x.slice(12, 14)}`
  return out
}

/** Máscara CPF (11 dígitos numéricos): 000.000.000-00. */
export function maskCpf(raw: string): string {
  const x = onlyDigits(raw).slice(0, 11)
  let out = x.slice(0, 3)
  if (x.length > 3) out += `.${x.slice(3, 6)}`
  if (x.length > 6) out += `.${x.slice(6, 9)}`
  if (x.length > 9) out += `-${x.slice(9, 11)}`
  return out
}

/** Campo combinado: presença de letra ⇒ CNPJ; senão ≤11 ⇒ CPF, 12–14 ⇒ CNPJ (comprimento normalizado). */
export function maskCpfCnpj(raw: string): string {
  const value = unmaskCnpj(raw)
  const hasLetter = /[A-Z]/.test(value)
  return hasLetter || value.length > 11 ? maskCnpj(raw) : maskCpf(raw)
}
