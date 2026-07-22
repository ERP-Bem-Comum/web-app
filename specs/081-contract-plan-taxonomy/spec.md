# 081 — Novo Contrato: categorização vem da árvore do plano (S3 do épico core-api #502)

> Escala **L**. Fonte da verdade: ADR-0051 (taxonomia por plano). Espelha a Fatia 1 (`specs/078`) no **Novo
> Contrato**, consumindo a fatia **S3 `CTR-SUBCATEGORY-REFS` / #343** do épico **Taxonomia Planejável Unificada**
> (core-api #502, já na `dev` via PR #513). Fecha a padronização: documento, título manual e agora contrato
> classificam pela MESMA árvore do plano.

## Problema

O Novo Contrato categorizava pelo **catálogo operacional** (Centro/Categoria como string livre, `value` = NOME) e
a **Subcategoria era placeholder morto** (não persistia). Fora do padrão dos demais e sem linkar a taxonomia
planejável → herança contrato→documento por texto, não por ref.

## Backend (S3, aditivo)

O contrato ganhou `costCenterRef`/`categoryRef`/`subcategoryRef` (UUIDs opacos) no **write** (create + PATCH) e no
**read** (list-item + detalhe), **ao lado** dos campos-texto antigos (`categorizacao`/`centroDeCusto`, mantidos como
rótulo exibível). Migration 0017 aditiva.

## Decisão (front)

- **Centro → Categoria → Subcategoria** vêm da **ÁRVORE do plano selecionado** (só nós ativos, `value` = `ref`),
  como o Lançar Documento. Plano só-**APROVADOS** + cenário no rótulo. Sem plano → cascata vazia (o plano é o
  catálogo); cada nível fica **desabilitado** até o de cima ser escolhido (affordance honesta). Trocar um nível
  zera os de baixo (§IV).
- **Subcategoria REAL** (folha) — persiste em `subcategoryRef`.
- **Sem regressão de display**: guardamos o **REF** (linka) em `costCenterRef`/`categoryRef`/`subcategoryRef` E o
  **NOME** exibível em `centroDeCusto`/`categorizacao` (o grid/detalhe do contrato mostra o texto; refs são opacos).
  Os seletores do controller são cascata-aware: setam ref + nome e zeram os de baixo.

## Cadeia

Client model (`contracts.model.ts`: Contract + CreateContractInput ganham os 3 refs) → server io-schema
(`contracts.schemas.ts`, guards schema≡domínio) → domain (`contracts.types.ts`) → core-api schema
(`contracts.schema.ts`, drift-tolerante) + mapper (`core-api-contracts.ts`: create body + read). UI:
`contract-create.binding.ts` (cascata plano-aware, reusa o helper PURO `plan-taxonomy-cascade` **via
`financial/public-api`** — ADR-0004: cross-módulo só por public-api) + controller (state + seletores) +
`contract-form.component.tsx` (4 dropdowns) + page (wiring).

## Reuso sem quebrar boundary

O helper puro `plan-taxonomy-cascade.ts` vive em `financial/client/data`. Contratos é OUTRO módulo → importar de
`client/data` viola o `boundaries/dependencies` (ADR-0004). Solução: **re-exportar o helper via
`financial/public-api`** e importar de lá. (Document/conciliação seguem importando same-module — sem churn.)

## Fora de escopo (follow-ups)

- **Pré-preenchimento visível do documento** a partir do contrato ("herança editável" do épico): hoje a herança é
  **derivação no backend** (o documento manda `contractRef`; o backend deriva dos refs do contrato). O read model do
  contrato já expõe os 3 refs → quando fizermos o pré-preenchimento, a hidratação (`partner-hydration`) só passa a
  carregá-los. Não adicionei código morto agora.
- **Resolver refs→nome no detalhe/grid do contrato** para os campos de ref (hoje o nome exibível vem dos campos-texto
  que gravamos junto). Mesma pendência do drawer de Contas a Pagar.

## Verificação

`pnpm typecheck` + `pnpm verify` (1577 puros) + `pnpm test:dom` (575, +3 do contrato: Centro desabilitado sem plano,
seleção dispara ref+nome, Subcategoria real). Lint 0 erros nos tocados. Validado em tela (local ERP-INFRA).
