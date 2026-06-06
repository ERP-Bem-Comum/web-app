/**
 * CPF VO (branded) — estado inválido irrepresentável (§IV). Smart constructor retorna `Result`.
 * Valida 11 dígitos + dígitos verificadores (módulo 11). Aceita entrada formatada (pontua, hífen).
 */
import type { Brand } from '#shared/primitives/brand.ts'
import { ok, err, type Result } from '#shared/primitives/result.ts'

export type CPF = Brand<string, 'CPF'>
export type CPFError = 'empty' | 'invalid-length' | 'invalid-check-digit'

const onlyDigits = (raw: string): string => raw.replace(/\D/g, '')

// DV do CPF: soma ponderada decrescente a partir de `startFactor`, módulo 11.
const checkDigit = (base: string, startFactor: number): number => {
  let total = 0
  for (let i = 0; i < base.length; i += 1) total += Number(base.slice(i, i + 1)) * (startFactor - i)
  const rest = (total * 10) % 11
  return rest === 10 ? 0 : rest
}

export const CPF = (raw: string): Result<CPF, CPFError> => {
  const digits = onlyDigits(raw)
  if (digits === '') return err('empty')
  if (digits.length !== 11) return err('invalid-length')
  if (/^(\d)\1{10}$/.test(digits)) return err('invalid-check-digit') // todos iguais
  const d1 = checkDigit(digits.slice(0, 9), 10)
  const d2 = checkDigit(digits.slice(0, 10), 11)
  if (d1 !== Number(digits.slice(9, 10)) || d2 !== Number(digits.slice(10, 11))) {
    return err('invalid-check-digit')
  }
  // Único lugar onde o cast é permitido: dentro do smart constructor (constituição §IV).
  return ok(digits as CPF)
}
