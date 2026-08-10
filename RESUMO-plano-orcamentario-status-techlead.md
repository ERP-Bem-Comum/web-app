# Plano Orçamentário — status para o tech lead

**Data:** 2026-07-13 · **Front:** `go-live-front` (em produção via `develop`) · **P.O.:** Alessandra

O front do **Plano Orçamentário** (Planejamento + Detalhe + Consolidado ABC + Edição de Orçamento) está
**praticamente completo**. O que falta para o fluxo fechar é **peça de backend** — este doc lista o pacote,
priorizado, com o que o front pluga assim que cada uma existir.

---

## ✅ Feito no front (verde, em produção ou em `go-live-front`)

| Item                                                                                        | PR       | Observação                                                      |
| ------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------- |
| Lista de Planejamento real                                                                  | —        | consome `GET /budget-plans` (#315)                              |
| **Projeção real da lista** (partnersCount + networkKind incl. **MISTO** + "atualizado por") | **#214** | consome #372/#373; **removeu o fan-out N+1**                    |
| Criar plano / options / detalhe / cost-structure                                            | —        | #316                                                            |
| Estrutura de custo (centros/categorias/subcategorias)                                       | —        | feature 061                                                     |
| Orçamento por rede (adicionar/editar/encerrar)                                              | —        | #394                                                            |
| **Criar cenário** (fix de contrato `scenarioName`)                                          | #210     | funciona ponta a ponta                                          |
| **Editar → Edição de Orçamento** (rota + tela + modal "Calculando Gastos")                  | —        | navega e abre; edição mensal é **local** (falta persistir — G1) |
| BFF de cálculo IPCA (leitura by-budget + escrita)                                           | #207     | pronto; a UI pluga quando G1 existir                            |

> Os 4 calculadores (`ipca`, `caed`, `personal-expenses`, `logistics-expenses`) **existem** no core (issue #414 fechada — era engano meu).

---

## 🔴 Bloqueadores de backend (fecham o fluxo do Orçamento)

### 1. #413 — grid/persistência **mensal** do Orçamento ⟵ **prioridade máxima**

A tela de Edição de Orçamento é **CATEGORIAS × 12 MESES** (legado §1.7) e o modal "Calculando Gastos" edita
valores **por mês**. Mas `bgp_budget_results` guarda **um valor ANUAL por rede×subcategoria** (`budget_id,
subcategory_id, model, value_cents`) — **sem dimensão de mês**.

- **Decisão da P.O.:** tem que ser **mensal** (o orçamento é feito mês a mês; não cabe exibir só o anual).
- **Precisa:** persistir e devolver os **12 valores mensais** por rede×subcategoria (coluna/tabela nova ou JSON
  de 12 posições) + um GET que os devolva pra alimentar o grid.
- **Impacto:** hoje o grid mensal e o "salvar" do modal ficam placeholder. É o **único** bloqueador do
  Calcular Gasto — todo o resto (rota, tela, modal, 4 calculadores, BFF) já existe.

### 2. #423 — aninhar **cenário** no pai na lista

Criar cenário funciona (#210), mas o filho **não aparece recolhido/expansível sob o pai** — aparece flat.

- **Causa:** `GET /budget-plans` retorna **todos os planos flat** (raízes + filhos), **sem `parentId`/
  `scenarioName`** no item e **sem filtrar raízes**. O `/children` do #401 existe mas não há como correlacionar.
- **Precisa (uma das 2):** (A) a lista filtra **raízes** (`parent_id IS NULL`) → front expande via `/:id/children`;
  ou (B) o item expõe **`parentId` + `scenarioName`** → front agrupa flat em árvore.

---

## 🟡 Confirmar / conveniência

- **#416** — Insights: confirmar que "Realizado" vem dos lançamentos **`CONCILIADO`** do Financeiro (§1.6) e que
  "Média de N Estados" conta as redes (apareceu 0).
- **#415** — GET consolidado (estrutura + valores por rede numa resposta) — evita N+1 na matriz "Por Rede".
  Conveniência, não-bloqueador.

---

## Resumo de 1 linha

**Front do Plano Orçamentário está pronto; o fluxo só não fecha por 2 peças de backend — #413 (persistência
mensal, prioridade máxima) e #423 (aninhar cenário na lista).** Assim que subirem, o front pluga sem nova rota.

_Detalhe técnico completo em `HANDOFF-plano-orcamentario-backend-gaps.md`._
