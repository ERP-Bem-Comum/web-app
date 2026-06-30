# Tasks: Destravar avaliação de fornecedor (§1.6) + cancelamento de contrato (§1.7)

**Feature**: `023-unlock-rating-cancel` | **Branch**: `feat/act-acordo-022` (ou própria)
**Input**: plan.md, research.md, data-model.md, contracts/{supplier-rating.md,contract-cancel.md}, spec.md
**Escopo**: frontend-only, ADITIVO, **sem tocar core-api**, sem regressão. TDD. 2 user stories independentes (módulos diferentes).

> `node:test` = `*.test.ts` (imports `#`); Vitest = `*.spec.tsx` (jsdom). [P] = paralelizável (arquivos distintos).
> ⚠️ **Coordenação**: **US2 (contracts) é independente da 022** → pode ir já. **US1 (supplier) só APÓS a 022/ACT fechar** (mesmo módulo partners + arquivos de erro/i18n compartilhados — evita conflito de merge).

---

## Phase 1: Setup

- [X] T001 Registrar **baseline** (SC-005): `pnpm typecheck` (0), `pnpm lint` (0 err), `pnpm test` (node), `pnpm test:dom` (vitest) — anotar totais.
- [X] T002 **Grep dos switches de status do contrato** (US2 — guard `never`): `grep -rn "Pendente\|Em Andamento\|Finalizado\|Distrato\|STATUS_BADGE\|ContractStatus" src/modules/contracts` → listar TODOS os switch/Record que precisam tratar `'Cancelado'` (badge/cor/label/chip/filtro). Confirmar slug do 409 (`ContractNotPending`/`contract-not-pending`). O typecheck guiará a completude.

---

## Phase 2: Foundational US2 (BLOQUEIA a US2)

> Status `Cancelado` + erro + i18n + testes RED. (US1 não depende disto.)

- [X] T003 Em `src/modules/contracts/server/domain/contracts.types.ts`: `ContractStatus` += `'Cancelado'`; `ContractsError` += `'contract-not-pending'`.
- [X] T004 [P] Em `src/modules/contracts/client/data/model/contracts.model.ts`: `ContractStatusSchema` z.enum += `'Cancelado'`.
- [X] T005 [P] Em `src/modules/contracts/server/adapters/contracts.schemas.ts`: `ContractStatusSchema` z.enum += `'Cancelado'` (manter drift guard).
- [X] T006 Em `src/modules/contracts/client/data/helpers/contracts-error-tag.ts`: + `case 'contract-not-pending' → 'contracts.error.contract-not-pending'` (switch exaustivo `never`). (Depende de T003.)
- [X] T007 [P] Em `src/shared/i18n/catalog.pt-BR.ts`: + `contracts.error.contract-not-pending` ("Apenas contratos pendentes podem ser cancelados."), `contracts.cancel.{title,body,confirm,cancel}` e o rótulo de status **Cancelado** onde os status são exibidos.
- [X] T008 [P] `node:test` em `tests/modules/contracts/server/adapters/core-api/status-cancel.test.ts`: `statusApiToDomain('Cancelled') === 'Cancelado'` e `statusDomainToApi('Cancelado') === 'Cancelled'`; SLUG `ContractNotPending`/`contract-not-pending` → `'contract-not-pending'`. (RED.)
- [X] T009 [P] `node:test` em `tests/modules/contracts/client/can-cancel.test.ts`: `canCancelContract(status)` true só p/ `'Pendente'`; false p/ os demais. (RED — helper a criar.)

**Checkpoint**: typecheck vai apontar cada switch de status faltando `'Cancelado'` → resolvidos na Phase 3.

---

## Phase 3: US2 — Cancelar contrato Pendente (P1, contracts) 🎯 independente da 022

### Server (BFF)

- [X] T010 [US2] Em `src/modules/contracts/server/adapters/core-api/core-api-contracts.ts`: `statusApiToDomain` Cancelled→'Cancelado' (remover do fallback); `statusDomainToApi` Cancelado→'Cancelled'; `SLUG_TO_ERROR` += `'ContractNotPending'`/`'contract-not-pending'` → `'contract-not-pending'`; novo método `cancelContract(contractId, token)` = `DELETE ${baseUrl}/contracts/:id` → `apiContractDetailToDomain` (status 'Cancelado'); atualizar a interface `CoreApiContractsClient`. **Torna T008 verde.**
- [X] T011 [US2] Em `src/modules/contracts/server/application/commands/cancel-contract.use-case.ts` (NOVO): thin `createCancelContract({ client })(contractId, token) → client.cancelContract`. Result.
- [X] T012 [US2] Em `src/modules/contracts/server/adapters/server-fns/cancel-contract.service.fn.ts` (NOVO): `createServerFn({ method:'POST' })` (RPC) com `inputValidator z.object({ contractId: z.uuid() })`; auth + token; chama `contractsServer().cancelContract`; try/catch→`'server'`. (Padrão do `end-contract.service.fn`.)
- [X] T013 [US2] Em `src/modules/contracts/server/adapters/contracts.composition.ts`: + `cancelContract: createCancelContract({ client })`.

### Client (data + UI)

- [X] T014 [US2] Em `src/modules/contracts/client/data/repository/contracts.repository.ts(.instance)`: + `cancelContract(contractId) → cancelContractFn`.
- [X] T015 [US2] Em `src/modules/contracts/client/contract-terminate/cancel-contract.mutation.ts` + `cancel-contract.binding.ts` (NOVOS): mutation DELETE + binding (errorTag via `contractsErrorTag`; `succeeded`); onSuccess invalida `['contracts','list']` + `['contracts','detail',id]`. (Espelha `end-contract.binding`.)
- [X] T016 [US2] Criar helper puro `canCancelContract(status: ContractStatus): boolean` (em `client/domain/` ou `contracts.model`): `=== 'Pendente'`. **Torna T009 verde.**
- [X] T017 [US2] Em `src/modules/contracts/client/contract-list/components/delete-contract-modal.component.tsx`: virar **"cancelar contrato"** (i18n `contracts.cancel.*`), **habilitada** (remover o disabled/aviso stale); `onConfirm` chama o cancelCommand. Renomear conceito "excluir"→"cancelar" na UI.
- [X] T018 [US2] No **gatilho** (contract-list — onde a modal abre; e contract-detail se oferecer): ação "Cancelar" só aparece/habilita p/ `canCancelContract(status)`; fiar o `useCancelContractBinding`.
- [X] T019 [US2] Tratar `'Cancelado'` em **TODOS os switches/Records de status** (lista da T002): `contract-detail/page/contract-detail.page.tsx` `STATUS_BADGE_CLASS` + `contract-detail/page/contract-detail.css.ts` (`statusBadgeCancelled` via token — cor neutra/cinza, distinta do vermelho do distrato); `contract-list/components/contract-row.component.tsx`; `contract-list/components/contract-status-chips.component.tsx`; `client/data/contract-list-filters.schema.ts`. (typecheck/guard `never` confirmam a completude.)
- [X] T020 [P] [US2] Vitest em `tests/modules/contracts/client/cancel-modal.spec.tsx`: a modal de cancelar habilita só p/ Pendente e dispara o command ao confirmar. (Deferir se `showModal`/jsdom frágil — como nas fatias anteriores —, com justificativa.)

**Checkpoint US2**: cancelar contrato Pendente → 'Cancelado' no grid/detalhe; não-Pendente bloqueado; typecheck/lint/testes verdes.

---

## Phase 4: US1 — Avaliação de fornecedor (P1, supplier) ⚠️ APÓS a 022 fechar

### Tipos + borda + mapeadores (server)

- [X] T021 [US1] Em `src/modules/partners/server/domain/supplier/supplier.types.ts`: + `ServiceRating='RUIM'|'REGULAR'|'BOM'|'OTIMO'`. Em `supplier.io.ts`: `CreateSupplierInput`/`SupplierDetail` += `serviceRating: ServiceRating | null`, `ratingComment: string | null`.
- [X] T022 [US1] Em `src/modules/partners/server/adapters/supplier.io-schemas.ts`: input += `serviceRating: z.enum(['RUIM','REGULAR','BOM','OTIMO']).nullable().default(null)`, `ratingComment: z.string().trim().max(500).nullable().default(null)`; manter drift guard.
- [X] T023 [US1] Em `src/modules/partners/server/adapters/core-api/supplier.schema.ts`: response (item+detalhe) += `serviceRating: z.string().nullable()`, `ratingComment: z.string().nullable()` (tolerante).
- [X] T024 [US1] Em `src/modules/partners/server/adapters/core-api/core-api-suppliers.ts`: `toWriteBody` += os 2 campos; `itemToModel`/`detailToModel` += ler (`string → ServiceRating | null` tolerante; desconhecido→null). `SLUG_TO_ERROR`: `invalid-service-rating` → `'validation'` (defesa). **Torna T026 verde.**
- [X] T025 [P] [US1] `node:test` em `tests/modules/partners/server/adapters/core-api/supplier-rating.test.ts`: `toWriteBody` envia serviceRating/ratingComment (e null); `detailToModel`/`itemToModel` leem (válido + null + desconhecido→null). (RED.) → renumerar: este é o teste de T024; escrever ANTES (RED).
- [X] T026 [US1] (≡ ordem TDD: T025 RED antes de T024) — ver nota; manter T024 como o que torna verde.

### Client model + UI

- [X] T027 [US1] Em `src/modules/partners/client/data/model/supplier.model.ts`: + `SERVICE_RATINGS` const + tipo + `isServiceRating`; form schema += `serviceRating` (enum|null) + `ratingComment` (string|null).
- [X] T028 [US1] Em `src/modules/partners/client/supplier-create/components/supplier-form.controller.ts`: estado + submit incluem serviceRating (null = sem avaliação) + ratingComment.
- [X] T029 [US1] Em `src/modules/partners/client/supplier-create/components/supplier-form.component.tsx`: **habilitar** o `<select>` de rating (opções via `SERVICE_RATINGS` + labels i18n + opção "Sem avaliação") e o campo de comentário (remover `disabled`/`gatedHint`).
- [X] T030 [US1] No supplier-detail (`.../supplier-detail/...`): exibir avaliação (nível + comentário) quando houver.
- [X] T031 [P] [US1] Em `src/shared/i18n/catalog.pt-BR.ts`: + `partners.suppliers.rating.{RUIM,REGULAR,BOM,OTIMO}` + "Sem avaliação". (Após a 022 — mesmo arquivo que ela edita.)
- [X] T032 [P] [US1] Vitest em `tests/modules/partners/client/supplier-rating-form.spec.tsx`: select de rating habilitado renderiza as 4 opções + "sem avaliação"=null; comentário editável. (Deferir se frágil, com justificativa.)

---

## Phase 5: Polish & validação

- [X] T033 `pnpm verify` vs baseline (T001): typecheck/lint 0; node ≥ baseline + novos.
- [X] T034 `pnpm test:dom` vs baseline.
- [X] T035 Revisar boundaries/lint do diff: ui sem useQuery/useMutation; Result sem throw fora da borda; sem any; só-tokens (badge Cancelado via vars.*); i18n; naming postfix; switch exaustivo `never`.
- [X] T036 Validado em tela (2026-06-11) pela usuária: **US1** avaliação de fornecedor OK; **US2** cancelamento de contrato Pendente OK; modal de detalhe OK; badges OK. SC-005 sem regressão. Polish do detalhe (data de assinatura/badge/caixa de documento) também validado.

---

## Dependencies

- **US2** (contracts) é **independente da 022** → pode ir já. **US1** (supplier) só **após a 022 fechar**.
- US2: Phase 2 (T003–T009) bloqueia Phase 3. T003→T006; T010 torna T008 verde; T016 torna T009 verde; T019 só fecha o typecheck (todos os switches).
- US1: T021→T022/T023/T024/T027; T025 (RED) antes de T024; T028→T029.
- TDD: T008/T009 (US2) e T025 (US1) RED antes das impls.
- **Polish** por último (depois de US2 e US1).

## Parallel opportunities

- T004 ‖ T005 ‖ T007; T008 ‖ T009.
- US1 (T021+) roda em paralelo à US2 **apenas após a 022 fechar** e em working tree sem conflito (idealmente sequencial após US2).
- T020 ‖ T019; T032 ‖ T030.

## Implementation Strategy

Entregar **US2 (cancelamento) primeiro** — independente da 022, valor imediato. **US1 (avaliação) depois da 022** (mesmo módulo partners). Cada US é uma fatia testável isolada. Incremental: foundational US2 (status/erro/i18n + RED) → US2 server→client→UI→switches → (022 fecha) → US1 server→client→UI → polish. Sem `serviceRating` na 022 (é aqui); cancelamento ≠ distrato (D5).

> **Nota T025/T026**: a numeração ficou com uma dobra — leia como: **escrever o node:test do supplier rating (RED) ANTES** de implementar o mapeador (T024). O teste é o "T025"; o "T026" é só o lembrete da ordem TDD (sem arquivo próprio).
