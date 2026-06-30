/**
 * Phone VO (branded) — telefone BR normalizado para dígitos (10 ou 11). Estado inválido irrepresentável (§IV).
 */
import type { Brand } from '#shared/primitives/brand.ts'
import { ok, err, type Result } from '#shared/primitives/result.ts'

export type Phone = Brand<string, 'Phone'>
export type PhoneError = 'empty' | 'invalid-length'

export const Phone = (raw: string): Result<Phone, PhoneError> => {
  const digits = raw.replace(/\D/g, '')
  if (digits === '') return err('empty')
  if (digits.length < 10 || digits.length > 11) return err('invalid-length')
  // Cast permitido só dentro do smart constructor (§IV).
  return ok(digits as Phone)
}
