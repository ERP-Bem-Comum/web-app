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
  // ── Exclusão do plano (feature 076 — #453). O `DELETE /:id` recusa em DOIS casos, ambos 409 e
  // INDISTINGUÍVEIS na resposta (o core esconde o slug): plano APROVADO e plano COM FILHO (cenário). UMA tag
  // para os dois de propósito — eleger um deles seria adivinhar qual foi, e a mensagem cobre ambos.
  // No caminho normal isto não chega: o menu já desabilita nos 2 casos (o front sabe `status` e `sceneryCount`
  // na linha). Sobra a CORRIDA — aprovaram/criaram cenário entre o render e o clique — onde o 409 vem mesmo.
  | 'budget-plan-not-deletable'
  // ── Escrita da estrutura de custo (feature 061 — Grupo B). 409 na escrita de plano não-editável (ex.: aprovado).
  | 'budget-plan-not-editable' // 409 nos POSTs de cost-structure — plano não aceita mais escrita de estrutura
  // ── Editar/desativar nó (feature 075 — #454 gap 3). 404 no PATCH de cost-structure. O core devolve 404 tanto
  // p/ plano inexistente quanto p/ nó inexistente (`cost-node-not-found`), e o slug não vem — mas as duas causas
  // significam a MESMA coisa p/ a tela: a árvore em mãos está velha. Tag por CONTEXTO do endpoint (como os 409
  // acima), pra não dizer "plano não encontrado" quando o plano está aberto na frente da usuária.
  | 'cost-node-not-found'
  | 'unexpected' // parse/inesperado (resposta futura do core fora do contrato)
