# Plan 060 — Ações + Insights (Grupo A)

## Constitution Check (§I–§XII)

- §III server-fn única fronteira: 1 fn por caso de uso (approve/start-calibration/create-scenery/export-csv/insights); auth no handler; Zod na borda (§IX).
- §II/§V erros como valores: `Result` no server; `{ ok, data|error }` na fronteira; tags de ciclo de vida mapeadas por STATUS; UI nunca olha HTTP.
- §XI MVVM: mutations/insights só em `*.binding.ts` (React); repository/model sem React; views burras recebem tudo por props.
- §X só-tokens: modal de insights e itens desabilitados reusam CSS tokenizado existente.
- §IV união discriminada: estado do insights (loading|error|ready); switch exaustivo nos mapeadores de erro.

## Server (BFF · DDD)

1. `domain/errors/budget-plans.errors.ts` — +3 tags de ciclo de vida.
2. `domain/plan-actions.io.ts` — tipos `LifecyclePlan`, `CreatedScenery`, `BudgetPlanInsights`, `BudgetPlanCsv`.
3. `adapters/core-api/budget-plans.schema.ts` — schemas `coreLifecyclePlanSchema`, `coreScenerySchema`, `coreInsightsSchema`.
4. `adapters/core-api/core-api-budget-plans.ts` — métodos `approvePlan`, `startCalibration`, `createScenery`, `generateCsv` (resultFetchText), `getInsights` + mappers de erro por contexto.
5. `application/*.use-case.ts` — 5 use-cases (ports próprios) pass-through/serialização mínima.
6. `adapters/budget-plans-list.io-schemas.ts` — inputs Zod (`{id}`, `{id,name}`).
7. `adapters/server-fns/*` — 5 server fns (auth no handler).
8. `adapters/budget-plans-list.composition.ts` — expõe os 5 casos.

## Client (MVVM)

9. `data/repository/budget-plans-error.ts` — espelha as 3 tags novas.
10. `data/model/plan-actions.model.ts` — tipos client `LifecyclePlan`, `CreatedScenery`, `BudgetPlanInsights`.
11. `data/repository/budget-plans.repository.ts` (+ `.instance.ts`) — +5 métodos.
12. `planejamento/plan-actions.view-model.ts` — helper `ACTION_ENABLEMENT` / `isActionEnabled` (share/planned-vs-actual/delete desabilitados) + tag de erro por ação (puro).
13. `planejamento/plan-actions.binding.ts` — `usePlanActions()` (mutations approve/calibration/scenery/export-csv; pending por ação; invalidação lista+detalhe; download CSV).
14. `planejamento/detalhe/plan-insights.binding.ts` — `usePlanInsights(id)` (query lazy; open/close; estado discriminado).
15. Componentes: `plan-insights-modal.component.tsx` (+ css); `plan-actions-menu` ganha `disabledActions` + `disabledTitle`.
16. Páginas: `planejamento-list.page.tsx` (wire mutations no confirm + export + itens disabled); `plan-detail.page.tsx` (menu "…" real + Insights ativo).

## Tests

- node: mappers de erro de ciclo de vida (por endpoint) + `isActionEnabled` + serialização de insights/scenery.
- vitest DOM: menu dispara a mutation certa; scenery exige nome; insights renderiza; share/planned/delete `disabled`; export dispara download.

## Gaps de backend

- 409 de ciclo de vida indistinguíveis por status (mapa por contexto).
- `GET /options` 500 (core-api#394) → filtro por Rede segue desabilitado.
- Sem `DELETE /budget-plans/:id` → Excluir desabilitado.
  </content>
