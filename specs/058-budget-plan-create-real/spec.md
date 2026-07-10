# 058 — Plano de implementação

## Camada server (BFF · DDD)

- `domain/errors/budget-plans.errors.ts`: + `budget-plan-already-exists`, `invalid-input`.
- `application/create-budget-plan.use-case.ts` (NOVO): port `CreateBudgetPlanClient` + command/result + use-case (erro-como-valor).
- `application/list-budget-plan-options.use-case.ts` (NOVO): port `BudgetPlanOptionsClient` + use-case (reusa `RawProgramOption`).
- `adapters/core-api/budget-plans.schema.ts`: + `coreCreateResponseSchema`.
- `adapters/core-api/core-api-budget-plans.ts`: + `createBudgetPlan` (POST via `resultFetch`) + `mapCreateHttpError` (409→already-exists, 401→unauthorized, 400/422→invalid-input, resto→unexpected).
- `adapters/budget-plans-list.io-schemas.ts`: + `CreateBudgetPlanInputSchema` (borda) `{ year:int, programRef:uuid }`.
- `adapters/budget-plans-list.composition.ts`: estende o build p/ expor `createBudgetPlan` + `listProgramOptions`.
- `adapters/server-fns/create-budget-plan.service.fn.ts` (NOVO, POST) e `list-budget-plan-options.query.fn.ts` (NOVO, GET) — auth no handler, Zod na borda, `{ ok, data|error }`.

## Camada client (MVVM)

- `data/model/budget-plan.model.ts`: `CreateBudgetPlanInputSchema` → `{ year:int, programRef:uuid }`; + `BudgetPlanProgramOption` + `CreatedBudgetPlan`.
- `data/repository/budget-plans-error.ts`: + `budget-plan-already-exists`, `invalid-input`.
- `data/repository/budget-plans.repository.ts` (+ `.instance.ts`): + `create`, `getProgramOptions`.
- `planejamento/create-plan.view-model.ts`: `validateCreatePlan` sem `existing` (sem checagem de unicidade); tags `conflict`/`unexpected`; remove `isDuplicatePlan`. + helper puro `createErrorTag(error)` (testável em node).
- `planejamento/create-plan.binding.ts`: `useCreateProgramOptions` → `{ abbreviation, ref }[]`; `useCreatePlan` → `useMutation(repo.create)` (onSuccess invalida + fecha; erro → tag).
- `planejamento/planejamento-list.binding.ts`: exporta `planejamentoListQueryKey` (fonte única da key).
- `planejamento/components/create-plan-modal.component.tsx`: options `{ ref, abbreviation }` (value=ref, label=abbreviation) + `submitting`.
- `planejamento/page/planejamento-list.page.tsx`: rewire.
- Remove `data/planejamento-list.placeholder.ts` e o export `isDuplicatePlan` da public-api.

## Constitution Check (§I–§XII)

- §II erro-como-valor: adapter/use-case sem throw; 409 vira tag. OK.
- §III server-fn única fronteira: create/options via server fn, auth no handler, Zod na borda. OK.
- §V cadeia de erro: UI só vê a tag (`conflict`/`unexpected`), nunca status HTTP. OK.
- §IX Zod na borda; token server-side. OK.
- §XI MVVM: react só no `*.binding.ts`; view-model puro; view burra. OK.

## Testes

- node: `create-plan.view-model` (validate + `createErrorTag`).
- vitest DOM: `create-plan.binding` (sucesso invalida+fecha; 409 → tag de conflito).
  </invoke>
  <invoke name="Bash">
  <parameter name="command">cd /Users/alessandracastro/dev/ERP-FRONTEND && cat > .specify/feature.json <<'EOF'
  {
  "feature_directory": "specs/058-budget-plan-create-real"
  }
  EOF
  echo done
