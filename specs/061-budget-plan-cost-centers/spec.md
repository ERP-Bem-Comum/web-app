# Spec — Plano Orçamentário: escrita da ESTRUTURA de custo (Grupo B, feature 061)

Branch: `feat/budget-plan-cost-centers` (off `go-live-front`). Tamanho: **L**.
Antecede: 058 (CREATE), 059 (DETALHE leitura), 060 (ações/insights). Sucede: Grupo C (valores orçados + cálculo).

## Problema

O modal "Centros de Custo" (§1.5) já tem a UI completa (árvore + formulários add/editar + ativar/desativar),
mas **NÃO persiste** (front-first, TODO #113 — "submeter/desativar só reflete na UI"). O core-api v2 já expõe
os 3 POSTs de estrutura. Precisamos ligar a **inclusão** de Centro de Custo → Categoria → Subcategoria aos
POSTs reais, com a **cascata** que a P.O. descreveu: cada nível recém-criado fica disponível na hora, e ao
existir um nível superior habilita a criação do nível abaixo.

## Escopo (SÓ a ESTRUTURA — criação)

- 3 server-fns de escrita (§III, fronteira única): add cost-center / add category / add subcategory.
- Cascata no client: criar centro → aparece no dropdown e fica selecionado; criar categoria (sob o centro
  selecionado) → aparece na árvore; criar subcategoria (sob a categoria) → idem. Cada `onSuccess` invalida
  `planDetailQueryKey(id)` (a árvore relê pronta do BFF).
- Expor o `ref: uuid` (aditivo) nos nós de centro e categoria do `PlanDetail` (o POST-filho referencia o pai
  por UUID), sem quebrar o `id: number` sintético já usado na matriz.
- Erros como valor → tag i18n no modal; estado de submissão (botão desabilitado).

## Fora de escopo (Grupo C)

- Valores orçados por rede (`POST /:id/budgets`) e cálculo (IPCA/CAED/pessoal/logística).
- Editar/renomear e ativar/desativar nós (o contrato do Grupo B só tem os 3 POSTs de criação) — seguem
  front-first (visual), documentado como gap.

## Contratos do backend (core-api v2, base `/api/v2/budget-plans`)

Cada POST retorna a **ÁRVORE INTEIRA atualizada** (`costStructureTreeSchema`, = a resposta do
`GET /:id/cost-structure`), 201:

1. `POST /:id/cost-structure/cost-centers` — `{ name: 1..255, direction: 'A PAGAR' | 'A RECEBER' }`.
2. `POST /:id/cost-structure/categories` — `{ costCenterId: uuid, name: 1..255 }`.
3. `POST /:id/cost-structure/subcategories` — `{ categoryId: uuid, name: 1..255, launchType: 'IPCA' | 'CAED' | 'DESPESAS_PESSOAIS' | 'DESPESAS_LOGISTICAS' }`.

## Enums (VALOR = literal do backend, não o rótulo PT)

- `direction` = `CostCenterType` do client (`'A PAGAR' | 'A RECEBER'`) — já são os literais.
- `launchType` = `ReleaseType` do client (`'DESPESAS_PESSOAIS' | 'IPCA' | 'CAED' | 'DESPESAS_LOGISTICAS'`) —
  já são os literais. O `subTipo` (INSTITUCIONAL/REDE) NÃO é enviado (o backend não o tem).

## Critérios de aceite

1. Criar um centro de custo persiste (POST) e ele aparece imediatamente no dropdown e fica selecionado.
2. Com um centro selecionado, "+ Categoria" cria a categoria sob aquele centro (via `ref` uuid) e ela aparece.
3. Com uma categoria, "+ Sub-categoria" cria a subcategoria sob ela (via `ref` uuid), com o `launchType` literal.
4. Nome vazio → validação client-side (tag), sem POST. 400/422 → `invalid-input`; 404 → `not-found`; 409
   (plano não editável/aprovado) → `budget-plan-not-editable`; 401 → `unauthorized`.
5. Durante a submissão o botão fica desabilitado; erro mostra a tag i18n no painel de formulário.
   </invoke>
