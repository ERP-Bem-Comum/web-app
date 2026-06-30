/**
 * CNPJ VO (branded) — estado inválido irrepresentável (§IV). Smart constructor retorna `Result`.
 * Aceita CNPJ alfanumérico (Serpro/2026): 12 posições `[0-9A-Z]` + 2 dígitos verificadores `[0-9]`.
 * Valida formato (via helper compartilhado) + DV (módulo 11, fórmula Serpro `charCodeAt−48` — resultado
 * idêntico ao numérico legado, zero regressão). O core-api permanece como árbitro final.
 */
import type { Brand } from '#shared/primitives/brand.ts'
import { ok, err, type Result } from '#shared/primitives/result.ts'
import { normalizeCnpj, isValidCnpjFormat } from '#shared/document/cnpj.ts'

export type CNPJ = Brand<string, 'CNPJ'>
export type CNPJError = 'empty' | 'invalid-length' | 'invalid-check-digit'

const WEIGHTS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const
const WEIGHTS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const

// Fórmula Serpro: valor de um caractere = código ASCII − 48 ('0'..'9' → 0..9; 'A'..'Z' → 17..42).
const charValue = (c: string): number => c.charCodeAt(0) - 48

const checkDigit = (base: string, weights: readonly number[]): number => {
  const total = weights.reduce((acc, w, i) => acc + charValue(base.charAt(i)) * w, 0)
  const rest = total % 11
  return rest < 2 ? 0 : 11 - rest
}

export const CNPJ = (raw: string): Result<CNPJ, CNPJError> => {
  const value = normalizeCnpj(raw)
  if (value === '') return err('empty')
  if (value.length !== 14) return err('invalid-length')
  // Formato (shape alfanumérico + anti-degenerado). DV não-numérico ou 14 iguais caem aqui.
  if (!isValidCnpjFormat(value)) return err('invalid-check-digit')
  const d1 = checkDigit(value.slice(0, 12), WEIGHTS_1)
  const d2 = checkDigit(value.slice(0, 13), WEIGHTS_2)
  if (d1 !== Number(value.slice(12, 13)) || d2 !== Number(value.slice(13, 14))) {
    return err('invalid-check-digit')
  }
  // Cast permitido só dentro do smart constructor (§IV).
  return ok(value as CNPJ)
}
