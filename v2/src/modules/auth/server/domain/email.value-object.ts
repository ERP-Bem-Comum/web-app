/**
 * Email VO (branded) — estado inválido irrepresentável (§IV). Smart constructor retorna `Result`.
 * Nota: o core-api aceita `z.string()` e decide credencial no domínio (→ invalid-credentials); aqui a
 * validação de formato é só p/ UX/evitar request inútil — a autoridade de credencial é o backend.
 */
import type { Brand } from '../../../../shared/primitives/brand.ts'
import { ok, err, type Result } from '../../../../shared/primitives/result.ts'

export type Email = Brand<string, 'Email'>
export type EmailError = 'empty' | 'invalid-format'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const Email = (raw: string): Result<Email, EmailError> => {
  const value = raw.trim().toLowerCase()
  if (value === '') return err('empty')
  if (!EMAIL_RE.test(value)) return err('invalid-format')
  // Único lugar onde o cast é permitido: dentro do smart constructor (constituição §IV).
  return ok(value as Email)
}
