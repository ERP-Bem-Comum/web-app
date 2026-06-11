# Implementation Plan: ACT reescrito — Acordo de Cooperação Técnica (CNPJ)

**Branch**: `feat/contracts-detail-and-partners` (spec dir `022-act-acordo`) | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/022-act-acordo/spec.md`

## Summary

O recurso ACT (`/api/v1/acts`) foi reescrito no #32: de **pessoa-física** (cpf/cargo/vínculo) para **Acordo de Cooperação Técnica** com **instituição/CNPJ** (actNumber, razão social, nome fantasia, representante legal, vigência início/fim, área de atuação, repasse financeiro com conta/PIX). O front ainda usa o modelo antigo → cadastrar/editar ACT **quebra**. Abordagem (frontend-only, sem tocar core-api): **reescrever o recurso ACT espelhando o módulo Fornecedor** (mesmo miolo CNPJ + conta/PIX), mantendo os **nomes de arquivo `act-*`** (zero churn de rotas/imports) e **reutilizando os padrões já presentes** nos partners (Location no create, meta de paginação harmonizada, deactivate/reactivate, `partnersErrorTag`). Diferenças do Fornecedor: o ACT tem **`hasFinancialTransfer` explícito** (toggle que revela conta/PIX), **vigência** (startDate/endDate, fim **estritamente** após início), **actNumber** e **legalRepresentative**, e **occupationArea** (PARC|DDI|DCE|EPV, labels i18n já existentes) no lugar de `serviceCategory`. Remover do front os conceitos de pessoa-física (cpf/role/startOfContract/employmentRelationship/registrationStatus). Validação em duas camadas: UI bloqueia (mensagens) + Zod na borda defende; o backend é o árbitro final. **Sem `serviceRating`** (é a fatia §1.6).

## Technical Context

**Language/Version**: TypeScript strict (erasableSyntaxOnly), React 19, TanStack Start/Query/Router, Zod 4, vanilla-extract.

**Storage**: N/A no front (server-state via TanStack Query; backend persiste).

**Testing**: `node:test` (puro, `*.test.ts`, imports `#`) p/ mapeadores request/response + validação Zod (repasse/vigência) + controller; Vitest+jsdom (`*.spec.tsx`) p/ o form (toggle repasse) e lista/filtros.

**Project Type**: Web app (front + BFF). Server function = única fronteira.

**Constraints**: invariantes v2 (lint): `Result<T,E>` sem throw fora da borda; sem `any`; imutabilidade; só-tokens; i18n; views burras (page/component sem `useQuery`/`useMutation`); boundaries por `public-api`; Zod na borda (input + response); naming por postfix; switch exaustivo (`never`). **Sem tocar core-api.**

**Scale/Scope**: 1 recurso (ACT) do módulo partners, 4 fluxos (list/create/edit/detail) + server (domain/adapters/server-fns). ~25 arquivos reescritos/editados (nomes mantidos), 0 novos de produção esperados (+ testes). Risco: regressão nos demais parceiros / resquício do modelo antigo.

## Constitution Check

| Princípio | Status | Como cumpre |
|---|---|---|
| I — Vertical-modular / boundaries | ✅ | Tudo dentro de `partners`; consumo externo (rotas) via páginas; sem novo cross-módulo. |
| II — Erros como valor | ✅ | Mapeadores devolvem `Result`/`PartnersError`; throw só na borda (server-fn try/catch). |
| III — Server fn única fronteira | ✅ | create/update/get/list/deactivate/reactivate via server-fns (nomes mantidos). |
| IV — Estados ilegais irrepresentáveis | ✅ | `OccupationArea`/`PixKeyType` unions; `PartnersError` += membros (switch exaustivo `never`); payment target = `hasFinancialTransfer` + conta/PIX. |
| V — Cadeia de erro → i18n | ✅ | slugs do #32 → `PartnersError` → `partnersErrorTag` → tag; UI nunca olha HTTP. |
| VI — Zod na borda | ✅ | input da server-fn (cnpj/vigência/repasse via `.superRefine`) + response do core-api; drift guards. |
| VII — Imutabilidade | ✅ | tipos `Readonly<>`; controller com estado imutável. |
| X — Só-tokens | ✅ | reusar CSS do form/detail/list (tokens); sem cor/px crus. |
| XI — Views burras / server≠UI | ✅ | data-hooks no binding; form state no controller; page/component por props. |
| i18n | ✅ | labels novos (actNumber, razão social, fantasia, representante, vigência, repasse) + áreas (já existem) + erros. |

**Resultado**: PASS. Sem Complexity Tracking.

## Project Structure

```text
specs/022-act-acordo/
├── plan.md · research.md · data-model.md · quickstart.md
├── contracts/acts-api.md
└── checklists/requirements.md
```

### Arquivos a tocar (todos em `src/modules/partners/`, **nomes mantidos**)

```text
SERVER — domínio + borda
server/domain/act/act.types.ts        # OccupationArea (manter) + PixKeyType + BankAccount/PixKey;
                                       #   REMOVER RegistrationStatus/EmploymentRelationship/(person)
server/domain/act/act.io.ts           # CreateActInput/UpdateActInput/ActDetail/ActListItem NOVOS (Acordo)
server/domain/act/act.ts              # agregado: drop person; manter puro/minimal (regra de repasse é do backend)
server/adapters/act.io-schemas.ts     # Zod input: actNumber/cnpj/corporateName/fantasyName/occupationArea/
                                       #   legalRepresentative/startDate/endDate/hasFinancialTransfer/bankAccount/pixKey
                                       #   + .superRefine (repasse⇒conta|pix; endDate>startDate) + drift guard
server/adapters/core-api/act.schema.ts# actDetailSchema do #32 (id/legacyId/active/createdAt/updatedAt + campos)
server/adapters/core-api/core-api-acts.ts # toWriteBody (domínio→wire, onlyDigits no cnpj, bankAccount/pixKey,
                                       #   startDate/endDate, hasFinancialTransfer); itemToModel/detailToModel;
                                       #   SLUG_TO_ERROR += (act-number-dup/invalid-cnpj/period/payment-target);
                                       #   Location no create + meta harmonizada (já no padrão — manter)
server/adapters/act.composition.ts    # ajustar se assinatura de deps mudar (provável: sem mudança)
server/application/act/act.use-cases.ts # ajustar tipos (input/output novos); sem regra nova
server/adapters/server-fns/act/*.ts   # create/update/get/list/deactivate/reactivate — ajustar input/validação

CLIENT — model + ui
client/data/model/act.model.ts        # espelha I/O novo + OCCUPATION_AREAS (manter) + PIX_KEY_TYPES
client/domain/act.types.ts            # reexport p/ UI (sem person)
client/data/repository/act.repository.ts(.instance) # assinaturas novas
client/data/act-list-filters.schema.ts# + hasFinancialTransfer + occupationArea (manter search/active/order/page/limit)
client/act-create/components/act-form.controller.ts # estado do Acordo + toggle repasse; submit monta input; valida (repasse/vigência)
client/act-create/components/act-form.component.tsx # campos do Acordo (espelhar supplier-form) + toggle revela conta/PIX + select área
client/act-create/{view-model,binding,mutation,page} # ajustar tipos
client/act-edit/components/act-edit-form.component.tsx + {view-model,binding,mutation,page} # idem (pré-carrega)
client/act-detail/components/act-detail-content.component.tsx + {view-model,binding,query} # exibe campos novos
client/act-list/{list,view-model,binding,query} + components/{act-filters.component,act-filters.controller,act-paginator} # colunas/filtros novos

I18N
shared/i18n/catalog.pt-BR.ts          # labels do Acordo + tags de erro (act-number-duplicate, invalid-cnpj,
                                       #   invalid-act-period, act-payment-target-required); áreas já existem

ERROS (partners)
server/domain/errors/partners.errors.ts + client copy + client/data/helpers/partners-error-tag.ts # += 4 membros
```

**Structure Decision**: reescrever **conteúdo** mantendo **nomes/rotas** (`atos/`), espelhando o Fornecedor por **cópia/adaptação** (não extração) para não acoplar/regredir o supplier. Padrões partners (Location, meta, status) reusados in-place.

## Complexity Tracking

> Sem violações de constituição. Reescrita ampla gerenciada por TDD nos mapeadores + checagem de não-regressão (SC-005).

## Migrations Drizzle (core-api)

- [x] **nenhuma** — frontend-only; o recurso `/api/v1/acts` já reescrito no #32.

## Contrato HTTP (consumo — core-api NÃO muda)

- `POST/PUT /api/v1/acts` (body do Acordo, §2.6.4). Criação **201 + Location** (sem corpo) → ler id → GET detalhe.
- `GET /api/v1/acts` (filtros `search/active/hasFinancialTransfer/occupationArea`; meta harmonizada). `GET /acts/:id`. `POST /acts/:id/{deactivate,reactivate}`.
- **Erros → tag i18n** (envelope `error.code`):

| code (core-api) | HTTP | PartnersError (novo) | tag |
|---|---|---|---|
| `register-act-number-duplicate` / `edit-act-number-duplicate` / `act-number-duplicate` | 409 | `act-number-duplicate` | `partners.error.act-number-duplicate` |
| `invalid-cnpj` | 422 | `invalid-cnpj` | `partners.error.invalid-cnpj` |
| `period-end-before-start` / `period-zero-duration` | 422 | `invalid-act-period` | `partners.error.invalid-act-period` |
| `act-payment-target-required` | 422 | `act-payment-target-required` | `partners.error.act-payment-target-required` |
| `act-*-required` / `occupation-area-*` / outros 422 | 422 | `validation` (existente) | `partners.error.validation` |

## Estimativa de Pipeline (W0 size)

- **Tamanho**: [x] **L** — recurso inteiro reescrito (4 fluxos + server), múltiplos mapeadores, novo modelo, regra de repasse + vigência.
- **Plano de testes W0 (RED)**:
  - `node:test` — `core-api-acts` mapeadores: `toWriteBody` (cnpj só-dígitos, bankAccount/pixKey null vs objeto, hasFinancialTransfer, startDate/endDate) e `detailToModel`/`itemToModel` (campos novos, legacyId, active); SLUG_TO_ERROR (4 slugs → erro).
  - `node:test` — `act.io-schemas` `.superRefine`: repasse⇒conta|pix; endDate>startDate (igual/antes falha).
  - `node:test` — `act-form.controller`: regra de repasse (toggle on sem conta/pix bloqueia) + vigência.
  - Vitest — `act-form.component`: toggle `hasFinancialTransfer` revela conta/PIX e exige ao menos um; select de área.
