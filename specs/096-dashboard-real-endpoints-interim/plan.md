# Implementation Plan: Dashboard — de-interim dos endpoints reais

**Branch**: `096-dashboard-real-endpoints-interim` | **Date**: 2026-07-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/096-dashboard-real-endpoints-interim/spec.md`

## Summary

Trocar a **fonte placeholder** das agregações cruas do Dashboard (`getDashboardAggregationsPlaceholder`)
por uma **fonte real** que compõe 3 endpoints já expostos pelo core-api (`/financial/dashboard/cost-centers`
#241/#237, `/financial/dashboard/no-contract-suppliers` #242, `/reports/dashboard/realized` #112). A
composição pura (`dashboard.composition.ts`) e o `DashboardStatisticsDto` **não mudam** — a arquitetura já
foi desenhada para trocar só a fonte. Fatiado por widget (P1 cost-centers → P2 suppliers → P3 gráfico) para
entregar valor incrementalmente. Métricas Receita/Maior-Financiador seguem interinas (sem endpoint → handoff).

## Technical Context

**Language/Version**: TypeScript estrito (`erasableSyntaxOnly`) · Node (preset Nitro)
**Meta-framework**: Vite + `@tanstack/react-start` · `@tanstack/react-router`
**Server-state**: TanStack Query · **Validação**: Zod 4 (na borda) · **UI**: React 19 (View intocada)
**Design System**: vanilla-extract (sem mudança — nenhum token/átomo novo)
**Testes**: `node:test` (composição/fonte/schema) + Vitest/jsdom (nenhuma mudança de DOM esperada)
**Project Type**: web app (front + BFF); esta feature é **só server-side** (adapters + application do BFF)
**Scale/Scope**: 0 rota nova · 3 chamadas core-api novas · 1 fonte reescrita · schema da borda revisto

## Constitution Check

_GATE: passar antes da Fase 0. Re-checar após a Fase 1._ Princípios I–XII (constituição do frontend).

| Princípio                            | Aderência | Nota                                                                                                                               |
| ------------------------------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| I. BFF-Orchestrated Boundary         | ✓         | browser só fala com a server fn `getDashboardStatisticsFn`; token server-only. O client compõe os 3 GETs e entrega o DTO completo. |
| II. Errors Are Values                | ✓         | `Result<T,E>`; `mapHttpError` já no client; parse inválido → `server`; sem `throw` pra fora.                                       |
| III. Client×Server Modular           | ✓         | tudo dentro de `modules/financial/server/**`; nenhum import cruzando `public-api`.                                                 |
| IV. Illegal States Unrepresentable   | ✓         | `variation.percentage` é união discriminada (`value`/`no-change`/`new`) — mapear com `switch` exaustivo, sem fabricar percentual.  |
| V. Server-State ≠ UI-State           | ✓         | Dashboard é server-state puro no Query; nada de UI-state novo.                                                                     |
| VI. Validation at the Boundary       | ✓         | cada resposta core-api validada por Zod em `dashboard.schema.ts` antes de virar `DashboardAggregations`.                           |
| VII. Strict TS 6→7                   | ✓         | união discriminada + `as const`; sem enum/namespace.                                                                               |
| VIII. Minimal Dependencies           | ✓         | zero dep nova; `Intl` para formatação já em uso.                                                                                   |
| IX. pnpm Only                        | ✓         | —                                                                                                                                  |
| X. Spec-Driven                       | ✓         | esta spec+plan versionados; sem decisão que exija ADR (consumo aditivo).                                                           |
| XI. Framework-Agnostic Client (MVVM) | ✓         | View e view-model do Dashboard **não mudam**.                                                                                      |
| XII. Reactive Flow via Event Bus     | ✓ (N/A)   | leitura pura; sem eventos.                                                                                                         |

**Veredito**: sem violações. Feature aditiva de consumo. Nenhum ADR necessário.

## Server Functions & Contratos do BFF _(a fronteira — Princ. I)_

A server fn **já existe** e **não muda de assinatura** — só a fonte que ela compõe:

| Server fn                  | Tipo  | Input         | Output                            | core-api consumido (NOVO)                                                                                                                        |
| -------------------------- | ----- | ------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `getDashboardStatisticsFn` | query | — (sem input) | `Result → DashboardStatisticsDto` | `GET /financial/dashboard/cost-centers` · `GET /financial/dashboard/no-contract-suppliers` · `GET /reports/dashboard/realized?budgetPlanId&year` |

**Ponto de troca (único)**: `financial.composition.ts:49` — hoje
`source: { getAggregations: getDashboardAggregationsPlaceholder }`. Passa a apontar para a fonte real
(`getDashboardAggregationsReal({ client })`), que faz os 3 GETs no `client` e monta `DashboardAggregations`.

**Cadeia de erro** (II/V): core-api 4xx/5xx → `resultFetch`→`HttpError` → `mapHttpError` → `FinancialError`
(valor) → server fn `{ ok:false, error }` → UI mapeia por tag i18n. 403 → `forbidden` → "sem permissão".
**Degradação por widget** (FR-006): a fonte real trata cada GET independentemente — um `err` (ex.: gráfico 503) **não** aborta os outros dois; o campo correspondente cai no vazio/interino e os demais preenchem.

## Integração core-api _(prontidão)_

| Capacidade                    | Endpoint                                     | Prontidão | Estratégia                                                                |
| ----------------------------- | -------------------------------------------- | --------- | ------------------------------------------------------------------------- |
| Despesas + Top Centro + Donut | `/financial/dashboard/cost-centers`          | 🟢        | real (P1)                                                                 |
| Fornecedores sem contrato     | `/financial/dashboard/no-contract-suppliers` | 🟢        | real (P2)                                                                 |
| Gráfico Realizado × Previsto  | `/reports/dashboard/realized`                | 🟡        | real (P3) — depende de escolher `budgetPlanId`+`year` e de plano populado |
| Métrica **Receita**           | —                                            | 🔴        | sem endpoint → interino + handoff (issue core-api)                        |
| Métrica **Maior Financiador** | —                                            | 🔴        | sem endpoint → interino + handoff (issue core-api)                        |

⚠️ **Fallback silencioso de driver**: módulo vazio (200, listas `[]`) = `*_DRIVER` não setado no ambiente,
não bug de front (ver nota de projeto). Validar em tela só com o read-model populado.

## Design System Impact

- **Nenhuma mudança**: sem token/átomo/molécula/organismo novo. A View do Dashboard permanece idêntica —
  os tons `dash.*` do donut e a régua de dispensa já existem.

## Data Model (client × server)

- **Forma crua (`DashboardAggregations`)** — decisão técnica central:
  - O `cost-centers` entrega **centavos** + `variation.percentage` como **união discriminada**; o
    `RawMetricAggregation` de hoje é `{ value: string; trendPercent: string }` (pré-formatado interino).
  - **Recomendação**: evoluir a métrica crua para **numérica** (`totalCents` + `variation`), cumprindo o
    intento original ("core devolve números; a composição formata" — comentário em `dashboard.io.ts`).
    Formatação (`Intl`) migra de vez para `dashboard.composition.ts`. Impacto: `RawMetricSchema` +
    `DashboardAggregations` + testes de composição. **Alternativa** (menor raio): formatar dentro da fonte
    real e manter a string — rejeitável por espalhar formatação no adapter. **A confirmar no review-plan.**
  - `revenue`/`topFinancier`: sem dado real → valor neutro **marcado como interino** (não exibir como
    número real fabricado — FR-007).
  - `costCenters` (donut) e `suppliersWithoutContract`: mapeamento direto (centavos já batem); preservar a
    ordem/rank do backend.
  - `monthlyForecast`/`monthlyRealized`: `chart[12]` em **centavos** → converter para **REAIS** (escala do
    eixo Y) na composição/fonte. Não vazar centavos crus pro gráfico.
- **Escolha do plano/ano (US3)**: MVP interino = **ano corrente** + plano padrão/ativo da org; sem plano →
  gráfico vazio. Seletor de plano fica fora desta feature (follow-up, se a P.O. quiser).
- **`dashboard.schema.ts`**: passa a validar a resposta real de cada endpoint (ou um schema por endpoint +
  o assembler produz `DashboardAggregations`). Zod na borda, nunca no domínio.

## Decisões tomadas na P1 (implementado)

- **Formatação na FONTE, não refatorar a métrica p/ numérica**: a composição hoje só REPASSA as strings
  (nunca formatou). Para não tocar DTO/View/composição/testes existentes E não fabricar zeros numéricos
  para `revenue`/`topFinancier` (sem endpoint), a fonte real (`dashboard-statistics.real-source.ts`)
  formata `expenses`/`topCostCenter` e mantém a forma string de `RawMetricAggregation`. Helpers puros
  (`formatBRLFromCents`/`formatVariationPercent`/`formatSharePercent`) exportados e testados.
- **Card "Top Centro de Custo"**: `value` = **nome** do CC (qual é o maior) e `trendPercent` = **participação**
  no total (`totalCents/totalExpenses`). `null`/sem-nome → `—` e `0%`. ⚠️ Confirmar leitura com a P.O. em tela.
- **Donut**: `labelKey` recebe o **nome real** do CC (passa verbatim por `t()`, que devolve a chave ausente);
  CC nulo → key i18n `dashboard.cost-center.slice.none` ("Sem centro de custo"). `id` = `ref` ou `cc-null-<i>`.
- **Degradação POR-WIDGET** (refinado na P2): a fonte busca cost-centers (P1) e fornecedores (P2) em
  **paralelo** (`Promise.all`); um `err` degrada **só a sua parte** para o interino, o outro widget segue
  com dado real. O "Últimos pagamentos" surfa o próprio erro por ter query separada.
- **Fornecedores sem contrato (P2)**: `id` = `supplierRef`, `name` = nome (nulo → `—`), `valorTotalCents`
  = `totalCents`. A composição (`buildSuppliers`) rankeia/corta (top-6). ⚠️ Se aparecer `name` nulo real,
  resolver nome do fornecedor (como no "Últimos pagamentos") vira follow-up.
- **⚠️ Limitação de View (follow-up)**: o `MetricCard` tem a seta `↑` fixa. Com variação real negativa
  ("−8,3%") a seta fica incoerente. Não corrigido na P1 (só camada de dados) — candidato a follow-up.
- `revenue`/`topFinancier` seguem o placeholder (handoff). Gráfico (P3) e fornecedores (P2) idem, por ora.

## Plano de Testes (TDD)

- **Puro (`node:test`)**:
  - `dashboard.schema` — parse das 3 respostas reais (happy + campos `null`: `topCostCenter` null,
    `name` null, variação `new`/`no-change`).
  - fonte real — assembler dos 3 endpoints → `DashboardAggregations`; **degradação por widget** (um GET
    `err` não derruba os outros); conversão centavos→REAIS do gráfico.
  - `dashboard.composition` — testes existentes **continuam verdes** (DTO não muda de forma); adicionar
    caso de variação discriminada se a métrica virar numérica.
- **DOM (Vitest/jsdom)**: nenhuma suite nova esperada (View intocada). Rodar `pnpm test:dom` para garantir
  não-regressão.
- **RED primeiro** nos testes de schema + fonte real.

## Complexity Tracking

> Sem violações do Constitution Check — seção vazia.

## Handoffs (GitHub issues no core-api)

- **Métrica Receita** no Dashboard: não há endpoint. Abrir issue (ou confirmar se entra no escopo do #112).
- **Métrica Maior Financiador**: idem, sem endpoint.
- **Seletor de plano do gráfico** (se a org tiver múltiplos planos/ano): decidir critério de seleção com a P.O.

## Ordem de implementação (fatias independentes)

1. **P1** — client + schema + fonte real do `cost-centers`; ligar métrica Despesas + Top Centro + donut.
   (Maior ganho, sem input.) Trocar o ponto de composição para a fonte real já cobrindo estes campos.
2. **P2** — `no-contract-suppliers` no mesmo client/fonte.
3. **P3** — `reports/dashboard/realized` (resolver `budgetPlanId`+`year`) → séries do gráfico.
4. Fechar: `pnpm verify` + `pnpm test:dom` verdes; validar em tela com read-model populado; abrir handoffs.
