# API Readiness — Plano Orçamentário (feature 041 ↔ core-api #113)

**Objetivo:** rastrear a prontidão dos endpoints do core-api que cada fatia do front consome (política
zero-mock: page só integra com endpoint real). Contratos detalhados em [`contracts/core-api-budget-plans.md`](./contracts/core-api-budget-plans.md).
Fonte do port: `HANDBOOK-plano-orcamentario-mapa.md` **Apêndice B** (legado `../ERP-BACKEND`).

## Estado atual (2026-07-01)

- **core-api:** módulo **inexistente**. Só existe `budgetPlanRef` (`varchar(36)` nullable no documento financeiro).
- **Dependências que já existem:** `programs` (Programa) 🟢 · financeiro/conciliação (Realizado = `CONCILIADO`) 🟡.

## Prontidão por fatia (PR)

| Fatia (US)      | Capacidade                                   | Endpoints core-api                                                                                                                              | Prontidão         | Estratégia front                              |
| --------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------- |
| **Fundação**    | preview de cálculo, enums, model, view-model | — (puro)                                                                                                                                        | 🟢 pronto         | **entregue** (sem backend)                    |
| **US1**         | listar/criar plano                           | `GET /budget-plans`, `POST /budget-plans`, `GET /budget-plans/options`                                                                          | 🔴                | model/viewModel prontos; page espera endpoint |
| **US2a**        | estrutura de custos                          | cost-centers CRUD (centro/categoria/subcategoria)                                                                                               | 🔴                | forms/validação adiantáveis                   |
| **US2b**        | orçamento por rede + lançamentos             | `POST/GET/DELETE /budgets`, `POST /budget-results/{ipca\|caed\|personal-expenses\|logistics-expenses}`, `GET /budget-results/all-last-year/...` | 🔴                | preview pronto; grid/modal esperam endpoint   |
| **US3**         | versionar/aprovar/insights                   | `POST /scenery`, `POST /:id/start-calibration`, `PATCH /:id/approve`, `DELETE /:id`, `GET /:id/insights` (+ financial `CONCILIADO`)             | 🔴                | confirmações/toasts adiantáveis               |
| **US4**         | Consolidado ABC + CSV                        | `GET /consolidated-result`, `GET /:id/generate-csv`                                                                                             | 🔴                | matriz/formatação adiantáveis                 |
| **Adiado (#9)** | compartilhamento externo                     | `share-budget-plans/*`, `check-credentials`                                                                                                     | ⚪ fora de escopo | —                                             |

## Ponto de troca (quando o endpoint existir)

Cada page integra pelo **repository → server function** (a fronteira). O `*.model.ts` (Zod) já define a forma
esperada; ao ligar o endpoint real, valida-se a resposta contra o schema e ativa-se a page. Sem fallback/mocks em `src/`.

## Ação recomendada

Abrir/atualizar as **issues do core-api #113** (uma por fatia, na ordem US1→US4), usando os contratos do anexo.
Ver rascunhos em [`contracts/core-api-budget-plans.md`](./contracts/core-api-budget-plans.md) §"Issues sugeridas".
