/**
 * BudgetPlansError — erro do módulo Plano Orçamentário propagado pelo BFF (string union). A UI nunca olha
 * status HTTP — trata só a tag i18n (§V). Ramos de escrita entram com o `POST /budget-plans` (feature 058):
 * `budget-plan-already-exists` (409 — unicidade ano+programa no backend) e `invalid-input` (400/422).
 */
export type BudgetPlansError =
  | 'unauthorized' // 401 — sessão ausente/expirada
  | 'budget-plan-already-exists' // 409 — já existe plano p/ esse ano+programa (unicidade server-side)
  | 'budget-plan-not-found' // 404 — plano inexistente (GET /budget-plans/:id — leitura do detalhe, feature 059)
  | 'invalid-input' // 400/422 — payload rejeitado pelo core-api
  // ── Ciclo de vida (feature 060 — ações do menu). Os três são 409 e INDISTINGUÍVEIS por status (o core-api
  // colapsa o slug num `code` público — OWASP), então o mapa é por CONTEXTO do endpoint (mensagem mais provável).
  | 'budget-plan-already-approved' // 409 no `approve` — plano já está aprovado
  | 'budget-plan-not-approved' // 409 no `scenery` — só planos aprovados geram cenário
  | 'budget-plan-invalid-transition' // 409 no `start-calibration` — transição de estado inválida (genérico)
  // ── Escrita da estrutura de custo (feature 061 — Grupo B). 409 na escrita de plano não-editável (ex.: aprovado).
  | 'budget-plan-not-editable' // 409 nos POSTs de cost-structure — plano não aceita mais escrita de estrutura
  | 'unexpected' // parse/inesperado (resposta futura do core fora do contrato)
