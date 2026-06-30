/**
 * ReconciliationError — erro da Conciliação Bancária propagado pelo BFF (string union). A UI nunca olha
 * status HTTP — trata só a tag i18n via `reconciliationErrorTag` (§V). Inclui os genéricos
 * (auth/forbidden/connectivity/server/validation/conflict/not-found) + os específicos do contrato
 * (PR #152). Mantido separado de `FinancialError` para não quebrar o `switch` exaustivo daquele.
 */
export type ReconciliationError =
  // genéricos
  | 'not-found' // 404 genérico
  | 'validation' // 400 / 422 genérico (shape inválido / regra recusada)
  | 'conflict' // 409 genérico
  | 'unauthorized' // 401
  | 'forbidden' // 403 (RBAC reconciliation:*)
  | 'connectivity' // rede/timeout
  | 'server' // 5xx / parse / inesperado
  // importação (POST /bank-statements)
  | 'import-unsupported-format' // 400 unsupported-format
  | 'import-empty-content' // 400 empty-content
  | 'import-malformed' // 400 malformed-statement
  | 'import-empty-statement' // 422 empty-statement
  // período
  | 'period-closed' // 409 period-closed
  | 'period-has-pending' // 422 period-has-pending-transactions
  | 'invalid-period-range' // 400 invalid-period-range
  | 'period-not-found' // 404 reconciliation-period-not-found
  // conciliação
  | 'reconciliation-not-balanced' // 422 reconciliation-not-balanced
  | 'transaction-already-reconciled' // 409 transaction-already-reconciled
  | 'account-closed' // 409 account-closed
  | 'payable-not-found' // 404 payable-not-found
  | 'title-not-paid' // 422 title-not-paid
  | 'empty-reconciliation' // 422 empty-reconciliation
  | 'reconciliation-already-undone' // 409 reconciliation-already-undone
  // exportação
  | 'export-unsupported-format' // 400 unsupported-export-format
  // costura (chrome) — backend ainda não existe (#168/#173)
  | 'unavailable' // capability sem endpoint (conta-cedente #168, listar períodos #173)
