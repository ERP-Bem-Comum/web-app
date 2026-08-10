# Plan — Desbloquear campos de perfil do Colaborador

> Feature: `036-collaborator-profile-fields` · ver `spec.md`.

## Camadas (vertical) e ordem de edição (inner → outer)

1. **BFF domínio** `server/domain/collaborator/collaborator.io.ts` — `CompleteCollaboratorRegistrationInput`:
   adicionar `sex?`, `maritalStatus?`, `hasChildren?`, `childrenCount?`, `childrenAges?` (number[]), `isPwd?`,
   `pwdDescription?`, `isOnLeave?`, `leaveDuration?`, `leaveRenewable?`, `leaveRenewalDuration?`,
   `publicSectorExperienceDuration?`.
2. **BFF io-schema** `server/adapters/collaborator.io-schemas.ts` — espelhar no
   `CompleteCollaboratorRegistrationInputSchema`; guard `AssertEqual` permanece verde.
3. **core-api response schema** `server/adapters/core-api/collaborator.schema.ts` — adicionar os campos ao
   `CoreApiCollaboratorDetailSchema` (`.nullish()`/tipos certos) para o mapper poder lê-los.
4. **core-api client** `server/adapters/core-api/core-api-collaborators.ts` — o `completeRegistration`
   já faz `{ id, ...fields }`: nenhum pick manual, então os novos campos passam automaticamente. O mapper
   `detailToModel` precisa propagar os novos campos do detalhe → `CollaboratorDetail`.
5. **server io model `CollaboratorDetail`** (`collaborator.io.ts`) — adicionar os campos de leitura.
6. **client model** `client/data/model/collaborator.model.ts` — `CollaboratorCompleteInput` e
   `CollaboratorDetail`: adicionar os campos (espelha o server por estrutura, §I). Exportar `SEXES`/`MARITAL_STATUSES`
   se útil para a view (hoje o componente define `MARITAL` localmente).
7. **client controller** `collaborator-detail-form.controller.ts` — `CollaboratorDetailFormState` (+ campos),
   `fromDetail` (hidratação, incl. `childrenAges int[]→"5, 12"`), `buildComplete` (envio, incl. parses),
   `hasCompleteData` (incluir os novos). Helper puro `parseChildrenAges`/`formatChildrenAges`.
8. **client view** `collaborator-detail-content.component.tsx` — trocar `gatedSel`/`gatedTxt` por `sel`/`txt`;
   remover `<p gatedNote>` das seções liberadas; apagar helpers gated + `MARITAL`/`hint` órfãos.
9. **testes** — node:test puro para `parseChildrenAges`/`formatChildrenAges` + `buildComplete` (sim/não→bool,
   idades, enums) via controller-helpers; mapper detail.

## Mapeamentos críticos

- Booleans (`hasChildren`/`isPwd`/`isOnLeave`/`leaveRenewable`): state `'' | 'sim' | 'nao'`; envio
  `'' ? undefined : v === 'sim'`; hidratação `undefined ? '' : v ? 'sim' : 'nao'` (EXATO como
  `experienceInThePublicSector`).
- `childrenCount`: input texto → `int` (parse dígitos; vazio/NaN → undefined). Hidratação: número → string.
- `childrenAges`: helper puro. Parse: extrai todos os inteiros não-negativos do texto, na ordem
  (`"5 anos, 12 anos"` → `[5,12]`). Format: `[5,12]` → `"5, 12"`. Vazio/sem números → `undefined`/`''`.
- `sex` / `maritalStatus`: select; valores do front == domínio backend; `blank()` no envio (cast seguro).
- Strings (`publicSectorExperienceDuration`, `pwdDescription`, `leaveDuration`, `leaveRenewalDuration`):
  `blank()` como os demais.

## Constitution Check (§I–§XII)

- §I vertical-modular: client espelha server por estrutura, sem cruzar boundary. ✅
- §II erros como valores: nenhum throw novo; controller é puro/derivação. ✅
- §III server fn única fronteira: client só monta o input; o BFF compõe. ✅
- §IV estados ilegais: `sex`/`maritalStatus` como union do domínio; helpers normalizam. ✅
- §VI TS estrito: sem `any`/enum/namespace; `as const` nos enums. ✅
- §VII imutabilidade: `Readonly<>`/`as const` mantidos. ✅
- §X só-tokens: nenhuma cor/px nova (reusa `select`/`Input`). ✅
- §XI MVVM/view burra: lógica no controller; a view só liga `state`/`setField`. ✅

## Gates (resultado da execução)

- `pnpm typecheck` → ✅ EXIT 0 (guard `AssertEqual` schema≡domínio verde).
- `pnpm lint` → ✅ 0 errors (115 warnings pré-existentes, nenhuma nos arquivos tocados).
- `pnpm verify` (typecheck+lint+test) → ✅ 877/877 node tests.
- `pnpm test:dom` → ✅ 260/260 (53 files). Regressão zero.

## Implementação (concluída)

Arquivos tocados:

- `server/domain/collaborator/collaborator.io.ts` — `CompleteCollaboratorRegistrationInput` + `CollaboratorDetail` (read) com os 12 campos.
- `server/adapters/collaborator.io-schemas.ts` — schema do complete + guard verde.
- `server/adapters/core-api/collaborator.schema.ts` — `CoreApiCollaboratorDetailSchema` (.nullish()).
- `server/adapters/core-api/core-api-collaborators.ts` — `detailToModel` propaga os campos; `completeRegistration` já fazia spread (sem pick manual).
- `client/data/model/collaborator.model.ts` — `CollaboratorCompleteInput` + `CollaboratorDetail` + enums `SEXES`/`MARITAL_STATUSES`.
- `client/.../collaborator-detail-form.controller.ts` — state/fromDetail/buildComplete/hasCompleteData; helpers puros exportados `parseChildrenAges`/`formatChildrenAges`/`buildCompleteInput`/`computeHasCompleteData`/`stateFromDetail`.
- `client/.../collaborator-detail-content.component.tsx` — gated→txt/sel; removidos gatedSel/gatedTxt/gatedNote/MARITAL/hint; `txt` ganhou `placeholder` opcional.
- `client/.../collaborator-detail-content.css.ts` — removido `gatedNote` órfão.
- Testes: `tests/.../collaborator-detail-form.controller.test.ts` + `tests/.../collaborator-profile-fields.test.ts`.

Decisão de mapeamento (childrenAges): texto livre → `parseChildrenAges` extrai todos os inteiros
não-negativos via `/\d+/g` na ordem ("5 anos, 12 anos" → [5,12]); zero é aceito (recém-nascido).
Hidratação `formatChildrenAges` faz `[5,12].join(', ')` → "5, 12". Vazio/sem números → `undefined`/`''`.
