/**
 * FinancialError — erro do submódulo Financeiro propagado pelo BFF (string union; espelha o
 * `FinancialError` do server). Arquivo NEUTRO da camada `client/data`. A UI nunca olha status HTTP —
 * trata só a tag i18n via `financialErrorTag` (§V). Espelha `users-error.ts`.
 */
export type FinancialError =
  | 'not-found'
  | 'invalid-transition'
  | 'net-value-invalid'
  | 'retention-not-allowed'
  | 'document-incomplete'
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'conflict'
  | 'connectivity'
  | 'server'

/** Forma do retorno RPC das server fns do módulo (`{ ok, data } | { ok, error }`). */
export type FnResult<T> =
  | Readonly<{ ok: true; data: T }>
  | Readonly<{ ok: false; error: FinancialError }>
