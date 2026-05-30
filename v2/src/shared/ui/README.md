# Design System (`shared/ui`)

Design system compartilhado da v2 (tipo `shared-ui` no `eslint-plugin-boundaries`; qualquer `client-ui` de feature importa daqui). Organização **Atomic Design**.

- [`tokens/`](./tokens/README.md) — **camada de tokens** (cores, tipografia, espaço, raio, sombra). Fonte única de verdade visual; consumir via `vars` (`import { vars } from '#shared/ui/tokens'`). ✅ implementado (spec 004).
- `atoms/` · `molecules/` · `organisms/` — **componentes** (próxima spec). A hierarquia (atoms ↛ molecules ↛ organisms) e a regra "só tokens" serão enforçadas por lint — ver [`handbook/reference/design-system/lint-enforcement.md`](../../../handbook/reference/design-system/lint-enforcement.md).

Stack: **vanilla-extract** (zero-runtime, type-safe) — ADR-0007. Fontes self-host via @fontsource — ADR-0008.
