# 078 — Categorização a partir da árvore do Plano (Fatia 1: Lançar Documento) · ADR-0051

## Contexto

Os dropdowns Centro de Custo → Categoria → Subcategoria do Lançar Documento liam o **catálogo operacional**
(`fin_categories` — o seed de teste). A P.O. pediu que reflitam **a árvore cadastrada no módulo de Orçamento**.

O **ADR-0051** (core-api, PR #457) governa isto e define a arquitetura — que **não** é "uma taxonomia única":
a árvore Centro→Categoria→Subcategoria pertence a **cada Plano Orçamentário**; `fin_categories` guarda só o
**operacional** (`Estorno`/`Ajuste`, que nunca existem num plano). Decisão da P.O.: **seguir o ADR**.

Esta é a **Fatia 1** (Lançar Documento). Contrato = Fatia 2; Conciliação/Relatórios = Fatia 3.

## O gap era estreito — quase tudo já existia

| Peça                                                                     | Estado antes                   |
| ------------------------------------------------------------------------ | ------------------------------ |
| Árvore por plano no banco (features 061/075 + ETL)                       | ✅                             |
| `PlanDetail` com a árvore (`costCenters[].categories[].subCategories[]`) | ✅                             |
| Seletor de Plano no Lançar Documento (`planoOrcamentario`)               | ✅                             |
| Cascata compartilhada (`categorization-cascade.ts`)                      | ✅ (lia o operacional)         |
| `getBudgetPlanDetailFn` na `public-api` do budget-plans                  | ❌ (fn existia, não exportado) |
| A cascata derivar da árvore do PLANO                                     | ❌                             |

## O que mudou

1. **public-api do budget-plans** expõe `getBudgetPlanDetailFn` — o financeiro lê a árvore cross-módulo (§I).
2. **Helper puro `plan-taxonomy-cascade.ts`** deriva os 3 níveis da árvore, com `ref` (UUID) no `value` e
   **filtrando nós inativos** (feature 075 — não se categoriza num destino desativado; o `active` já é o
   efetivo nó∧ancestrais).
3. **Binding** escolhe a fonte: árvore do plano quando há UUID válido, catálogo operacional senão.
4. **Controller** zera Centro/Categoria/Sub ao trocar o Plano (senão a folha ficaria órfã — §IV).
5. **Page** liga os hooks plan-aware.
6. **Dropdown de Plano**: só **APROVADOS** + cenário no rótulo (ver abaixo).
7. **Layout**: Programa + Plano em cima, os 3 embaixo.

### O boundary mandou onde o código vive (ADR-0004)

Tentei importar o `PlanDetail` no helper puro; o **lint barrou** (`client-data` não importa `public-api` de
outro módulo). Correção: o helper trabalha num tipo NEUTRO local (`PlanCostTree`), e o BINDING (client-ui, que
pode tocar a public-api) passa o `PlanDetail` — a tipagem estrutural aceita (o PlanDetail tem mais campos). É a
mesma disciplina do mapper de reports: o cross-módulo é traduzido na borda, a regra pura fica agnóstica.

## O "bug" reportado na validação NÃO era código — era colisão de rótulo

A P.O. viu **só um centro** ("Luz") após selecionar o plano, mesmo tendo cadastrado mais e aprovado. Causa
(lida no banco): **três planos distintos** (UUIDs diferentes) renderizavam idênticos como "2026 ABC 1.0" — um
aprovado com 3 centros e dois rascunhos. Ela selecionou um rascunho de 1 centro sem ter como distinguir. A
cascata leu **certo** a árvore do plano selecionado.

**Correção (decisão da P.O.):**

- o dropdown lista **só planos APROVADOS** — a categorização usa a estrutura COMPROMETIDA, não um rascunho em
  edição; e some o lixo de rascunhos duplicados de teste.
- o rótulo ganha o **cenário** (`· <scenarioName>`) para dois aprovados homônimos não colidirem.

## Blindagem: fonte-plano só com UUID válido

O campo `planoOrcamentario` carrega o UUID quando escolhido no dropdown, mas a **hidratação por contrato** ainda
o preenche com o **nome do cenário** (inconsistência pré-existente — handoff abaixo). Buscar a árvore com um
nome daria 404 e **esvaziaria os dropdowns em silêncio**. Por isso a fonte-plano só entra quando o valor casa
o regex de UUID; qualquer outra coisa cai no operacional — **nunca esvazia**.

## Handoff pré-existente (fora desta fatia)

Unificar `planoOrcamentario` (que ora é UUID, ora é nome do cenário via hidratação) com `budgetPlanRef`. Hoje
os dois coexistem inconsistentes. Não corrigido aqui: é mudança própria no controller/hidratação, e o guard de
UUID já protege a Fatia 1.

## Gate / DoD

- `pnpm verify` exit 0 · node:test **1575 pass / 0 fail** · Vitest **570 pass / 0 fail** · lint 0 erros.
- Cobertura nova (helper puro): centros/categorias/subs só ATIVOS · `ref` no value · sem centro → vazio
  (não há categoria global no plano) · varredura por ref sem precisar do centro-pai · nós inexistentes → vazio.
- **Sabotagem verificada:** remover o filtro `active` faz os testes certos falharem.
- **Validado em tela** (local, com a P.O.): plano aprovado → Centro mostra Céu/Luz/Vida; cascata funciona;
  layout Programa+Plano em cima.

## Fora de escopo (próximas fatias)

- **Fatia 2:** Novo Contrato (já tem seletor de plano — replica o padrão).
- **Fatia 3:** Conciliação (Nova transação) e Relatórios — depende de mapear se/como amarram plano.
