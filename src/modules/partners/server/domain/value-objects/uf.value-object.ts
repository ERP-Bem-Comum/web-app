/**
 * UF VO — union literal fechada das 27 unidades federativas (§IV: make illegal states unrepresentable).
 * Não é Brand de string livre: o conjunto é finito e conhecido. Smart constructor normaliza e valida.
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'

export const UF_VALUES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

export type UF = (typeof UF_VALUES)[number]
export type UFError = 'invalid-uf'

export const UF = (raw: string): Result<UF, UFError> => {
  const value = raw.trim().toUpperCase()
  // Cast permitido só dentro do smart constructor (§IV), após checagem de pertencimento.
  return (UF_VALUES as readonly string[]).includes(value) ? ok(value as UF) : err('invalid-uf')
}
