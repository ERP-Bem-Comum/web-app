# Implementation Plan: Consumo da numeração real + programa/classificação de contratos (#32)

**Branch**: `feat/contracts-detail-and-partners` · **Spec**: [spec.md](./spec.md) · **Date**: 2026-06-10

## Summary

Alinhar o **frontend** (módulo `contracts`) ao contrato de API do core-api #32 (já rodando local): exibir o **número gerado pelo backend**, a **classificação CT/OS real** e o **programa + metadados** no grid e no detalhe; e ajustar o **create** para o novo body. A investigação revelou que o front foi **pré-construído** com os campos — mas com **tipos divergentes** do que o #32 entrega, e com **seletor de programa mockado**. O grosso do trabalho é **reconciliar tipos no model + parsear/mapear no BFF** (leitura) e **corrigir o envio** (create). Frontend-only, aditivo, sem tocar core-api.

## Technical Context

**Language/Version**: TypeScript strict (TS 6→7, `erasableSyntaxOnly`) · **Runtime**: TanStack Start (Vite + Nitro), React 19
**Primary Dependencies**: Zod 4 (validação na borda), TanStack Query (server-state), vanilla-extract (tokens-only)
**Testing**: `node:test` (puros, `*.test.ts`, imports relativos) + Vitest/jsdom (`*.spec.tsx`)
**Project Type**: Web app (front + BFF unificado); a **server function** é a única fronteira client↔server
**Backend de referência**: core-api `feat/backlog-front-handoff` (#32) local — `admin.full@bemcomum.dev` / `DevPassw0rd!2024`
**Scope**: módulo `contracts` (server-adapter/schema + client data/domain/ui de grid, detalhe e create). ~8–12 arquivos.

## Estado atual verificado (read-the-code)

| Camada | Arquivo | Estado hoje |
|---|---|---|
| BFF response schema | `server/adapters/core-api/contracts.schema.ts` | `CoreApiContractListItemSchema`/`DetailSchema` **NÃO** parseiam classification/program/metadados. Status union = Pending/Active/Expired/Terminated (**sem `Cancelled`**). |
| BFF mapper | `server/adapters/core-api/core-api-contracts.ts` | `apiContractToDomain` **hardcoda** `classification:'Contract'`, `program/programId/budgetPlan*/categorizacao/centroDeCusto: undefined`. |
| BFF create | idem (`create`) | Envia `mode:'Pending'` + **`sequentialNumber` aleatório** (`Math.random`) + `classification` cru (`'Contract'/'ServiceOrder'`) + `programId` (number). Resposta parseada por `CoreApiContractListItemSchema`. |
| Client model | `client/data/model/contracts.model.ts` | **Já tem** os campos, tipos divergentes: `programId/budgetPlanId: number` (≠ UUID); `categorizacao/centroDeCusto: enum` (≠ string livre); `program.id: number`. `classification: 'Contract'\|'ServiceOrder'`. Status union sem `Cancelled`. |
| Formatação | `client/domain/format.ts` | `formatContractNumber(code, classification?)` **já** suporta CT/OS; hoje recebe sempre `'Contract'`. |
| Create form | `client/contract-create/components/contract-form.{controller,component}` | `classification` selecionável. **Programa/Plano = `<option>` MOCK numéricas (1..4)** com `Number(e.target.value)`. Sem `signedAt`/`mode` → create **Pending-only**. |

### Mismatches que QUEBRAM contra o #32 (não só "faltando")
1. **classification no create**: front envia `'Contract'/'ServiceOrder'`; #32 exige `'CT'/'OS'` → **rejeita**. Mapear no body.
2. **programId/budgetPlanId**: front = `number` (seletor mock 1..4); #32 = **UUID string** → create com programa **rejeita**; leitura `z.number()` **falha o parse** (UUID string).
3. **categorizacao/centroDeCusto**: front = enum; #32 = string livre → leitura pode falhar.
4. **sequentialNumber**: enviado aleatório; #32 ignora (não-strict) → inofensivo no write, mas **código morto a remover**; o número exibido já vem do response.

## Decisões (rationale completo em research.md; convenção de IDs em **ADR-0013**)

> Ratificado 2026-06-10: **hashtable UUID↔número REJEITADA** (UUID-canônico); **sem brand agora** (só `z.uuid()` string); **D9 escape-branch adotado**.

- **D1 — Classificação**: manter domínio `'Contract'|'ServiceOrder'` (UI/i18n já usam); **mapear no BFF**: response `CT→Contract`/`OS→ServiceOrder`; create `Contract→CT`/`ServiceOrder→OS`. Isola o wire CT/OS no adapter.
- **D2 — IDs string (UUID), sem brand**: `programId`/`budgetPlanId` e `program.id`/`budgetPlan.id` → **`z.uuid()` string** (model + controller). Sem branded type nesta fatia (ADR-0013).
- **D3 — categorizacao/centroDeCusto string livre**: model → `z.string()` nullable/optional; form mantém os valores conhecidos como opções de UI.
- **D4 — Bloco `program`**: parsear `{ id: uuid, sigla }` do #32 → model `program: { id: string, name: string }` (sigla na coluna Programa).
- **D5 — Backward-compat de leitura**: campos novos `.nullable().optional()` nos schemas do BFF → contratos sem metadados ainda parseiam; mapper default `undefined`/"—".
- **D6 — Numeração**: remover `sequentialNumber` aleatório do create; passar `classification` real ao `formatContractNumber` (grid/detalhe já chamam).
- **D7 — Modo de create**: **manter Pending-only** (`mode:'Pending'`). "Cadastro+assinatura" segue o **fluxo 2-passos existente** (criar → anexar doc assinado → ativar). **NÃO** adicionar create mode=Active nesta fatia. → Refina FR-008/FR-009: os dois modos existem **no sistema** via dois fluxos; o create permanece Pending.
- **D8 — Seletor de programa real (UUID)** *(maior risco)*: o `<select>` de programa é mock numérico; para criar com programa válido no #32 e validar US2 via UI, ligar a uma **query de listagem de programas** (via `#modules/programs/public-api`), opções `{ value: program.id (uuid), label: sigla }`. Onde a UI quiser um número de programa, usar **`programNumber`** do backend (não a PK) — ADR-0013. **budgetPlan**: sem endpoint de listagem confirmado → manter **opcional/sem opções** nesta fatia (envia vazio) + follow-up.
- **D9 — Parse resiliente**: `discriminatedUnion` de status ganha **branch de escape** (`status: z.string()`) + `safeParse` por item, para não quebrar quando o #32 mandar `'Cancelled'`. (UI/fluxo de cancelamento = slice futuro.)

## Constitution Check

- ✅ **Erros como valor** (`Result<T,E>`): cadeia existente preservada; sem `throw` fora da borda.
- ✅ **Sem `any`/class, imutabilidade**: edições em schemas/mappers/model puros.
- ✅ **Zod na borda**: response do core-api e input da server fn validados (foco da fatia).
- ✅ **Views burras (MVVM)**: grid/detalhe/form sem `useQuery/useMutation`; a query de programas (D8) vive no **binding** do create.
- ✅ **Design system só-tokens**; **i18n** nos rótulos; **boundaries** (`contracts`→`programs` via public-api).
- ✅ **TS 6→7**: união de literais + `as const`; sem enum runtime.
- **Sem violações** → Complexity Tracking vazio.

## Project Structure

### Documentation (this feature)
```
specs/019-contract-number-program/
├── spec.md · plan.md · research.md · data-model.md · quickstart.md
├── contracts/api-mapping.md   ← #32 (wire) ↔ domínio do front, campo a campo
└── checklists/requirements.md
```

### Arquivos a tocar (source)
**Leitura (US1 número/classificação + US2 programa):**
- `server/adapters/core-api/contracts.schema.ts` — `classification` + `program`(bloco) + `programId/budgetPlanId/categorizacao/centroDeCusto` (nullable/optional) no base/list-item e detalhe.
- `server/adapters/core-api/core-api-contracts.ts` — mapper mapeia classification (CT/OS→domínio) + program/metadados (em vez de hardcodar); **remove** `sequentialNumber` aleatório; mapeia classification domínio→CT/OS no create.
- `client/data/model/contracts.model.ts` — `programId/budgetPlanId`/`program.id`/`budgetPlan.id` → `string`; `categorizacao/centroDeCusto` → `string`; idem `CreateContractInputSchema`.
- `client/domain/format.ts` — assinatura inalterada; receber `classification` real (chamadas já existem).
- `contract-list/components/contract-row.*` — coluna **Programa** = `program?.name ?? '—'`; prefixo via `formatContractNumber(code, classification)`.
- `contract-detail/...` — Programa/Plano/Categorização/Centro de Custo lidos do contrato (hoje "—").

**Create (US1):**
- `contract-create/components/contract-form.controller.ts` — IDs string; `categorizacao/centroDeCusto: string|null`; `submit()` com tipos novos.
- `contract-create/components/contract-form.component.tsx` — seletor de Programa com **opções reais** (D8); sem `Number(...)`.
- `contract-create/contract-create.binding.ts` — (D8) query de programas via `#modules/programs/public-api`.
- `contract-create/contract-create.view-model.ts` — expor opções de programa (derivação pura).

### Testes
- **node:test**: `formatContractNumber` (CT/OS); `apiContractToDomain` dos novos campos (CT→Contract, program block, metadados, backward-compat nulls); `submit()` (input com programId string; sem número).
- **Vitest/jsdom**: coluna **Programa** no grid (sigla vs "—"); campos no detalhe; seletor de programa com opções reais (query mockada).

## Riscos / Out-of-scope

- ⚠️ **Status `Cancelled`** (#32) **fora de escopo**: a union de status (sem `Cancelled`) **falharia o parse** de um cancelado. Não criamos cancelados aqui; mitigação opcional (fallback tolerante) ou slice futuro de cancelamento.
- ⚠️ **D8** é o maior item; se a listagem de programas exigir muito wiring, pode virar sub-tarefa/follow-up — mas é necessária para validar US2 via UI. budgetPlan fica opcional.
- **Fora de escopo**: cancelamento, motivo do distrato, `signedAt` do aditivo, avaliação de fornecedor, `GET /partner-municipalities/added`.

## Migrations Drizzle (core-api)
**N/A** — frontend-only.

## Contrato HTTP
**N/A criar** — consumimos o contrato do #32. Mapeamento em `contracts/api-mapping.md`.

## Estimativa de Pipeline (W0 size)
**M** — 8–12 arquivos, 3 frentes (read/number/create) + 1 integração cross-módulo (programs). TDD nos pontos puros.

## Próximos comandos
`/speckit-tasks` → `/speckit-analyze` → `/speckit-implement`.
