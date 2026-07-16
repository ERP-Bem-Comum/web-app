# 075 — Editar e desativar a árvore de custos (Plano Orçamentário §1.5)

## Contexto

O modal "Centros de Custo" tem **"Editar"** e um **switch** por linha nos 3 níveis (Centro → Categoria →
Subcategoria) desde a feature 061. Os dois eram **fachada — e mentiam**:

- **Editar**: o painel abria pré-preenchido, a usuária trocava o nome e salvava → o `submitForm` caía no ramo
  `edit-*` e **só fechava o painel**. Nada era gravado, e a tela não dizia nada. Parecia ter funcionado.
- **Desativar**: mexia num `Set<string>` em memória no binding. Não saía do navegador: **voltava no F5**.

O Gabriel fechou o **#454 gap 3** (core-api `b4ede885`, na `dev`) e o contrato agora existe.

## O contrato (lido no core-api, não suposto)

```
PATCH /budget-plans/:id/cost-structure/{cost-centers|categories|subcategories}/:nodeId
body:     { name?: string (1..NODE_NAME_MAX), active?: boolean }   // ao menos um; `{}` → 400
response: 200 + a ÁRVORE INTEIRA (mesmo schema dos 3 POSTs e do GET /:id/cost-structure)
erros:    404 cost-node-not-found · 400 cost-node-patch-empty · 409 plano APROVADO (herdado do `mutate`)
RBAC:     budget-plan:write
```

Uma **rota por nível** (o nível vem do PATH). O `GET /cost-structure` passou a expor `active` em todo nó.

## Duas decisões do backend que mandam no desenho do front

1. **Não existe DELETE de nó.** `bgp_budget_results.subcategory_id` aponta para a subcategoria **sem FK**:
   apagar deixaria lançamento órfão. **Desativar é `active: false`**; `true` reativa. Só soft.
2. **O `active` devolvido é o EFETIVO** (nó ∧ ancestrais), derivado na leitura (`withInheritedActive`). A
   **intenção individual não é exposta de propósito** — expor as duas convidaria o front a recalcular a herança.
   → **o front não recalcula herança**: mostra o que vem.

## O quê

Ligar os dois. Renomear e (des)ativar cabem no **mesmo PATCH**, então é **um** caso de uso para 3 níveis × 2
campos — espelhando o desenho do core, que também não quebrou em três.

- **Editar** → PATCH `{ name }`. Só o nome: tipo do centro e modelo de cálculo da subcategoria não estão no
  contrato.
- **Switch** → PATCH `{ active }` (sem `name`: (des)ativar não renomeia).
- **Nome de nó inativo** segue riscado; agora pelo `active` do servidor, não por um Set local.

## A armadilha da herança, e o que a tela faz (decisão da P.O., 2026-07-16)

O switch mostra o **efetivo**, mas o PATCH grava a **intenção**. Com o Centro desligado, ligar o switch de uma
Categoria dele gravaria `intenção = true` e a releitura devolveria `efetivo = false && true = false` — **o
switch voltaria sozinho**, sem explicação. Parece bug. É o **core-api#469** (sem `activeSelf`, o switch não
distingue herança de intenção).

**Decidido: travar + explicar.** Filho de ancestral inativo tem o switch **desabilitado**, o texto vira
"Inativo por herança" e o `title`/`aria-label` diz **qual** ancestral desligou e como destravar. Zero
snap-back, zero backend novo, e diz a verdade. Não há perda: com o pai desligado, a intenção do filho é
inobservável de qualquer forma. Reativou o pai? O core devolve cada filho ao que **ele** era.

Quem é citado é o ancestral **que causou** — com o Centro desligado, a Subcategoria cita o **Centro**, não a
Categoria (que também chega `false`, mas por herança): citar a Categoria mandaria consertar o lugar errado.

## Cadeia (BFF · DDD → MVVM) — espelha `write-cost-structure.use-case.ts`

io (`PatchCostNodeCommand`, `CostNodeLevel`) → port + use-case `createPatchCostNode` → adapter core-api
(`patchCostNode`, `COST_NODE_LEVEL_PATH` nível→segmento, omite chave ausente p/ não virar `{}`) → io-schema
`PatchCostNodeInputSchema` (`.refine` ao menos um campo) → server-fn `patch-cost-node.service.fn` (auth no
handler) → repository (porta `patchCostNode` + wire) → view-model (`active` nos 3 níveis, `ref` da **sub**,
`categoriaLock`/`subLock`) → binding (`patchCostNodeMutation`, `toggleActive`, `edit-*` real, `lockOf`) → UI
(switch travável + tooltip).

**`active` atravessa a cadeia inteira** (`coreCostStructureSchema` → `CostStructure*Input` → mapper →
`*Consolidated` → `CentroNode`), sempre **passando direto** — nunca recalculado.

## Achados no caminho

- **O `ref` da subcategoria era descartado** no `buildCentrosTree` (só centro e categoria o carregavam, porque
  só eles eram pai de um POST). Sem ele não há como endereçar o PATCH do 3º nível. Agora os 3 níveis o levam.
- **`CostCenterConsolidated` faz dois papéis**: a árvore real e editável de UM plano (tem identidade, `ref`
  uuid) e o **agregado sintético** do Consolidado ABC, que soma centros homônimos de VÁRIOS planos (`ref: ''`).
  `active` só faz sentido no primeiro. O merge preenche `active: true` = **"não aplicável"**, na convenção que
  ele já usa para `ref: ''`/`networkInCents: []`, e o comentário diz por quê. Dar tipos próprios ao agregado é
  o caminho certo se ele um dia precisar refletir desativação — não ensinar o merge a herdar herança.
- **`cost-node-not-found` (404) ganhou tag própria** em vez de reusar `budget-plan-not-found`: o core devolve
  404 tanto p/ nó quanto p/ plano e não manda o slug, mas as duas causas dizem o mesmo à tela (a árvore em mãos
  está velha) — e "plano não encontrado" com o plano aberto na frente da usuária seria mentira. Mensagem manda
  reabrir, não "tentar de novo" (repetir não traz o nó de volta).
- **O i18n do projeto não interpola** (`createTranslator` = `catalog[key] ?? key`; as chaves com `{{}}` no
  catálogo são strings mortas, nunca ligadas). O `{{ancestor}}` é resolvido **na page**, com `.replaceAll`.
  Local de propósito: dar interpolação ao i18n inteiro é decisão de arquitetura (pede ADR), não efeito
  colateral de um tooltip.

## Fora de escopo

- **`DELETE /budget-plans/:id`** ("Excluir Plano", #453, `0e518fe1`) — destravado no mesmo pacote, fica de fora
  por decisão da P.O.: é irreversível e com cascata nos filhos, merece sessão e leitura próprias.
- **Reparentar nó**: não existe no contrato (`{ name?, active? }`).
- **Tipo do centro / modelo de cálculo da subcategoria** na edição: fora do PATCH.
- **core-api#469** (expor `activeSelf`): enquanto não existir, a trava é a resposta honesta.
- **core-api#470**: desativar **ainda não impede lançamento nem marca o CSV** — hoje o efeito é na árvore do
  plano. É backend, e já está registrado.

## Gate / DoD

- `pnpm typecheck && pnpm lint && pnpm test && pnpm test:dom` verdes (lint 0 erros).
- Cobertura nova: view-model puro (`ref` nos 3 níveis; `active` propagado sem recalcular herança; 6 casos de
  `categoriaLock`/`subLock`, incluindo a precedência centro>categoria e o único caso editável) + DOM (switch
  reflete o servidor; filho travado cita quem desligou; centro-raiz nunca trava).
- Teste antigo `"a chave (switch) desativa: rótulo vira Ativar"` **substituído**: afirmava o modelo antigo
  (toggle otimista local). O rótulo agora é a verdade do servidor — afirma-se renderizando outra árvore, não
  clicando.
- Sabotagem verificada: inverter a precedência em `subLock` faz o teste certo falhar.
- **Falta validar em tela** contra a stack local com `BUDGET_PLANS_DRIVER=mysql` (ver #374).
