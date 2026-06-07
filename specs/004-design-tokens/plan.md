# Implementation Plan: Design Tokens Fundacionais (Design System v2)

**Branch**: `004-design-tokens` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-design-tokens/spec.md`

## Summary

Estabelecer a **camada de tokens** do design system compartilhado em `src/shared/ui/tokens/`, usando **vanilla-extract** (já instalado, commit `a1fbdf2`). A abordagem separa **valores crus** (objeto TS puro, testável por `node:test`) do **contrato de tema** (`createThemeContract`) e da **aplicação global** (`createGlobalTheme(':root', …)`), gerando CSS estático zero-runtime. Fontes Inter/Nunito/JetBrains Mono **self-host via `@fontsource`** (npm versionado, com provenance — passa no supply-chain hardening). Fidelidade visual à v1 (marca `#32C6F4`, radius `0.5rem`). Escopo: **somente tokens**, sem componentes.

## Technical Context

**Language/Version**: TypeScript 6 (estrito, `erasableSyntaxOnly`, `verbatimModuleSyntax`)

**Primary Dependencies**: `@vanilla-extract/css` (já instalado); **a adicionar**: `@fontsource-variable/inter`, `@fontsource-variable/nunito`, `@fontsource/jetbrains-mono` (self-host, provenance OK)

**Storage**: N/A (tokens são código/CSS estático)

**Testing**: `node:test` (runner puro da constituição) sobre o objeto de **valores** (`*.values.ts`) — sem DOM, sem necessidade do compilador do VE. Decisão de tipo de teste: ver "Estratégia de Teste (TDD)" abaixo.

**Target Platform**: Browser (SSR via TanStack Start + Nitro)

**Project Type**: Web app (front + BFF unificado) — design system compartilhado em `shared/ui`

**Performance Goals**: zero-runtime de estilização (CSS estático no build); fontes self-host sem FOUC (sem ida a domínio externo)

**Constraints**: respeitar boundaries (`shared-ui` só importa de `shared`/`shared-ui`); sem `enum`/`namespace`/`class`/`any`; `import type`; privacidade/LGPD (sem CDN de fonte externo)

**Scale/Scope**: ~5 grupos de token (cor, tipografia, espaçamento, raio, sombra); 3 famílias de fonte; 1 tema (claro) com contrato pronto para dark futuro

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Aderência |
| :-- | :-- |
| **III. Boundaries** | ✅ tokens vivem em `src/shared/ui/` (tipo `shared-ui`); só importam de `shared`/`shared-ui`. Nenhum import de feature/server/external. |
| **VII. Strict TS 6→7** | ✅ sem `enum`/`namespace`/`class`/`any`; valores via `as const`; `import type` onde aplicável. |
| **VIII. Minimal Dependencies** | ✅ adiciona 3 pacotes `@fontsource*` — **alinhado, não desvio**. Investigação (research.md R1 + ADR-0008) provou: **zero scripts, zero deps transitivas, zero JS executável** (são só `.woff2`+`.css`) + provenance. O que o Princípio VIII quer conter (código não-auditado/superfície de execução) **não existe aqui**; é asset versionado. vanilla-extract formalizado em ADR-0007. |
| **IX. pnpm Only + supply-chain** | ✅ `@fontsource*` têm attestation (provenance) e idade > 1 dia → passam `trustPolicy: no-downgrade` e `minimumReleaseAge`. Verificado via `pnpm view`. |
| **X. Spec-Driven** | ✅ este plano; spec versionada em `specs/004`. |
| **XI. Dumb Views / i18n** | ✅ N/A direto (tokens não são view), mas habilita: componentes futuros aplicam estilo via tokens sem hex/px cru. |
| **II / IV / V / VI / XII** | ✅ N/A (tokens não têm erro/estado/IO/eventos). |

**Resultado**: PASS — sem desvios. As escolhas de dependência (vanilla-extract, `@fontsource`) são formalizadas em ADR-0007 e ADR-0008. (Complexity Tracking mantido apenas como registro do trade-off avaliado.)

## Estratégia de Teste (TDD)

Conforme prática do time (TDD + escolha explícita do tipo de teste). Para **tokens** (valores, não comportamento de usuário), o desenho proposto torna os **valores** testáveis de forma pura:

- O CSS-em-TS do vanilla-extract (`*.css.ts`) tem side-effect de registro e exige o compilador do VE — **não** é importável em `node:test` puro.
- **Solução**: extrair os valores crus para `tokens.values.ts` (objeto `as const`, puro). O `*.css.ts` apenas consome esse objeto. Assim, o `node:test` valida os **valores** (fidelidade à v1) sem tocar no VE.

**DECISÃO (Tech Lead, 2026-05-30): Unitário dos valores via `node:test`.**
Teste puro sobre `tokens.values.ts` (`tests/shared/ui/tokens/tokens.values.test.ts`), escrito ANTES da implementação (TDD):
- assert `color.brand.normal === '#32C6F4'` e `color.brand.hover === '#76D9F8'`;
- assert `radius.lg === '0.5rem'`;
- assert nenhum valor de cor ∈ paleta institucional proibida (`#396496`, `#2d4f75`, `#1f7d55`, `#176642`);
- assert `font.family.heading` começa por Inter, `body` por Nunito, ambos com fallback de sistema;
- assert cobertura: toda folha do contrato tem valor.
Rápido, puro, alinhado à constituição (runner `node:test` para `shared`, imports relativos no teste). Smoke de build e BDD ficam fora deste escopo (BDD será usado nos componentes/login).

## Project Structure

### Documentation (this feature)

```text
specs/004-design-tokens/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 — decisões (fontsource vs woff2; contract vs theme; values puros)
├── data-model.md        # Phase 1 — entidades de token (cor/tipo/espaço/raio/sombra/contrato)
├── quickstart.md        # Phase 1 — como consumir os tokens num .css.ts
├── checklists/
│   └── requirements.md  # checklist de qualidade da spec (já criado)
└── tasks.md             # Phase 2 — /speckit-tasks (NÃO criado aqui)
```

### Source Code (repository root)

```text
src/shared/ui/
├── README.md                    # (existente) atualizar p/ apontar tokens
└── tokens/
    ├── tokens.values.ts         # VALORES crus (objeto as const, PURO, testável node:test)
    ├── contract.css.ts          # createThemeContract — nomes/estrutura dos tokens (sem valores)
    ├── theme.css.ts             # createGlobalTheme(':root', contract, valores claros) — aplica no :root
    ├── fonts.css.ts             # imports @fontsource* (side-effect) + tokens de família com fallback
    └── index.ts                 # API pública: re-exporta `vars` (contrato) p/ consumo tipado

tests/shared/ui/tokens/
└── tokens.values.test.ts        # node:test — fidelidade dos valores à v1

src/app/
└── router.tsx                   # (existente) importa theme.css.ts + fonts.css.ts (side-effect 1×)
```

**Structure Decision**: tokens isolados em `src/shared/ui/tokens/` (subpasta dedicada do `shared-ui`). A separação **values (puro) → contract → theme (CSS)** atende FR-006 (type-safe), FR-007 (CSS estático), FR-010 (contrato≠valores) e torna os valores testáveis por `node:test` (constituição). Os assets de imagem (background/logo) **não** entram aqui — virão com os componentes.

## Complexity Tracking

Sem violações de constituição. Trade-off de dependências avaliado e **formalizado em ADR**:

| Decisão | ADR | Resumo |
|---------|-----|--------|
| vanilla-extract como engine do design system | **ADR-0007** | zero-runtime, type-safe, passa no supply-chain; Panda/Tailwind rejeitados (chokidar fura `trustPolicy`). |
| Self-host de webfonts via `@fontsource` | **ADR-0008** | assets puros (0 scripts/0 deps/0 JS) + provenance; CDN e `.woff2`-manual rejeitados. |
