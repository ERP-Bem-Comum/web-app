# Implementation Plan: Anexo do documento assinado e efetivação do contrato

**Branch**: `develop` (feature dir `017-contract-document-activation`) | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/017-contract-document-activation/spec.md`

## Summary

Ligar, no frontend, o fluxo que torna um contrato **efetivo** pela inclusão do documento assinado. Hoje o modal de criação já captura `uploadedFile` (PDF) + `signatureDate`, mas o `handleConfirm` os ignora e todo contrato nasce **Pendente**. A regra (corrigida pela stakeholder): **incluir o documento assinado dispara o evento de status → Em Andamento**; não incluir → **Pendente** (pode incluir depois). O backend (core-api) já implementa tudo; o trabalho é **só client + BFF**, **aditivo**, reaproveitando duas rotas existentes em **ordem obrigatória**:

1. `POST /api/v2/contracts/:id/documents` — corpo **binário** (`application/octet-stream`, ≤20 MiB, magic bytes `%PDF`), metadados na **query** (`categoria=signed_contract`, `fileName`, `mimeType=application/pdf`, `signedElectronically`).
2. `POST /api/v2/contracts/:id/activate` — `{ signedAt }`; **exige** o documento já enviado (senão `activate-contract-no-signed-document` 409).

Abordagem: **um** caso de uso de BFF (`attachSignedDocument`) orquestra upload→activate server-side e devolve o contrato efetivado; o client chama **uma** server function (`attach-signed-document.service.fn.ts`). Dois pontos de entrada na UI: (US2) no modal de criação, encadear `create → attach`; (US3) ação "Incluir documento assinado" num contrato **Pendente** (detalhe e/ou grade), só com `contract:write`.

## Technical Context

**Language/Version**: TypeScript strict (6→7, `erasableSyntaxOnly`), React 19

**Primary Dependencies**: TanStack Start (Vite + Nitro), TanStack Query/Router, Zod 4, vanilla-extract. Nenhuma dependência nova.

**Storage**: N/A no front. Documentos vivem no core-api/MinIO via as rotas existentes.

**Testing**: `node:test` (puro: validação de borda, mapeamento de erro, view-model) + Vitest/jsdom (componentes/modal) + Playwright (e2e happy/sad).

**Target Platform**: Web (SSR via Nitro), navegadores evergreen.

**Project Type**: Web app (front + BFF unificado). Módulo vertical `src/modules/contracts/`.

**Performance Goals**: Upload de PDF ≤20 MiB sem travar a UI; feedback de progresso/estado de envio.

**Constraints**: Mudanças **aditivas** (zero regressão em criar Pendente / update / amendment). Token nunca no browser. Browser só fala com core-api via server functions.

**Scale/Scope**: ~12–16 arquivos novos/alterados no módulo contracts + 1 helper de borda binária em `external/core-api` + tags i18n. Sem nova rota de página (ações via modal).

## Constitution Check

*GATE: passar antes do Phase 0; reavaliar após design.*

| § | Princípio | Conformidade do plano |
|---|---|---|
| I | Vertical-modular, import só via `public-api` | ✅ Tudo dentro de `src/modules/contracts/`; novos símbolos exportados em `contracts/public-api/index.ts`. |
| II | Erros como valor (`Result`), sem throw fora da borda | ✅ BFF e data retornam `Result`; `throw` só no `*.service.fn.ts` (permitido) convertido na hora. Novos erros = string-literais kebab-case EN (`document-magic-bytes-mismatch`, `activate-contract-no-signed-document`, `file-too-large`, `invalid-pdf`, `signed-at-in-future`). |
| III | Server function = única fronteira; sufixo `*.service.fn.ts`; BFF orquestra e devolve estado | ✅ `attach-signed-document.service.fn.ts` (comando). O BFF faz upload→activate e devolve o **contrato efetivado** (não `{ok:true}`). Client não conhece a topologia. |
| IV | Estados ilegais irrepresentáveis; união discriminada + switch exaustivo | ✅ Erros como união discriminada; mapeamento `ContractsError → AppError/tag` por switch com guarda `never`. VO de borda (PDF) via smart constructor `Result`. |
| V | Cadeia de erro fim-a-fim; UI nunca olha status HTTP | ✅ `resultFetch`→`Result.err(HttpError)`→server fn preserva status→boundary→`switch` em `kind`→tag i18n. 401 já tratado no cache. |
| VI | TS estrito/apagável; sem `any`/`enum`/`namespace` | ✅ Uniões de literais + `as const`; `import type`. `as` só dentro de smart constructor de borda. |
| VII | Imutabilidade | ✅ `Readonly<>`/`as const`; inputs/objetos imutáveis. |
| VIII | Mínimo de deps; nativo | ✅ Usa nativo: `File.arrayBuffer()`, `Uint8Array`, `btoa`/base64 nativo, `fetch`. Nenhuma lib nova. |
| IX | Segurança por construção; token server-side; validação na fronteira (Zod) | ✅ Token só no BFF (server-fn injeta `authHeader`). Zod no input da fn **e** no response do core-api (`*.schema.ts`). Fn protegida faz auth própria (espelha `create-contract`). |
| X | Design system só-tokens | ✅ Estilos do modal em `*.css.ts` com `vars.*` (reusa o estilo do upload já existente no create). Strings via i18n. |
| XI | MVVM views burras; server-state≠ui-state; núcleo agnóstico de framework | ✅ Lógica em `*.view-model.ts`/`*.mutation.ts` (sem react); React só no `*.binding.ts`; modal é view burra (props + `useState` local de UI). |
| XII | Eventos de domínio (Event Bus) | ➖ Não há novo fluxo reativo cross-módulo. Reuso da invalidação de query (TanStack). Sem novo evento de bus. |

**Resultado:** Sem violações. Sem entradas em Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/017-contract-document-activation/
├── plan.md              # Este arquivo
├── research.md          # Decisões técnicas (binário, ordem, falha parcial, RBAC client)
├── data-model.md        # Entidades/schemas Zod (input da fn, DocumentMeta, erros)
├── quickstart.md        # Como validar ponta a ponta
├── contracts/           # Contratos das operações de BFF/server-fn
│   ├── attach-signed-document.fn.md
│   └── bff-core-api-contracts.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
src/modules/contracts/
├── server/
│   └── adapters/
│       ├── core-api/
│       │   ├── core-api-contracts.ts        # (ALT) + uploadDocument(), activate(), attachSignedDocument() [orquestra]
│       │   └── contracts.schema.ts          # (ALT) + schema Zod da resposta de documento/ativação (reusa CoreApiDocumentSchema/ListItem)
│       └── server-fns/
│           └── attach-signed-document.service.fn.ts   # (NOVO) ← espelha create-contract.service.fn.ts
├── client/
│   ├── data/
│   │   ├── model/contracts.model.ts         # (ALT) + AttachSignedDocumentInputSchema, DocumentMetaSchema
│   │   ├── repository/contracts.repository.ts          # (ALT) + attachSignedDocument()
│   │   ├── repository/contracts.repository.instance.ts # (ALT) wire attachSignedDocumentFn
│   │   └── helpers/can.ts                    # (NOVO) ← espelha partners/client/data/helpers/can.ts (contract:read/write)
│   ├── contract-attach-document/            # (NOVO slice) anexar+efetivar
│   │   ├── attach-signed-document.mutation.ts        # ← espelha contract-create.mutation.ts
│   │   ├── attach-signed-document.view-model.ts      # onSuccess/toErrorTag (sem react)
│   │   ├── attach-signed-document.binding.ts         # useMutation (react)
│   │   └── components/
│   │       ├── attach-document-modal.component.tsx   # view burra (reusa UI de upload do create)
│   │       └── attach-document-modal.css.ts          # só-tokens
│   ├── contract-create/page/contract-create.page.tsx # (ALT) handleConfirm: create → (se arquivo) attach → redirect
│   └── contract-detail/components/contract-documents.component.tsx # (ALT) botão "Incluir documento assinado" (Pendente + contract:write)
│       (opcional) contract-list/components/contract-row.component.tsx # (ALT) ação na grade p/ Pendente
├── public-api/index.ts                      # (ALT) export attachSignedDocumentFn + useAttachSignedDocumentBinding
└── ...

src/external/core-api/
└── (NOVO ou ALT) helper de upload binário: fetch octet-stream + query string (resultFetch hoje força application/json)

src/shared/i18n/catalog.pt-BR.ts             # (ALT) + contracts.attach.* e tags de erro novas

tests/modules/contracts/                     # espelha src/
├── server/adapters/attach-signed-document.border.test.ts   # magic bytes %PDF, ≤20MiB, signedAt obrigatória/não-futura
├── client/contract-attach-document/attach-signed-document.view-model.test.ts  # mapeamento de erro→tag
└── (DOM) tests/modules/contracts/client/.../attach-document-modal.spec.tsx
e2e/ (happy: anexar→Em Andamento; sad: PDF inválido/sem data)
```

**Structure Decision**: Módulo vertical `contracts` existente, split server×client, com um **slice client novo** (`contract-attach-document/`) seguindo o padrão de `contract-create/` (mutation→view-model→binding→components). Única adição fora do módulo: um helper de **upload binário** em `src/external/core-api/` (o `resultFetch` atual injeta `application/json`; precisamos de `application/octet-stream` + query string).

## Complexity Tracking

> Sem violações de constituição. Nada a justificar.

## Migrations Drizzle (core-api)

- **Mudanças de schema**: [x] **nenhuma** — feature frontend-only; core-api intocado.
- Demais itens: **N/A**.

## Contrato HTTP (Fase 2+)

- **N/A — sem rota nova no core-api.** Apenas **consumo** de rotas já existentes (`POST /api/v2/contracts/:id/documents` e `POST /api/v2/contracts/:id/activate`). Os contratos consumidos estão detalhados em [contracts/bff-core-api-contracts.md](./contracts/bff-core-api-contracts.md).

## Estimativa de Pipeline (W0 size)

- **Tamanho**: [x] **M** — múltiplos arquivos no módulo, 1 server-fn nova + 2 métodos de BFF + orquestração + UI em 2 pontos de entrada + helper de borda binária; porém sem agregado/BC novo e sem tocar backend.
- **Justificativa**: superfície concentrada no módulo `contracts` (client) + 1 helper em `external/`. Risco principal = upload binário (borda) e encadeamento create→attach; mitigado por testes de borda e e2e.
- **Plano de testes W0 (RED)**: primeiro escrever, falhando:
  1. `attach-signed-document.border.test.ts` — rejeita não-PDF (sem magic bytes), >20MiB, `signedAt` ausente/futura → `Result.err` com a tag certa.
  2. `attach-signed-document.view-model.test.ts` — `activate-contract-no-signed-document`/`document-*` → tag i18n correta (switch exaustivo).
  3. e2e happy: criar com PDF+data → contrato **Em Andamento** na grade; sad: PDF inválido → contrato segue **Pendente** + mensagem.
