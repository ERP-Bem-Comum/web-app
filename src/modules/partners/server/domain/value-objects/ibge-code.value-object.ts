/**
 * IbgeCode VO (branded) — código IBGE de município: exatamente 7 dígitos (§IV). Smart constructor
 * retorna `Result`. É a identidade do município parceiro (não o nome). O catálogo real é validado pelo
 * core-api (`invalid-ibge-code`); aqui garantimos só o formato.
 */
import type { Brand } from '#shared/primitives/brand.ts'
import { ok, err, type Result } from '#shared/primitives/result.ts'

export type IbgeCode = Brand<string, 'IbgeCode'>
export type IbgeCodeError = 'empty' | 'invalid-format'

export const IbgeCode = (raw: string): Result<IbgeCode, IbgeCodeError> => {
  const value = raw.trim()
  if (value === '') return err('empty')
  if (!/^\d{7}$/.test(value)) return err('invalid-format')
  // Cast permitido só dentro do smart constructor (§IV).
  return ok(value as IbgeCode)
}
