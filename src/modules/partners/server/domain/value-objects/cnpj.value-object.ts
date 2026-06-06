/**
 * CNPJ VO (branded) — estado inválido irrepresentável (§IV). Smart constructor retorna `Result`.
 * Valida 14 dígitos + dígitos verificadores (módulo 11 com pesos). Aceita entrada formatada.
 */
import type { Brand } from '#shared/primitives/brand.ts'
import { ok, err, type Result } from '#shared/primitives/result.ts'

export type CNPJ = Brand<string, 'CNPJ'>
export type CNPJError = 'empty' | 'invalid-length' | 'invalid-check-digit'

const onlyDigits = (raw: string): string => raw.replace(/\D/g, '')

const WEIGHTS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const
const WEIGHTS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const

const checkDigit = (base: string, weights: readonly number[]): number => {
  const total = weights.reduce((acc, w, i) => acc + Number(base.slice(i, i + 1)) * w, 0)
  const rest = total % 11
  return rest < 2 ? 0 : 11 - rest
}

export const CNPJ = (raw: string): Result<CNPJ, CNPJError> => {
  const digits = onlyDigits(raw)
  if (digits === '') return err('empty')
  if (digits.length !== 14) return err('invalid-length')
  if (/^(\d)\1{13}$/.test(digits)) return err('invalid-check-digit') // todos iguais
  const d1 = checkDigit(digits.slice(0, 12), WEIGHTS_1)
  const d2 = checkDigit(digits.slice(0, 13), WEIGHTS_2)
  if (d1 !== Number(digits.slice(12, 13)) || d2 !== Number(digits.slice(13, 14))) {
    return err('invalid-check-digit')
  }
  // Cast permitido só dentro do smart constructor (§IV).
  return ok(digits as CNPJ)
}
