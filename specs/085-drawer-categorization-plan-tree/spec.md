# 085 — Drawer de Contas a Pagar resolve a categorização contra a árvore do plano

> Escala **S/M**. Follow-up do épico #502: fecha o gap de LEITURA que sobrou da Fatia 1 (S1). É o espelho, na
> exibição, do que a Fatia 1 fez na escrita.

## Bug

O drawer de Detalhe do Documento (Contas a Pagar) mostra a Categorização (Centro · Categoria · Subcategoria ·
Programa · Plano). O documento guarda **refs (UUIDs)**; o drawer resolve ref→nome em `document-detail.binding.ts`.

Só que os resolvers eram montados **só do catálogo operacional** (`referenceOptionsQuery` = `fin_categories`/
`fin_cost_centers`) e `budgetPlan` era **fixo em "—"**. Desde a **Fatia 1 (S1)**, o documento é carimbado com refs
da **ÁRVORE DO PLANO** (UUIDs que não existem no catálogo operacional) → o drawer não achava e mostrava **"—"**
em Centro/Categoria/Subcategoria/Plano, mesmo com o documento corretamente categorizado.

## Decisão

Resolver **PLANO-FIRST** com fallback operacional:

- Quando o documento tem `budgetPlanRef` (UUID), buscar a **árvore daquele plano** (`getBudgetPlanDetailFn` — mesmo
  cache/queryKey da Fatia 1) e montar os resolvers dela: `costCenterRef`/`categoryRef`/`subcategoryRef` → nome, e o
  **Plano** → rótulo ("ano sigla versão · cenário"). A subcategoria aponta p/ a categoria-pai (o drawer decodifica a
  folha por `parentId`, igual à cascata).
- **Fallback**: refs não encontrados na árvore caem no catálogo operacional (docs antigos / lançamentos manuais) —
  sem regressão. Guard de UUID (não busca com valor inválido).

A view pura (`resolveCategorization`/`mapDocumentDetail`) **não muda** — só recebe resolvers melhores.

## Verificação

`pnpm typecheck` + `pnpm verify` (1580) + `pnpm test:dom` (578) verdes; lint 0. O **decoding** (folha por
`parentId`, inclusive shape plano-tree) já é coberto pelos testes de `resolveCategorization` (S1); o map-building
novo é validado **em tela** (extrair pra teste puro exigiria mocks pesados dos imports do binding — não compensou).
Validado no local (ERP-INFRA): documento com plano `2026 ABC 1.0` → drawer mostra Céu/Mar/Sol + o Plano resolvido.

## Follow-up que sobra

Município `disabled` no relatório (affordance visual). Nada mais do épico #502 pendente no front.
