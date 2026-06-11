# Implementation Plan: Distrato aderente ao #32 — encerrar contrato por distrato

**Branch**: `feat/contracts-detail-and-partners` (spec dir `020-contract-distrato`) | **Date**: 2026-06-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/020-contract-distrato/spec.md`

## Summary

Hoje o distrato pela UI **não encerra** o contrato (fica "Em Andamento"). Causa raiz confirmada (teste real OS 0001 + leitura do `dev`): o `POST /api/v2/contracts/:id/end` do #32 passou a exigir, para `kind:'Terminate'`, **`terminatedAt`** (data efetiva, não-futura) + **`reason`** (motivo) no body, e um documento **`signed_termination` Active** vinculado ao contrato **antes** do `/end`. O front envia só `{ kind:'Terminate' }` e não anexa documento → 400 (body) / 422 (`terminate-no-signed-document`).

Abordagem técnica (frontend-only, aditiva): **reaproveitar o fluxo de aditivo de distrato já existente** (Mecanismo A — ver research.md D1). O modal de aditivo **já captura** os três inputs necessários: `description` (→ `reason`), `terminationDate` (→ `terminatedAt`, data efetiva) e `file`+`signedAt` (o PDF assinado). Ao homologar o aditivo de distrato, além do passo atual (upload `signed_amendment` → homologate), o BFF passa a: **(1)** subir o mesmo PDF como `signed_termination` (documento de contrato) e **(2)** chamar `/end` com `{ kind:'Terminate', terminatedAt, reason }`. O threading de `terminatedAt`+`reason`+`file` percorre: page → end-contract.binding → mutation → repository → end-contract.service.fn (Zod na borda) → end-contract.use-case (upload→end, idempotente em `document-conflict`) → core-api-contracts client. Cadeia de erro (400/422 → tags i18n amigáveis) e invalidação de query (detalhe + lista) reusam os padrões existentes.

## Technical Context

**Language/Version**: TypeScript strict (erasableSyntaxOnly), React 19, Node/Nitro (TanStack Start)

**Primary Dependencies**: TanStack Start (Vite + Nitro), TanStack Query, Zod 4, vanilla-extract

**Storage**: N/A no front (estado remoto = TanStack Query; o core-api persiste). Documento via MinIO/S3 no core-api.

**Testing**: `node:test` (puro, `*.test.ts`, imports relativos) p/ validação de borda + montagem de body; Vitest+jsdom (`*.spec.tsx`) p/ fluxo de UI do distrato.

**Target Platform**: Web (browser) + BFF (server functions). O browser nunca fala com o core-api direto.

**Project Type**: Web app (front + BFF unificado), módulo vertical `src/modules/contracts/`.

**Performance Goals**: N/A (fluxo pontual de escrita). Sem N+1 novos.

**Constraints**: Invariantes v2 (lint cobra): `Result<T,E>` sem throw fora da borda; sem `any`/`class`/`this`; imutabilidade; design system só-tokens (`vars.*`); strings de UI = tags i18n; views burras MVVM (page/component sem `useQuery`/`useMutation`); boundaries por `public-api`; Zod na borda (input da server fn + response do core-api); naming por postfix. Server function = única fronteira client↔server. **Sem tocar core-api.**

**Scale/Scope**: 1 módulo (`contracts`), ~9 arquivos editados (sem arquivo novo de produção obrigatório; 1 método novo no client adapter). Mudança ADITIVA.

## Constitution Check

*GATE: deve passar antes da Fase 0 e ser reavaliado após o design.*

| Princípio (constituição I–XII) | Status | Como o plano cumpre |
|---|---|---|
| II — Erros como valor (`Result`, sem throw fora da borda) | ✅ | Toda a cadeia segue `Result`/`ContractsError`; `throw`→`Result` só na borda da server fn (try/catch já existente). |
| III — Make illegal states unrepresentable | ✅ | Body do `/end` espelha o discriminated union do backend (`kind:'Terminate'` carrega `terminatedAt`+`reason`); novos `ContractsError` como union string + `switch` exaustivo no error-tag (guard `never`). |
| IV — Imutabilidade | ✅ | Tipos `Readonly<>`; inputs novos como campos readonly. |
| V — Server-state ≠ UI-state | ✅ | `terminatedAt`/`reason`/`file` são UI-state (form controller); o resultado remoto fica no TanStack Query. |
| VI — Validação na fronteira (Zod) | ✅ | `EndContractFnInputSchema` cresce com `fileBase64`/`fileName`/`terminatedAt`/`reason`; PDF + data não-futura validados na borda (reuso de `validateSignedDocument`); response do core-api já validado por schema. |
| VII — Token nunca no browser | ✅ | Inalterado: `resolveAccessTokenFn` server-side; nada de Bearer no bundle. |
| IX — Fronteiras de import (`public-api`) | ✅ | Sem cross-módulo novo; tudo dentro de `modules/contracts`. |
| X — Design system só-tokens | ✅ | Reuso do modal de aditivo existente (já tokens-only); se houver microajuste de UI, `vars.*`. |
| XI — Views burras (MVVM) | ✅ | `contract-detail.page` continua só compondo; data-hooks ficam no binding; captura no controller. |
| Strings = i18n | ✅ | Novas mensagens (documento/data efetiva do distrato) entram no catálogo `contracts.distrato.error.*`. |

**Resultado**: PASS (sem violações). Sem necessidade de Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/020-contract-distrato/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões (Mecanismo A, origem de reason/terminatedAt, validação)
├── data-model.md        # Fase 1 — entidades/inputs e regras
├── quickstart.md        # Fase 1 — roteiro de validação em tela
├── contracts/
│   └── distrato-end.md  # Fase 1 — contrato BFF↔core-api do /end + upload signed_termination
├── checklists/
│   └── requirements.md  # (já criado no /speckit-specify)
└── tasks.md             # Fase 2 (/speckit-tasks — NÃO criado aqui)
```

### Source Code (arquivos a tocar — todos em `src/modules/contracts/`)

```text
server/adapters/core-api/core-api-contracts.ts   # endContract: body {kind:'Terminate',terminatedAt,reason};
                                                 #   + método uploadTerminationDocument (categoria signed_termination);
                                                 #   + SLUG_TO_ERROR: terminate-no-signed-document / terminate-invalid-date
server/adapters/contracts.schemas.ts             # EndContractInputSchema (novo) + drift guard
server/adapters/server-fns/end-contract.service.fn.ts  # inputValidator cresce; valida PDF+data (reuso validateSignedDocument)
server/application/commands/end-contract.use-case.ts   # orquestra upload(signed_termination)→endContract (idempotente)
server/domain/contracts.types.ts                 # ContractsError += 'terminate-no-document' | 'terminate-invalid-date';
                                                 #   EndContractInput type (espelha schema)
client/data/repository/contracts.repository.ts   # endContract(input) assinatura cresce; EndContractFn tipo
client/data/repository/contracts.repository.instance.ts # (sem mudança de fiação além do tipo)
client/contract-terminate/end-contract.mutation.ts     # mutationFn passa input completo
client/contract-terminate/end-contract.binding.ts      # execute(input) cresce; errorTag já cobre novos via contractsErrorTag
client/data/helpers/contracts-error-tag.ts       # +2 casos (terminate-no-document, terminate-invalid-date)
client/amendment-create/components/amendment-form.controller.ts # distrato: description+terminationDate obrigatórios; expõe reason/terminatedAt no submit
client/contract-detail/page/contract-detail.page.tsx   # chaining: passa {file,terminatedAt,reason} ao endCommand nos 2 gatilhos
shared/i18n/catalog.pt-BR.ts                      # tags contracts.distrato.error.* + labels do form distrato
```

**Structure Decision**: módulo vertical `contracts` (split server DDD × client MVVM), espelhando o fluxo gêmeo `attach-signed-document` (upload→activate) — o distrato vira **upload(signed_termination)→end**. Nenhum arquivo de produção novo é estritamente necessário (o método `uploadTerminationDocument` mora no client adapter existente); arquivos de teste novos conforme TDD.

## Complexity Tracking

> Sem violações de constituição. Nada a justificar.

## Migrations Drizzle (core-api)

- **Mudanças de schema**: [x] **nenhuma** — feature **frontend-only**; o #32 já entregou `/end` (terminatedAt+reason), a categoria `signed_termination` e a RN no `dev`.

## Contrato HTTP (consumo — o core-api NÃO muda)

- `POST /api/v2/contracts/:id/documents?categoria=signed_termination&fileName=<f>&mimeType=application/pdf&signedElectronically=true` — corpo octet-stream (bytes do PDF). **Pré-requisito do /end.** (A query de doc de **contrato** NÃO exige `signedAt` — confirmado em `uploadDocumentQuerySchema`.)
- `POST /api/v2/contracts/:id/end` — body `{ kind:'Terminate', terminatedAt: <ISO/YYYY-MM-DD>, reason: <string não-vazia> }`. Resposta 200 = list-item do contrato (status `Terminated`). Erros: **400** (body inválido, Zod), **422** `terminate-invalid-date` (data ausente/malformada/futura), **422** `terminate-no-signed-document` (sem doc `signed_termination` Active), **409**-ish via `ContractNotActive` (contrato não-Ativo → `contract-not-active`).
- **Backward-compat / versionamento**: nenhuma quebra; só passamos a enviar os campos que o backend já exige.

## Estimativa de Pipeline (W0 size)

- **Tamanho**: [x] **M** — threading por múltiplas camadas + 1 método novo de client + orquestração upload→end + cadeia de erro/i18n; sem agregado novo nem migration.
- **Justificativa**: localizado no módulo `contracts`, padrão já existente (`attach-signed-document`) a espelhar.
- **Plano de testes W0 (RED)**:
  - `node:test` — `end-contract` border: monta body `{kind:'Terminate',terminatedAt,reason}`, rejeita data futura (reuso `validateSignedDocument`) e PDF inválido; mapeia `terminate-no-signed-document`/`terminate-invalid-date` → erro de domínio.
  - `node:test` — `amendment-form.controller`: distrato exige `description` (reason) e `terminationDate` (terminatedAt); `submit` os repassa.
  - Vitest (`*.spec.tsx`) — fluxo de UI: criar distrato com motivo+data+PDF dispara o encerramento; ausência de motivo/data/doc bloqueia com mensagem.
