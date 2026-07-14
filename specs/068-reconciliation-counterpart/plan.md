# Plan — Contrapartida esperada (US2 do #269)

Espelha a cadeia-irmã (palpites de título + criar conciliação). Nomes: `getCounterpartSuggestions` (query),
`confirmCounterpart` (comando).

## Constitution Check (§I–§XII)

- **§I vertical-modular** — tudo em `src/modules/financial`; cross-módulo só por public-api (não aplicável aqui).
- **§II erros como valores** — `Result<T, ReconciliationError>` fim-a-fim; sem `throw` no domínio/aplicação.
- **§III server fn = única fronteira** — 2 server fns novas; o client não compõe (repository → porta).
- **§IV/§VI estados ilegais / TS estrito** — união discriminada `CounterpartState`; enums tolerantes no mapper;
  guardas `AssertEqual` schema≡domínio; sem `any`/`enum`.
- **§V cadeia de erro** — `mapHttpError` compartilhado (status→ReconciliationError); a UI trata só a tag i18n.
  O core-api esconde o slug → 422→`validation`, 409→`conflict` (slugs específicos listados p/ forward-compat).
- **§VII imutabilidade** — `Readonly<>`/`readonly[]` em todos os tipos.
- **§IX segurança** — auth NO HANDLER (`getCurrentUserFn`/`resolveAccessTokenFn`); Zod no `inputValidator`;
  token nunca serializado ao browser.
- **§X design só-tokens** — pane reusa as classes `*.css.ts` do workspace (sem hex/px cru novo).
- **§XI MVVM view burra** — formatação no view-model puro (`counterpart.view-model.ts`); pane só apresenta.

## Camadas (arquivos)

### server

1. `domain/reconciliation.io.ts` — `CounterpartSuggestion`, `GetCounterpartSuggestionsInput`,
   `ConfirmCounterpartInput`, `ConfirmCounterpartResult`.
2. `domain/errors/reconciliation.errors.ts` — +4 erros `counterpart-*`.
3. `adapters/core-api/reconciliation.schema.ts` — `CoreApiCounterpartSuggestion(s)Schema`, `CoreApiCounterpartConfirmedSchema`.
4. `adapters/core-api/reconciliation.mappers.ts` — `counterpartSuggestionsToModel`, `counterpartConfirmedToModel`, +slugs.
5. `adapters/core-api/core-api-reconciliation.ts` — `getCounterpartSuggestions`, `confirmCounterpart`.
6. `adapters/reconciliation.io-schemas.ts` — 2 schemas de input + guardas.
7. `application/reconciliation.use-cases.ts` — porta (2 métodos) + `createGetCounterpartSuggestions`/`createConfirmCounterpart`.
8. `adapters/reconciliation.composition.ts` — wire dos 2 use-cases.
9. `adapters/server-fns/get-counterpart-suggestions.query.fn.ts` + `confirm-counterpart.service.fn.ts`.

### client

10. `client/data/repository/reconciliation-error.ts` — +4 erros (espelha server).
11. `client/data/helpers/reconciliation-error-tag.ts` — +4 casos no switch exaustivo.
12. `client/data/model/reconciliation.model.ts` — tipos espelhados.
13. `client/data/repository/reconciliation.repository.ts` (+ `.instance.ts`) — 2 métodos + wiring.
14. `reconciliation-workspace/counterpart.view-model.ts` — formatação pura (BRL/data/score/band) + sort.
15. `reconciliation-workspace/counterpart.binding.ts` — `useConfirmCounterpart` + `useCounterpart` (state).
16. `reconciliation-workspace/reconciliation-workspace.query.ts` — `counterpartSuggestionsQueryOptions`.
17. `reconciliation-workspace/reconciliation-workspace.binding.ts` — expõe `vm.counterpart`.
18. `reconciliation-workspace/components/counterpart-pane.component.tsx` — view burra.
19. `reconciliation-workspace/page/reconciliation-workspace.page.tsx` — planta o pane na aba `sugestao`.
20. `shared/i18n/catalog.pt-BR.ts` — tags `financial.recon.counterpart.*` + `financial.recon.error.counterpart-*`.

## Testes

- node:test: `tests/modules/financial/counterpart.view-model.test.ts` (parse cents string, score→pct/band,
  ordenação score desc + expectedDate asc).
- vitest jsdom: `tests/modules/financial/counterpart.binding.spec.tsx` (palpites: ready/none/error; confirm:
  sucesso invalida + erro vira tag).

## Decisão de placement (UX)

Seção appendada ABAIXO do `SuggestionPane` na aba `sugestao` (não uma 4ª aba) — mantém o tab-bar do mock e
mostra a contrapartida como "mais um palpite" da MESMA transação. Renderiza só quando há candidatas → invisível
para transações comuns de título. Undo pós-confirm via lookup #175 (a conciliação de contrapartida aparece no
`GET /statement-transactions/:id/reconciliation`), sem gravação de sessão nova.
