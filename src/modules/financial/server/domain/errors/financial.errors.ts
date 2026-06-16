/**
 * FinancialError — erro do submódulo Financeiro / Contas a Pagar propagado pelo BFF (string union). A UI
 * nunca olha status HTTP — trata só a tag i18n derivada via `financialErrorTag` (§V). Espelha `UsersError`.
 */
export type FinancialError =
  | 'not-found' // document-not-found (404)
  | 'invalid-transition' // invalid-state-transition (409): transição inválida de estado
  | 'net-value-invalid' // net-value-not-positive (422): líquido ≤ 0
  | 'retention-not-allowed' // retention-not-allowed-for-type (422): retenção em tipo ≠ NFS-e/RPA
  | 'document-incomplete' // document-incomplete (422): faltam campos obrigatórios (ex.: vencimento)
  | 'validation' // 400 / 422 genérico (shape inválido / regra recusada)
  | 'unauthorized' // 401
  | 'forbidden' // 403 (RBAC)
  | 'conflict' // 409 genérico
  | 'connectivity' // rede/timeout
  | 'server' // 5xx / parse / inesperado
