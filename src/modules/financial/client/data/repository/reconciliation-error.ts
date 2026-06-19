/**
 * ReconciliationError — erro da Conciliação Bancária propagado pelo BFF (string union; espelha o
 * `ReconciliationError` do server). Arquivo NEUTRO da camada `client/data`. A UI nunca olha status HTTP —
 * trata só a tag i18n via `reconciliationErrorTag` (§V). Espelha `financial-error.ts`.
 */
export type ReconciliationError =
  | 'not-found'
  | 'validation'
  | 'conflict'
  | 'unauthorized'
  | 'forbidden'
  | 'connectivity'
  | 'server'
  | 'import-unsupported-format'
  | 'import-empty-content'
  | 'import-malformed'
  | 'import-empty-statement'
  | 'period-closed'
  | 'period-has-pending'
  | 'invalid-period-range'
  | 'period-not-found'
  | 'reconciliation-not-balanced'
  | 'transaction-already-reconciled'
  | 'account-closed'
  | 'payable-not-found'
  | 'title-not-paid'
  | 'empty-reconciliation'
  | 'reconciliation-already-undone'
  | 'export-unsupported-format'
  | 'unavailable'

/** Forma do retorno RPC das server fns da conciliação (`{ ok, data } | { ok, error }`). */
export type ReconFnResult<T> =
  | Readonly<{ ok: true; data: T }>
  | Readonly<{ ok: false; error: ReconciliationError }>
