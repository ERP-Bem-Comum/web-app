# Spec — Plano Orçamentário: DETALHE real (Fase 2, feature 059)

Branch: `feat/budget-plan-detail-real` (off `go-live-front`). Tamanho: **M**.
Antecede: feature 058 (CREATE real). Sucede: Fase 3 (escrita de centros de custo) e Fase 4 (valores orçados).

## Problema

Ao clicar num plano na lista, o Detalhe abre lendo um **PLACEHOLDER** (`plan-detail.placeholder.ts`,
TODO #113): cabeçalho + árvore consolidada vêm de um template ETI 1.2 hardcoded, iguais para qualquer plano.
Precisamos ligar o **cabeçalho** e a **árvore de estrutura de custos** ao backend real (core-api v2).

## Escopo (SÓ LEITURA)

- Compor, no BFF, `GET /budget-plans/:id` (cabeçalho + total do plano) **+** `GET /budget-plans/:id/cost-structure`
  (árvore Centro→Categoria→Subcategoria, só estrutura/nomes) numa resposta ÚNICA (§III) = o `PlanDetail`.
- Renderizar cabeçalho (ano/programa/versão/status/total), a árvore real e os estados de
  **loading / erro / vazio** (plano novo → `costCenters: []` → estado vazio honesto, não erro).

## Fora de escopo

- Valores orçados/cálculo por nó (mensais/totais/por-rede) = **Fase 4**: nesta fase todo valor de nó é **0**;
  `networkInCents` vazio; `networks: []` (a visão "Por Rede" não acende ainda).
- `budgets[]` (por parceiro/rede) do GET /:id = Fase 4 (só o `totalInCents` do plano é usado no cabeçalho).
- Escrita de centros de custo / modal Centros de Custo persistente = **Fase 3** (segue front-first).
- Join de abreviação de programa via `/options` (o cabeçalho usa `programName` do GET /:id).

## Contratos do backend (core-api v2, base `/api/v2/budget-plans`)

- `GET /budget-plans/:id` → `{ id:uuid, year:int, status, version:string, programRef:uuid, programName:string,
budgets:[…], totalInCents:int, createdAt, updatedAt }`. 404 quando o plano não existe.
- `GET /budget-plans/:id/cost-structure` → `{ budgetPlanId:uuid, costCenters: Array<{ id:uuid, name, direction,
categories: Array<{ id:uuid, name, subcategories: Array<{ id:uuid, name, launchType }> }> }> }`.

## Critérios de aceite

1. Abrir o detalhe de um plano existente mostra ano/abrev(ou nome)/versão/status/`Total Plano` reais e a árvore
   real (nomes de centros/categorias/subcategorias do backend), com todos os valores de célula em R$ 0,00.
2. Plano recém-criado (árvore vazia) mostra estado **vazio honesto** — sem placeholder, sem erro.
3. `GET /:id` 404 → estado "não encontrado". Falha de sessão (401) → tag `unauthorized`. Falha inesperada → erro.
4. Enquanto carrega, a tela mostra estado de loading (não o "não encontrado").
5. `pnpm verify` verde; lint 0 erros / ≤115 warnings; nenhuma outra tela quebrada (create/consolidado/orcamento).

## Gaps de backend a confirmar (não bloqueiam o front)

- **Rótulos exatos das enums** `direction` (→ `A PAGAR`/`A RECEBER`) e `launchType`
  (→ `DESPESAS_PESSOAIS`/`IPCA`/`CAED`/`DESPESAS_LOGISTICAS`) NÃO estão pinados no handbook
  ("confirmar apenas os rótulos exatos do dropdown"). O mapper é **tolerante** (lookup + fallback) e o
  schema aceita a enum como string livre — confirmar os literais reais com o backend (issue de handoff).
  </content>
  </invoke>
