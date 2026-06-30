---
paths:
  - "tests/**/*.ts"
  - "tests/**/*.tsx"
  - "**/*.test.ts"
  - "**/*.spec.ts"
  - "**/*.spec.tsx"
  - "e2e/**/*.ts"
---

# Regras — Testes

Fonte: ADR-0011; `handbook/ARQUITETURA.md` §9.

## Invariantes

- **Dois runners, globs disjuntos:**
  - `node:test` → `*.test.ts` — lógica **pura**, imports relativos, sem DOM.
  - **Vitest + jsdom** → `*.spec.ts(x)` — DOM, aliases (`#…`).
- **Regressão visual (Playwright):** em `e2e/visual/*.e2e.ts` com `toHaveScreenshot`, contra stack/login real. Baseline oficial é o `-linux`; **nunca** dar `--update-snapshots` sem revisão humana.
- **Após aprovar algo visual, crie o teste visual** correspondente.
- **Sem mocks em produção (ADR-0011):** fixtures e doubles **só** em `tests/`; `src/` usa `not-implemented` como placeholder (governance test cobra).
- **Espelhe a estrutura de `src/`** na pasta de testes.

> Em conflito, vence: ADR > constituição > este arquivo > `eslint.config.js`.
