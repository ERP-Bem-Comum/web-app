# Tasks: Login com a identidade visual (design system) + refactor ADR-0009

**Input**: Design documents from `specs/006-login-view-styling/` (plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅)

**Tests**: INCLUÍDOS — TDD (Tech Lead): teste ANTES da implementação. `node:test` para o núcleo agnóstico (puro), Vitest (jsdom) para DOM/comportamento.

**Estrutura (ADR-0009 flat feature-first):** `src/modules/auth/client/{data,login,current-user,logout}/`. O `client/` já foi reorganizado (item 3, commit `1776b21`); aqui muda o **conteúdo**: `loginViewModel` vira objeto puro, `useLoginBinding` retorna `loginCommand`, `usecase` sai, e a `LoginForm` é vestida.

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: paralelizável (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1/US2/US3; Setup/Foundational/Polish sem label

---

## Phase 1: Setup

- [X] T001 [P] Portar o asset de fundo: copiar `../v1/public/images/backgroundLogin.png` → `public/images/backgroundLogin.png` (servido em `/images/backgroundLogin.png`).
- [X] T002 [P] i18n: adicionar em `src/shared/i18n/catalog.pt-BR.ts` as chaves `auth.login.subtitle`, `auth.login.email-placeholder`, `auth.login.password-placeholder`, `common.loading` (textos provisórios; conteúdo do P.O.).
- [X] T003 Token de fundo de fallback `color.surface.canvas`: adicionar em `tokens.values.ts` → `contract.css.ts` → `theme.css.ts` e sincronizar `tests/shared/ui/tokens/{tokens.values.test.ts,contract-extensibility.test.ts}` (padrão do `borderWidth.thin`). Valor provisório (tom de marca claro) — **tom exato confirmado com o P.O. durante a impl**.

---

## Phase 2: Foundational (refactor ADR-0009 + spinner do Button) — BLOQUEIA as user stories

> O núcleo agnóstico + o Command precisam existir antes de a `LoginForm` consumir. O spinner é do átomo Button (todo o DS reusa).

### Átomo Button — spinner (design system)

- [X] T004 [P] (TDD vermelho) Estender `tests/shared/ui/atoms/button.spec.tsx`: no estado `loading` → `disabled` + `aria-busy` + nome acessível `loadingLabel` presente (sr-only) + spinner (classe) presente; `onClick` não dispara; sem `loading`, sem spinner.
- [X] T005 Implementar o spinner no Button: `button.css.ts` (+ `keyframes(spin)` + `spinner` anel `conic-gradient`+`mask` dimensionado em `em` + `WebkitMask` p/ Safari + `srOnly` + `position: relative` na base; suavizar sob `prefers-reduced-motion`) e `button.component.tsx` (+ prop `loadingLabel?`; no `loading`: `children` com `visibility: hidden` + spinner centralizado + `<span srOnly>{loadingLabel}</span>`). T004 → verde. (Consultar o agente `css-expert`.)

### Núcleo agnóstico + Command + binding (login)

- [X] T006 [P] (TDD vermelho) Criar `tests/modules/auth/client/login/login.view-model.test.ts` (`node:test`, imports relativos): `loginViewModel.toErrorTag(err('invalid-credentials'))` → tag i18n esperada; o objeto é **puro** (sem React). Deve falhar/ajustar (o objeto ainda não existe nessa forma).
- [X] T007 [P] Criar `src/modules/auth/client/login/login.mutation.ts`: `loginMutationOptions = { mutationKey, mutationFn: (input) => authRepository.login(input) }` — AGNÓSTICO (só `@tanstack/query-core`/tipos; o lint anti-react cobre).
- [X] T008 Refatorar `src/modules/auth/client/login/login.view-model.ts` para o **objeto puro** `loginViewModel = { mutation: loginMutationOptions, onSuccess: (user, { bus }) => bus.emit(UsuarioAutenticado(user)), toErrorTag }`. Migrar o `authErrorTag` p/ `toErrorTag`; remover a forma antiga (`deriveLoginView`/`type LoginView` → vira `LoginUiState` se necessário). T006 → verde.
- [X] T009 Refatorar `src/modules/auth/client/login/login.binding.ts`: `useLoginBinding()` retorna `{ loginCommand: { running: m.isPending, errorTag: m.error ? loginViewModel.toErrorTag(...) : null, result, execute: m.mutate } }`; renomear o export `useLoginViewModel` → `useLoginBinding`.
- [X] T010 Remover o `usecase` do login (`src/modules/auth/client/login/login.{use-case,composition}.ts`): a emissão de `UsuarioAutenticado` agora é o `onSuccess` do command (T008). Adaptar/mover `tests/modules/auth/client/usecase/login.test.ts` (o que sobrar de lógica pura vai p/ `login.view-model.test.ts`); ajustar `public-api/index.ts` se reexportava o usecase.
- [X] T011 Atualizar `src/modules/auth/client/login/login.page.tsx`: consumir `useLoginBinding`; mapear `loginCommand` → props da `LoginForm` (`submitting = loginCommand.running`, `errorText = loginCommand.errorTag ? t(loginCommand.errorTag) : null`, `onSubmit = () => loginCommand.execute(input)`); resolver e passar as novas tags i18n (`subtitle`, placeholders, `loadingLabel = t('common.loading')`).

**Checkpoint**: núcleo agnóstico (puro, anti-react verde) + Command + binding + Button com spinner — a `LoginForm` pode ser vestida.

---

## Phase 3: User Story 1 — Login com a identidade visual (Priority: P1) 🎯 MVP

**Goal**: a `/login` mostra fundo + card branco centralizado + logo + campos/checkbox/botão do design system, mantendo o comportamento.

**Independent Test**: abrir `/login` deslogado → enquadramento da marca; login funciona; `test:dom`/`lint`/`typecheck`/`build` verdes.

- [X] T012 [P] [US1] (TDD vermelho) Estender `tests/modules/auth/client/ui/login-form.spec.tsx`: renderiza `Card` (superfície) + `Logo` (alt) + título + subtítulo + 2× `Field`>`Input` (com placeholder, `getByLabelText`) + `Checkbox` (lembrar) + `Button`; submit dispara `onSubmit`; `errorText` → `role="alert"`; comportamento (onChange/remember/submit) inalterado.
- [X] T013 [P] [US1] Criar `src/modules/auth/client/login/components/forms/login-form.css.ts`: estilo interno do form (stack `flex column` + `gap` por token; bloco de erro form-level com `vars.color.feedback.*`). Só `vars.*`. (Consultar `css-expert`.)
- [X] T014 [P] [US1] Criar `src/modules/auth/client/login/login.css.ts`: layout da TELA — `min-block-size: 100dvh` + `display: grid; place-items: center` + `background-image: url(/images/backgroundLogin.png)` + `background-size: cover` + fallback `vars.color.surface.canvas`; largura do card `max-inline-size` ~`28rem` (sem largura fixa → ~320px **sem overflow**, SC-006). Só `vars.*` (logical properties). **Nota:** SC-006 é verificado **manualmente** (jsdom não faz layout) — ver T019. (Consultar `css-expert`.)
- [X] T015 [US1] Reescrever `src/modules/auth/client/login/components/forms/login-form.component.tsx` (burra): `Card` › `Logo(size=48)` + título + subtítulo + `<form>`[ `Field`>`Input`(email, placeholder) · `Field`>`Input`(senha, placeholder) · `Checkbox`(remember)+label · (se errorText) bloco `role=alert` · `Button`(submit, `loading={submitting}`, `loadingLabel`) ]; props novas (`subtitle`, `emailPlaceholder`, `passwordPlaceholder`, `loadingLabel`). A `login.page.tsx` envolve no wrapper de `login.css.ts`. T012 → verde.
- [X] T016 [US1] Validar o MVP: `pnpm test` + `pnpm test:dom` + `pnpm typecheck` + `pnpm lint` + `pnpm build` verdes; conferir que o CSS gerado usa as CSS vars (sem cor/medida crua) e que o login funciona ponta a ponta (smoke).

**Checkpoint**: LoginForm vestida, testada, só-tokens, comportamento intacto.

---

## Phase 4: User Story 2 — Login acessível e com feedback claro (Priority: P2)

**Goal**: operável por teclado, foco visível, erro anunciado, spinner com alternativa textual, sem depender só de cor.

**Independent Test**: navegar só por teclado → foco visível em cada controle; erro com `role=alert`; spinner com nome acessível; `prefers-reduced-motion` suaviza (não some).

- [X] T017 [P] [US2] (TDD) Asserções de a11y no `login-form.spec.tsx`/`button.spec.tsx`: cada campo tem label associado (`getByLabelText`); erro `getByRole('alert')`; Button em loading expõe nome acessível "carregando"; foco visível (classe `:focus-visible` presente nos átomos).
- [X] T018 [US2] Confirmar `prefers-reduced-motion` no spinner (suavizado, não removido) e que estado/erro não dependem só de cor (o `role=alert` + texto cobrem). Ajustar se faltar.

---

## Phase 5: User Story 3 — Fidelidade visual à v1 (Priority: P3)

**Goal**: enquadramento corresponde ao login da v1.

**Independent Test**: comparação lado a lado com `../v1` (`/login`).

- [ ] T019 [US3] Comparação visual lado a lado com a v1 (`docker compose up -d` → `https://app.localhost` vs v1): conferir fundo, card centralizado, logo no topo, botão ciano; ajustes finos de espaçamento/tamanho via tokens (sem hardcode). Registrar o resultado (SC-005).

---

## Phase 6: Polish & Cross-Cutting

- [ ] T020 [P] Espelhar as pastas de TESTE no flat (ADR-0009): mover `tests/modules/auth/client/{ui,usecase,view-model}/*` → `tests/modules/auth/client/{login,current-user}/...` (mirror de `src/`); atualizar a anatomia no `src/modules/auth/README.md` pro flat.
- [X] T021 [P] Quality gate final completo: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm test:dom` · `pnpm build` — todos verdes.

---

## Dependencies

```
Setup (T001 asset, T002 i18n, T003 token)
   └─> Foundational (P2 bloqueante):
         Button spinner   T004 → T005
         Núcleo+Command   T006 → T008 ; T007 (mutation) ; T008 → T009 → T010 ; → T011 (page)
   └─> US1 (P1): T012 (teste) ; T013/T014 (css [P]) ; T015 (impl, depende de T011+T013+T014+T005) → T016 (validação)
   └─> US2 (P2): T017/T018 (após US1)
   └─> US3 (P3): T019 (após US1)
   Polish: T020, T021 (após US1)
```

- **Teste antes da impl** (TDD) em cada unidade.
- O núcleo agnóstico (T006-T010) deve ficar **anti-react verde** (lint do item 3).
- T015 (LoginForm) depende do binding/command (T011) + dos CSS (T013/T014) + do Button com spinner (T005).

## Parallel Opportunities

- T001/T002 (setup) `[P]`. T004 e T006/T007 (testes-vermelho de áreas distintas) `[P]`. T013/T014 (CSS) `[P]`. T020/T021 `[P]`.

## Implementation Strategy

- **MVP = Setup + Foundational + US1**: núcleo agnóstico + Command + binding + Button spinner + LoginForm vestida. Entrega o valor visual e fecha o refactor ADR-0009 do login.
- **US2/US3**: refinam (a11y já vem dos átomos; fidelidade é verificação).
- **Polish**: mirror dos testes + gate final.
- Commits sugeridos: (1) setup+tokens+i18n; (2) Button spinner; (3) núcleo agnóstico+Command+binding+remover usecase; (4) LoginForm vestida + css; (5) a11y/fidelidade/polish.
