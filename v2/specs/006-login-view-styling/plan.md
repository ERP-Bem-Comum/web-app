# Implementation Plan: Login com a identidade visual (design system)

**Branch**: `006-login-view-styling` | **Date**: 2026-05-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-login-view-styling/spec.md`

## Summary

Vestir a LoginForm (hoje HTML cru) com os componentes do design system (Card, Logo, Field, Input,
Checkbox, Button) e reproduzir o enquadramento do login da v1 (fundo cobrindo a tela + card branco
centralizado + logo + ciano), **sem alterar o comportamento de autenticação** (FR-009). O feedback de
"enviando" é um **spinner em CSS** (anel `conic-gradient` + `mask`) adicionado ao estado `loading` do
**átomo Button** — melhoria do design system que o login consome. Abordagem: TDD (teste antes), só-tokens,
views burras (§XI), a11y (foco visível, `role=alert`, spinner com alternativa textual).

> **Camada foundational — refactor do [ADR-0009](../../handbook/adr/0009-framework-agnostic-client.md):**
> como a reorg do client foi adiada para cá, esta feature CARREGA a adoção do modelo agnóstico antes da
> estilização: `client/` vira **flat feature-first** (`login/`, `current-user/`, `data/` compartilhado);
> o login ganha **`loginViewModel`** (agnóstico) + **`useLoginBinding`** (`useMutation → loginCommand`); o
> `client/usecase/login` é **removido** (vira `loginViewModel.onSuccess`). A estilização (Phase 3) assenta
> sobre essa base. O `Command` (`{ running, errorTag, … }`) entrega o spinner de graça (`command.running`).

## Technical Context

**Language/Version**: TypeScript estrito (strip-types / TS 6→7), React 19

**Primary Dependencies**: TanStack Start (front+BFF), vanilla-extract (`@vanilla-extract/css`), Zod 4 —
todas já no projeto. **Nenhuma dependência nova** (Princípio VIII).

**Storage**: N/A (feature de apresentação; sem dados novos)

**Testing**: Vitest + @testing-library (DOM, `*.spec.tsx`) para comportamento/estrutura; node:test
(`*.test.ts`) para lógica pura (tokens). TDD obrigatório.

**Target Platform**: Browser (SSR via TanStack Start/Nitro). Baseline: features Widely available.

**Project Type**: Web app (front + BFF unificado)

**Performance Goals**: Spinner em CSS hardware-accelerated (60fps); zero-runtime (CSS estático do
vanilla-extract); sem layout shift no estado loading.

**Constraints**: só-tokens (lint cobra hex/px/rgb cru); views burras (§XI, lint cobra); `prefers-reduced-motion`
(spinner suavizado, não removido — exceção funcional); largura mínima ~320px sem transbordo.

**Scale/Scope**: 1 tela (login) + 1 átomo aprimorado (Button) + tokens/i18n de apoio. ~3 arquivos de UI
tocados, ~2 do design system, catálogo i18n, 1 asset.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Aplicação nesta feature | Status |
| --- | --- | --- |
| I. BFF-Orchestrated Boundary | Não toca server/auth; só apresentação. Token segue invisível. | ✅ |
| II. Errors Are Values | Sem novo fluxo de erro; o `errorText` já vem resolvido da ViewModel. | ✅ |
| III. Client×Server Modular | Mudança 100% em `client/ui` (login) + `shared/ui` (Button/tokens/i18n). Nada cross-fronteira. | ✅ |
| IV. Illegal States Unrepresentable | Props `Readonly`; estados de UI derivados de props. | ✅ |
| V. Server-State ≠ UI-State | Inalterado (ViewModel/Controller existentes). | ✅ |
| VI. Validation at Boundary | Inalterado (Zod no controller/data já existe). | ✅ |
| VII. Strict TS 6→7 | Sem enum/namespace/`any`/`class`. | ✅ |
| VIII. Minimal Dependencies | Zero dep nova (spinner é CSS puro). | ✅ |
| IX. pnpm Only | Inalterado. | ✅ |
| X. Spec-Driven | Esta é a spec 006 (specify→clarify→plan). | ✅ |
| XI. Dumb Views (MVVM) | LoginForm segue burra (props→JSX); estilo via className do DS. | ✅ |
| XII. Reactive Flow (Event Bus) | Não aplicável (sem novos eventos). | ✅ |
| Governança DS (só-tokens, Atomic) | Tudo via `vars.*`; novo(s) token(s) em `tokens.values.ts`; hierarquia mantida. | ✅ |

**Resultado: PASS.** Nenhuma violação → `Complexity Tracking` vazio.

## Project Structure

### Documentation (this feature)

```text
specs/006-login-view-styling/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 — decisões técnicas (spinner, layout, tokens, i18n)
├── data-model.md        # Phase 1 — contratos de props, tokens novos, chaves i18n
├── quickstart.md        # Phase 1 — como rodar/validar
├── contracts/           # Phase 1 — contratos de UI (LoginForm, Button.loading)
└── tasks.md             # Phase 2 — /speckit-tasks (NÃO criado aqui)
```

### Source Code (repository root)

```text
public/images/
└── backgroundLogin.png                      # NOVO — portado de ../v1/public/images/

src/shared/ui/atoms/button/                   # melhoria foundational do átomo
├── button.css.ts                            # + keyframes(spin) + spinner (conic-gradient+mask) + srOnly + position:relative
├── button.component.tsx                      # + prop loadingLabel; no loading: label visibility:hidden + spinner + sr-only "carregando"
└── button.variants.ts                        # (inalterado)

src/shared/ui/tokens/
├── tokens.values.ts                          # + token de cor de fundo de fallback do login (e, se preciso, largura do card)
├── contract.css.ts                           # + contrato do(s) token(s)
└── theme.css.ts                              # + valor(es)

src/shared/i18n/
└── catalog.pt-BR.ts                          # + auth.login.subtitle, *.email-placeholder, *.password-placeholder, common.loading

src/modules/auth/client/                      # ★ REORG flat feature-first (ADR-0009)
├── data/                                     # COMPARTILHADO (porta/model/events) — inalterado
├── login/                                    # COMPORTAMENTO login (flat) — camada = sufixo
│   ├── login.mutation.ts                     # NOVO: loginMutationOptions { mutationFn } — AGNÓSTICO
│   ├── login.view-model.ts                   # loginViewModel { mutation, onSuccess, toErrorTag } — AGNÓSTICO ← funde os antigos view-model/login/*
│   ├── login.binding.ts                      # NOVO: useLoginBinding() → loginCommand — ADAPTER (React)
│   ├── login.page.tsx                        # LoginPage — compõe (resolve i18n, chama o binding) + aplica login.css
│   ├── login.css.ts                          # NOVO: layout da TELA (fundo full-screen + centralização)
│   └── components/forms/
│       ├── login-form.component.tsx          # REESCRITA: LoginForm burra (Card/Logo/Field/Input/Checkbox/Button)
│       ├── login-form.css.ts                 # NOVO: estilo interno do form (stack de campos + bloco de erro)
│       └── login-form.controller.ts          # useLoginFormController — Hook local de form
└── (removido) usecase/login/                 # emissão do evento vira loginViewModel.onSuccess

tests/shared/ui/atoms/
└── button.spec.tsx                           # + casos de loading (disabled, aria-busy, nome acessível, spinner)

tests/modules/auth/client/
├── login/login.view-model.test.ts            # NOVO (node:test): toErrorTag/derivação do loginViewModel (puro)
└── login/components/forms/login-form.spec.tsx # ESTENDE: estrutura vestida (Card/Logo/Field/Input/Checkbox/Button, subtítulo, placeholders, erro)
```

**Structure Decision**: client **flat feature-first** ([ADR-0009](../../handbook/adr/0009-framework-agnostic-client.md)):
a pasta `login/` concentra tudo do comportamento (camada = sufixo: `.mutation/.view-model` agnósticos,
`.binding/.page/.component/.controller` adapter), com `data/` compartilhado. A **LoginForm** permanece a
view burra (§XI); a `login.page.tsx` chama o `useLoginBinding` e passa `{ command, textos }` por props. O
layout da tela vive em `login.css.ts` e o do form em `login-form.css.ts` (tipo `client-ui` → consome
`shared-ui` + tokens). O **spinner é do átomo Button** (reuso por todo o DS) e é dirigido por
`loginCommand.running`.

## Complexity Tracking

> Sem violações de constituição — seção vazia.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
