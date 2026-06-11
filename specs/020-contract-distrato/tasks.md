# Tasks: Distrato aderente ao #32 — encerrar contrato por distrato

**Feature**: `020-contract-distrato` | **Branch**: `feat/contracts-detail-and-partners`
**Input**: plan.md, research.md, data-model.md, contracts/distrato-end.md, spec.md
**Escopo**: frontend-only, módulo `src/modules/contracts/`, ADITIVO (sem regressão), **sem tocar core-api**. TDD.

> Convenções: testes `node:test` = `*.test.ts` (puros, **imports relativos**); Vitest = `*.spec.ts(x)` (aliases `#…`).
> Espelhar o fluxo gêmeo `attach-signed-document` (upload→activate) → distrato é **upload(signed_termination)→end**.
> [P] = paralelizável (arquivos distintos, sem dependência pendente).

---

## Phase 1: Setup

- [X] T001 Registrar a **baseline** de testes/gates antes de qualquer mudança (para comparação em SC-004): rodar `pnpm test` (node:test) e `pnpm test:dom` (vitest) e anotar os totais (ex.: node 457, dom 114) + `pnpm typecheck`/`pnpm lint` (0 erros). Anotar em comentário no PR/sessão.

---

## Phase 2: Foundational (BLOQUEIA as user stories)

> Tipos, schema, erros e i18n. Sem isso o resto não compila. T002/T003 são [P] (arquivos distintos).

- [X] T002 [P] Em `src/modules/contracts/server/domain/contracts.types.ts`: acrescentar à união `ContractsError` os membros `'terminate-no-document'` e `'terminate-invalid-date'` (com comentário do slug 422 de origem); e exportar o tipo `EndContractInput = Readonly<{ contractId: string; fileBase64: string; fileName: string; terminatedAt: string; reason: string }>` (espelha o schema da T004). **F1 (boundary):** em `src/modules/contracts/server/adapters/contracts-shared.types.ts`, **re-exportar** `EndContractInput` (`export type { EndContractInput } from '…/server/domain/contracts.types.ts'`), espelhando o re-export de `ContractsError` — o **client NUNCA importa `server/domain` direto** (§I/§III, lint).
- [X] T003 [P] Em `src/shared/i18n/catalog.pt-BR.ts`: adicionar as tags `'contracts.distrato.error.no-document'` ("É necessário anexar o documento assinado de distrato para encerrar o contrato.") e `'contracts.distrato.error.invalid-date'` ("Data efetiva do distrato inválida (não pode ser futura)."). Conferir e, se faltar, adicionar labels do form de distrato (motivo/data efetiva) usadas pela UI — sem literais soltos.
- [X] T004 Em `src/modules/contracts/server/adapters/contracts.schemas.ts`: criar `EndContractInputSchema = z.object({ contractId: z.uuid(), fileBase64: z.string().trim().min(1), fileName: z.string().trim().min(1).max(255).regex(/^[^/\\:*?"<>|]+$/, 'invalid-file-name'), terminatedAt: z.string().trim().min(1), reason: z.string().trim().min(1) })` e adicionar o drift guard `const _g_endInput: AssertEqual<z.infer<typeof EndContractInputSchema>, D.EndContractInput> = true` ao bloco `void [...]`. (Depende de T002.)
- [X] T005 Em `src/modules/contracts/client/data/helpers/contracts-error-tag.ts`: adicionar ao `switch` exaustivo os casos `'terminate-no-document' → 'contracts.distrato.error.no-document'` e `'terminate-invalid-date' → 'contracts.distrato.error.invalid-date'` (mantendo o guard `never`). (Depende de T002.)

**Checkpoint**: `pnpm typecheck` compila (a união e o schema fecham; o error-tag exaustivo cobre os 2 novos casos).

---

## Phase 3: User Story 1 — Distratar um contrato e ele encerrar (P1) 🎯 MVP

**Goal**: ao distratar um contrato Em Andamento (motivo + data efetiva + documento), ele encerra (status **Distrato**), refletido no detalhe e no grid.

**Independent Test**: criar+homologar um aditivo de distrato com motivo, data efetiva (não-futura) e PDF assinado → contrato vira Distrato, `endedAt` = data efetiva.

### Testes RED (escrever ANTES da implementação)

- [X] T006 [P] [US1] `node:test` do use-case em `tests/modules/contracts/server/application/end-contract.test.ts` (imports RELATIVOS): com client mockado, verificar que `createEndContract` chama `uploadTerminationDocument` e **depois** `endContract(contractId, terminatedAt, reason)`; que `document-conflict` no upload **não aborta** (segue para o end); que outro erro de upload **aborta** com `err`; que repassa `terminatedAt`/`reason`. (Falha agora — assinatura ainda antiga.)
- [X] T007 [P] [US1] `node:test` do schema em `tests/modules/contracts/server/adapters/end-contract-input-schema.test.ts` (imports RELATIVOS): `EndContractInputSchema` rejeita `reason` vazio, `terminatedAt` vazio, `fileName` com separador de path e `fileBase64` vazio; aceita um input válido. (Falha agora — schema não existe.)

### Implementação — Server (BFF)

- [X] T008 [US1] Em `src/modules/contracts/server/adapters/core-api/core-api-contracts.ts`: (a) `SLUG_TO_ERROR` += `'terminate-no-signed-document': 'terminate-no-document'` e `'terminate-invalid-date': 'terminate-invalid-date'`; (b) `endContract` passa a receber `(contractId, terminatedAt, reason, token)` e enviar body `{ kind: 'Terminate', terminatedAt, reason }`; (c) novo método `uploadTerminationDocument(contractId, { bytes, fileName }, token)` espelhando `uploadDocument` mas com `categoria: 'signed_termination'` (a query de doc de **contrato** NÃO leva `signedAt`); (d) atualizar a interface `CoreApiContractsClient` (assinaturas de `endContract` e do novo método). Remover o comentário "Religação BÁSICA".
- [X] T009 [US1] Em `src/modules/contracts/server/application/commands/end-contract.use-case.ts`: reescrever espelhando `attach-signed-document.use-case.ts` — `Deps.client` ganha `uploadTerminationDocument` + `endContract(contractId, terminatedAt, reason, token)`; `EndContractCommand = Readonly<{ contractId; bytes: Uint8Array; fileName: string; terminatedAt: string; reason: string }>`; orquestrar `uploadTerminationDocument → endContract`, idempotente em `document-conflict` (qualquer outro erro de upload aborta). **Torna T006 verde.**
- [X] T010 [US1] Em `src/modules/contracts/server/adapters/server-fns/end-contract.service.fn.ts`: trocar o `inputValidator` para `EndContractInputSchema`; validar PDF + data não-futura via `validateSignedDocument({ fileBase64, fileName, signedAt: data.terminatedAt }, new Date())` (a data não-futura do distrato espelha a RN do domínio → `invalid-pdf`/`file-too-large`/`invalid-signed-at`); ao ok, chamar `contractsServer().endContract({ contractId, bytes, fileName, terminatedAt: data.terminatedAt, reason: data.reason }, token)`. Manter o try/catch→`'server'`.
- [X] T011 [US1] Em `src/modules/contracts/server/adapters/contracts.composition.ts`: confirmar a fiação de `createEndContract({ client })` (o `client` já expõe os métodos novos após T008) — ajustar só se a assinatura de deps mudar.

### Implementação — Client (threading)

- [X] T012 [US1] Em `src/modules/contracts/client/data/repository/contracts.repository.ts`: `endContract` passa a receber `EndContractInput` (em vez de só `contractId`); atualizar o tipo `EndContractFn` para `(opts: { data: EndContractInput }) => …`. **F1 (boundary):** importar `EndContractInput` **de `#modules/contracts/server/adapters/contracts-shared.types.ts`** (re-export da T002), **NÃO** de `server/domain` — espelhar exatamente como o repository já importa `ContractsError`/`AttachSignedDocumentInput`. (Depende de T002.)
- [X] T013 [US1] Em `src/modules/contracts/client/data/repository/contracts.repository.instance.ts`: fiar `endContractFn` repassando o `data` completo (`{ contractId, fileBase64, fileName, terminatedAt, reason }`).
- [X] T014 [US1] Em `src/modules/contracts/client/contract-terminate/end-contract.mutation.ts`: `mutationFn` recebe `EndContractInput` e chama `contractsRepository.endContract(input)` (não mais só `contractId`).
- [X] T015 [US1] Em `src/modules/contracts/client/contract-terminate/end-contract.binding.ts`: `execute` passa a `({ contractId, file, terminatedAt, reason })`, convertendo `file→base64` via `fileToBase64` (espelhar `attach-signed-document.binding.ts`) e chamando `mutation.mutate({ contractId, fileBase64, fileName: file.name, terminatedAt, reason })`; manter a invalidação (`['contracts','detail',id]` + `['contracts','list']`) e `errorTag` (já cobre os novos via `contractsErrorTag`). **Torna T007/T010 relevantes verdes.**

### Implementação — UI (captura + encadeamento)

- [X] T016 [US1] Em `src/modules/contracts/client/amendment-create/components/amendment-form.controller.ts`: tornar `description` obrigatório quando `type==='distrato'`; estender `AmendmentAttach` para `Readonly<{ file: File; signedAt: string; terminatedAt: string; reason: string }>` e, em `submit`, preencher `terminatedAt: state.terminationDate` e `reason: state.description` no attach de distrato (demais tipos seguem sem esses campos).
- [X] T017 [US1] Em `src/modules/contracts/client/amendment-create/components/amendment-modal.component.tsx`: `canSubmit` exige, **apenas quando `type==='distrato'`**: `description` não-vazio, `terminationDate` preenchido e **arquivo + `signedAt` presentes** (F3 — sem documento o distrato não encerra; o `signed_termination` é obrigatório). **Não alterar** a validação dos demais tipos (valor/prazo/escopo/outro seguem podendo nascer Pendentes sem doc). Ao montar o `attach` no `onCreate`/`onAttach`, incluir `terminatedAt` (= `terminationDate` no create; **fallback `signedAt`** no attach-pending, onde o bloco de distrato não é exibido) e `reason` (= description). Sem novos literais (i18n).
- [X] T018 [US1] Em `src/modules/contracts/client/contract-detail/page/contract-detail.page.tsx`: `pendingAmendmentAttach` cresce para `{ file; signedAt; isDistrato; terminatedAt; reason }`; no efeito `homologateChained` e no handler `onAttach`, ao confirmar distrato chamar `endCommand.execute({ contractId, file, terminatedAt, reason })` (em vez de `endCommand.execute(contractId)`); o `reason` vem de `input.description`/`selectedAmendment.description` e o `terminatedAt` do attach. Page continua burra (sem data-hooks).

### Testes DOM (Vitest)

- [X] T019 [P] [US1] `tests/modules/contracts/client/amendment-create/amendment-modal-distrato.spec.tsx` (componente AmendmentModal — onde mora o gating): distrato sem documento/data efetiva → submit desabilitado (F3); distrato completo → submit habilita e `onCreate` recebe `attach` com `terminatedAt`; **regressão** aditivo de VALOR submete sem documento (não-distrato inalterado). 3 testes verdes.
- [~] T020 [US1] **DEFERIDO** (`tests/modules/contracts/client/contract-detail/distrato-flow.spec.tsx`): render full-page do `ContractDetailPage` exigiria mock de ~7 bindings + router + QueryClient (alto custo/fragilidade) para validar glue simples. A cadeia já é coberta por: typecheck (assinatura/payload do `endCommand`), T006 (orquestração upload→end), T019 (modal produz o `attach` com `terminatedAt`/`reason`) e T024 (validação em tela manual). Follow-up se quiser o guarda E2E.

**Checkpoint US1**: testes verdes; distrato encerra o contrato ponta a ponta no fluxo de criação-com-anexo.

---

## Phase 4: Polish & validação

- [X] T021 Rodar `pnpm verify` (typecheck + lint + node:test) e comparar com a baseline (T001): **0 erros** de typecheck/lint; node:test ≥ baseline + novos.
- [X] T022 Rodar `pnpm test:dom` e comparar com a baseline: dom ≥ baseline + novos; sem regressões.
- [X] T023 Revisar boundaries/lint do diff: `ui` não importa `server/`/`data`/`server-fn`; `Result` sem `throw` fora da borda; sem `any`; só-tokens; i18n; naming por postfix.
- [X] T024 Validar em tela (admin.full@bemcomum.dev) conforme `quickstart.md`: distratar um contrato **Em Andamento** (motivo+data+PDF) → vira **Distrato** no detalhe e no grid, `endedAt` = data efetiva; checar bloqueios (sem motivo / sem doc / data futura) e mensagem amigável em falha. **F2 (FR-007):** confirmar que tentar distratar um contrato **não-Ativo** (já Distrato/Finalizado) é recusado com mensagem amigável (`contract-not-active`) — o gating é por **defesa do backend** (decisão: aceitar, sem gating proativo de UI nesta fatia; gating na UI fica como follow-up). **Regressão:** refazer um aditivo de **valor** e um de **prazo** + homologação e confirmar que seguem OK. **NÃO commitar** (a usuária commita).

---

## Dependencies

- **Phase 2** (T002–T005) bloqueia tudo. T002 → T004, T005, T008, T009, T010, T012.
- **Server** (T008 → T009 → T010 → T011) antes do **client** (T012 → T013 → T014 → T015).
- **UI** (T016 → T017 → T018) depende do client (T015) para o `endCommand` novo.
- **DOM tests** (T019, T020) após T016–T018.
- **Polish** (T021–T024) por último.
- TDD: T006/T007 (RED) **antes** de T008–T015.

## Parallel opportunities

- T002 ‖ T003 (arquivos distintos).
- T006 ‖ T007 (arquivos de teste distintos).
- T019 pode iniciar em paralelo a T018 (arquivo distinto), validando ao fim.

## Implementation Strategy

MVP = **US1 completa** (Phases 2→3). É a única user story (P1) e corrige o fluxo hoje quebrado. Entregar incrementalmente: foundational → testes RED → server → client → UI → tornar verde → polish. Sem cancelamento/Expire (fora de escopo).
