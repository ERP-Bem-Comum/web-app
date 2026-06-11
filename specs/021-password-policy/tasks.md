# Tasks: Política de senha alinhada ao #32 (mínimo 12)

**Feature**: `021-password-policy` | **Branch**: `feat/contracts-detail-and-partners`
**Input**: plan.md, research.md, data-model.md, contracts/password-policy.md, spec.md
**Escopo**: frontend-only, ADITIVO (sem regressão na Trocar Senha — incl. complexidade existente — nem em auth/usuários/outros). **Sem tocar core-api.** TDD.

> Convenções: `node:test` = `*.test.ts` (puros, imports `#`); Vitest = `*.spec.ts(x)` (jsdom).
> Único fluxo afetado: **Trocar Senha (Minha Conta)**. Leitura da política mora no **auth** (dono do endpoint), consumida pelo **users**.
> [P] = paralelizável (arquivos distintos, sem dependência pendente).

---

## Phase 1: Setup

- [X] T001 Registrar **baseline** (comparação SC-004): `pnpm typecheck` (0), `pnpm lint` (0 err), `pnpm test` (node) e `pnpm test:dom` (vitest) — anotar os totais.

---

## Phase 2: Foundational (BLOQUEIA a US1)

> Validador parametrizável, união de erros, schema de borda e i18n. Testes RED antes da impl.

### Testes RED

- [X] T002 [P] `node:test` em `tests/modules/users/client/domain/password-policy.test.ts`: `evaluatePassword(pw, limits)` — rejeita `length < minLength`, aceita `>= minLength` e `<= maxLength`, rejeita `> maxLength`; **default {12,128}** quando sem limites; **complexidade preservada** (senha de 12+ sem maiúscula falha em `upper`, etc.). (Falha agora — assinatura sem `limits`.)
- [X] T003 [P] `node:test` em `tests/modules/users/client/data/users-error-tag.test.ts`: `usersErrorTag('password-too-short')` → `'users.error.password-too-short'`. (Falha agora — caso inexistente.)

### Implementação (tipos/erros/schema/i18n/validador)

- [X] T004 [P] Em `src/modules/users/client/domain/password-policy.ts`: `evaluatePassword(pw, limits: { minLength: number; maxLength: number } = { minLength: 12, maxLength: 128 })` — `length: pw.length >= limits.minLength && pw.length <= limits.maxLength`; `passwordMeetsPolicy(pw, limits?)` idem; **manter** `upper/lower/number/special`. Atualizar o comentário (min 12). **Torna T002 verde.**
- [X] T005 [P] Em `src/modules/users/server/domain/errors/users.errors.ts`: `UsersError` += `'password-too-short'` (comentário: 422 password-too-short).
- [X] T006 [P] Em `src/modules/users/client/data/repository/users-error.ts`: cópia client de `UsersError` += `'password-too-short'`.
- [X] T007 Em `src/modules/users/client/data/helpers/users-error-tag.ts`: + `case 'password-too-short': return 'users.error.password-too-short'` (switch exaustivo, guard `never`). (Depende de T006.) **Torna T003 verde.**
- [X] T008 [P] Em `src/modules/users/server/adapters/core-api/core-api-users.ts`: `SLUG_TO_ERROR` += `'password-too-short': 'password-too-short'`. (Depende de T005.)
- [X] T009 [P] Em `src/modules/users/server/adapters/users.io-schemas.ts`: `ChangePasswordInputSchema.newPassword` `min(8)` → `min(12)` (mantém `max(128)` e `trim`).
- [X] T010 [P] Em `src/shared/i18n/catalog.pt-BR.ts`: adicionar `'users.error.password-too-short'` (mensagem amigável) e alterar `'users.account.password.rule.length'` para usar interpolação `{{min}}` (ex.: "Mínimo {{min}} caracteres"). Conferir que `createTranslator` aceita params (há precedente `{{number}}`/`{{type}}`).

**Checkpoint**: `pnpm typecheck` compila; T002/T003 verdes.

---

## Phase 3: User Story 1 — Trocar senha exige ≥12 (P1) 🎯 MVP

**Goal**: a modal de Trocar Senha aplica o mínimo da fonte única (12), mostra o número certo e bloqueia <12; o backend aceita 12+.

**Independent Test**: senha <12 → bloqueada com "Mínimo 12 caracteres"; 12+ válida → conclui.

### Leitura da política (módulo auth — infra reutilizável, D2)

- [X] T011 [US1] Em `src/modules/auth/server/adapters/server-fns/get-password-policy.query.fn.ts` (NOVO): server fn `createServerFn({ method: 'GET' })` **pública** (NÃO exige user/token); `resultFetch` `GET ${env.CORE_API_URL}/api/v2/auth/password-policy` **sem** header Authorization; validar o response com `PasswordPolicyResponseSchema = z.object({ minLength: z.int().positive(), maxLength: z.int().positive() })` na borda; retornar `{ ok: true, data } | { ok: false, error }` (errors-as-values, try/catch→erro). Definir o schema junto da fn ou em `auth/server/adapters/core-api/`.
- [X] T012 [P] [US1] Em `src/modules/auth/client/data/model/auth.model.ts`: + `export type PasswordPolicy = Readonly<{ minLength: number; maxLength: number }>`.
- [X] T013 [US1] Em `src/modules/auth/client/data/gateways/password-policy.gateway.ts` (NOVO): `fetchPasswordPolicy()` chama `getPasswordPolicyFn()` e devolve `Result<PasswordPolicy, ...>`/shape do contrato (porta client→server, espelha `current-user.gateway.ts`). (Depende de T011/T012.)
- [X] T014 [US1] Em `src/modules/auth/client/password-policy/password-policy.query.ts` (NOVO): `passwordPolicyQueryOptions` = `{ queryKey: ['auth','password-policy'] as const, queryFn: () => fetchPasswordPolicy(), staleTime: Infinity }`. (Depende de T013.)
- [X] T015 [US1] Em `src/modules/auth/public-api/index.ts`: exportar `passwordPolicyQueryOptions` e o tipo `PasswordPolicy`. (Depende de T012/T014.)

### Consumo (módulo users — Trocar Senha)

- [X] T016 [US1] Em `src/modules/users/client/my-account/my-account.binding.ts`: `useQuery(passwordPolicyQueryOptions)` (do `auth/public-api`); derivar `passwordPolicy = { minLength: data?.minLength ?? 12, maxLength: data?.maxLength ?? 128 }` (fallback D4) e expô-lo no retorno do binding (`MyAccountBinding`). `useQuery` no binding é permitido (§XI).
- [X] T017 [US1] Em `src/modules/users/client/my-account/page/my-account.page.tsx`: repassar `minLength`/`maxLength` do binding para a `ResetPasswordModal` por props (page burra — só compõe).
- [X] T018 [US1] Em `src/modules/users/client/my-account/components/reset-password-modal.component.tsx`: receber `minLength`/`maxLength` por props; usar em `evaluatePassword(pw, { minLength, maxLength })` e `passwordMeetsPolicy`; trocar o rótulo `length` por `t('users.account.password.rule.length', { min: minLength })`. (Depende de T004, T010, T017.)

### Teste DOM (opcional)

- [~] T019 [US1] **DEFERIDO**: a modal chama `el.showModal()` no `useEffect` **sem fallback** para jsdom (diferente da AmendmentModal) → renderizar com `open` lança em jsdom, tornando o teste frágil. A lógica de gating (a real) já está coberta por T002 (validador parametrizável, 9 casos) + typecheck (props minLength/maxLength) + T023 (tela). Follow-up: ou adicionar try/catch no showModal da modal (mudança no componente) ou usar a abordagem de ref-callback da AmendmentModal.

**Checkpoint US1**: Trocar Senha aplica 12 dinâmico; testes verdes.

---

## Phase 4: Polish & validação

- [X] T020 `pnpm verify` vs baseline (T001): typecheck/lint 0; node ≥ baseline + novos.
- [X] T021 `pnpm test:dom` vs baseline: dom ≥ baseline + novos; sem regressões.
- [X] T022 Revisar boundaries/lint do diff: `users` consome a política **só via `auth/public-api`** (não importa auth internals); `useQuery` só no binding; sem `any`/`throw` fora da borda; só-tokens; i18n; naming por postfix.
- [ ] T023 Validar em tela (admin.full@bemcomum.dev) conforme `quickstart.md`: Trocar Senha com <12 → bloqueia com "Mínimo 12 caracteres"; 12+ válida → conclui (logout/redirect existente); **complexidade preservada** (sem maiúscula/dígito/símbolo ainda bloqueia); senha >128 bloqueada. **NÃO commitar** (a usuária commita).

---

## Dependencies

- **Phase 2** bloqueia a US1. T002→T004; T003→(T006→T007); T005→T008.
- **Auth read** (T011→T013→T014→T015; T012 [P]) antes do **consumo** (T016→T017→T018).
- T018 depende de T004 (validador) + T010 (i18n) + T017 (props).
- **Polish** (T020–T023) por último.
- TDD: T002/T003 (RED) antes de T004/T007.

## Parallel opportunities

- T002 ‖ T003 (testes distintos).
- T005 ‖ T006 ‖ T009 ‖ T010 (arquivos distintos); T008 após T005.
- T012 ‖ T011 (model vs fn); T019 ‖ T018 (arquivo distinto, valida ao fim).

## Implementation Strategy

MVP = **US1 completa** (Phases 2→3): Trocar Senha alinhada à política. Incremental: foundational (validador/erros/schema/i18n + RED) → auth read infra → consumo na modal → verde → polish. A infra de leitura (auth) fica pronta para reuso pelos futuros fluxos de cadastro-com-senha/recuperação (FR-007). Sem cadastro-com-senha/recuperação nesta fatia (não existem no front).
