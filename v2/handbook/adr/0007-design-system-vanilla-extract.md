# ADR-0007 — vanilla-extract como engine do design system

**Status:** Accepted
**Data:** 2026-05-30
**Decisores:** Gabriel (Tech Lead)
**Contexto da spec:** `specs/004-design-tokens/`

---

## Contexto

A v2 precisa de uma camada de estilização para o design system compartilhado (`src/shared/ui/`), com
fidelidade visual à v1 (migração imperceptível) e organização **Atomic Design** (tokens → atoms →
molecules → organisms). A v2 nasceu **sem nenhuma técnica de CSS** configurada. A escolha precisa respeitar
a constituição: TS estrito (§VII), dependências mínimas (§VIII), pnpm + supply-chain hardening (§IX,
ADR-0003) e SSR (TanStack Start + Nitro).

Foram avaliadas (spikes reais no pipeline): CSS Modules, Tailwind v4, styled-components, **vanilla-extract**
e **Panda CSS**. Os dois finalistas (VE e Panda) buildaram com SSR + CSS estático zero-runtime.

## Decisão

Adotar **vanilla-extract** (`@vanilla-extract/css` runtime de autoria + `@vanilla-extract/vite-plugin`
build) como engine de estilização do design system.

- **Zero-runtime:** estilos em `*.css.ts` são compilados em **CSS estático** no build (sem custo de runtime,
  SSR-safe).
- **Type-safe:** tokens via `createThemeContract` + `createGlobalTheme`; referenciar token inexistente é
  **erro de compilação**.
- **Atomic Design** em `src/shared/ui/` (tipo `shared-ui` no `eslint-plugin-boundaries`): `tokens/` →
  `atoms/` → `molecules/` → `organisms/`. Qualquer `client-ui` de feature importa de `shared-ui`.
- **Integração:** `vanillaExtractPlugin()` como 1º plugin do `vite.config.ts` (antes do `tanstackStart`).
- **Supply-chain:** instala limpo sob o hardening da v2; `esbuild` (já trazido pelo Vite/TanStack) declarado
  em `allowBuilds: esbuild: false` (binário via napi; build script bloqueado, igual ao `unrs-resolver`).

## Consequências

**Positivas:**
- CSS estático → sem FOUC, sem runtime de estilização, SSR previsível.
- Tokens tipados → guard-rail contra regressão visual (uso inválido não compila).
- Footprint pequeno e sem postinstall próprio → aderente ao §VIII e ao §IX.
- Contrato ≠ valores → tema dark futuro sem reescrever consumidores.

**Negativas / trade-offs:**
- Não traz baterias prontas (recipes/patterns como o Panda) — átomos e variantes são escritos à mão
  (`style`/`styleVariants`/`recipe`).
- Anti-regressão de "só tokens" exige regra de lint própria (não há MCP/plugin oficial de tokens do VE);
  avaliar `@antebudimir/eslint-plugin-vanilla-extract` (`prefer-theme-tokens`) ou regra interna.

## Alternativas consideradas

- **Panda CSS:** venceu em DX (recipes/patterns + ESLint oficial anti-regressão) e chegou a ser escolhido.
  **Rejeitado** porque `@pandacss/node` fixa `chokidar@4.0.3` (versão exata, sem provenance) → dispara
  `ERR_PNPM_TRUST_DOWNGRADE` no `trustPolicy: no-downgrade` (ADR-0003). Instalá-lo exigiria **furar o
  supply-chain hardening** — inaceitável para um ERP. (chokidar@4.0.3 é falso-positivo legítimo — publicado
  via NPM_TOKEN antigo, GPG do mantenedor verificado — mas o pin exato não dá saída por upgrade.)
- **Tailwind v4:** porte 1:1 da v1, mas engine Oxide (binário nativo c/ postinstall) adiciona atrito de
  supply-chain e governança de classes utilitárias soltas. Rejeitado.
- **styled-components / CSS-in-JS runtime:** SSR frágil (registry/`ServerStyleSheet`), custo de runtime,
  projeto em maintenance mode. Rejeitado.
- **CSS Modules:** zero deps e válido, mas sem type-safety de tokens nativa. Mantido como "plano B"; VE
  preferido pela tipagem do contrato de tokens.

---

## Referências

- Constituição §VII (TS estrito), §VIII (Minimal Dependencies), §IX (pnpm + supply-chain)
- ADR-0003 (supply-chain hardening) — motivo da rejeição do Panda
- ADR-0008 (self-host de webfonts) — decisão irmã desta feature
- `specs/004-design-tokens/` — spec + research.md (spikes comparativos)
- `handbook/reference/vanilla-extract/` — doc curada + APIs
- `vite.config.ts`, `pnpm-workspace.yaml` — integração e allowBuilds
