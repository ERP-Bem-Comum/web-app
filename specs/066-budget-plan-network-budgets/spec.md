# 066 — Orçamento por rede (Grupo C, fatia C1) · #394

## Contexto

Com o core-api#394 corrigido (rede = chave natural UF/IBGE, não UUID; `/options` deixou de dar 500), a visão
"Por Rede" do Plano Orçamentário deixa de ser placeholder. Antes o mapper hardcodava `networks: []` e 3
schemas do front ainda declaravam `ref: z.uuid()` — o que **quebraria** o `/options`, o detalhe e o Consolidado
contra o backend #394.

## O quê (C1 — adicionar orçamento por rede)

1. **Compatibilidade #394**: `partner.ref`/`redes.ref` viram chave natural (UF/IBGE) nos schemas do front.
2. **Ler os orçamentos reais**: o detalhe expõe `budgets[]`; a matriz "Por Rede" mostra as colunas de rede com
   o **total real** por rede (plano-level). As células por centro de custo ficam 0 até o cálculo (C2).
3. **Adicionar orçamento** (persistência real): modal com **rede real** (do `/options`) + **valor**; `POST
/:id/budgets {partnerKind, partnerRef, valueInCents}` → invalida o detalhe → a coluna aparece na hora.
   Remoção (`DELETE /:id/budgets/:budgetId`) plumbada no BFF (UI de excluir = fatia futura).

## Cadeia (BFF · DDD → MVVM)

domain (`BudgetInput`, `AddBudgetCommand`, `NetworkOption`, networks enriquecidas) → schema (chave natural) →
mapper (networks dos budgets) → core-api client (`getPlanDetailHeader` com budgets, `addBudget`, `deleteBudget`,
`getNetworkOptions`) → use-cases (`budget-write.use-case`) → composition → server-fns (`add-budget`,
`delete-budget`, `list-network-options`) → repository → binding (`plan-detail.binding`: query de rede + mutação)
→ view-model (`buildNetworkMatrix` usa o total real; `parseAddBudgetCents`; validação por ref) → modal (valor).

## Fora de escopo / próximas fatias

- **C2 — cálculo gasto**: `budget-results/{ipca,caed,personal-expenses,logistics-expenses}` +
  `by-budget/:budgetId` acendem as **células** da matriz. Fatia própria.
- **Cenário-filho na lista/árvore**: bloqueado em core-api#401 (`GET /:id/children` inexistente — o cenário é
  criado mas não há como listar os filhos).

## Gate / DoD

- `pnpm typecheck && pnpm lint && pnpm test && pnpm test:dom` verdes (0 erros / ≤115 warnings).
- Cobertura nova: node (validateAddBudget por ref + valor; parseAddBudgetCents; mapper networks dos budgets)
  - DOM do modal (campo de valor).
- Validado em tela contra o core-api #394 (adicionar orçamento por rede → coluna com total).
