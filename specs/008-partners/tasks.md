---
description: "Task list — Gestão de Parceiros (módulo partners)"
---

# Tasks: Gestão de Parceiros (`partners`)

**Input**: Design documents from `/specs/008-partners/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md, data-model.md, contracts/, design-system/

**Tests**: INCLUÍDOS — a constituição (Princ. X) exige TDD. Testes puros em `node:test` (`*.test.ts`,
imports relativos); testes DOM em Vitest/jsdom (`*.spec.tsx`). Espelhe `src/` → `tests/`.

> **Revisão pós-`/speckit-analyze`**: D1 aplicado (organismo `DualPanel` movido para Foundational, T018 —
> US4 e US5 agora paralelizáveis); G1 aplicado (task de verificação de performance SC-002 no Polish, T079).

## Format: `[ID] [P?] [Story] Descrição com caminho`

- **[P]**: paralelizável (arquivos distintos, sem dependência pendente)
- **[Story]**: US1 Colaboradores · US2 Fornecedores · US3 Financiadores · US4 Estados · US5 Municípios
- Estrutura-alvo: `src/modules/partners/{server,client,public-api}` espelhando `src/modules/contracts/`

## Convenções de caminho (deste projeto)

- Domínio/aplicação/adapters server: `src/modules/partners/server/{domain,application,adapters}/`
- Client (feature-first flat): `src/modules/partners/client/{data,domain,<comportamento>}/`
- Rotas: `src/routes/_authenticated/<entidade>/...`
- Design system compartilhado: `src/shared/ui/{atoms,molecules,organisms}/`
- Testes: `tests/modules/partners/**` (`*.test.ts` puro · `*.spec.tsx` DOM)

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Criar a árvore do módulo `src/modules/partners/{server/{domain,application,adapters},client/{data,domain},public-api}` espelhando `src/modules/contracts/`
- [ ] T002 [P] Criar `src/modules/partners/public-api/index.ts` (stub do único ponto de import externo)
- [ ] T003 [P] Adicionar entradas de i18n do módulo em `src/shared/i18n/` (namespace `partners`: rótulos, status, erros, motivos)
- [ ] T004 [P] Registrar o boundary `partners` no `eslint.config.js` (se necessário) seguindo o padrão de `contracts`
- [ ] T005 [P] Criar os arquivos de rota file-based vazios em `src/routes/_authenticated/{colaboradores,fornecedores,financiadores,estados,municipios}/` (composition root)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: VOs/infra/organismos compartilhados por várias stories. ⚠️ Concluir antes das stories.

- [X] T006 [P] Teste dos VOs branded compartilhados em `tests/modules/partners/server/domain/value-objects.test.ts` (CPF, CNPJ, Email, UF, Phone, PixKey — rejeitam inválidos; MF-001) ✅ 19/19 verdes
- [X] T007 [P] Implementar VOs `CPF`/`CNPJ`/`Email`/`UF`/`Phone`/`PixKey` (branded + smart constructor `Result`) em `src/modules/partners/server/domain/value-objects/` ✅
- [X] T008 [P] Definir erros-como-valor do módulo em `src/modules/partners/server/domain/errors/partners.errors.ts` (união kebab-case EN) ✅
- [ ] T009 Criar o client do core-api para `/api/v1` em `src/modules/partners/server/adapters/core-api/partners-core-api.ts` (usa `external/core-api` resultFetch; base `/api/v1`, timeout)
- [ ] T010 [P] Mapear a cadeia de erro do módulo (HttpError→AppError) em `src/modules/partners/client/data/helpers/partners-error-tag.ts` (switch exaustivo → tag i18n)
- [X] T011 [P] Helper de RBAC (FR-020) em `src/modules/partners/client/data/helpers/can.ts` + teste ✅ (lógica pura pronta; ⚠️ FONTE das permissões pendente — `CurrentUser` só tem `userId`; exige BFF `/me` expor permissões)
- [ ] T012 [P] Organismo compartilhado `DataTable` (linha clicável, coluna reservada, empty/loading) em `src/shared/ui/organisms/data-table/` + `*.spec.tsx` 🔴
- [ ] T013 [P] Molécula `PaginationControl` (5/10/25 + prev/next) em `src/shared/ui/molecules/pagination-control/` + `*.spec.tsx` 🔴
- [ ] T014 [P] Organismo `FormCard` (n seções) em `src/shared/ui/organisms/form-card/` + `*.spec.tsx` 🔴
- [ ] T015 [P] Organismo `DeactivateModal` (Motivo opcional, ícone informativo) em `src/shared/ui/organisms/deactivate-modal/` + `*.spec.tsx` 🔴
- [ ] T016 [P] Molécula `FormField` (label+controle+erro+readOnly) em `src/shared/ui/molecules/form-field/` + `*.spec.tsx` 🔴
- [ ] T017 [P] Molécula `SearchField` + átomos faltantes (`StatusBadge`, `IconButton` variants) em `src/shared/ui/{molecules,atoms}/` (só-tokens) + specs 🔴
- [ ] T018 [P] Organismo compartilhado `DualPanel` (2 painéis + buscas independentes + transfer +/− + aria-live; usado por US4 e US5) em `src/shared/ui/organisms/dual-panel/` + `*.spec.tsx` 🔴 *(movido de US4 — D1)*
- [ ] T019 Confirmar/casar tokens de status (`active/inactive/warning/success`) em `src/shared/ui/tokens/*.values.ts` (ver `design-system/01-design-tokens.md`)

**Checkpoint**: fundação pronta — as 5 stories podem começar em paralelo (incl. US4 e US5).

---

## Phase 3: User Story 1 — Colaboradores (Priority: P1) 🎯 MVP

**Goal**: CRUD de colaboradores com pré-cadastro em 2 etapas, filtros, import CSV e desativação com motivo.
**Independent Test**: em `/colaboradores`, criar pré-cadastro → completar → filtrar → importar CSV → desativar com motivo.

### Tests (escrever primeiro — RED) ⚠️
- [ ] T020 [P] [US1] Testes do agregado `Collaborator` + VOs específicos (RegistrationStatus unidirecional; DeactivationReason obrigatório) em `tests/modules/partners/server/domain/collaborator.test.ts` 🔴
- [ ] T021 [P] [US1] Teste do parser CSV puro + anti-CSV-injection em `tests/modules/partners/server/domain/csv-parse.test.ts` (BOM, aspas, quebras embutidas; rejeita `= + - @ \t` no início) 🔴
- [ ] T022 [P] [US1] Testes dos use-cases (list/create/complete/deactivate/import) com fakes em `tests/modules/partners/server/application/collaborator-use-cases.test.ts` 🔴
- [ ] T023 [P] [US1] Testes dos view-models (filtros, status duplo, derivação idade de `dateOfBirth`, command de desativar) em `tests/modules/partners/client/collaborator-view-model.test.ts` 🔴
- [ ] T024 [P] [US1] Spec DOM da listagem + modal de desativar (Motivo desabilita botão) em `tests/modules/partners/client/collaborator-list.spec.tsx` 🔴
- [ ] T025 [P] [US1] Spec DOM do import (input file, sending, relatório parcial) em `tests/modules/partners/client/collaborator-import.spec.tsx` 🔴

### Server (domain → application → adapters)
- [ ] T026 [US1] Agregado `Collaborator` + VOs (`RegistrationStatus`, `DeactivationReason`, `OccupationArea`, `EmploymentRelationship`) em `src/modules/partners/server/domain/collaborator/`
- [ ] T027 [US1] Parser CSV puro + anti-injection em `src/modules/partners/server/domain/collaborator/csv-parse.ts`
- [ ] T028 [US1] Use-cases (`list/get/create/complete-registration/update/deactivate/reactivate/import`) em `src/modules/partners/server/application/collaborator/`
- [ ] T029 [US1] Schemas Zod (request/response core-api) em `src/modules/partners/server/adapters/core-api/collaborator.schema.ts` (saneamento de encoding na ACL — FR-013)
- [ ] T030 [US1] Server functions `*.server-fn.ts` (list/get/create/complete/update/deactivate/import) em `src/modules/partners/server/adapters/server-fns/collaborator/` — auth + RBAC na server fn; import recebe string CSV (Zod ≤2 MiB) e repassa `text/csv`
- [ ] T031 [US1] Composição/wiring (lazy) em `src/modules/partners/server/adapters/collaborator.composition.ts`

### Client (data → view-model → ui)
- [ ] T032 [P] [US1] Model Zod + repository (porta→server fn) em `src/modules/partners/client/data/collaborator/`
- [ ] T033 [US1] View-models: `collaborator-list` (filtros + paginação server-side; programa removido, idade derivada), `collaborator-detail`, `collaborator-create`, `collaborator-edit`, `collaborator-import` (union `idle|file-selected|sending|reported|failed`) em `src/modules/partners/client/collaborator-*/`
- [ ] T034 [US1] Bindings (`*.binding.ts`) por comportamento — `mutationFn` do import faz `File.text()` (efeito na borda) em `src/modules/partners/client/collaborator-*/`
- [ ] T035 [US1] Controllers de form (`*.controller.ts`) — pré-cadastro (7 campos), completo (21), guarda do `File` selecionado
- [ ] T036 [US1] Views burras: `*.page.tsx` + `*.component.tsx` (lista, detalhe, editar, adicionar, dropzone de import; gating por `can()` — FR-020) em `src/modules/partners/client/collaborator-*/`
- [ ] T037 [US1] Rotas `/colaboradores`, `/detalhes/:id`, `/editar/:id`, `/adicionar` em `src/routes/_authenticated/colaboradores/`
- [ ] T038 [US1] Exportar o público da story em `src/modules/partners/public-api/index.ts`

**Checkpoint**: US1 entregável e testável de forma independente (MVP).

---

## Phase 4: User Story 2 — Fornecedores (Priority: P1)

**Goal**: CRUD de fornecedores (cadastrais + bancários + PIX), filtros por categoria, export.
**Independent Test**: em `/fornecedores`, criar (3 seções) → filtrar por categoria → exportar → detalhe (linha clicável) → desativar.

### Tests (RED) ⚠️
- [ ] T039 [P] [US2] Testes do agregado `Supplier` + VOs (`ServiceCategory` union 39, `BankAccount`, `PixKey` coeso) em `tests/modules/partners/server/domain/supplier.test.ts` 🔴
- [ ] T040 [P] [US2] Testes use-cases (list/create/update/deactivate/export/categories) em `tests/modules/partners/server/application/supplier-use-cases.test.ts` 🔴
- [ ] T041 [P] [US2] Spec DOM do form de 3 seções + filtro de categoria em `tests/modules/partners/client/supplier-form.spec.tsx` 🔴

### Implementation
- [ ] T042 [US2] Agregado `Supplier` + VOs em `src/modules/partners/server/domain/supplier/`
- [ ] T043 [US2] Use-cases (incl. `exportSuppliers`, `listServiceCategories`) em `src/modules/partners/server/application/supplier/`
- [ ] T044 [US2] Schemas Zod + server fns (`/suppliers*`, `/suppliers/export`, `/suppliers/service-categories`) em `src/modules/partners/server/adapters/{core-api,server-fns}/supplier/`
- [ ] T045 [P] [US2] Model + repository + gateway de catálogo (39 categorias) em `src/modules/partners/client/data/supplier/`
- [ ] T046 [US2] View-models + bindings + controllers (form 3 seções; export aciona download) em `src/modules/partners/client/supplier-*/`
- [ ] T047 [US2] Views burras + rotas `/fornecedores[...]` (linha clicável; breadcrumb padronizado — FR-013; gating `can('supplier:write')`)
- [ ] T048 [US2] Atualizar `public-api/index.ts`

**Checkpoint**: US2 entregável independente.

---

## Phase 5: User Story 3 — Financiadores (Priority: P2)

**Goal**: CRUD simples PJ-only (6 campos), busca simples, desativação com texto dinâmico.
**Independent Test**: em `/financiadores`, criar/editar/detalhar/desativar com busca.

### Tests (RED) ⚠️
- [ ] T049 [P] [US3] Testes do agregado `Financier` (PJ-only: CNPJ/razão social/rep. legal obrigatórios) em `tests/modules/partners/server/domain/financier.test.ts` 🔴
- [ ] T050 [P] [US3] Spec DOM do modal de desativar (texto dinâmico, hierarquia de botões invertida) em `tests/modules/partners/client/financier-deactivate.spec.tsx` 🔴

### Implementation
- [ ] T051 [US3] Agregado `Financier` + use-cases em `src/modules/partners/server/{domain,application}/financier/`
- [ ] T052 [US3] Schemas Zod + server fns (`/financiers*`) em `src/modules/partners/server/adapters/.../financier/`
- [ ] T053 [P] [US3] Model + repository em `src/modules/partners/client/data/financier/`
- [ ] T054 [US3] View-models + bindings + controllers (form 1 seção) em `src/modules/partners/client/financier-*/`
- [ ] T055 [US3] Views burras + rotas `/financiadores[...]` (sem painel de filtros; gating `can('financier:write')`)
- [ ] T056 [US3] Atualizar `public-api/index.ts`

**Checkpoint**: US3 entregável independente.

---

## Phase 6: User Story 4 — Estados parceiros (Priority: P2)

**Goal**: dual-panel para marcar/desmarcar UFs com persistência imediata (toggle idempotente).
**Independent Test**: em `/estados`, adicionar (+ → "Adicionado") e remover (−) com efeito imediato.

> `DualPanel` é foundational (T018) — esta story apenas o consome.

### Tests (RED) ⚠️
- [ ] T057 [P] [US4] Testes do view-model do dual-panel de estados (seleção, add/remove otimista, busca por painel) em `tests/modules/partners/client/partner-states-view-model.test.ts` 🔴

### Implementation
- [ ] T058 [US4] VO `PartnerState` + use-cases (`list/toggle`) em `src/modules/partners/server/{domain,application}/geography/`
- [ ] T059 [US4] Schemas Zod + server fns (`GET /partner-states`, `POST/DELETE /partner-states/:uf`) em `src/modules/partners/server/adapters/.../partner-states/`
- [ ] T060 [P] [US4] Model + repository em `src/modules/partners/client/data/partner-states/`
- [ ] T061 [US4] View-model + binding (toggle otimista) + view burra `partner-states.page.tsx` + rota `/estados` (reusa `DualPanel`; gating `can('geography:write')`)
- [ ] T062 [US4] Atualizar `public-api/index.ts`

**Checkpoint**: US4 entregável independente.

---

## Phase 7: User Story 5 — Municípios parceiros (Priority: P3)

**Goal**: dual-panel por UF (combobox obrigatório), cross-state, identidade por `ibgeCode`.
**Independent Test**: em `/municipios`, selecionar UF → adicionar município → trocar UF → selecionados permanecem.

> Reusa `DualPanel` foundational (T018). Independente de US4 (D1).

### Tests (RED) ⚠️
- [ ] T063 [P] [US5] Testes do view-model (UF obrigatória; cross-state; "Nenhum resultado" sem UF) em `tests/modules/partners/client/partner-municipalities-view-model.test.ts` 🔴
- [ ] T064 [P] [US5] Spec DOM do combobox de UF (autocomplete, clear) + dual-panel cross-state em `tests/modules/partners/client/partner-municipalities.spec.tsx` 🔴

### Implementation
- [ ] T065 [P] [US5] Molécula `Combobox` com autocomplete (UF) em `src/shared/ui/molecules/combobox/` + `*.spec.tsx` 🔴
- [ ] T066 [US5] VO `PartnerMunicipality` (`ibgeCode`) + use-cases (`listByUf/toggle`) em `src/modules/partners/server/{domain,application}/geography/`
- [ ] T067 [US5] Schemas Zod + server fns (`GET /partner-municipalities?uf=`, `POST/DELETE /:ibgeCode`) em `src/modules/partners/server/adapters/.../partner-municipalities/`
- [ ] T068 [P] [US5] Model + repository em `src/modules/partners/client/data/partner-municipalities/`
- [ ] T069 [US5] View-model + binding (reusa `DualPanel` + `Combobox`) + view burra + rota `/municipios` (gating `can('geography:write')`)
- [ ] T070 [US5] Atualizar `public-api/index.ts`

**Checkpoint**: US5 entregável independente.

---

## Phase 8: Polish & Cross-Cutting

- [ ] T071 [P] Sidebar: adicionar o accordion "Gestão de Parceiros" com os 5 sub-itens em `src/shared/ui/organisms/app-shell/` (reuso)
- [ ] T072 [P] Completar i18n: revisar todas as tags e remover qualquer literal de UI (lint)
- [ ] T073 [P] A11y: foco/teclado/aria-live nos modais e dual-panel; `<progress>` indeterminado no import (NFR-003)
- [ ] T074 [P] Verificar SC-004: bundle do client sem `accessToken`/`refreshToken`/`Bearer` (grep)
- [ ] T075 [P] Verificar so-tokens (0 hex/px cru em `client/ui`) e boundaries (lint)
- [ ] T076 [P] Verificar SC-005: revisão de boundary — trocar gateway mock→real não toca `client/ui` nem `*.view-model.ts`
- [ ] T077 Validar `quickstart.md` (fluxo manual dos 5 sub-domínios) e atualizar se divergir
- [ ] T078 Gate final: `pnpm typecheck && pnpm lint && pnpm test:all && pnpm build`
- [ ] T079 [P] Verificação de performance SC-002: medir a listagem (p95 < 1s) com o volume de teste (≤50) via trace/Lighthouse; registrar baseline em `metrics.md` *(G1)*

---

## Dependencies & Execution Order

- **Phase 1 (Setup)** → **Phase 2 (Foundational)** bloqueiam tudo. `DualPanel` (T018) e `DataTable`/`FormCard`/`DeactivateModal` são foundational.
- **US1–US5** dependem da Phase 2; entre si são **independentes** e paralelizáveis (D1 removeu a ordem US4→US5).
- **Phase 8 (Polish)** depois das stories entregues.
- Ordem recomendada de entrega: US1 (MVP) → US2 → US3 → US4 → US5 → Polish.

## Parallel Opportunities

- **Foundational**: T006–T018 (VOs e organismos de design em arquivos distintos) altamente paralelos.
- **Dentro de cada story**: os testes (RED) `[P]` em paralelo; `data` (`[P]`) paralela ao `server/adapters` depois que o domínio existe.
- **Entre stories**: US1–US5 totalmente paralelas após a fundação (incl. US4 e US5, que apenas consomem o `DualPanel` foundational).

## Implementation Strategy (MVP incremental)

1. **MVP = US1 (Colaboradores)** — entrega o CRUD central + import + filtros. Já demonstra o módulo fim-a-fim.
2. Incrementos: US2 (Fornecedores) → US3 (Financiadores) → US4 (Estados) → US5 (Municípios).
3. Cada story passa pelo ciclo TDD (RED → impl → verde) e pelo gate W3 antes de seguir.
