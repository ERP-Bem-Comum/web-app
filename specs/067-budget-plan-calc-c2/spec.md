# 067 — Cálculo dos valores orçados (Grupo C, fatia C2) · budget-results

> **Status: planejado (modelo resolvido do legado; implementação = fatia dedicada).**

## Contexto

O C1 (specs/066) ligou o **orçamento por rede** (colunas + total). Falta **acender as células** da matriz
"Por Rede" — o valor de cada **subcategoria × rede**, que vem do **cálculo** (`budget-results`).

## Modelo (resolvido do protótipo — HANDBOOK-plano-orcamentario-mapa.md §1.7/1.8)

- **O cálculo é POR REDE.** Entra-se pela tela **"Edição de Orçamento por rede"** (`/planejamento/detalhes/:id/orcamento/:orcamentoId`), escopada a UM orçamento (`orcamentoId` = **budgetId** = rede). Fluxo: Detalhe → filtrar Rede → **Editar** → esta tela.
- **`Tipo de lançamento` é por SUBCATEGORIA** (não por centro de custo): **Pessoal · IPCA · CAED · Logística** — decide qual dos 4 formulários abre.
- O modal **"Calculando Gastos"** (4 forms já construídos: `pessoal/caed/logistica` + IPCA no calc-gastos) manda os **params** ao backend, que **calcula o valor ANUAL**:
  - `POST /budget-plans/budget-results/ipca` → `baseValueInCents * (1 + ipca/100)`
  - `POST .../caed` → `numberOfEnrollments * baseValueInCents`
  - `POST .../personal-expenses` → folha (soma dos campos)
  - `POST .../logistics-expenses` → viagem (soma dos campos)
  - Todos com `{ budgetId, subcategoryId, ...params }` → resposta `{ ..., valueInCents }`.
- **Leitura:** `GET /budget-plans/budget-results/by-budget/:budgetId` → os valores por subcategoria daquela rede → preenche `networkInCents` na matriz "Por Rede".
- **Anual × mensal (decisão P.O.):** a soma dos 12 meses editados = o valor anual persistido. (O backend guarda o anual; a distribuição mensal é da UI.)

## Escopo de implementação (L — fatia dedicada)

1. **BFF write** dos 4 cálculos: io-schemas + client (`postBudgetResult*`) + use-cases + composition + 4 server-fns.
2. **BFF read**: `getBudgetResultsByBudget(budgetId)` → mapear para `{ subcategoryId → valueInCents }`.
3. **Detalhe/mapper**: preencher `networkInCents[i]` de cada subcategoria com o budget-result da rede i (via read por budget de cada rede do plano). Requer casar `subcategoryId` (UUID do backend) com o nó da árvore — hoje o mapper descarta o UUID da subcategoria (só nomes); **expor o `ref` da subcategoria** (como já foi feito p/ centro/categoria na feature 061).
4. **UI**: ligar o "Calcular/Salvar" do modal (hoje local) às mutações; a tela `/orcamento/:orcamentoId` scoped ao budgetId; RBAC por status (Aprovado = read-only).

## Dependências / gaps

- O mapper precisa expor o **UUID da subcategoria** (para casar com `budget-results.subcategoryId`). Hoje só centro/categoria têm `ref`.
- Cadeia grande (4 calculadoras + leitura + fiação da matriz). Recomendado: fatiar por tipo (começar IPCA end-to-end como prova, depois CAED/Pessoal/Logística).

## Fora de escopo

- Cenário-filho na lista/árvore: bloqueado em **core-api#401** (`GET /:id/children` inexistente).
