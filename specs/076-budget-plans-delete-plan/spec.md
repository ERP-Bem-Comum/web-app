# 076 — Excluir Plano Orçamentário (§2.5)

## Contexto

"Excluir Plano" existia no menu "…" e não fazia nada: não havia rota. O front o mantinha `disabled` + tooltip
pela regra da P.O. ("o que não tiver, deixe desativado"). O core-api entregou o `DELETE /budget-plans/:id`
(#453, commit `0e518fe1`).

## O que o backend REALMENTE faz (lido na fonte — e contradiz o que a tela prometia)

```
DELETE /budget-plans/:id   → 204 (sem body)
RBAC: budget-plan:write
409: plano APROVADO  ·  plano COM FILHO (cenário)
404: plano inexistente
```

Na mesma transação o core apaga **o plano + seus orçamentos + seus lançamentos** (`bgp_budget_results` não tem
FK; um DELETE ingênuo deixaria lançamento órfão — "trocaria _não dá pra excluir_ por _excluir corrompe_").

**Não há cascata de PLANOS.** Nas palavras do commit: _"como ambos bloqueiam, o DELETE só remove folha
RASCUNHO/EM_CALIBRACAO"_. As duas recusas:

- **APROVADO não sai**: o módulo trata aprovado como imutável; o Consolidado ABC agrega aprovados (apagar
  reescreveria resultado já reportado) e `fin_documents.budget_plan_ref` aponta para planos **sem FK**.
- **Plano com filho não sai**: apaga-se de baixo pra cima.

## O que muda no front

O commit do core assume que _"lá basta tirar `delete` do `ACTIONS_WITHOUT_ENDPOINT`"_. **Não basta** — dois
problemas reais:

### 1. O texto de confirmação MENTIA

Prometia _"o plano '{nome}' **e seus itens filhos**, isso não pode ser desfeito"_. Neste módulo "filho" é
**cenário**, e plano com cenário **não é apagado** (409) — a usuária leria "vai levar meus cenários junto"
quando, na verdade, não apaga nada. O que some junto são os **orçamentos e lançamentos do próprio plano**.

Novo texto (decisão da P.O., 2026-07-16): _"Atenção, você está prestes a excluir o plano '{nome}', com todos os
seus orçamentos e lançamentos. Isso não pode ser desfeito. Tem certeza?"_

### 2. Os dois 409 são INDISTINGUÍVEIS

O core esconde o slug (OWASP — ver a memória `backend-hides-error-slug`), então um 409 do DELETE não diz se foi
_aprovado_ ou _tem cenário_. Sem gate, a usuária confirmaria uma ação **irreversível** e leria "não foi possível
excluir" sem motivo.

**Decisão da P.O.: desabilitar + dizer o motivo**, espelhando as 2 recusas do domínio — exatamente o que o
`create-scenery` já faz neste mesmo arquivo (e pela mesma razão: _"sem isto o menu OFERECE a ação, o backend
devolve 409 e a P.O. leva uma mensagem de erro no lugar de um item desabilitado com o motivo"_). O front já
conhece `status` e `sceneryCount` na linha.

- `delete` sai de `ACTIONS_WITHOUT_ENDPOINT` e entra no gate por status + cenários.
- Tooltips: `deleteApproved` ("Planos aprovados não podem ser excluídos") e `deleteHasChildren` ("Exclua os
  cenários deste plano antes de excluí-lo"). Aprovado **com** cenário cita o aprovado (o estado visível na linha).
- Uma tag de erro só — `budget-plan-not-deletable` — porque eleger uma das duas causas seria **adivinhar**. A
  mensagem **enumera** as regras, como o `sceneryNeedsDraft` já faz (ele mentiu em tela por chutar).

## Cadeia (BFF · DDD → MVVM) — espelha `approve-budget-plan`

use-case `createDeleteBudgetPlan` (port aqui) → adapter core-api `deletePlan` (`DELETE /:id`, 204 →
`ok(undefined)`; `mapDeletePlanHttpError`: 409 → `budget-plan-not-deletable`) → server-fn
`delete-budget-plan.service.fn` (auth no handler, `PlanIdInputSchema`) → repository (porta `deletePlan` + wire)
→ binding `usePlanActions` (`delete` vira `RunnableAction`) → páginas.

## Decisões de implementação

- **`removeQueries`, não `invalidateQueries`, no detalhe**: o plano não existe mais — invalidar mandaria o cache
  buscar um plano morto (404 garantido, e o `planDetailQueryKey` segue montado se a exclusão saiu do próprio
  detalhe). A **lista** é invalidada normalmente.
- **Navegar para fora ao excluir do detalhe**: ficar na página mostraria o plano que acabou de sumir. Espelha o
  `create-scenery`, que já navega no `onOutcome`.
- **O guard do clique na lista passou a revalidar com a linha**: `onAction` chamava `isActionEnabled(action)`
  **sem status** — bastava, porque o Set pegava o `delete` sem precisar de contexto. Com o `delete` fora do Set,
  o guard deixaria passar. Para uma exclusão irreversível, depender só do `disabled` no DOM é fino demais.
  (`findRowName` virou `findRow` + wrapper — a lista é uma ÁRVORE: cenários são `children`.)
- **`isScenario` NÃO barra o delete**: diferente do `create-scenery`. Cenário é folha, e folha sai — o que
  importa é **ter** filho, não **ser** filho.

## Limitação conhecida (não é bug — é o backend)

No **detalhe**, o gate só enxerga o `status`: o `GET /budget-plans/:id` não expõe a contagem de cenários (o
mesmo buraco que o comentário do `sceneryNeedsDraft` já registrava). Então um RASCUNHO **com** cenário oferece
o "Excluir" ali e leva 409. É por isso que a mensagem de erro **enumera** as duas regras: ela é a rede de
segurança. Na **lista** (onde a P.O. opera) o gate é completo.

## Fora de escopo

- Excluir cenário-filho para então excluir o pai (fluxo em cascata guiado): a P.O. apaga de baixo pra cima
  manualmente, que é o que o backend suporta.
- Reabrir/desfazer exclusão: não existe.

## Gate / DoD

- `pnpm verify` exit 0 · node:test **1562 pass / 0 fail** · Vitest **568 pass / 0 fail** · lint 0 erros.
  ⚠️ `pnpm verify` **não roda o `test:dom`** — rodar à parte (foi o que pegou a regressão do menu).
- Cobertura nova (pura): `delete` aprovado não sai · com cenário não sai · folha sai · `isScenario` não barra ·
  tooltip por motivo (incl. a precedência aprovado > tem-cenário) · `notDeletable` no mapa de erro.
- Testes ANTIGOS corrigidos, os dois afirmavam "delete não tem endpoint" (agora falso):
  `plan-actions-enablement.test.ts` (asserção movida para o bloco novo) e `plan-actions-menu.spec.tsx`
  (`delete` mudou de lado: sem status, o menu o mostra habilitado).
- Sabotagem verificada: trocar o gate de cenários por `return true` faz o teste certo falhar.
- **Falta validar em tela** — depende do `BUDGET_PLANS_DRIVER=mysql` (#374).
