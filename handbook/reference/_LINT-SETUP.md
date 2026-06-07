# Lint Setup — Frontend v2

Guia da configuração de lint/qualidade do projeto. Fonte: `eslint.config.js` + `tsconfig.json`.
Filosofia: **estado inválido irrepresentável já no lint** — TS estrito, segurança por padrão,
arquitetura enforçada, e migração saudável rumo ao TypeScript 7 (compilador nativo / strip-types).

## Como rodar

```bash
pnpm lint        # eslint .
pnpm lint:fix    # eslint . --fix  (muitas regras têm autofix)
pnpm typecheck   # tsc --noEmit
```

MCP do ESLint registrado em `.mcp.json` (`@eslint/mcp`) — o Claude Code conecta ao abrir o projeto
(precisa aprovar o servidor na primeira vez).

## Stack

| Pacote | Papel |
| --- | --- |
| `eslint@10` + `@eslint/js` | core, flat config |
| `typescript-eslint@8` | parser + `strictTypeChecked` + `stylisticTypeChecked` (com type info) |
| `eslint-plugin-react-hooks@7` | rules of hooks, purity, immutability, exhaustive-deps, etc. |
| `@tanstack/eslint-plugin-query` / `-router` / `-start` | boas práticas do ecossistema TanStack |
| `eslint-plugin-zod` (marcalexiei) | boas práticas Zod 4 |
| `eslint-plugin-security` | segurança (AST) |
| `eslint-plugin-no-secrets` | segredos hardcoded (entropia) |
| `eslint-plugin-boundaries` | arquitetura: matriz de camadas + isolamento de feature |
| `eslint-import-resolver-typescript` | resolve imports `.ts`/aliases para o boundaries |

## 1. TypeScript estrito + migração 6 → 7

**tsconfig.json** (flags que blindam o compilador nativo / `node --experimental-strip-types`):

- `strict: true`, `strictNullChecks: true`
- `isolatedModules: true` — **exigido pelo Vite**
- `verbatimModuleSyntax: true` — import/export sem elisão mágica → exige `import type` explícito
- `erasableSyntaxOnly: true` — proíbe sintaxe não-apagável (enum/namespace/parameter-property/`import =`)

**Lint (espelha `erasableSyntaxOnly` no editor)** via `no-restricted-syntax`:
`TSEnumDeclaration`, `TSModuleDeclaration[kind=namespace]`, `TSParameterProperty`, `TSImportEquals` → erro.

**Do TS handbook** (via `strictTypeChecked` + regras explícitas):
`no-explicit-any`, `no-wrapper-object-types` (String/Object), `no-unsafe-function-type`,
`consistent-type-imports` (autofix → `import type`), `consistent-type-exports`,
`switch-exhaustiveness-check`, `no-deprecated`.

> `class` continua permitido (ex.: `QueryError` da arquiteture.md) — classes são apagáveis.

## 2. React

`eslint-plugin-react-hooks@7` (recommended-latest), só em `.ts/.tsx`. Cobre: rules of hooks,
render puro (sem `Math.random`/`Date.now` no render), imutabilidade, exhaustive-deps,
set-state-in-render/effect, componentes estáticos, refs.

## 3. Ecossistema (TanStack + Zod)

Em `.ts/.tsx`, presets `flat/recommended`:
- **Query**: exhaustive-deps, no-unstable-deps, stable-query-client, no-void-query-fn, prefer-query-options…
- **Router**: `create-route-property-order` (ordem importa p/ inferência).
- **Start**: `no-client-code-in-server-component`, `no-async-client-component` (type-aware).
- **Zod** (`eslint-plugin-zod`, recommended): `no-any-schema`, `no-native-enum`, `prefer-meta`,
  `consistent-import` (**use `import * as z from 'zod'`**), `z.uuid()` no lugar de `z.string().uuid()`, etc.

> Peer warning conhecido: `@tanstack/eslint-plugin-start@0.1.0` declara eslint ≤9, mas roda no 10.

## 4. Segurança da informação

- `eslint-plugin-security` (recommended) — child-process, ReDoS, non-literal fs/regexp, timing-attacks…
  (`detect-object-injection` desligado por ruído).
- `eslint-plugin-no-secrets` — bloqueia strings de alta entropia (token/segredo hardcoded).
- `no-eval`, `no-implied-eval`, `no-new-func`.
- XSS: `dangerouslySetInnerHTML` (JSX) e `document.write` bloqueados.

## 5. Arquitetura (camadas + isolamento de feature)

`eslint-plugin-boundaries` (`boundaries/dependencies`, sintaxe v6) enforça a matriz da `arquiteture.md`.
**Só "morde" quando a estrutura de pastas existir:**

```
src/
├── lib/                         # puro, cross-cutting
├── components/ui/               # design system
├── server/                      # BFF cross-feature
└── features/<feature>/
    ├── domain/                  # puro
    ├── application/             # use cases
    ├── infrastructure/          # server functions, http, mappers, queries
    └── ui/                      # componentes + presenter hooks
```

### Matriz de imports permitidos

| De ↓ \ Pode importar → | lib | components/ui | server | domain* | application* | infrastructure* | ui* |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| **lib** | ✅ | | | | | | |
| **components/ui** | ✅ | ✅ | | | | | |
| **server** | ✅ | | ✅ | | | | |
| **domain** | ✅ | | | ✅ | | | |
| **application** | ✅ | | | ✅ | ✅ | | |
| **infrastructure** | ✅ | | ✅ | ✅ | ✅ | ✅ | |
| **ui** | ✅ | ✅ | | ✅ | ✅ | ✅ | ✅ |

`*` = **mesma feature** (via `{{from.captured.feature}}`). Cruzar features só por `lib` (kernel compartilhado).
Rotas (`src/routes/**`), `router*`, `client*`, `ssr*`, `start*` ficam fora do policiamento (`boundaries/ignore`).

### Como estender
- **Nova camada/tipo**: adicione em `boundaryElements` (pattern da pasta, modo folder) e regras em `boundaryRules`.
- **Novo alias** (ex.: `@/`): configure em `tsconfig.json#paths` — o resolver TS do boundaries já segue.

## Convenções que o lint vai cobrar (lembrete ao escrever código)

- `import * as z from 'zod'` (namespace), não `import { z }`.
- `import type { X }` para tipos (autofix).
- Sem `enum`/`namespace` — use union de literais + objeto `as const`.
- Zod só na borda (`infrastructure`/`server`) — reforçado pela matriz de camadas.
- Nada de segredo/token literal no código (vai pro env/SessionStore server-side).

## Decisões em aberto (ajustáveis)
- Query em `recommended` (não `recommended-strict`).
- `strictTypeChecked` (mais estrito); dá pra baixar p/ `recommendedTypeChecked` se ficar ruidoso.
