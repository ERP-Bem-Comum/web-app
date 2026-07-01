# Tasks: Módulo Plano Orçamentário (Planejamento + Consolidado ABC)

**Input**: `specs/041-plano-orcamentario-reproducao/{spec.md, plan.md}` + `HANDBOOK-plano-orcamentario-mapa.md` (Apêndice B).

**Política**: zero-mock (ADR-0011) · zero-regressão · testes antes (TDD, `node:test`) · valores em **centavos**.
Cada page só integra quando o endpoint do core-api existir; até lá, adianta-se o que independe do backend.

## Fase 1 — Setup (estrutura do módulo)

- [ ] T001 Criar estrutura `src/modules/budget-plans/{server,client,public-api}` espelhando `auth`.
- [ ] T002 `public-api/index.ts` (stub de exports).

## Fase 2 — Fundação PURA (independe do backend) 🎯 começa agora

- [ ] T003 [P] Enums `as const` + Zod em `client/data/model/enums.ts`: `BudgetPlanStatus` (RASCUNHO/EM_CALIBRACAO/APROVADO), `ReleaseType` (IPCA/CAED/DESPESAS_PESSOAIS/DESPESAS_LOGISTICAS), `SubCategoryType` (INSTITUCIONAL/REDE), `CostCenterType` ("A PAGAR"/"A RECEBER").
- [ ] T004 [P] Tipos de input dos 4 lançamentos (união discriminada por `releaseType`) em `client/domain/calc/types.ts` (campos `*InCents`).
- [ ] T005 [P] **RED**: testes das 4 fórmulas em `tests/modules/budget-plans/calc-preview.test.ts` (casos derivados do legado).
- [ ] T006 As 4 funções puras de preview + dispatcher em `client/domain/calc/preview.ts` (espelha `calc-total-value-result.ts`, retorna centavos inteiros) → testes GREEN.
- [ ] T007 [P] Helpers de derivação: `deriveEditable(status)`, `sumMonths`, `formatCentsBRL` (via `Intl`) em `client/domain/calc/derive.ts` + testes.

## Fase 3 — US1 Listar/criar plano (Priority: P1) — _aguarda endpoints_

- [ ] T010 [P] [US1] `client/data/model/budget-plan.model.ts` (Zod do retorno do BFF: plano + children + parceiros).
- [ ] T011 [US1] `server/adapters/server-fns/list-budget-plans.server-fn.ts` (+ schema Zod) — **gate: `GET /budget-plans`**.
- [ ] T012 [US1] `server/adapters/server-fns/create-budget-plan.server-fn.ts` — **gate: `POST /budget-plans`**.
- [ ] T013 [US1] `client/data/repository/budget-plans.repository.ts` + `viewModel` da lista (filtros/paginação/derivações).
- [ ] T014 [US1] `client/planejamento/page` + `components` (TreeTable, StatusBadge, Criar Plano modal) + `bind` + rota `src/routes/planejamento`.
- [ ] T015 [US1] Testes DOM (Vitest) da page/binding.

## Fase 4 — US2 Estrutura + edição com preview (Priority: P2) — _aguarda endpoints_

- [ ] T020 [US2] Models/server-fns: getPlan, manageCostCenters, addBudget/deleteBudget, saveResult (4 tipos), getLastYearResults.
- [ ] T021 [US2] Página Detalhe (matriz mês/rede, toggles, Adicionar Orçamento, Insights) + Página Orçamento (grid + "Calculando Gastos" 3 colunas usando os previews da Fase 2).
- [ ] T022 [US2] Regra de edição por status (Aprovado = read-only) no viewModel + guard.

## Fase 5 — US3 Versionamento/insights (P3) & US4 Consolidado ABC (P3) — _aguarda endpoints_

- [ ] T030 [US3] approve/scenery/calibrate/delete (confirmações + toasts + estado "Calculando…"); Insights (realizado = CONCILIADO).
- [ ] T040 [US4] Página Consolidado ABC + disparo de CSV (backend gera).

## Fase 6 — Polish

- [ ] T050 ADR "Preview de cálculo no client espelhando o backend" (skill `adr-author`).
- [ ] T051 Suíte de equivalência preview↔backend (quando os endpoints existirem).
- [ ] T052 `pnpm verify` + `test:dom` verdes; i18n PT das mensagens.

## Dependências

- Fase 2 é **pré-requisito** de tudo e **não depende de backend** — feita primeiro.
- Fases 3–5: cada page é gateada pelo endpoint correspondente (🔴 hoje). Model/viewModel/validação podem adiantar; integração só com endpoint real.

## Estratégia

MVP incremental por PR: Fase 2 (pura) → US1 → US2 → US3/US4, cada uma testável e sem quebrar as anteriores.
