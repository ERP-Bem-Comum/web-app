# Implementation Plan: Átomos do Design System (componentes do login)

**Branch**: `005-design-system-atoms` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-design-system-atoms/spec.md`

## Summary

Criar os primeiros **componentes** do design system em `src/shared/ui/` — átomos **Button, Input, Checkbox, Logo, Card** e a molécula **Field** — consumindo os tokens (`vars`, spec 004) via vanilla-extract, com fidelidade visual à v1. Componentes **burros** (props + JSX), testados (unitário de variantes + BDD/DOM de comportamento) e sob os linters de enforcement (só-tokens + hierarquia Atomic) já configurados. **Escopo: só os componentes** — NÃO veste a LoginView nem porta o fundo de login (próxima spec). Porta apenas o asset do **logo**.

## Technical Context

**Language/Version**: TypeScript 6 (estrito, `erasableSyntaxOnly`, `verbatimModuleSyntax`), React 19

**Primary Dependencies**: `@vanilla-extract/css` (já instalado — `style` + **`styleVariants`** p/ variantes do Button; **verificado**: `styleVariants` existe no pacote, `@vanilla-extract/recipes` **não** instalado e **não** será adicionado), `vars` de `#shared/ui/tokens`. Testes: Vitest (jsdom) + `@testing-library/react` (já instalados) e `node:test`.

**Storage**: N/A (componentes de UI)

**Testing**: híbrido — **`node:test`** (`tests/**/*.test.ts`) p/ lógica pura de variante; **Vitest + @testing-library/react** (`tests/**/*.spec.tsx`, jsdom) p/ comportamento/DOM. Globs disjuntos (vitest.config: `include: tests/**/*.spec.{ts,tsx}`). **Sem** `@testing-library/jest-dom` — seguir o padrão atual (`login-view.spec.tsx`): queries do testing-library + `expect` do Vitest, asserções via `.hasAttribute('disabled')`, `getByRole('alert')`, `getByLabelText`.

**Target Platform**: Browser (SSR via TanStack Start + Nitro)

**Project Type**: Web app — design system compartilhado (`shared/ui`, Atomic Design)

**Performance Goals**: CSS estático zero-runtime (vanilla-extract); átomos leves, sem estado de negócio

**Constraints**: componentes BURROS (sem fetch/estado de negócio/i18n hardcoded); só `vars` (lint barra hex/px/rgb); hierarquia Atomic enforçada (lint); a11y (label associado, foco visível, erro com `role=alert`)

**Scale/Scope**: 5 átomos + 1 molécula + 1 asset (logo). Sem vestir login, sem dark, sem mudança de MVVM.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Aderência |
| :-- | :-- |
| **III. Boundaries** | ✅ átomos `ds-atom` (importam só `shared`/`ds-tokens`); molécula `ds-molecule`. Enforçado pelo lint (spec 004). |
| **VII. Strict TS 6→7** | ✅ sem `enum`/`namespace`/`class`/`any`; `import type`; props `Readonly<>`. |
| **VIII. Minimal Dependencies** | ✅ **zero dep nova**: `styleVariants` do `@vanilla-extract/css` já instalado (evita `@vanilla-extract/recipes`); testes com libs já presentes (sem jest-dom). |
| **XI. Dumb Views / i18n** | ✅ componentes burros; **nenhum texto de UI hardcoded** — labels vêm por props. São componentes genéricos de `shared/ui` (não `*.page/*.component` de feature), mas seguem o mesmo princípio. |
| **X. Spec-Driven** | ✅ spec 005 + este plano. |
| **II/IV/V/VI/XII** | ✅ N/A (sem erro/estado de negócio/IO/eventos nos átomos). |

**Resultado**: PASS — sem desvios. (Stack/fontes já em ADR-0007/0008.)

### Gap conhecido (registrado, não-bloqueante)

O lint permite `client-ui → shared-ui`, mas os átomos têm tipo mais específico `ds-atom`. Esta spec **não** faz `client-ui` importar átomos (não veste a LoginView) → **sem violação agora**. Para a próxima spec (vestir login): a `client-ui` consumirá o DS via **barrel `#shared/ui`** (tipo `shared-ui`, que já importa `ds-*`), OU adiciona-se regra `client-ui → ds-*`. Detalhe em research.md (R4).

## Estratégia de Teste (TDD)

Decisão do Tech Lead: **ambos** (unitário de variantes + BDD/DOM de comportamento), escritos **antes** da implementação.

- **Unitário (`node:test`)** — `tests/shared/ui/atoms/button.test.ts`: a lógica pura de variante/estado do Button (função `buttonClass(variant, state)` ou mapa) retorna a classe esperada, sem DOM.
- **BDD/DOM (`Vitest` + testing-library)** — `tests/shared/ui/atoms/*.spec.tsx` + `.../molecules/field.spec.tsx`: render acessível, callbacks (`onClick`/`onChange`), estados (`disabled`/`loading`/`invalid`/erro `role=alert`), foco.
- Os `*.css.ts` **não** entram em teste unitário puro (exigem o compilador do VE); a aparência é coberta por (a) o lint "só-tokens" e (b) o smoke visual na spec que veste o login.

## Project Structure

### Documentation (this feature)

```text
specs/005-design-system-atoms/
├── plan.md · research.md · data-model.md · quickstart.md
├── checklists/requirements.md
└── tasks.md   (/speckit-tasks — NÃO criado aqui)
```

### Source Code (repository root)

```text
public/
└── images/
    └── logo-bem-comum.png        # asset portado da v1 (Vite serve public/ por padrão; v2 ainda não tem public/)

src/shared/ui/
├── atoms/
│   ├── button/   { button.tsx, button.css.ts, index.ts }
│   ├── input/    { input.tsx, input.css.ts, index.ts }
│   ├── checkbox/ { checkbox.tsx, checkbox.css.ts, index.ts }
│   ├── logo/     { logo.tsx, logo.css.ts, index.ts }
│   ├── card/     { card.tsx, card.css.ts, index.ts }
│   └── index.ts                  # barrel dos átomos
├── molecules/
│   ├── field/    { field.tsx, field.css.ts, index.ts }
│   └── index.ts
├── tokens/                       # (spec 004 — existente)
└── index.ts                      # barrel do DS: reexporta vars + atoms + molecules

tests/shared/ui/
├── atoms/   { button.test.ts (node:test), button.spec.tsx, input.spec.tsx, checkbox.spec.tsx, logo.spec.tsx, card.spec.tsx (Vitest) }
└── molecules/ { field.spec.tsx }
```

**Structure Decision**: um diretório por componente (`<nome>/` com `.tsx` + `.css.ts` + `index.ts`), barris em `atoms/index.ts`, `molecules/index.ts` e `shared/ui/index.ts`. Co-localização (componente + estilo + export) e casa com os patterns do lint (`src/shared/ui/atoms/**`, `.../molecules/**`). O `Logo` é genérico (recebe `src`/`alt` por prop); o consumidor passa `/images/logo-bem-comum.png`.

## Complexity Tracking

Sem violações. Notas (detalhe em research.md): `styleVariants` (não `recipes`) → zero dep; logo via `public/` (não import de asset) → átomo genérico + sem tipos de asset; sem jest-dom → consistência com specs atuais.
