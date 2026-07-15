/**
 * ReportsError — erro dos Relatórios (leitura) propagado pelo BFF (string union). A UI nunca olha status
 * HTTP — trata só a tag i18n (§V). Read-only: espelha o SUBCONJUNTO mínimo de `FinancialError` (sem
 * estados de negócio como conflict/not-found — os 3 endpoints são GET puros de agregação).
 */
export type ReportsError =
  | 'unauthorized' // 401
  | 'forbidden' // 403 (RBAC)
  | 'validation' // 400 / 422 (shape inválido / regra recusada)
  | 'connectivity' // rede/timeout
  | 'server' // 5xx / parse / inesperado
