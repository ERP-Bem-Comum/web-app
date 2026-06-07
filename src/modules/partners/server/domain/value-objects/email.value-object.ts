/**
 * Email VO (branded) — estado inválido irrepresentável (§IV). Validação de formato p/ UX/borda;
 * a autoridade de unicidade/credencial é o core-api. Espelha o padrão de `auth` (VO folha local).
 */
import type { Brand } from '#shared/primitives/brand.ts'
import { ok, err, type Result } from '#shared/primitives/result.ts'

export type Email = Brand<string, 'Email'>
export type EmailError = 'empty' | 'invalid-format'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const Email = (raw: string): Result<Email, EmailError> => {
  const value = raw.trim().toLowerCase()
  if (value === '') return err('empty')
  if (!EMAIL_RE.test(value)) return err('invalid-format')
  // Cast permitido só dentro do smart constructor (§IV).
  return ok(value as Email)
}
