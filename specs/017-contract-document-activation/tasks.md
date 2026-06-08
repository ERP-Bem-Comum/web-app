---
description: "Task list — feature 017 anexo do documento assinado e efetivação do contrato"
---

# Tasks: Anexo do documento assinado e efetivação do contrato

**Input**: Design documents em `specs/017-contract-document-activation/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: INCLUÍDOS (TDD — invariante §do projeto: teste antes da implementação). node:test (puro) + Vitest (DOM) + Playwright (e2e).

**Escopo**: frontend-only, módulo `src/modules/contracts/`. Mudanças **ADITIVAS** — zero regressão em criar Pendente / update / amendment. **Não tocar core-api.**

## Format: `[ID] [P?] [Story] Description`
- **[P]**: paralelizável (arquivos distintos, sem dependência pendente)
- **[Story]**: US1 / US2 / US3
- Caminhos de arquivo são absolutos a partir da raiz do repo.

---

## Phase 1: Setup

- [X] T001 Confirmar baseline verde antes de começar: rodar `pnpm verify` e `pnpm test:dom` e anotar contagens (baseline para detectar regressão depois). Sem alterar código.

---

## Phase 2: Foundational (bloqueia todas as user stories)

**Purpose**: infra de borda binária, model, RBAC client e i18n — pré-requisitos de US2/US3.

- [X] T002 [P] Criar helper de upload binário em `src/external/core-api/` (ex.: `octet-stream-fetch.ts`): `POST` com `Content-Type: application/octet-stream`, body `Uint8Array`, query string e `authHeader`, devolvendo `Result<T, HttpError>` na mesma cadeia do `resultFetch` (§V). NÃO alterar `resultFetch`. Espelhar a forma de `src/external/core-api/result-fetch.ts` (parse de erro/HttpError idêntico).
- [X] T003 [P] Estender `src/modules/contracts/client/data/model/contracts.model.ts`: adicionar `AttachSignedDocumentInputSchema` (`contractId` uuid, `fileBase64` string, `fileName` 1–255 sem path-sep, `signedAt` ISO) e `DocumentMetaSchema` (reusar/espelhar `CoreApiDocumentSchema`). Exportar os tipos inferidos.
- [X] T004 [P] Criar `src/modules/contracts/client/data/helpers/can.ts` espelhando `src/modules/partners/client/data/helpers/can.ts`: união `ContractPermission = 'contract:read' | 'contract:write' | 'contract:mass-approve'` + `grantedContractPermissions()` (narrowing) + `can(granted, required)`.
- [X] T005 [P] Adicionar tags i18n em `src/shared/i18n/catalog.pt-BR.ts` sob `contracts.attach.*`: `title`, `button`, `hintFile`, `hintDate`, `submit` + erros `error.invalid-pdf`, `error.too-large`, `error.invalid-date`, `error.no-document`, `error.conflict`, `error.storage`, `error.failed`. Seguir a convenção existente de `contracts.*`.

**Checkpoint**: helper binário, schemas, RBAC e i18n prontos → US2/US3 podem começar.

---

## Phase 3: US1 — Registrar sem documento → Pendente (Priority: P1) 🎯 não-regressão

**Goal**: garantir que criar contrato SEM documento continua nascendo **Pendente** (comportamento atual preservado).
**Independent Test**: criar sem arquivo → contrato Pendente na grade; `status='Pending'`, 0 documentos.

- [X] T006 [US1] Teste de regressão (node:test) em `tests/modules/contracts/` cobrindo que `createContractFn`/fluxo de criação SEM arquivo produz status Pendente e não chama upload/activate. (Se já houver teste de create, estender; senão criar `create-contract-pending.test.ts`.)

**Checkpoint**: US1 verde = rede de segurança contra regressão antes de mexer no `handleConfirm`.

---

## Phase 4: US2 — Anexar na criação → Em Andamento (Priority: P1) 🎯 MVP/núcleo

**Goal**: anexar PDF + data de assinatura na criação → contrato nasce **Em Andamento** (efetivo).
**Independent Test**: criar com PDF válido + data → grade mostra EM ANDAMENTO; `status='Active'`, `signed_at` preenchido, 1 doc em `ctr_documents`.

### Testes primeiro (TDD — RED)
- [X] T007 [P] [US2] node:test `tests/modules/contracts/server/adapters/attach-signed-document.border.test.ts`: rejeita não-PDF (sem magic bytes %PDF) → `invalid-pdf`; >20MiB → `file-too-large`; `signedAt` ausente/inválida/futura → `invalid-signed-at`; `fileName` com path-sep → sanitiza/rejeita.
- [X] T008 [P] [US2] node:test `tests/modules/contracts/client/contract-attach-document/attach-signed-document.view-model.test.ts`: mapeamento `ContractsError → tag i18n` por switch exaustivo (`activate-contract-no-signed-document`→no-document, `document-magic-bytes-mismatch`→invalid-pdf, `document-*`→conflict, `storage-*`→storage, fallback→failed).

### BFF (server)
- [X] T009 [US2] Em `src/modules/contracts/server/adapters/core-api/core-api-contracts.ts`: método `uploadDocument(contractId, { bytes, fileName }, token)` usando o helper binário (T002), query `categoria=signed_contract&fileName=<enc>&mimeType=application/pdf&signedElectronically=true`; validar resposta 201 com `CoreApiDocumentSchema`; mapear `document-magic-bytes-mismatch`/`document-contract-mismatch`/`document-already-*`/`storage-*` → `ContractsError`.
- [X] T010 [US2] No mesmo `core-api-contracts.ts`: método `activate(contractId, { signedAt }, token)` via `resultFetch` (JSON `{signedAt}`, headers SÓ `authHeader(token)` — não duplicar content-type); resposta 200 → `apiContractToDomain`; mapear `activate-contract-no-signed-document`/`activate-contract-invalid-signed-at`.
- [X] T011 [US2] No mesmo arquivo: método de orquestração `attachSignedDocument(contractId, { bytes, fileName, signedAt }, token)`: `uploadDocument` → se ok `activate`; idempotência (se `document-already-*` → pular upload e tentar só `activate`); devolve `Result<Contract, ContractsError>` (contrato efetivado). Estender o tipo `ContractsError` com os novos valores (data-model.md).

### Server function (borda)
- [X] T012 [US2] Criar `src/modules/contracts/server/adapters/server-fns/attach-signed-document.service.fn.ts` espelhando `create-contract.service.fn.ts`: `inputValidator(AttachSignedDocumentInputSchema)` + auth (`getCurrentUserFn`/`resolveAccessTokenFn`) + validação de borda (decodifica base64; magic bytes %PDF→`invalid-pdf`; ≤20MiB→`file-too-large`; `signedAt` obrigatória/não-futura→`invalid-signed-at`; `fileName` sanitizado) + chamar `attachSignedDocument` do BFF + converter `Result`→`{ok,data|error}`. (T007 fica GREEN.)

### Client (data → view-model → binding)
- [X] T013 [US2] Em `src/modules/contracts/client/data/repository/contracts.repository.ts`: adicionar `attachSignedDocument(input)` chamando `attachSignedDocumentFn({ data: input })` e devolvendo `Result`. Em `contracts.repository.instance.ts`: injetar `attachSignedDocumentFn`.
- [X] T014 [P] [US2] Criar slice `src/modules/contracts/client/contract-attach-document/`: `attach-signed-document.mutation.ts` (espelha `contract-create.mutation.ts`) e `attach-signed-document.view-model.ts` (sem react: `onSuccess`/`toErrorTag` com switch exaustivo). (T008 fica GREEN.)
- [X] T015 [US2] `src/modules/contracts/client/contract-attach-document/attach-signed-document.binding.ts` (react): `useMutation` → expõe `{ running, errorTag, result, execute }`; helper para ler `File`→base64 (`file.arrayBuffer()`→base64) antes de `execute`.

### UI
- [X] T016 [P] [US2] Criar componente compartilhado `src/modules/contracts/client/contract-attach-document/components/attach-document-modal.component.tsx` (view burra: props `open/onClose/onSubmit(file,signedAt)/submitting/errorTag`; `useState` local p/ drag-drop) + `attach-document-modal.css.ts` (só-tokens `vars.*`; reusar estilos do upload do create). Strings via i18n (T005).
- [X] T017 [US2] Alterar `src/modules/contracts/client/contract-create/page/contract-create.page.tsx`: no `handleConfirm`, após `createCommand` ter sucesso, SE `uploadedFile` presente → chamar attach (via binding) com `uploadedFile` + `signatureDate`; só então redirecionar. Se o attach falhar: NÃO redirecionar forçado — contrato já existe como Pendente; exibir `errorTag` orientando incluir depois (FR-012). Sem documento → comportamento atual (Pendente) intacto.
- [X] T018 [P] [US2] Vitest DOM `tests/modules/contracts/client/contract-attach-document/attach-document-modal.spec.tsx`: render do modal, seleção de PDF, exige data, dispara `onSubmit`, mostra `errorTag`.
- [X] T019 [US2] Exportar em `src/modules/contracts/public-api/index.ts`: `attachSignedDocumentFn` + `useAttachSignedDocumentBinding`.

**Checkpoint**: criar com PDF+data → Em Andamento; sem arquivo → Pendente (US1 segue verde).

---

## Phase 5: US3 — Incluir documento depois num Pendente → efetiva (Priority: P1)

**Goal**: a partir de um contrato Pendente, incluir o documento assinado → Em Andamento.
**Independent Test**: detalhe de um Pendente → "Incluir documento assinado" (só com `contract:write`) → anexar PDF+data → status vira Em Andamento sem recarregar.

- [X] T020 [US3] Alterar `src/modules/contracts/client/contract-detail/components/contract-documents.component.tsx`: botão "Incluir documento assinado" visível só quando status é **Pendente** E `can(granted, 'contract:write')`; abre o `attach-document-modal` (T016) e usa o binding (T015); no sucesso, invalidar a query do detalhe e da lista (TanStack) para refletir Em Andamento.
- [X] T021 [US3] Garantir que o detalhe disponibiliza as `permissions` do usuário ao componente (via binding/view-model do detalhe) para o gate RBAC; espelhar como partners passa `granted`.
- [ ] T022 [P] [US3] (OPCIONAL) Ação equivalente na grade `src/modules/contracts/client/contract-list/components/contract-row.component.tsx` para linhas Pendente (mesmo modal). Marcar como opcional — só se sobrar tempo.
- [ ] T023 [P] [US3] e2e Playwright `e2e/` happy: (a) criar com PDF→Em Andamento; (b) Pendente + anexar→Em Andamento. E sad: PDF inválido / sem data → contrato segue Pendente + mensagem.

**Checkpoint**: ciclo completo Pendente↔efetivo coberto por e2e.

---

## Phase 6: Polish & validação final

- [X] T024 Revisar boundaries/lint: imports cross-módulo só via public-api; views burras sem data-hooks; núcleo agnóstico sem `react`; só-tokens no `.css.ts`. Rodar `pnpm lint`.
- [ ] T025 Gate de regressão zero: `pnpm verify` (typecheck+lint+node:test) e `pnpm test:dom` verdes, com contagem ≥ baseline de T001. Se mexeu em UI/CSS, `pnpm test:visual` (stack de pé) — sem `test:visual:update` sem revisão.
- [X] T026 Validar em tela pelos passos do [quickstart.md](./quickstart.md) (US1/US2/US3 + sad paths). Conferir no banco: `status` e `ctr_documents`.

---

## Dependencies & ordem

- **Phase 2** (T002–T005) bloqueia US2/US3. T002–T005 são todos `[P]` entre si (arquivos distintos).
- **US1 (T006)** independente; rodar cedo como rede de segurança.
- **US2** depende de Phase 2. Ordem interna: testes T007/T008 (RED) → BFF T009→T010→T011 (mesmo arquivo, sequencial) → fn T012 → data T013 → slice T014/T015 → UI T016/T017 → T018 → export T019.
- **US3** depende de US2 (reusa modal + binding + BFF). T020→T021; T022/T023 `[P]`.
- **Polish** por último.

## Paralelização (exemplos)
- Phase 2: T002, T003, T004, T005 juntos.
- US2 testes: T007 e T008 juntos (RED) antes da implementação.
- US2 UI/test: T016 e T018 podem andar junto após o slice.

## MVP
- **MVP mínimo** = Phase 2 + **US2** (anexar na criação → Em Andamento) + US1 (não-regressão). Entrega o valor central já validável em tela.
- **US3** (incluir depois) completa a regra; mesma infra, baixo custo incremental.

---

## Status final (decisão da stakeholder — 2026-06-08)

**017 concluída como está** — funcional (US1+US2+US3 validadas em tela) e gate automático verde:
typecheck limpo · lint 0 erros · node:test 384 · test:dom 95. Nada commitado (a usuária pede commits explicitamente).

- **T022** (ação na grade) — **dispensado** (não essencial; a regra funciona pelo detalhe).
- **T023** (e2e Playwright) — **dispensado** neste momento (validação manual + integração + DOM cobrem o fluxo).
- **T025** (regressão visual) — **pendente p/ a usuária**: rodar `pnpm test:visual` no Docker (`visual-testing.md`).
  Única mudança visual esperada: botão "Incluir documento assinado" no topo do detalhe de contrato Pendente
  (+ o modal de anexo). Se aprovado, regenerar baseline `-linux` e commitar os `.png` com revisão humana.
