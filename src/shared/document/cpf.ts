/**
 * Helper puro de CPF — normalização e validação de formato + dígito verificador (módulo 11), para a
 * validação na BORDA do client (formulários). O VO branded do BFF
 * (`modules/partners/server/domain/value-objects/cpf.value-object.ts`) segue como a validação de domínio;
 * o core-api é o árbitro final. Funções puras, sem I/O, sem `throw`.
 */

/** Só os dígitos do CPF (remove pontuação/espaços). */
export function normalizeCpf(raw: string): string {
  return raw.replace(/\D/g, '')
}

// DV do CPF: soma ponderada decrescente a partir de `startFactor`, módulo 11.
const checkDigit = (base: string, startFactor: number): number => {
  let total = 0
  for (let i = 0; i < base.length; i += 1) total += Number(base.charAt(i)) * (startFactor - i)
  const rest = (total * 10) % 11
  return rest === 10 ? 0 : rest
}

/** 11 dígitos, não todos iguais, com os dois dígitos verificadores corretos. Aceita entrada mascarada. */
export function isValidCpf(raw: string): boolean {
  const digits = normalizeCpf(raw)
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false
  return (
    checkDigit(digits.slice(0, 9), 10) === Number(digits.charAt(9)) &&
    checkDigit(digits.slice(0, 10), 11) === Number(digits.charAt(10))
  )
}
