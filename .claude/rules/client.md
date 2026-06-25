---
paths:
  - "src/modules/*/client/**/*.ts"
  - "src/modules/*/client/**/*.tsx"
---

# Regras — Camada Client (MVVM)

Fonte: ADR-0004, ADR-0009, ADR-0012; constituição §XI; `handbook/ARQUITETURA.md` §3 e §7.
Feature-modelo: `src/modules/auth/client/`.

## Invariantes (o lint cobra — `eslint.config.js → boundaryRules`)

- **MVVM (§XI):** a ViewModel orquestra a tela (TanStack Query + estado); a View é **burra** — só apresenta o que recebe por props/binding. `*-view.ts` = derivação **pura**.
- **Núcleo agnóstico de framework (ADR-0009):** `data/`, `view-model.ts`, `*.query.ts`/`*.mutation.ts` **não** importam `react` nem `@tanstack/react-*`. O acoplamento ao React vive **só** em `*.binding.ts`.
- **Dependência aponta para dentro:** `ui → view-model → data` (e `data → view-model`). Cross-módulo **só** via `public-api/index.ts`.
- **`client/` nunca importa `server/domain` nem `server/application`** — só chama a server function pela `data/` (repository → porta).
- **`ui/` (views burras) não importa** `server/`, `data`, `usecase`, `repository` nem `*.server-fn` direto.
- **server-state ≠ UI-state:** o cache do TanStack Query não é estado de UI.
- **A camada é o sufixo do arquivo, não a pasta (§XI):** subpastas agrupam por *concern* (login, logout…); o boundary que o lint enforça é a camada (`client/data`, `client/view-model`, `client/ui`…).

## Skills oficiais a carregar (delegar, não duplicar)

`pnpm dlx @tanstack/intent@latest load @tanstack/router-core#router-core/navigation` (e `#search-params`, `#path-params`, `#data-loading`, `#code-splitting`, `#type-safety`). Para server-state, ver o agente `tanstack-query-expert`.

> Em conflito, vence: ADR > constituição > este arquivo > `eslint.config.js` (a autoridade executável vence o texto).
