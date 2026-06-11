# Tasks: ACT reescrito — Acordo de Cooperação Técnica (CNPJ)

**Feature**: `022-act-acordo` | **Branch**: `feat/contracts-detail-and-partners`
**Input**: plan.md, research.md, data-model.md, contracts/acts-api.md, spec.md
**Escopo**: frontend-only, módulo `partners` (recurso **ACT**), reescrita pessoa-física → Acordo institucional. **Sem tocar core-api. Sem regredir** colaborador/fornecedor/financiador. TDD. **Nomes de arquivo `act-*`/rotas `atos/` mantidos** (rewrite de conteúdo).

> `node:test` = `*.test.ts` (puros, imports `#`); Vitest = `*.spec.tsx` (jsdom).
> Molde: módulo **Fornecedor** (cnpj/conta/PIX) — por **cópia/adaptação** (não extrair). [P] = paralelizável (arquivos distintos).

---

## Phase 1: Setup

- [ ] T001 Registrar **baseline** (comparação SC-005): `pnpm typecheck` (0), `pnpm lint` (0 err), `pnpm test` (node), `pnpm test:dom` (vitest) — anotar totais.
- [ ] T002 **Grep de boundaries (D6)**: confirmar que `RegistrationStatus`/`EmploymentRelationship`/campos de pessoa-física só são importados DENTRO do recurso ACT (`grep -rn "RegistrationStatus\|EmploymentRelationship\|startOfContract\|complete-registration" src` e checar que collaborator usa cópia própria). Anotar consumidores; se houver uso externo inesperado, **parar e reportar**.
- [ ] T003 **Ler o molde** (confirmações do implement): `supplier-form.component.tsx`/`.controller.ts` (conta/PIX, select keyType), `core-api-suppliers.ts` (Location no create + meta), `supplier.io-schemas.ts` (bank/pix schemas), e o `core-api-acts.ts` atual (Location/meta/deactivate já presentes). Sem editar — só mapear o que copiar.

---

## Phase 2: Foundational (BLOQUEIA as user stories)

> Tipos/IO, erros, i18n, filtros e os testes RED. Sem isso o resto não compila.

### Tipos & modelo (server domain + client model)

- [ ] T004 Em `src/modules/partners/server/domain/act/act.types.ts`: manter `OccupationArea` ('PARC'|'DDI'|'DCE'|'EPV'); adicionar `PixKeyType` ('cpf'|'cnpj'|'email'|'phone'|'random-key'), `BankAccount`, `PixKey`; **remover** `RegistrationStatus`/`EmploymentRelationship` e campos de pessoa-física. **A1:** a situação do Acordo é **`active: boolean`** (alinha ao `actDetailSchema` do #32) — não reintroduzir o par `ActivationStatus 'active'|'inactive'`; se a UI precisar de rótulo, derivar no view-model a partir do boolean.
- [ ] T005 Em `src/modules/partners/server/domain/act/act.io.ts`: reescrever `CreateActInput`/`UpdateActInput`/`ActDetail`/`ActListItem`/`ActListResponse` para o Acordo (actNumber, name, email, cnpj, corporateName, fantasyName, occupationArea, legalRepresentative, startDate, endDate, hasFinancialTransfer, bankAccount|null, pixKey|null; detalhe + id/legacyId/active/createdAt/updatedAt). Remover tipos de pessoa-física.
- [ ] T006 Em `src/modules/partners/server/domain/act/act.ts`: ajustar o agregado/funções puras ao novo modelo (drop person); manter mínimo (regra de repasse/vigência é validada na borda + backend).
- [ ] T007 [P] Em `src/modules/partners/client/data/model/act.model.ts`: espelhar o I/O novo + `OCCUPATION_AREAS` (manter) + `PIX_KEY_TYPES` + `isPixKeyType`; remover person.
- [ ] T008 [P] Em `src/modules/partners/client/domain/act.types.ts`: reexportar os tipos novos p/ a UI (sem person).

### Erros (partners) + i18n + filtros

- [ ] T009 Em `src/modules/partners/server/domain/errors/partners.errors.ts`: `PartnersError` += `'act-number-duplicate' | 'invalid-cnpj' | 'invalid-act-period' | 'act-payment-target-required'`.
- [ ] T010 Em `src/modules/partners/client/data/repository/partners-error.ts` (cópia client da union): += os 4 membros (mesma ordem).
- [ ] T011 Em `src/modules/partners/client/data/helpers/partners-error-tag.ts`: +4 casos no `switch` exaustivo (guard `never`) → `partners.error.{act-number-duplicate,invalid-cnpj,invalid-act-period,act-payment-target-required}`. (Depende de T010.) **C2 (atomicidade):** T009+T010+T011 formam um bloco — rodar `pnpm typecheck` só após os três (o `switch never` quebra enquanto server/client divergirem).
- [ ] T012 [P] Em `src/shared/i18n/catalog.pt-BR.ts`: adicionar tags de erro (4 acima) + labels do form do Acordo (`partners.acts.form.actNumber|name|email|cnpj|corporateName|fantasyName|legalRepresentative|startDate|endDate|hasFinancialTransfer|section.payment` + reuso/criação de labels de banco/PIX). Áreas `partners.acts.area.*` já existem.
- [ ] T013 [P] Em `src/modules/partners/client/data/act-list-filters.schema.ts`: adicionar `hasFinancialTransfer?` (boolean) e `occupationArea?` (enum) aos filtros; manter search/active/order/page/limit.

### Testes RED (escrever ANTES da impl da Phase 3)

- [ ] T014 [P] `node:test` em `tests/modules/partners/server/adapters/core-api/act-mapper.test.ts`: `toWriteBody` (cnpj só-dígitos; bankAccount/pixKey null vs objeto; hasFinancialTransfer; startDate/endDate) e `detailToModel`/`itemToModel` (campos novos + legacyId + active) — falham agora.
- [ ] T015 [P] `node:test` em `tests/modules/partners/server/adapters/act-io-schemas.test.ts`: `.superRefine` — repasse `true` sem conta/pix → falha; `endDate <= startDate` (igual e antes) → falha; caso válido passa.
- [ ] T016 [P] `node:test` em `tests/modules/partners/server/adapters/core-api/act-error-map.test.ts`: `SLUG_TO_ERROR` mapeia `register-act-number-duplicate`/`edit-act-number-duplicate`/`act-number-duplicate`→`act-number-duplicate`; `invalid-cnpj`→`invalid-cnpj`; `period-end-before-start`/`period-zero-duration`→`invalid-act-period`; `act-payment-target-required`→idem.

**Checkpoint**: `pnpm typecheck` ainda quebra (server-fns/UI usam tipos antigos) — esperado; segue a Phase 3.

---

## Phase 3: US1 + US2 — Cadastrar e Editar Acordo (P1) 🎯 MVP

**Goal**: criar e editar um Acordo (mesmo modelo) com validação de repasse/vigência e mensagens amigáveis.

**Independent Test**: cadastrar Acordo com e sem repasse; editar; bloqueios (repasse sem conta/pix, vigência fim≤início, cnpj inválido, nº duplicado).

### Borda + mapeadores (server)

- [ ] T017 [US1] Em `src/modules/partners/server/adapters/act.io-schemas.ts`: schemas Zod de input (Create/Update) com cnpj `min(14).max(18)`, occupationArea enum, datas, hasFinancialTransfer, bankAccount/pixKey `.nullable().default(null)`; `.superRefine` (repasse⇒conta|pix; endDate>startDate); **drift guard** `AssertEqual<z.infer, D.CreateActInput>`. **U2:** comparar vigência como **string ISO `YYYY-MM-DD`** (comparação lexicográfica = cronológica) — `endDate > startDate` estrito; **mesma** regra/forma no controller (T023). **Torna T015 verde.**
- [ ] T018 [US1] Em `src/modules/partners/server/adapters/core-api/act.schema.ts`: `actDetailSchema` do #32 (id/legacyId/active/createdAt/updatedAt + campos; bankAccount/pixKey nullable; occupationArea string tolerante) + meta harmonizada (reuso do padrão).
- [ ] T019 [US1] Em `src/modules/partners/server/adapters/core-api/core-api-acts.ts`: `toWriteBody` (domínio→wire: `onlyDigits(cnpj)`, bankAccount/pixKey, startDate/endDate, hasFinancialTransfer, occupationArea); `detailToModel`/`itemToModel` (wire→domínio, novos campos + `legacyId`/`active` boolean); `SLUG_TO_ERROR` += os 4 grupos; **manter** o create lendo `Location`→GET e a meta `{page,limit,total}`. **U1:** `occupationArea` vem como **string tolerante** no response — valor fora de PARC/DDI/DCE/EPV (legado) **não quebra** o parse (mantém o cru; a UI exibe '—'/label quando reconhecido). **Torna T014/T016 verdes.**
- [ ] T020 [US1] Em `src/modules/partners/server/application/act/act.use-cases.ts` e `server/adapters/act.composition.ts`: ajustar tipos de input/output ao novo I/O (sem regra nova); ajustar fiação se a assinatura mudar.
- [ ] T021 [US1] Em `src/modules/partners/server/adapters/server-fns/act/{create-act,update-act,get-act}.service.fn.ts`: trocar o `inputValidator` para os schemas novos; passar o input completo; manter try/catch→erro.

### Client data + UI (create + edit)

- [ ] T022 [US1] Em `src/modules/partners/client/data/repository/act.repository.ts(.instance)`: assinaturas de `create/update/getById` com o I/O novo.
- [ ] T023 [US1] Em `src/modules/partners/client/act-create/components/act-form.controller.ts`: estado do Acordo + `hasFinancialTransfer` (toggle); `submit()` monta o input (bankAccount/pixKey só quando repasse on); validação UI (repasse⇒conta|pix; `endDate > startDate` estrito, **comparação string ISO** como em T017/U2). **Torna o teste do controller (T024) verde.**
- [ ] T024 [P] [US1] `node:test` em `tests/modules/partners/client/act-form-controller.test.ts` (RED→GREEN com T023): repasse on sem conta/pix bloqueia; endDate≤startDate bloqueia; caso válido monta input correto (cnpj, occupationArea, datas, conta/pix).
- [ ] T025 [US1] Em `src/modules/partners/client/act-create/components/act-form.component.tsx`: campos do Acordo (espelhar `supplier-form`): actNumber, name, email, cnpj, corporateName, fantasyName, `<select>` occupationArea (labels `partners.acts.area.*`), legalRepresentative, startDate/endDate, **toggle hasFinancialTransfer** que revela bankAccount + pixKey (`<select>` keyType). View burra; sem literais (i18n); só-tokens.
- [ ] T026 [US1] Em `src/modules/partners/client/act-create/{act-create.view-model.ts,act-create.binding.ts,act-create.mutation.ts,page/act-create.page.tsx}`: ajustar tipos/erro (errorTag via `partnersErrorTag`); page burra.
- [ ] T027 [US2] Em `src/modules/partners/client/act-edit/components/act-edit-form.component.tsx` + `{act-edit.view-model.ts,act-edit.binding.ts,act-edit.mutation.ts,page/act-edit.page.tsx}`: mesmo form do create, pré-carregando os valores atuais (incl. conta/PIX); mesmas regras.

**Checkpoint US1/US2**: typecheck verde no recurso ACT; cadastro+edição funcionam; testes server+controller verdes.

---

## Phase 4: US3 — Listar/filtrar + detalhe + ativar/desativar (P2)

**Goal**: lista com filtros novos, detalhe com campos do Acordo, deactivate/reactivate.

- [ ] T028 [US3] Em `src/modules/partners/server/adapters/server-fns/act/list-acts.query.fn.ts` + `core-api-acts.ts` (query): mapear filtros `active(0|1)`, `hasFinancialTransfer(0|1)`, `occupationArea` na querystring; itemToModel já feito (T019).
- [ ] T029 [US3] Em `src/modules/partners/client/act-list/{act-list.query.ts,act-list.view-model.ts,act-list.binding.ts,page/act-list.page.tsx}`: colunas do Acordo (nº instrumento, nome/razão social, área, repasse, situação); consumir filtros novos.
- [ ] T030 [US3] Em `src/modules/partners/client/act-list/components/{act-filters.component.tsx,act-filters.controller.ts}`: filtros de **repasse financeiro** e **área de atuação** (select) + manter busca/situação; `act-paginator` inalterado (confirmar).
- [ ] T031 [US3] Em `src/modules/partners/client/act-detail/components/act-detail-content.component.tsx` + `{act-detail.view-model.ts,act-detail.binding.ts,act-detail.query.ts}`: exibir os campos do Acordo (instituição/CNPJ/razão social/fantasia, área, representante, vigência, repasse com conta/PIX quando houver, ativo/inativo). Sem campos de pessoa-física.
- [ ] T032 [US3] Em `server/adapters/server-fns/act/{deactivate,reactivate}-act.service.fn.ts` + `client/act-detail/act-status.mutation.ts`: confirmar/ajustar (padrão já existe) ao novo detalhe.
- [ ] T033 [P] [US3] Vitest em `tests/modules/partners/client/act-form.spec.tsx`: toggle `hasFinancialTransfer` revela conta/PIX e exige ao menos um; `<select>` de área renderiza as 4 opções. (Opcional: filtros da lista.)

**Checkpoint US3**: lista/filtros/detalhe/status funcionam com o Acordo.

---

## Phase 5: Polish & validação

- [ ] T034 `pnpm verify` vs baseline (T001): typecheck/lint 0; node ≥ baseline + novos.
- [ ] T035 `pnpm test:dom` vs baseline.
- [ ] T036 **Grep SC-004**: `grep -rn "cpf\|role\|startOfContract\|employmentRelationship\|registration\|complete-registration" src/modules/partners/**/act*` → **zero** resquício de pessoa-física no recurso ACT.
- [ ] T037 Revisar boundaries/lint do diff: ui sem `useQuery`/`useMutation`; `Result` sem throw fora da borda; sem `any`; só-tokens; i18n; naming por postfix; switch exaustivo.
- [ ] T038 Validar em tela (admin.full@bemcomum.dev) conforme `quickstart.md`: cadastrar Acordo **com e sem** repasse; editar; lista + filtros (repasse/área); detalhe; ativar/desativar; bloqueios (repasse sem destino, cnpj inválido, vigência fim≤início, nº duplicado). **SC-005**: confirmar **fornecedor/colaborador/financiador** sem regressão. **NÃO commitar** (a usuária commita).

---

## Dependencies

- **Phase 1** (setup/grep) → **Phase 2** (tipos/erros/i18n/filtros + RED) bloqueia tudo.
- T004/T005 → T007/T008 (espelho client) e T017/T019 (borda/mapeadores). T009→T010→T011. 
- **Phase 3** (US1/US2) antes da **Phase 4** (US3 consome o I/O/mapeadores).
- T017→T015 verde; T019→T014/T016 verdes; T023→T024 verde.
- **Phase 5** por último.
- TDD: T014/T015/T016 (RED) antes de T017/T019; T024 junto de T023.

## Parallel opportunities

- T007 ‖ T008 ‖ T012 ‖ T013 (arquivos distintos).
- T014 ‖ T015 ‖ T016 (testes distintos).
- T033 ‖ T031 (arquivo distinto).

## Implementation Strategy

MVP = **US1+US2** (Phases 2→3): cadastrar+editar Acordo (o fluxo hoje quebrado). US3 (leitura/filtros) na Phase 4. Incremental: foundational (tipos/erros/i18n + RED) → borda/mapeadores/server-fns → controller/form/edit (verde) → lista/detalhe/status → polish. **Não regredir** os demais parceiros é critério de aceite (SC-005, T038). Espelhar o Fornecedor por cópia (D1); sem `serviceRating` (§1.6).
