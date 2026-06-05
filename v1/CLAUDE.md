# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Esta é a v1 — LEGADO CONGELADO

Este diretório (`frontend/v1`) é a **versão antiga, descontinuada e parada**. O desenvolvimento ativo vive em `../v2`.

**Não implemente, refatore nem "corrija" nada aqui.** O propósito deste arquivo é ser um **mapa de consulta rápida**: quando você estiver na v2 e precisar entender *como a v1 fazia algo* (um fluxo, um contrato de API, um cálculo, uma tela, um componente), use este guia para localizar a referência rápido — e depois volte para a v2.

Se o usuário pedir mudança de código aqui, **confirme antes** que ele realmente quer mexer no legado, e não na v2.

## ⚠️ Cuidado: a própria documentação da v1 está desatualizada

A v1 foi **migrada de Next.js 13 para TanStack Start + Vite no meio do caminho**, e a migração **ficou pela metade**. Vários arquivos de doc/config descrevem o estado *antigo* (Next) e não a realidade atual:

- `README.md` → diz "Next.js 13 + Yarn dev (Next)". **Stack errada.**
- `DOCUMENTACAO_TECNICA.md` → diz "Next.js 13.4.7 / React 18". **Stack errada**, mas é **excelente para domínio, telas, regras de negócio, fluxos** (use para *o quê*, não para *como técnico*).
- `AGENTS.md` → é ruído auto-gerado (índice de docs do Next + regra "GSD"). **Ignore** — contradiz a stack real.
- Pastas órfãs: `next.config` não existe; `firebase.json`, `playwright.config.ts`, `vitest.config.ts`, `vite.config.ts` são os reais.

**Fonte de verdade da stack/comandos = `package.json` + `vite.config.ts`.** Para domínio = `DOCUMENTACAO_TECNICA.md` + `GUIA_FRONTEND.md`.

## Domínio

ERP financeiro: contas a pagar/receber (com fluxo de aprovação), contratos (+ aditivos, timeline, histórico), fornecedores/financiadores/colaboradores, centros de custo, planos orçamentários (com compartilhamento externo), conciliação bancária, exportação CNAB, dashboards e relatórios (posição, fluxo de caixa, análise, realizado), gestão de usuários e perfis.

## Stack real (do `package.json`)

- **App / SSR:** TanStack Start (`@tanstack/react-start`) + **Vite 8** + Nitro. React 19, TS strict.
- **Roteamento:** TanStack Router file-based em `src/routes/`, árvore gerada em `src/routeTree.gen.ts` (não editar à mão). Server functions no padrão `*.server-fn.ts`.
- **Data fetching:** TanStack Query v5 + Axios (e `ofetch`/`result-fetch` em pontos novos).
- **Forms / validação:** React Hook Form + Zod 4.
- **UI:** **duas libs convivem** — MUI 9 (+ Emotion) e Radix + Tailwind v4 + CVA/clsx/tailwind-merge (padrão shadcn, ver `components.json` e `src/components/ui`). Código novo tende ao shadcn.
- **Gráficos:** Recharts, Chart.js e Highcharts (os três coexistem).
- **FP:** fp-ts, neverthrow, monocle-ts, newtype-ts.
- **Auth:** **dois sistemas convivem** (ver abaixo) — next-auth + iron-session + jose + nookies.
- **API tipada:** **Orval** gera client + tipos a partir do OpenAPI.
- **Testes:** **Vitest** (jsdom) + Testing Library; **Playwright** (e2e); **MSW**.
- **Gerenciador:** **Yarn 4** (`yarn@4.14.1`). Use `yarn`, não `npm`.

## Comandos (só se precisar rodar a v1 para inspecionar comportamento)

```bash
yarn dev               # vite dev (http://localhost:3000)
yarn build             # vite build
yarn start             # node .output/server/index.mjs (produção)
yarn lint              # eslint .
yarn typecheck         # tsc --noEmit
yarn test:run          # vitest run
yarn test:ui           # vitest --ui

yarn api:generate      # Orval: regenera client/tipos a partir do OpenAPI (handbook/doc.yaml)
yarn mock:api          # mock da API (Prism via docker) em :4010
yarn mock:server       # mock local: node --import tsx mock-api.ts
yarn verify:contracts  # valida contratos (scripts/verify-contracts.sh)
```

Rodar um teste isolado: `npx vitest run caminho/arquivo.test.ts` ou `npx vitest -t "nome do teste"`.

Aliases efetivos em runtime (`vite.config.ts`): **`@ → src`** e **`lib → lib`**. O `tsconfig.json` declara mais (`@components`, `@utils`, `@public`) mas o Vite só resolve `@` e `lib`.

## Estado da migração (o detalhe mais importante para se localizar)

Só **duas áreas** foram portadas para a arquitetura nova (TanStack Start, em `src/routes/` + `src/features/`):

- **`login`** → `src/routes/login.tsx` + `src/features/auth/`
- **`contratos`** → `src/routes/_authenticated/contratos/*` + `src/features/contracts/` (este é o **modelo de referência** da arquitetura nova — clean architecture por feature)

**Todo o resto do ERP** (financeiro, parceiros, programas, usuários, plano orçamentário, relatórios) **continua na estrutura Next antiga em `src/app/`** e **não foi religado ao roteamento do TanStack** — ou seja, são telas legadas, não navegáveis pelo app atual, mas ainda referenciadas por componentes (`@/app/...`) e pelo `globals.css`. `src/app/` **não está morto**: é o grosso do código histórico e a melhor referência de "como cada tela funcionava".

## Mapa — onde procurar cada coisa

| Preciso entender… | Olhe em | Observação |
|---|---|---|
| **Telas migradas (vivas)** | `src/routes/` | Só `login` e `_authenticated/contratos/`. Layout protegido em `_authenticated.tsx`; `__root.tsx` redireciona `/` → `/login` e importa `../app/globals.css` |
| **Telas legadas Next (a maioria)** | `src/app/` | Route groups `(main)/(financeiro)`, `(gestao-parceiros)`, `(gestao-programa)`, `(gestao-usuario)`, `(plano-orcamentario)`, `(reports)` com `page.tsx`. Referência histórica de cada módulo |
| **Feature nova (modelo bom)** | `src/features/contracts/` | `domain/` (types/schemas/status/timeline/format + testes), `application/ports.ts`, `adapters/` (http + queries), `infrastructure/*.server-fn.ts`, `views/` (components + hooks) |
| **Auth (arquitetura nova)** | `src/features/auth/infrastructure/` | `*.server-fn.ts` (login/logout/me/refresh) + `session-store.ts`/`auth-session.ts` (iron-session) |
| **Server-side / BFF** | `src/server/` | `auth.ts`, `contracts.ts`, `budget-plans.ts`, `partners.ts`, `env.ts`, `middleware/auth.ts`, `http/result-fetch.ts` |
| **Client HTTP legado (Axios)** | `src/services/api.ts` | Axios + interceptors; baseURL default `http://localhost:4010` (mock). Usa next-auth `getSession()` e tem **modo bypass** (`AUTH_BYPASS_ENABLED`) |
| **Services legados por domínio** | `src/services/*.ts` | Um arquivo por área: `payables`, `receivable`, `contracts`, `creditCard`, `budgetPlan`, `reconciliation`, `exportCNAB`, `reports`, etc. |
| **Client/tipos da API (gerados)** | `src/services/generated/`, `src/types/generated/` | **Gerados pelo Orval** — não editar (estão no `globalIgnores` do ESLint); regere com `yarn api:generate`. Mutator: `src/services/generated/mutator.ts` |
| **Contrato da API (fonte)** | `handbook/doc.yaml` (core), `handbook/auth.openapi.yaml`, `handbook/contratos/openapi.yaml`, `orval.config.cjs` | OpenAPI que alimenta Orval e o mock Prism |
| **Componentes** | `src/components/` | ~300 arquivos por domínio (`payables/`, `receivables/`, `creditCard/`, `dashboard/`, `budgetPlan/`, `reports/`…) + `ui/` (shadcn) e `layout/main/` (Navigation, TopMain, PageContainer) |
| **Estado compartilhado** | `src/contexts/` | Contexts React por fluxo: `approvalsContext`, `cnabContext`, `payablesContext`, `receivablesContext` |
| **Hooks / enums / validators** | `src/hooks/`, `src/enums/`, `src/validators/` | `validators/` = schemas Zod; `enums/` = status e constantes de domínio |
| **Tema / cores / config Zod** | `src/configurations/` | `colors.ts`, `globalZodConfig.ts` |
| **Planejamento da migração** | `.planning/` (`PROJECT.md`, `STATE.md`, `ROADMAP.md`), `specs/001-contratos-tanstack-start/` | Contexto de por que/como a migração começou pelos contratos |

## Pontos de atenção

- **Migração parcial:** ao procurar uma tela, comece por `src/routes/`; se não estiver lá (só login/contratos estão), ela mora em `src/app/` no formato Next antigo.
- **Dois sistemas de auth:** o legado usa **next-auth** (`getSession`/`signOut` em `services/api.ts`) com **bypass de dev** (`AUTH_BYPASS_ENABLED` → entra logado, 401/403 viram "backend offline"); o novo usa **server functions + iron-session** em `src/features/auth`.
- **Lint é permissivo:** `eslint.config.mjs` desliga muita regra (prettier, react-hooks, etc.). `eslint-plugin-boundaries` está no `package.json` mas **não está ligado** na config — não há enforcement de fronteiras de fato.
- **Duas libs de UI e três de gráfico** convivem por causa da migração — não tome nenhuma como "a oficial" sem checar o componente concreto.
- **Não é Next.js apesar das aparências:** existe `src/app/` com `page.tsx`/`layout.tsx`, mas o app roda por Vite/TanStack Start. APIs do Next (`next/navigation`, route handlers, etc.) só fazem sentido no código legado de `src/app/`.
