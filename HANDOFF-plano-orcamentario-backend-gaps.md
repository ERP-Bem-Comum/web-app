# HANDOFF — Gaps do backend para o fluxo REAL do Plano Orçamentário

> **Objetivo:** rodar o fluxo inteiro com **dado real** — criar plano → estrutura de custo (4 tipos de
> lançamento) → orçamento por rede → **Calcular Gasto** (4 calculadoras) → **grid mensal** → Insights → Cenário.
> Hoje a tela de **Orçamento** (grid + modal "Calculando Gastos") e o **Insight** são **front-first placeholder**
> por falta de peça no backend. Este doc mapeia o que existe e o que falta, com evidência.
>
> _Levantado contra o core-api rodando na stack local (`api.localhost`, `/api/v2`) + inspeção do MySQL
> (`bgp_\*`). Data: 2026-07-11.\_

## O que JÁ existe (verde) no core-api

| Recurso                                                        | Endpoint                                               | Status                |
| -------------------------------------------------------------- | ------------------------------------------------------ | --------------------- |
| Lista de planos                                                | `GET /budget-plans`                                    | ✅                    |
| Criar plano                                                    | `POST /budget-plans`                                   | ✅                    |
| Options (abreviação)                                           | `GET /budget-plans/options`                            | ✅                    |
| Detalhe (header)                                               | `GET /budget-plans/:id`                                | ✅                    |
| Estrutura de custo (só árvore)                                 | `GET /budget-plans/:id/cost-structure`                 | ✅                    |
| CRUD estrutura (centro/categoria/subcategoria + `launch_type`) | `POST …/cost-centers`, `/categories`, `/subcategories` | ✅                    |
| Orçamento por rede                                             | `addBudget` / `deleteBudget` / `GET …/options` de rede | ✅                    |
| **Leitura** de resultados de cálculo                           | `GET /budget-plans/budget-results/by-budget/:budgetId` | ✅ (401 auth)         |
| **Escrita** de cálculo — IPCA                                  | `POST /budget-plans/budget-results/ipca`               | ✅ (400 valida corpo) |
| **Escrita** de cálculo — CAED                                  | `POST /budget-plans/budget-results/caed`               | ✅ (400 valida corpo) |
| Insights                                                       | `GET /budget-plans/:id/insights`                       | ✅ (parcial — ver G5) |
| Export CSV                                                     | `GET /budget-plans/:id/generate-csv`                   | ✅                    |
| Cenário                                                        | `POST /budget-plans/:id/scenery`                       | ⚠️ existe mas ver G4  |

## Gaps (bloqueiam o fluxo real)

### G1 — 🔴 BLOQUEADOR: o grid MENSAL de Orçamento não tem fonte real

A tela de edição de Orçamento (HANDBOOK §1.7) mostra **CATEGORIAS × 12 MESES** com valor por subcategoria.
Mas o backend **não guarda valor mensal**:

```
bgp_budget_results:  id · budget_id · subcategory_id · model · value_cents
```

→ é **UM valor ANUAL por rede×subcategoria** (marcado pelo `model`: IPCA/CAED/…). **Não há dimensão de mês**,
nem tabela mensal (só existem `bgp_budget_plans/_budgets/_results/_cost_centers/_categories/_subcategories`).

A decisão registrada (spec 067) foi "o backend guarda o anual; a distribuição mensal é da UI" — mas isso implica
que **o mensal não é persistido**: ao recarregar, os 12 valores somem. Logo o grid mensal **não tem como ser real**.

**Decisão de produto/backend necessária (uma das 3):**

- **(a)** backend passa a guardar os **12 valores mensais** por rede×subcategoria (nova coluna/tabela), ou
- **(b)** o grid de Orçamento passa a exibir o **ANUAL** (redesign — sem as 12 colunas de mês), ou
- **(c)** persistir a **distribuição mensal** (ex.: JSON de 12 posições) junto ao `budget_result`.

> Enquanto isso o grid fica placeholder. **O DETALHE "Por Rede" já exibe o ANUAL real** (o front combina
> `cost-structure` + `by-budget` — feito na fatia BFF A+B, PR #207).

### G2 — ✅ NÃO É GAP (os 4 calculadores existem) — issue #414 fechada

Correção: os 2 "faltantes" existem, só com **nomes diferentes** do que eu testei. Confirmado no `dev` + probe (400 = existe):

| Tipo de lançamento  | Endpoint                                       | Status |
| ------------------- | ---------------------------------------------- | ------ |
| IPCA                | `POST …/budget-results/ipca`                   | ✅ 400 |
| CAED                | `POST …/budget-results/caed`                   | ✅ 400 |
| Despesas Pessoais   | `POST …/budget-results/**personal-expenses**`  | ✅ 400 |
| Despesas Logísticas | `POST …/budget-results/**logistics-expenses**` | ✅ 400 |

**Os 4 calculadores estão prontos.** O único bloqueador real do fluxo de Orçamento é o **G1** (grid mensal vs anual).

### G3 — 🟡 Leitura consolidada da estrutura COM valores (conveniência, não-bloqueador)

`cost-structure` devolve **só a árvore** (sem valores). O front monta o anual por rede×sub combinando
`cost-structure` + N chamadas `by-budget` (1 por rede). Um GET consolidado (estrutura + valores por rede numa
resposta) reduziria o fan-out. Opcional.

### G4 — ✅ RESOLVIDO (era fix de FRONT, não gap de backend) — PR #210

`POST /:id/scenery` existe e o **contrato do core está correto**. A UI caía em `unexpected` porque o
`coreScenerySchema` do front exigia um campo **`name`** — mas o core devolve a forma de transição
(`lifecyclePlanResponseSchema`) com o nome do cenário em **`scenarioName`** (nullable). O `safeParse` falhava →
`unexpected`. Diagnóstico feito **lendo a fonte do core** (`schemas.ts` / `budget-plan-dto.ts`), sem captura em
runtime. **Fix no front** (web-app PR #210): `coreScenerySchema` passa a ler `scenarioName`; `createScenery`
mapeia `name = scenarioName ?? command.name`. (A suspeita inicial de `version` numérico estava errada — `version`
já é string no core.)

### G5 — 🟡 Insights: confirmar fonte do "Realizado" e "Média de N Estados"

`GET /:id/insights` responde, mas na tela apareceu **Realizado R$ 11.450.000** com **"Média de 0 Estados"**.
Confirmar com o backend: (a) o "Realizado" vem mesmo da **soma dos lançamentos `CONCILIADO` do Financeiro**
(§1.6)? (b) "Média de N Estados" deveria contar as **redes do plano** — hoje veio 0.

## Issues abertas (core-api) / PRs (web-app)

| Gap                                 | Onde                | Link                                                         |
| ----------------------------------- | ------------------- | ------------------------------------------------------------ |
| G1 (grid mensal)                    | core-api            | [#413](https://github.com/ERP-Bem-Comum/core-api/issues/413) |
| G2 (calculadoras Pessoal/Logística) | core-api            | [#414](https://github.com/ERP-Bem-Comum/core-api/issues/414) |
| G3 (GET consolidado)                | core-api            | [#415](https://github.com/ERP-Bem-Comum/core-api/issues/415) |
| G4 (contrato /scenery)              | **web-app** (front) | PR #210 — ✅ resolvido                                       |
| G5 (insights)                       | core-api            | [#416](https://github.com/ERP-Bem-Comum/core-api/issues/416) |

## Sequência recomendada para destravar o fluxo real

1. **Decidir G1** (mensal × anual no grid) — é o bloqueador macro; define o resto.
2. **G2** — expor as 2 calculadoras faltantes (Pessoal, Logística).
3. **Migrar a tela de Orçamento (grid + modal) para dado real** (o pendente #113) — aí a **persistência do
   cálculo (fase C)** entra naturalmente, sem o descompasso grid(placeholder)↔modal(real) que motivou fechar a PR #209.
4. **G4 e G5** em paralelo (cenário + insights).

## Como semear dado de teste HOJE (parcial — o que dá)

```sql
-- rede (partner_ref = UF válido de 2 letras OU IBGE de 7 dígitos; slug quebra o mapper da lista)
INSERT INTO bgp_budgets (id, budget_plan_id, partner_kind, partner_ref, value_cents)
VALUES (UUID(), '<plano_id>', 'state', 'CE', 50000000);

-- flip de subcategoria para um tipo que TEM calculadora (IPCA ou CAED)
UPDATE bgp_subcategories SET launch_type='IPCA' WHERE id='<subcategory_id>';
```

> ⚠️ Não dá pra testar o cálculo de **Pessoal/Logística** hoje (endpoints faltam — G2). E o grid **mensal**
> segue placeholder até G1 ser decidido. O DB local foi deixado **pristino** (sem meu seed de validação).

## Referência de status por front (o que já está pronto do lado do web-app)

- **BFF leitura+escrita de budget-results (fases A+B)** — PR #207, **merged** em `go-live-front`. Leitura
  `by-budget` + escrita IPCA prontas; acende a célula **anual** no DETALHE "Por Rede".
- **Fiação de UI da fase C** (persistir IPCA pelo modal) — PR #209, **fechada** (prematura; entra na migração da
  tela). Branch `feat/budget-plan-calc-ipca-wire` preservada (`resolveNetworkBudgetId`, ref threading, mutação).
