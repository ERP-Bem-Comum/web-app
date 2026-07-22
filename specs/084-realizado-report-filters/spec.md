# 084 — Filtros reais do relatório Realizado × Planejado

> Escala **M**. Follow-up direto da S6 (`specs/083`): a S6 ligou o dado ao endpoint com `year=2026` fixo e os
> filtros chrome. Aqui os 5 filtros viram REAIS e alimentam a query do `GET /reports/realized`.

## Antes

Os selects (Programa · Plano · Estado · Município · Ano) eram **placeholder visual** (`FilterField` não
controlado, opções estáticas). O relatório consultava sempre `{ year: 2026 }`.

## Decisão

Cada filtro vira um select REAL, controlado, com opção-fonte própria; "Filtrar" **aplica** (draft → aplicado)
e a query re-busca.

| Filtro    | Fonte (public-api)                                  | Valor enviado ao endpoint            |
| :-------- | :-------------------------------------------------- | :----------------------------------- |
| Programa  | `listProgramsFn` (ativos)                           | UUID → `programId`                   |
| Plano     | `listBudgetPlansFn` (aprovados + cenário no rótulo) | UUID → `budgetPlanId`                |
| Estado    | `listPartnerStatesFn` (com parceria)                | `uf` → `partnerStateId`              |
| Município | `listMunicipalitiesByUfFn` (cascata pela UF)        | `ibgeCode` → `partnerMunicipalityId` |
| Ano       | anos com plano (derivado do `listBudgetPlansFn`)    | number → `year` (obrigatório)        |

**IDs** (confirmado no geography + `toRealizedFilter` do backend): estado por `uf`, município por `ibgeCode`.

## Mecânica

- **`realizado-filters.binding.ts`** (NOVO): 5 hooks de opções (cross-módulo só via public-api §I; degradação
  graciosa → []). Plano e Ano compartilham a MESMA query de planos (um fetch cacheado). Município `enabled`
  só com UF.
- **Page:** estado `draft` (seleção) × `applied` (consulta); `useRealizadoReport(applied)`; "Filtrar" commita.
  Trocar a UF **zera** o município (cascata). `FilterField` reescrito CONTROLADO (`value`/`onChange`/`placeholder`
  → opção "Todos" vazia/`disabled`). Refetch por filtro mantém o dado anterior visível (o painel de loading só
  aparece na 1ª carga). Boundary: o tipo dos filtros vem re-exportado do binding (`RealizedReportFilters`), a
  page NÃO importa de `data/model`.

## Ressalvas / follow-ups

- **Estado/Município**: ligados por `uf`/`ibgeCode`. Validado em tela que RECORTAM o realizado. (Se algum caso não
  recortar, o commit da S6 menciona um "OR do filtro estado+município no ON" — semântica de backend.)
- **Município `disabled`**: usa `disabled` nativo do select; se precisar de affordance mais forte, ajustar o estilo
  (gotcha "disabled precisa parecer disabled").

## Verificação

`pnpm typecheck` + `pnpm verify` + `pnpm test:dom` (578) verdes; lint 0. Validado em tela (local ERP-INFRA):
os 5 filtros consultam o endpoint; cascata Estado→Município; Estado/Município recortam o realizado.
