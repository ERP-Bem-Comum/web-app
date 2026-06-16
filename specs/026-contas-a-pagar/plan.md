# Implementation Plan: Contas a Pagar (Financeiro) — v1 núcleo

**Branch**: `feat/contas-a-pagar-026` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/026-contas-a-pagar/spec.md`

## Summary

Criar o submódulo **Contas a Pagar** como **novo módulo vertical** `src/modules/financial/`, espelhando a feature-modelo `src/modules/auth/`. Duas superfícies de UI no v1: **Grid de Contas a Pagar** (entrada — **lista real paginada** na Fatia 2; estado vazio é fallback) e **Lançar Documento** (form que cria um documento fiscal `Open` via `POST /api/v2/financial/documents`; o backend gera 1 título pai + 1 filho por retenção). As server functions de ciclo de vida (ajustar/aprovar/desfazer/cancelar) entram na camada server+client, mas a **superfície de UI** dessas ações desce com o **drawer (onda 2)** — fora do v1. Consome `/api/v2/financial` (**Fatia 2, #57**). **Zero mudança no core-api** (gap `FIN-LIST-DTO`/[#47](https://github.com/ERP-Bem-Comum/core-api/issues/47) fica como handoff: lista real mas DTO fino).

## Technical Context

**Language/Version**: TypeScript strict (migração 6→7, `erasableSyntaxOnly`) · React 19
**Primary Dependencies**: TanStack Start (Vite + Nitro), TanStack Query/Router, Zod 4, vanilla-extract (nenhuma dep nova)
**Storage**: N/A no front — estado remoto no core-api, acessado **só** via server functions (BFF)
**Testing**: `node:test` (`*.test.ts`, puro — domain/view-model/io/mappers) + Vitest jsdom (`*.spec.tsx`, DOM — páginas/componentes/controllers) + Playwright visual (`e2e/visual/`)
**Target Platform**: Web (SSR + browser) com BFF unificado
**Project Type**: Web app (front + BFF) — módulo vertical novo
**Performance Goals**: interações percebidas como instantâneas; grid preparado para paginação server-side (quando a Fatia 2 entregar a lista)
**Constraints**: token nunca no browser (§IX); design system só-tokens (§X); strings i18n; errors-as-values (§II); a UI nunca olha status HTTP (§V)
**Scale/Scope**: v1 ≈ 2 telas (grid + lançar) · 7 server fns (todas reais na Fatia 2: list paginada/filtrada + get + 5 de ciclo) · ações de ciclo de vida na camada server/client
**NEEDS CLARIFICATION**: nenhum bloqueante — contrato da **Fatia 2 (#57)** mapeado e fonte de verdade (`core-api/specs/FIN-DOCUMENTO-INGESTAO`) lida. Itens fora do contrato atual estão explicitamente deferidos na spec.

## Constitution Check

_GATE: passa antes da Fase 0; re-checado pós-Fase 1._

| §    | Princípio                        | Conformidade do plano                                                                                                                                                                                            |
| ---- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I    | Vertical-modular + isolamento    | Novo `src/modules/financial/` com split `server/`×`client/` + `public-api/index.ts` como único import externo. ✅                                                                                                |
| II   | Erros como valores               | `FinancialError` (string-union); `Result<T,E>`; `throw` só na borda (`*.server-fn.ts`, `external`). ✅                                                                                                           |
| III  | Server fn = única fronteira      | `*.query.fn.ts` (list, get) · `*.service.fn.ts` (create, adjust, approve, undo-approval, cancel); client toca server só pela porta `Repository`. ✅                                                              |
| IV   | Estados ilegais irrepresentáveis | `DocumentId` branded; `Money` VO; uniões discriminadas para `DocumentType`/`DocumentStatus`/`PayableKind`/`RetentionType` com `switch` exaustivo. ✅                                                             |
| V    | Cadeia de erro fim-a-fim         | slug do core-api → `FinancialError` → tag i18n; status preservado na server fn; 401 central (cache do Query). Espelha `mapHttpError`/`errorTag` de users/contracts. ✅                                           |
| VI   | TS estrito apagável              | união de literais + `as const` (sem `enum`/`namespace`); `import type` inline. ✅                                                                                                                                |
| VII  | Imutabilidade                    | `Readonly<>`/`readonly[]`/`as const` em todo o domínio. ✅                                                                                                                                                       |
| VIII | Mínimo de deps                   | `Intl.NumberFormat` (moeda) e formatação de data nativas; **nenhuma dep nova**. ✅                                                                                                                               |
| IX   | Segurança por construção         | cada server fn anexa o guard de auth (route guards não protegem fns); Zod no input **e** no response do core-api; nenhum segredo no client. ✅                                                                   |
| X    | Design system só-tokens          | vanilla-extract `*.css.ts`, `vars.*`, Atomic Design, i18n; tokens/medidas exatas via Figma MCP + mock HTML. ✅                                                                                                   |
| XI   | MVVM views burras                | `*.view-model.ts`/`*.mutation.ts`/`*.query.ts` agnósticos (sem `react`); acoplamento React no `*.binding.ts`; páginas/`*.component.tsx` burras; server-state no Query, UI-state em `*.controller.ts`/máquina. ✅ |
| XII  | Event Bus                        | **N/A no v1** (sem reatividade cross-fluxo nova). Futuro: evento `DocumentoLancado` se o shell precisar reagir.                                                                                                  |

**Resultado: PASS — sem violações.** Complexity Tracking vazio.

## Project Structure

### Documentation (this feature)

```text
specs/026-contas-a-pagar/
├── spec.md              # /speckit-specify (feito)
├── plan.md              # este arquivo
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
├── contracts/           # Fase 1 (contratos das server fns + contrato core-api consumido)
└── tasks.md             # /speckit-tasks (próximo comando)
```

### Source Code (repository root)

```text
src/modules/financial/
├── server/
│   ├── domain/
│   │   ├── document.io.ts            # tipos I/O PUROS: Document, Payable, enums, FinancialError, DocumentSummary
│   │   └── money.value-object.ts     # reais↔centavos (ou reuso de shared, ver research)
│   ├── application/
│   │   └── financial.use-cases.ts    # porta FinancialClient + use-cases (list/get/create/adjust/approve/undo/cancel)
│   └── adapters/
│       ├── financial.io-schemas.ts   # Zod INPUT (Create/Adjust/Approve/List/Id) + asserts ≡ domínio
│       ├── financial.composition.ts
│       ├── core-api/
│       │   ├── core-api-financial.ts # cliente HTTP /api/v2/financial; mapHttpError; mappers API→model
│       │   └── financial.schema.ts   # Zod RESPONSE (CoreApiDocument, CoreApiPayable, CoreApiDocumentList)
│       └── server-fns/
│           ├── list-documents.query.fn.ts       # GET /documents (lista real paginada/filtrada)
│           ├── get-document.query.fn.ts          # GET /documents/:id
│           ├── create-document.service.fn.ts     # POST /documents (asDraft:false)
│           ├── adjust-document.service.fn.ts      # PATCH /documents/:id
│           ├── approve-document.service.fn.ts     # POST /documents/:id/approve
│           ├── undo-approval.service.fn.ts        # POST /documents/:id/undo-approval
│           └── cancel-document.service.fn.ts      # DELETE /documents/:id
├── client/
│   ├── data/
│   │   ├── model/document.model.ts               # espelha document.io (tipos do client)
│   │   ├── helpers/financial-error-tag.ts        # FinancialError → tag i18n (switch exaustivo)
│   │   └── repository/
│   │       ├── financial.repository.ts           # porta → server fns
│   │       ├── financial.repository.instance.ts
│   │       └── financial-error.ts
│   ├── contas-a-pagar-list/                       # SLICE: grid
│   │   ├── contas-a-pagar.query.ts               # queryOptions (lista)
│   │   ├── contas-a-pagar.view-model.ts          # deriva estado (loading/empty/ready) — PURO
│   │   ├── contas-a-pagar.binding.ts             # adapter React (useQuery)
│   │   ├── page/contas-a-pagar.page.tsx (+ .css.ts)   # view burra
│   │   └── components/                            # grid, status-chips, empty-state, document-row, footer-totais
│   └── document-create/                           # SLICE: lançar documento
│       ├── document-form.controller.ts           # UI-state do form (máquina/reducer) — agnóstico
│       ├── create-document.mutation.ts           # mutationOptions
│       ├── create-document.binding.ts            # adapter React (useMutation)
│       ├── document-form.view.ts                 # derivação pura (preview do líquido, gating de retenção)
│       ├── page/lancar-documento.page.tsx (+ .css.ts)
│       └── components/                            # document-form, retentions-block, registered-taxes-block, net-value-preview
└── public-api/index.ts                            # ★ único import externo

src/routes/
├── financeiro/
│   └── contas-a-pagar/
│       ├── index.tsx        # rota do grid (composition root: monta binding → page)
│       └── lancar.tsx       # rota de lançar documento

tests/modules/financial/    # espelha src (../server/... .test.ts puros; ../client/... .spec.tsx DOM)
```

**Structure Decision**: espelhar `src/modules/auth/` e `src/modules/users/` (o split server×client, o `*.io.ts`/`*.io-schemas.ts`/`core-api-*.ts`/`*-error-tag.ts`, e os slices `*-list`/`*-create` com `query/view-model/binding/page/components`). Rotas file-based em `src/routes/financeiro/contas-a-pagar/` como composition root.

## Faseamento dentro do v1 (ondas)

- **Onda 1a — Server + dados (sem UI):** scaffold do módulo; `document.io.ts` + `money` + schemas Zod (input/response); `core-api-financial.ts` (7 chamadas, mappers, mapHttpError); use-cases + composition; server fns; repository + error-tag. **Testes puros primeiro (RED→GREEN):** money reais↔centavos, mappers API→model, view-model do grid (empty/ready), `financialErrorTag` exaustivo, `document-form.view` (preview do líquido + gating de retenção NFS-e/RPA).
- **Onda 1b — Grid (lista real paginada):** `contas-a-pagar` query/view-model/binding/page + componentes; ligado ao `list-documents.query.fn` (**lista real, paginada/filtrada** na Fatia 2); linhas renderizadas a partir dos `items`; paginação ligada a page/pageSize; base vazia → estado vazio (fallback); chips de status como chrome (sem contadores por aba no v1); botão "Novo Documento" → rota de lançar. Spec DOM do grid (lista + paginação + empty fallback + navegação).
- **Onda 1c — Lançar Documento:** `document-form.controller` + `create-document.mutation/binding` + page/componentes; preview do líquido; bloco de retenções só p/ NFS-e/RPA; fornecedor via dados de Parceiros/Fornecedores; submit → `create-document.service.fn`. Spec DOM do form (validações, gating, onSubmit com centavos/bps).
- **Onda 2 (fora do v1):** drawer de detalhes + ações de ciclo de vida na UI (aprovar/desfazer/ajustar/cancelar), seleção em massa, export, filtro/visões. As server fns já estarão prontas desde a Onda 1a.

## Migrations Drizzle (core-api)

**N/A** — feature 100% frontend; não toca `schema.ts` nem o core-api.

## Contrato HTTP (Fase 2+)

**N/A — consome** o `/api/v2/financial` já existente (**Fatia 2, #57**). Nenhum endpoint novo no core-api. Handoffs abertos como GitHub issues: `FIN-LIST-DTO` ([#47](https://github.com/ERP-Bem-Comum/core-api/issues/47), enriquecer DTO da lista) e `FIN-CREATE-DTO` ([#48](https://github.com/ERP-Bem-Comum/core-api/issues/48)).

## Estimativa de Pipeline (W0 size)

- **Tamanho**: **L** — módulo vertical novo, 7 server fns, 2 slices de UI, integração de borda + mappers + cadeia de erro própria. (Conceito do core-api; aqui só orienta o esforço.)
- **Plano de testes (RED) primeiro**: `tests/modules/financial/server/domain/money.test.ts`, `.../adapters/core-api/mappers.test.ts`, `.../client/contas-a-pagar/contas-a-pagar-view-model.test.ts`, `.../client/document-create/document-form-view.test.ts`, `.../client/data/financial-error-tag.test.ts` — todos descrevendo a API esperada antes da implementação.
