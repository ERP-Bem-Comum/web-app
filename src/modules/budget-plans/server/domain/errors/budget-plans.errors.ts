/**
 * BudgetPlansError — erro do módulo Plano Orçamentário propagado pelo BFF (string union). A UI nunca olha
 * status HTTP — trata só a tag i18n (§V). Ramos de escrita entram com o `POST /budget-plans` (feature 058):
 * `budget-plan-already-exists` (409 — unicidade ano+programa no backend) e `invalid-input` (400/422).
 */
export type BudgetPlansError =
  | 'unauthorized' // 401 — sessão ausente/expirada
  // 403 (RBAC) — a sessão é válida, mas falta a permissão (`budget-plan:read` / `budget-plan:write`).
  // Espelha `FinancialError`/`ReportsError`, que já distinguiam. Sem esta tag o 403 caía em `unexpected` e a
  // tela dizia "Tente novamente" — conselho ERRADO: permissão não se resolve tentando de novo. Cenário real:
  // ambiente semeado antes do #315 tem 42 permissões em vez de 44 (faltam as duas de budget-plan), então o
  // módulo sobe conectado ao banco e responde 403 (core-api#374).
  | 'forbidden'
  | 'budget-plan-already-exists' // 409 — já existe plano p/ esse ano+programa (unicidade server-side)
  | 'budget-plan-not-found' // 404 — plano inexistente (GET /budget-plans/:id — leitura do detalhe, feature 059)
  | 'invalid-input' // 400/422 — payload rejeitado pelo core-api
  // ── Ciclo de vida (feature 060 — ações do menu). Os três são 409 e INDISTINGUÍVEIS por status (o core-api
  // colapsa o slug num `code` público — OWASP), então o mapa é por CONTEXTO do endpoint (mensagem mais provável).
  | 'budget-plan-already-approved' // 409 no `approve` — plano já está aprovado
  | 'budget-plan-not-approved' // 409 no `start-calibration` — calibração só em plano APROVADO
  | 'budget-plan-scenery-needs-draft' // 409 no `scenery` — cenário só em plano NÃO aprovado (rascunho/calibração)
  | 'budget-plan-invalid-transition' // 409 genérico de transição de estado (reservado; nenhum endpoint mapeia hoje)
  // ── Escrita da estrutura de custo (feature 061 — Grupo B). 409 na escrita de plano não-editável (ex.: aprovado).
  | 'budget-plan-not-editable' // 409 nos POSTs de cost-structure — plano não aceita mais escrita de estrutura
  | 'unexpected' // parse/inesperado (resposta futura do core fora do contrato)
