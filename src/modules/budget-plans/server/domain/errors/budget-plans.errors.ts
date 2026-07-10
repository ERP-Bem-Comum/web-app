/**
 * BudgetPlansError — erro do módulo Plano Orçamentário propagado pelo BFF (string union). A UI nunca olha
 * status HTTP — trata só a tag i18n (§V). Ramos de escrita entram com o `POST /budget-plans` (feature 058):
 * `budget-plan-already-exists` (409 — unicidade ano+programa no backend) e `invalid-input` (400/422).
 */
export type BudgetPlansError =
  | 'unauthorized' // 401 — sessão ausente/expirada
  | 'budget-plan-already-exists' // 409 — já existe plano p/ esse ano+programa (unicidade server-side)
  | 'invalid-input' // 400/422 — payload rejeitado pelo core-api
  | 'unexpected' // parse/inesperado (resposta futura do core fora do contrato)
