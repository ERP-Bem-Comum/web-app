# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **ERP Bem Comum — Frontend v2.** Front + BFF unificado em **TanStack Start** (Vite + Nitro),
> **React 19**, **pnpm 11**, **vanilla-extract**, **Zod 4**, **TypeScript strict**. Erros como valores
> (`Result`), módulos verticais com fronteiras enforçadas por lint. Zero exceções escondidas.

> **Precedência v1 (legado).** A versão antiga vive em `../v1` (**congelada, não desenvolver lá**). Se
> precisar entender como a v1 fazia um fluxo/tela/contrato para portar à v2, leia **`../v1/CLAUDE.md`** —
> é o mapa de consulta da v1 (stack real = TanStack Start migrado pela metade; docs internas dela estão
> desatualizadas). Não copie padrões da v1 para a v2: aqui valem as invariantes abaixo.

## Comandos

```bash
pnpm dev            # vite dev (porta 3000)
pnpm build          # vite build → .output/server/index.mjs (preset Nitro node-server)
pnpm start          # roda o build de produção

pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint . (boundaries + strict type-checked + segurança)
pnpm lint:fix

pnpm test           # node:test — unidades PURAS (domain, application, view-model, http, primitives)
pnpm test:dom       # vitest + jsdom — DOM/UI (componentes, hooks)
pnpm test:all       # ambos
```

### Rodar um único teste

```bash
# Puro (node:test) — arquivos *.test.ts:
node --experimental-strip-types --test tests/modules/auth/server/domain/email.test.ts

# DOM (vitest) — arquivos *.spec.ts(x):
pnpm test:dom tests/modules/auth/client/ui/login-view.spec.tsx
```

**Dois runners, globs disjuntos (nunca se sobrepõem):** `*.test.ts` → `node:test` (puro, sem DOM);
`*.spec.ts(x)` → Vitest (jsdom). ⚠️ Os subpath imports (`#shared/*`, `#modules/*`, …) **só resolvem no
bundler** — testes de `node:test` usam **imports relativos**; testes de Vitest podem usar os aliases.

## Arquitetura (visão geral)

Um app = **front + BFF unificado**. O browser nunca fala com o `core-api` diretamente — fala com as
**server functions** deste app (RPC via TanStack Start), que autenticam, orquestram e normalizam.
**A server function é a única fronteira** entre client e server.

### Módulos verticais com split CLIENT × SERVER

Cada módulo em `src/modules/<m>/` tem três partes (ver `src/modules/auth/README.md` — **a feature de
referência; leia-a antes de criar qualquer módulo novo**):

```
modules/<m>/
├── server/                  # BFF · server-side · DDD · onde o TOKEN vive
│   ├── domain/              #   PURO (sem I/O): value-objects branded, errors-como-valor, agregados
│   ├── application/         #   use-cases (commands/queries), Result, sem throw
│   └── adapters/            #   borda: *.server-fn.ts (★ a fronteira), clients core-api, schemas Zod, guards
├── client/                  # FRONT · client-side · MVVM · só consome o BFF
│   ├── data/                #   "Model": repository (a PORTA → server fn), gateways, model Zod, Event Bus
│   ├── usecase/             #   intenção de UI (opcional): emite eventos no bus
│   ├── view-model/          #   orquestra a tela (TanStack Query + estado); *-view.ts = derivação pura
│   └── ui/                  #   views BURRAS: *.page.tsx, *.component.tsx (+ *.controller.ts p/ form state)
└── public-api/index.ts      # ★ ÚNICO ponto de import por fora do módulo
```

Fora dos módulos: `src/shared/` (puro, cross-cutting: `primitives/` Result+brand, `http/`, `bus/`,
`i18n/`, `ports/`, `ui/` design system), `src/external/` (I/O real + segredos, **server-only**:
`config/env`, `core-api/` fetch, `session/` store+cookie), `src/app/` (bootstrap: router, query-client,
`routeTree.gen.ts`), `src/routes/` (file-based routing — composition root), `src/start.ts` (middleware global).

### Fronteiras de import (enforçadas por `eslint-plugin-boundaries`)

Dependência **aponta para dentro**; cross-módulo **só** via `public-api`. Resumo (fonte de verdade:
`eslint.config.js`, `boundaryRules`):

- **server:** `domain` → só `shared`/`domain` próprio. `application` → +`application`. `adapters` →
  +`external`, +`public-api`, +`server/*` próprio. `client/` **nunca** importa `server/domain|application`.
- **client:** `data` → `shared` + `server-adapters` (chama a server fn). `usecase` → +`data`. `view-model`
  → +`data`/`usecase` + `public-api`. `ui` (views burras) → `shared` + design system + `view-model` +
  `public-api`; **proibido** importar `server/`, `data`, `usecase`, `repository` ou `server-fn` direto
  (recebe tudo da ViewModel por props).
- **design system (Atomic Design):** `tokens ← atoms ← molecules ← organisms`, só "para baixo".

### Cadeia de erro (fim a fim) — a UI nunca olha status HTTP

```
core-api 4xx/5xx
  → resultFetch → Result.err(HttpError)              [external, sem throw]
  → mapToServerResponse → Response (status preservado) [server fn]
  → queryFn → throw QueryError(mapToAppError(...))     [client boundary]
  → TanStack Query (queryCache/mutationCache.onError)  [401 → signOut + redirect /login]
  → switch exaustivo em AppError.kind → tag i18n       [ui]
```

`QueryError` é a **única** subclasse de `Error` permitida (ponte com o TanStack Query). Vive em
`src/shared/http/query-error.ts`, usada só por `queryFn`/`mutationFn`.

## Invariantes do projeto (o lint cobra — não burle)

- **Erros são valores:** `Result<T,E>` (`src/shared/primitives/result.ts`, formato `{ ok: true, value }`
  / `{ ok: false, error }`). `throw` **só** na borda de infra (`external/`, `*.server-fn.ts`), convertido
  para `Result` na hora.
- **Sem `class`** (exceto `QueryError`), **sem `this`, sem `throw`** fora da borda. **Sem `any`** —
  `unknown` + narrowing; `as` só com comentário justificando (permitido dentro de smart constructors).
- **Imutabilidade:** `Readonly<>`, `readonly T[]`, `as const`.
- **Make illegal states unrepresentable:** branded types + smart constructors retornando `Result`;
  discriminated unions + `switch` exaustivo (guarda `const _: never = x`).
- **Server-state ≠ UI-state:** dados remotos no TanStack Query; estado de UI em `useReducer`/máquina de
  estado tagged. Nunca misturar.
- **Validação na fronteira:** Zod no input da server fn **e** no response do core-api (`*.schema.ts`).
- **Migração TS 6→7 (`erasableSyntaxOnly`):** sem `enum`, `namespace` com runtime, parameter properties,
  `import =`. Use union de literais + `as const`, módulos ESM.
- **Strings de UI = tags i18n** (`src/shared/i18n`), nunca literais. Erros internos = literais kebab-case EN.
- **Token NUNCA no browser** (Auth): o cookie `__Host-session` carrega só um `sessionId` opaco; access +
  refresh tokens vivem no `SessionStore` server-side. O bundle do client não pode conter
  `accessToken`/`refreshToken`/`Bearer`/segredo.
- **Design system "só tokens":** proibido hex/rgb/hsl/px crus em `ui/` (atoms/molecules/organisms e
  `modules/*/client/ui`) — use `vars.*` de `#shared/ui/tokens`. O lint pega inclusive dentro de template
  literals. Exceção: `tokens/` e `*.values.ts` (a fonte de verdade dos literais).

## Convenções

- **Naming:** postfix por tipo de arquivo — `.value-object.ts`, `.use-case.ts`, `.server-fn.ts`,
  `.repository.ts`, `.view-model.ts`, `.component.tsx`, `.page.tsx`, `.controller.ts`, `.schema.ts`,
  `.gateway.ts`, `.events.ts`. Espelhe `src/` → `tests/`.
- **Views burras (MVVM, §XI):** `*.page.tsx`/`*.component.tsx` não podem usar data-hooks (`useQuery`/
  `useMutation`) nem `useReducer` — isso vive na ViewModel/Controller (o lint bloqueia).
- **Imports relativos** dentro da mesma subpasta com `./`; cross-sublayer no mesmo módulo com `#modules/<m>/…`.
- **Mínimo de libs:** prefira nativo (`Intl`, `crypto.randomUUID`, `EventTarget`, `AbortController`) a
  dependências externas.
- **TDD:** escreva o teste antes da implementação. Pergunte ao usuário se é teste unitário (node:test) ou
  de DOM/comportamento (Vitest) quando não estiver claro.

## Supply-chain (pnpm 11) — atenção ao instalar deps

Configuração de segurança vive em `pnpm-workspace.yaml` (não em `.npmrc`): `minimumReleaseAge: 1440`
(quarentena de 1 dia para versões novas), `allowBuilds` allowlist explícita (postinstall scripts bloqueados
por padrão), `blockExoticSubdeps`, `trustPolicy: no-downgrade`. Adicionar uma dep nova publicada hoje
exige incluí-la em `minimumReleaseAgeExclude` por **versão exata**. Nunca use `dangerouslyAllowAllBuilds`.

## Fontes de verdade (hierarquia)

1. `.specify/memory/constitution.md` — a constituição v1.2.1 (princípios I–XII). Governa `src/`.
2. `handbook/adr/` — decisões arquiteturais (0001 modular vertical, 0002 errors-as-values, 0004
   client×server MVVM/DDD, 0005 auth/session/refresh, 0006 CSP, 0007 design system, 0003 supply-chain).
3. `src/modules/auth/README.md` — a feature-modelo, materializa tudo acima.
4. `handbook/arquiteture.md` — guia geral (⚠️ a seção "estrutura de pastas" está marcada como divergência:
   a estrutura `features/`+`lib/` foi **substituída** pelo split client×server; os snippets de Result/HTTP/
   server fn continuam válidos).

Spec-driven via **Spec Kit** (`/speckit-*` skills); specs em `specs/`. **Perdido no fluxo?** Rode
`/speckit-status` ("você está aqui"). **Onboarding + playbook de "a IA alucinou"** em `.claude/README.md`.
Antes de dar algo como pronto, rode `pnpm verify` (typecheck + lint + testes). O `core-api/` é um **submódulo**
(repo separado) presente só como **referência para subir o Docker de infra única** — não é alvo de
desenvolvimento daqui, fora do escopo do lint/typecheck deste app; docs em `handbook/core-api/`. Stack
local: `docker compose up -d` → `https://app.localhost` (Caddy).

## Git / commits

- **Nunca use heredoc (`<<EOF`) em commits** — um hook bloqueia. Use `-m "msg"` com aspas ou `-F arquivo`.
- Não paralelize `git add`/`commit`/`log` dependentes (embaralha output) — sequencie ou encadeie com `&&`.
- Convenção: `tipo(<bc>/<scope>): descrição` (ex.: `feat(ui): átomo Button`). Ver
  `handbook/reference/_CLAUDE-WORKFLOW.md`.
