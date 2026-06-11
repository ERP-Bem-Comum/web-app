# Tasks — 025 Integração Parceiros × Contratos

**Feature**: 5 user stories frontend-only entre `contracts` e `partners`, sem tocar core-api, sem regressão.

**Ajuste crítico (US1)**: banco/PIX no contrato permanecem **somente-leitura** (campos já `disabled` — NÃO
destravar); pré-preenchimento só **alimenta** esses campos. Só e-mail/telefone (Contato) editáveis.

**Invariantes v2 (lint cobra)**: `Result<T,E>` sem throw fora da borda; sem `any`/`class`/`this`;
imutabilidade `Readonly`; só-tokens (`vars.*`, sem CSS novo); strings UI = i18n; views burras MVVM;
boundaries por `public-api` (contracts→partners SÓ via `partners/public-api`); Zod na borda; naming postfix;
`switch` exaustivo `never` (em `contractType` e `pixKeyType`). Server fn = única fronteira.

**Testes**: `node:test` → `*.test.ts` (imports RELATIVOS, puros); Vitest+jsdom → `*.spec.tsx`.

---

## Phase 1: Setup & Baseline

- [X] T001 Registrar baseline: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:dom` — anotar números.
- [X] T002 Confirmar no código real (read-only): shapes das server fns de detalhe (`getSupplierFn`/`getActFn`
  têm `bankAccount`+`pixKey`+`email`; `getFinancierFn` `telephone`; `getCollaboratorFn` `email`) e que
  `getCollaboratorFn` NÃO está no `partners/public-api`; nomes dos campos nos controllers
  (`supplier-form.controller.ts` e `act-form.controller.ts`: `cnpj`, `email`, `pixKeyType`, `pixKey`);
  discriminador `contractType` ('Fornecedor'|'Financiador'|'Colaborador'|'ACT'); `avatarVariant`/`tipoVariant`
  já têm 'ACT'; e a forma do `Contractor`/`PartnerSnapshot` no client (supplier/financier/collaborator) p/
  espelhar `act`.
- [X] T003 Confirmar que o server fn de contrato já entrega o snapshot do contratado **act** (server
  `core-api-contracts.ts` `mapContractorToDomain`/`CONTRACTOR_TYPE.act`); se sim, o client só precisa
  **aceitar** `act` no model/types (sem mexer no server). Registrar.

**Checkpoint**: shapes/campos/discriminador confirmados; baseline anotado.

---

## Phase 2: Foundational (puros + export) — bloqueia US1/US5/US2

- [X] T004 [P] Exportar `getCollaboratorFn` (+ tipo `CollaboratorDetail`) em
  `src/modules/partners/public-api/index.ts` (hoje ausente), junto dos demais `getXxxFn`.
- [X] T005 [P] **[RED]** Teste do helper de auto-PIX em
  `tests/modules/partners/client/domain/derive-pix-key.test.ts` (node, imports relativos):
  `derivePixKey('cpf'|'cnpj', {document,email,telephone}) === document`; `'email' === email`;
  `'phone' === telephone`; `'random-key' === ''`; campo ausente/vazio → `''`.
  Deve **falhar** (helper não existe) — rodar `pnpm test` e confirmar RED.
- [X] T006 [P] Implementar o helper PURO **genérico**
  `src/modules/partners/client/domain/derive-pix-key.ts`:
  `derivePixKey(keyType: PixKeyType, src: { document?: string; email?: string; telephone?: string }): string`
  — `switch` exaustivo com guard `never`; `cpf|cnpj→document`, `email→email`, `phone→telephone`,
  `random-key→''`; ausente/vazio → `''`. Genérico para servir aos 4 forms (ativo só em supplier/act nesta
  fatia). Torna T005 verde.
- [X] T007 [P] **[RED]** Teste do mapper de pré-preenchimento em
  `tests/modules/contracts/client/contract-create/partner-detail-to-contract.test.ts` (node, relativos):
  `partnerDetailToContractFields('Fornecedor'|'Acordo', detail)` → `{bancaryInfo:{...,dv:checkDigit}, pixInfo, email}`;
  `'Financiador'` → `{telephone}`; `'Colaborador'` → `{email}`; campos ausentes ⇒ chave omitida. RED.
- [X] T008 [P] Implementar o mapper PURO
  `src/modules/contracts/client/contract-create/partner-detail-to-contract.ts`:
  `partnerDetailToContractFields(kind, detail) → ContractPrefill` (Readonly, só campos presentes;
  `checkDigit→dv`). `switch`/guard sobre `kind`. Torna T007 verde.

**Checkpoint**: helpers puros verdes; `getCollaboratorFn` exportado.

---

## Phase 3: US2 — ACT no grid e detalhe (P1)

**Goal**: contrato com contratado ACT aparece no grid e no detalhe como os demais tipos.
**Independent Test**: contrato ACT → grid mostra o ACT (nome+estilo ACT); detalhe mostra o ACT; outros tipos OK.

- [X] T009 **[RED]** [US2] Teste em `tests/modules/contracts/client/contract-list/contractor-act.test.ts`
  (node, relativos): `getContractorFromRow` com `contractType:'ACT'` retorna `row.act` (não `supplier`);
  e `mapModelToContractRow` propaga `act`/`actId`. RED (antes da impl). **Dep**: T009b/T009c (BFF) entregam
  o snapshot `act` ao client — fazer ANTES de T010-T014 para o fluxo fechar fim-a-fim.
- [X] T009b **[BFF, frontend-only — NÃO core-api]** [US2] `src/modules/contracts/server/domain/contracts.types.ts`:
  `Contract` (server domain) += `act?: PartnerSnapshot` (espelha supplier/financier/collaborator ~L126-128).
- [X] T009c **[BFF, frontend-only]** [US2] `src/modules/contracts/server/adapters/core-api/core-api-contracts.ts`:
  no objeto base (~L266-272) adicionar `act: undefined`; em `mapContractorToDomain` (~L324-326) adicionar
  `act: k.type === 'act' ? snapshot : undefined`. **Sem isso o snapshot do ACT é descartado** (o
  `contractType` já vira 'ACT' via `CONTRACTOR_TYPE`, mas o `act` nunca é setado). Não tocar core-api.
- [X] T010 [US2] `src/modules/contracts/client/domain/types.ts`: `Contract` += `act?: Contractor | null`
  (espelha supplier/financier/collaborator). `ContractRow` herda.
- [X] T011 [US2] `src/modules/contracts/client/data/model/contracts.model.ts`: `ContractSchema` += `act`
  (snapshot, `PartnerSnapshotSchema.optional()`); `actId` já existe. Manter drift guard se houver.
- [X] T012 [US2] `src/modules/contracts/client/contract-list/contract-list.view-model.ts`:
  `mapModelToContractRow` e `buildContractDocData` mapeiam `act`/`actId` (espelhando os outros tipos).
- [X] T013 [US2] `src/modules/contracts/client/contract-list/components/contract-row.component.tsx`:
  `getContractorFromRow` `case 'ACT' → contractRow.act` (corrige o fallback p/ supplier). Garantir guard
  `never` no switch de `contractType`. Torna T009 verde.
- [X] T014 [US2] `src/modules/contracts/client/contract-detail/components/contract-info.component.tsx`:
  incluir `act` no fallback do contratado (`supplier ?? financier ?? collaborator ?? act`) e tratar 'ACT'
  no `typeLabel` (switch exaustivo).

**Checkpoint**: ACT visível no grid e detalhe; node verde; sem regressão nos outros tipos.

---

## Phase 4: US3 — Máscara de telefone na seção Contato (P1)

**Goal**: telefone com máscara na inclusão (Contato) e no detalhe (edição). **Independent Test**: digitar
telefone → exibe `(xx) xxxxx-xxxx`; salva dígitos.

- [X] T015 [US3] `src/modules/contracts/client/contract-create/components/contract-form.component.tsx`:
  trocar o `<input type="text">` de telefone (section Contato) por `<Input mask="phone" …>` (shared),
  mantendo o binding de valor/onChange (o `Input` faz `unmask` → salva dígitos).
- [X] T016 [US3] `src/modules/contracts/client/contract-detail/components/contract-contato.component.tsx`:
  no modo edição, trocar o `<input>` de telefone por `<Input mask="phone" …>` (shared).
- [X] T017 [US3] **[vitest]** `tests/modules/contracts/.../contact-phone-mask.spec.tsx` (ou reuso): renderizar
  o input de telefone e confirmar que digitar dígitos exibe o valor mascarado. Deferir se frágil no jsdom
  (justificar) — a máscara em si já é testada no helper `input.mask`.

**Checkpoint**: telefone mascarado na inclusão e detalhe.

---

## Phase 5: US5 — Auto-preencher chave PIX (Fornecedor/ACT) (P2)

**Goal**: ao escolher o tipo de chave PIX (cpf/cnpj/email), a chave preenche com o valor do form (editável).
**Independent Test**: novo Fornecedor/ACT com cnpj+email → escolher tipo cnpj → chave=cnpj; email → chave=email;
aleatória → limpa.

- [X] T018 [US5] `src/modules/partners/client/supplier-create/components/supplier-form.component.tsx`:
  no `onChange` do select de tipo de chave PIX, além de `setField('pixKeyType', t)`, chamar
  `setField('pixKey', derivePixKey(t, { document: c.state.cnpj, email: c.state.email }))` (helper T006).
- [X] T019 [US5] `src/modules/partners/client/act-create/components/act-form.component.tsx`: idem
  (`{ document: c.state.cnpj, email: c.state.email }`).
- [X] T019b [US5] (NÃO nesta fatia — registrar) Colaborador e Financiador ficam **gated**: o helper já
  cobre (`{document: cpf, email}` / `{document: cnpj, telephone}`), mas só se liga quando o backend liberar
  banco/PIX (ticket `PAR-FINANCIER-COLLAB-BANK`). Não tocar esses forms agora.
- [X] T020 [US5] **[vitest]** `tests/modules/partners/client/supplier-create/supplier-pix-autofill.spec.tsx`
  (e/ou act): preencher cnpj/email, trocar o tipo de chave → assert a chave preenchida; trocar p/ aleatória
  → chave vazia; a chave continua editável. `afterEach(cleanup)`.

**Checkpoint**: auto-PIX funcionando em Fornecedor e ACT; node (helper) + vitest verdes.

---

## Phase 6: US1 — Pré-preencher dados do contratado (P1)

**Goal**: selecionar contratado pré-preenche banco/PIX (somente-leitura) + e-mail/telefone (editáveis).
**Independent Test**: selecionar Fornecedor/ACT → banco/PIX/e-mail preenchidos (banco/PIX bloqueados);
Financiador → telefone; trocar contratado re-preenche; erro no detalhe não trava.

- [X] T021 [US1] `src/modules/contracts/client/contract-create/page/contract-create.page.tsx`
  `handleSelectPartner`: estender as branches por tipo —
  `Acordo` → `getActFn`; `Financiador` → `getFinancierFn`; `Colaborador` → `getCollaboratorFn`
  (Fornecedor já existe via `getSupplierFn`). Em cada `.then(res => { if (!res.ok) return; ... })` aplicar
  `partnerDetailToContractFields(kind, res.data)` (T008) e `form.update(...)` para os campos presentes
  (banco/PIX só popular — disabled; e-mail/telefone editáveis). Importar `getActFn`/`getFinancierFn`/
  `getCollaboratorFn` de `#modules/partners/public-api`.
- [X] T022 [US1] Garantir o **degrade em erro** (server fn falha → não preenche, não trava) e que **trocar
  de contratado** limpa/re-preenche coerentemente (resetar campos pré-preenchidos do tipo anterior antes de
  aplicar o novo, p/ não vazar banco/PIX de um Fornecedor anterior ao trocar p/ Financiador).
- [X] T023 [US1] Refatorar o branch de Fornecedor para também usar `partnerDetailToContractFields` (consistência
  com os novos), garantindo que o teste do mapper (T007) cobre o caminho do Fornecedor.

**Checkpoint**: pré-preenchimento por tipo, banco/PIX só-leitura, contato editável, degrade em erro; node verde.

---

## Phase 7: US4 — "Cadastrar novo parceiro" com retorno (P2)

**Goal**: a ação leva ao módulo de parceiros (mesma aba) e volta à inclusão de contrato após cadastrar.
**Independent Test**: acionar "cadastrar novo parceiro" → módulo de parceiros; cadastrar → volta ao contrato.

- [X] T024 [US4] `src/modules/contracts/client/contract-create/page/contract-create.page.tsx`
  `handleCreateNewPartner`: trocar `window.open('/parceiros/criar','_blank')` por
  `navigate({ to: '/parceiros/fornecedores/criar', search: { returnTo: '/contratos/criar' } })`
  (useNavigate já disponível na page).
- [X] T025 [P] [US4] Adicionar `validateSearch` `({ returnTo: z.string().trim().optional() })` nas 4 rotas:
  `src/routes/_authenticated/parceiros/{fornecedores,colaboradores,atos,financiadores}/criar.tsx`.
- [X] T026 [US4] `supplier-create.binding.ts` `onSuccess` (isOk): em vez de `navigate({to:'/parceiros/fornecedores'})`,
  usar `navigate({ to: safeRedirect(search.returnTo, '/parceiros/fornecedores') })`; ler `search` via
  `useSearch({ strict: false })`; importar `safeRedirect` de `#modules/auth/public-api`.
- [X] T027 [P] [US4] Idem em `act-create.binding.ts` (default `/parceiros/atos`),
  `collaborator-create.binding.ts` (`/parceiros/colaboradores`), `financier-create.binding.ts`
  (`/parceiros/financiadores`).

**Checkpoint**: fluxo novo-parceiro→volta funcionando (mesma aba, sem URL quebrada).

---

## Phase 8: Polish & Validação

- [X] T028 `pnpm verify` (typecheck+lint+node) e `pnpm test:dom`; comparar com baseline (T001) e **reportar
  números**. Esperado: +3 testes node (mapper, derivePixKey, contractor-act) + specs vitest novos; lint 0 erros.
- [X] T029 Revisão boundaries/lint do diff: contracts→partners só via `public-api`; views burras (data-hooks
  no binding; a chamada de detalhe na page segue o padrão vigente do Fornecedor); `Result` sem throw fora da
  borda; sem `any`; só-tokens (sem CSS novo); i18n (textos novos do fluxo/Contato); `switch` exaustivo `never`
  em `contractType` (getContractorFromRow, typeLabel) e `pixKeyType` (derivePixKey).
- [ ] T030 Validar em tela (admin.full@bemcomum.dev) conforme `quickstart.md`: US1 pré-preenche (banco/PIX
  bloqueados; contato editável; troca de contratado; degrade); US2 ACT no grid e detalhe; US3 máscara de
  telefone; US4 novo parceiro→volta; US5 auto-PIX em Fornecedor/ACT. **Sem regressão**. **NÃO commitar**
  (a usuária commita e valida).

---

## Dependencies

- **Phase 1 (T001–T003)** → tudo.
- **Phase 2 (T004–T008)** bloqueia US1 (mapper T008) e US5 (helper T006); RED antes da impl (T005→T006, T007→T008).
- **US2 (T009–T014)**: T009 RED antes; T010→T011→T012→T013→T014 (types→model→view-model→row→info).
- **US3 (T015–T017)**: independente das demais.
- **US5 (T018–T020)**: depende de T006 (helper).
- **US1 (T021–T023)**: depende de T004 (export collaborator) + T008 (mapper).
- **US4 (T024–T027)**: independente; T025/T027 paralelizáveis (arquivos distintos).
- **Phase 8** após todas.

## Parallel opportunities
- **T004, T005, T007** em paralelo (arquivos distintos). T006 após T005; T008 após T007.
- US2, US3, US5, US4 são módulos/arquivos majoritariamente distintos — as fases podem ser tocadas em paralelo
  por arquivo, exceto onde compartilham `contract-create.page.tsx` (US1 T021 e US4 T024 — sequenciar essas duas).
- T025 (4 rotas) e T027 (3 bindings) marcados [P] internamente (arquivos distintos).

## Implementation strategy (MVP incremental)
Ordem recomendada: **US2 + US3** (P1 rápidas, contracts) → **US5** (partners, puro) → **US1** (mapper + page)
→ **US4** (rotas + bindings) → Polish. Cada US é entregável/testável isolada. Validar em tela antes de commitar.

## Notas / a confirmar no implement
- T003: se o server fn de contrato ainda NÃO inclui o snapshot `act`, avaliar mapear no client a partir do
  que o response traz (provável que já traga; só faltando o campo no Zod/types). Não tocar core-api.
- US1 T021/T024 mexem no MESMO arquivo (`contract-create.page.tsx`) → sequenciar (não paralelizar).
- US5: telefone como chave PIX não se aplica (Fornecedor/ACT não coletam telefone) — `phone → ''`.
- US4: propagação do `returnTo` se o usuário trocar de tipo dentro do módulo é limitação aceita (voltar simples).
