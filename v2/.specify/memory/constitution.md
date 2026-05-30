<!--
SYNC IMPACT REPORT
==================
Version change: (template) → 1.0.0 → 1.1.0 → 1.2.0 → 1.2.1
Bump rationale:
  - 1.2.1 (PATCH): clarificação do §XII — localização dos tipos de evento (client→`client/data`,
    server→`server/domain`), resolvendo tensão com os boundaries (client não importa server/domain).
    Origem: /speckit-analyze da Auth (finding K1).
  - 1.0.0: first ratification (template → governing principles).
  - 1.1.0 (MINOR): adopted vertical-modular structure mirroring core-api + Principle XI (MVVM).
  - 1.2.0 (MINOR): refined the per-module internal structure into a CLIENT × SERVER split — the
    server side (BFF) is DDD; the client side (FRONT) is MVVM; the boundary is the server function.
    Made Event Bus (Observer) and Controller (transient form state) official patterns. Rewrote
    Principle III and XI; added Principle XII (Reactive Flow via Event Bus); rewrote folder structure.
    Materially expanded guidance, no principle removed. See ADR-0004 (refines ADR-0001's internal layout).

Principles:
  - I. BFF-Orchestrated Boundary · II. Errors Are Values · III. Client×Server Modular Architecture
    (rewritten 1.2.0) · IV. Make Illegal States Unrepresentable · V. Server-State Is Not UI-State ·
    VI. Validation at the Boundary · VII. Strict TypeScript & 6→7 · VIII. Minimal Dependencies ·
    IX. pnpm Only · X. Spec-Driven Development · XI. Dumb Views, Smart ViewModels — MVVM (rewritten 1.2.0) ·
    XII. Reactive Flow via Event Bus (added 1.2.0).

Templates & config requiring updates:
  - eslint.config.js ................................ ⚠ pending (boundary elements for server/* vs
    client/* + shared/bus + MVVM rule scoped to *.page.tsx/*.component.tsx)
  - handbook/adr/0004-*.md .......................... ⚠ pending (new ADR for the client×server split)
  - handbook/adr/0001-*.md .......................... ⚠ note: internal layout refined by ADR-0004
  - handbook/arquiteture.md ......................... ⚠ divergence note already present (update layout)
  - .specify/templates/* ............................ ✅ no change (tech-agnostic / dynamic gates)

Sources of truth: CLAUDE.md (v2), handbook/adr/, core-api modular-monolith (ADR-0006), and the
Tech Lead's front-end architecture guide (client=MVVM, server=DDD) consolidated here.
-->

# ERP Bem Comum — Frontend v2 Constitution

> Front + BFF unificado em TanStack Start. Fonte de verdade: este documento + `handbook/adr/`.
> Governa o código de `src/`; conflitos com outras práticas são resolvidos a favor deste documento
> (e dos ADRs aceitos, que estão acima dele na hierarquia).

## Core Principles

### I. BFF-Orchestrated Boundary

Um app = front + BFF no mesmo processo. O browser **NUNCA** fala direto com o `core-api` — fala apenas
com as **server functions** do próprio BFF, que autenticam, orquestram e normalizam. Tokens, refresh
tokens, client secrets e a URL do backend **NUNCA** chegam ao browser: o cookie carrega só um
`sessionId` opaco (`HttpOnly; SameSite=Strict; Secure`); os tokens vivem num `SessionStore` server-side.
Toda I/O e todo segredo ficam atrás da fronteira do BFF.

**Rationale:** centralizar I/O e segredos elimina classes inteiras de vazamento e de acoplamento
cliente↔backend, e dá um único ponto de auditoria de segurança.

### II. Errors Are Values

Erros são valores, não exceções: toda operação falível retorna `Result<T, E>` com unions de erro em
string-literal kebab-case. `throw` é **proibido** fora da borda de infraestrutura; quando uma API nativa
lança, o `catch` converte para `Result` **imediatamente**. A **única** subclasse de `Error` permitida é
`QueryError` (vive em `shared/http`, ponte entre `Result` e a API de erro do TanStack Query, usada só por
`queryFn`/`mutationFn`). Engolir erros é proibido — todo `E` é propagado e tratado exaustivamente.

**Rationale:** erros-como-valores tornam o fluxo de falha visível ao compilador e à revisão.

### III. Client × Server Modular Architecture with Enforced Boundaries

Cada módulo de negócio é um slice vertical isolado em `src/modules/<módulo>/` e **separa explicitamente
client de server** (decisão do Tech Lead; ver ADR-0004):

- **`server/` — BFF, server-side, DDD.** É "tudo que definimos pro BFF": orquestração real, sessão,
  tokens, chamada ao `core-api`. Camadas: `domain/` (puro: VOs branded, `Result`, regras, ports, event
  types), `application/` (use cases — orquestram core-api + sessão), `adapters/` (server functions
  `*.server-fn.ts` + client do core-api + `*.schema.ts` Zod + mappers). Usa `external/` para I/O/segredos.
- **`client/` — FRONT, client-side, MVVM.** É o que roda no browser e **consome** o BFF. Camadas:
  `data/` (Model = Zod do que o BFF já devolveu + **Repository = porta** para a server function),
  `usecase/` (intenção de UI, opcional), `view-model/` (TanStack Query + store; `{estado, ações}`),
  `ui/` (`*.page.tsx` template burro + `*.controller.ts` form + `*.component.tsx`).
- **`public-api/`** — único ponto de import **cross-módulo**.

**Fronteira client↔server = a server function.** O `client/` só toca o `server/` chamando server
functions (RPC); **nunca** importa `server/domain` ou `server/application`. A **dependência aponta para
dentro**: `client/ui → client/view-model → client/usecase → client/data`; `server/adapters →
server/application → server/domain`; `domain` (qualquer lado) é puro. `external/` é server-only e nunca
importa módulos. Cross-módulo só via `public-api`.

Compartilhado: `src/shared/` (puro) e `src/external/` (I/O real + segredos, server-only). Violar a matriz
de import é **erro de lint**, não convenção.

**Rationale:** separar client (apresentação/consumo, MVVM) de server (domínio/orquestração, DDD) deixa
claro onde vive o quê, mantém o núcleo testável e cada lado evoluível sem vazar o outro — e o `public-api`
mantém os módulos extraíveis (como o `core-api`, ADR-0006).

### IV. Make Illegal States Unrepresentable

O domínio usa **branded types + smart constructors** (`type CPF = Brand<string,'CPF'>`;
`CPF = (raw) => Result<CPF, CPFError>`) — estado inválido é irrepresentável. Toda estrutura é imutável
(`Readonly<>`, `readonly T[]`, `as const`); mudança de estado é cópia por spread. Commands, eventos e
estados são **discriminated unions** com campo discriminante, tratados por `switch` **exaustivo** com
guarda `const _: never = x`. `as` só dentro do smart constructor (ou com comentário); `any` é proibido.

**Rationale:** o compilador vira a primeira linha de defesa; estado inválido deixa de compilar.

### V. Server-State Is Not UI-State

Estado remoto vive **somente** no cache do TanStack Query (na `view-model`). Estado de UI efêmero vive em
`useReducer`/state machine (na `view-model`) ou estado transiente de form (no `controller`). **Nunca**
misturar. A cadeia de erro é fixa: `server/` (`resultFetch → HttpError → mapToServerResponse`) →
`client/data` Repository (valida Zod, converte) → `queryFn` lança `QueryError(mapToAppError)` → `AppError`
→ `switch` na `view-model`/UI. A UI **nunca** inspeciona status HTTP — só `AppError` semântico (resolvido
em tag de i18n).

**Rationale:** separar as duas naturezas de estado elimina sincronização manual e bugs de re-render.

### VI. Validation at the Boundary

Validação com **Zod 4** acontece na fronteira: no **input** da server function E no **response do backend**
(`server/adapters/*.schema.ts`), e novamente quando o **Repository do client** recebe o retorno da server
function (Model). Para dentro da fronteira, tudo é total e tipado. Zod só em `server/adapters`,
`client/data` e `external` — **nunca** em `domain` nem em `ui`.

**Rationale:** a borda é o único lugar onde dados não confiáveis entram; validar ali mantém o núcleo limpo.

### VII. Strict TypeScript & Healthy 6→7 Migration

TypeScript estrito máximo. Proibido sintaxe não-apagável (`erasableSyntaxOnly`): **sem `enum`/`namespace`/
parameter-properties/`import =`** — use union de literais + `as const` e ESM. `import type` obrigatório
(`verbatimModuleSyntax`). Proibidos `any`, `class` (exceto `QueryError`) e `this`.

**Rationale:** alinhar com o compilador nativo do TS 7 evita migração dolorosa e mantém output previsível.

### VIII. Minimal Dependencies

Preferir APIs nativas (`Intl`/`Temporal`, `crypto.randomUUID`, `EventTarget`, `AbortController`, `fetch`).
Adicionar dependência exige justificativa explícita — não é o default.

**Rationale:** cada dependência é superfície de ataque e dívida de manutenção.

### IX. pnpm Only

pnpm (pinado via `packageManager`); `npm`/`yarn` proibidos (hook bloqueia). Supply-chain hardening em
`pnpm-workspace.yaml` (ADR-0003). Lockfile commitado.

**Rationale:** lockfile determinístico e instalação reproduzível em dev/CI/Docker.

### X. Spec-Driven Development

Toda feature segue o spec-kit: **constitution → specify → (clarify) → plan → (checklist) → tasks →
(analyze) → implement**. Código de produção não nasce antes de uma spec versionada em `specs/`. Decisões
arquiteturais viram **ADRs** (`handbook/adr/`).

**Rationale:** especificar e registrar a decisão (não só o código) torna intenção/escopo revisáveis.

### XI. Dumb Views, Smart ViewModels (MVVM)

A camada `client/ui` segue **MVVM** com 4 papéis:

- **`*.page.tsx` (PageView/template)** e **`*.component.tsx` (Components)** são **BURROS** — recebem dados
  e callbacks por props, renderizam JSX, encaminham eventos. **Proibido** neles: `useQuery`/`useMutation`,
  importar `data`/`usecase`/server functions, ou carregar estado de negócio.
- **`*.view-model.ts` (ViewModel)** — verdade reativa da tela: liga server-state (TanStack Query) e
  UI-state, expõe `{estado, ações}` (ex.: `idle/submitting/error`), devolve **dados, nunca JSX**; assina
  o Event Bus.
- **`*.controller.ts` (Controller)** — estado **transiente** de form/grupo (valores antes do submit),
  **por exceção** (form é o caso canônico). No submit, entrega ao ViewModel.

ViewModel e Controller **podem** usar hooks/estado (não são "views burras"). Strings de UI são **tags de
i18n** (catálogo centralizado) — **nenhum literal de UI hardcoded**.

**Rationale:** separar render (View) de orquestração (ViewModel) e de interação de form (Controller) torna
a tela testável sem DOM e elimina god-components.

### XII. Reactive Flow via Event Bus

Reações cross-feature no client usam um **Event Bus** (Observer, `shared/bus`, `EventTarget` nativo).
Eventos são **fatos no passado** (particípio: `UsuarioAutenticado`, nunca `AutenticarUsuario`). **Localização
dos tipos de evento:** eventos **client** vivem em `client/data` (acessíveis ao client — que não importa
`server/domain`); eventos **server** vivem em `server/domain`. **`client/usecase` emite**; **`view-model`
assina** para reagir (ex.: invalidar query). O bus é **opt-in** (chamada direta é o normal — use o bus só
para efeito cross-feature); handlers **delegam** (não decidem regra) e **não** podem criar loops.

**Rationale:** desacopla quem causa o fato de quem reage a ele, sem CQRS/event-store — reatividade simples
e declarativa.

## Technology Constraints & Stack

Stack mandatória (substituições exigem amenda):

- **Meta-framework:** Vite + `@tanstack/react-start` (SSR + server functions) · **Router:**
  `@tanstack/react-router` (file-based) · **Server-state:** TanStack Query · **Validação:** Zod 4 (na borda)
  · **UI:** React 19 · **Tipos:** TS estrito máximo · **pnpm** (ADR-0003).
- **Testes:** runner híbrido — `node:test` para puro (`server/domain`, `server/application`, `shared`,
  `external`, `client/data`/`usecase`), Vitest para DOM (`client/ui`, `view-model`). ⚠ código testado por
  `node:test` usa **imports relativos** (alias só no bundler).

Estrutura de pastas (normativa — ver ADR-0004):

```
src/
├── modules/<módulo>/
│   ├── server/                 # BFF (server-side, DDD) — usa external/, nunca vai ao browser
│   │   ├── domain/             # PURO: VOs branded, Result, regras, *.repository.port.ts, *.events.ts
│   │   ├── application/         # *.use-case.ts (orquestra core-api + sessão) + ports
│   │   └── adapters/            # *.server-fn.ts (fronteira RPC) + client core-api + *.schema.ts (Zod) + mappers
│   ├── client/                  # FRONT (client-side, MVVM) — consome o BFF
│   │   ├── data/                # *.model.ts (Zod do retorno do BFF) + *.repository.ts (porta → server-fn)
│   │   ├── usecase/             # *.use-case.ts (intenção de UI; opcional) — emite eventos no bus
│   │   ├── view-model/          # *.view-model.ts (TanStack + store; {estado, ações}; assina o bus)
│   │   └── ui/                  # *.page.tsx (template burro) + *.controller.ts (form) + *.component.tsx
│   └── public-api/              # index.ts — ÚNICO import externo ao módulo
├── shared/                      # cross-cutting PURO (sem framework/I/O)
│   ├── primitives/              # result.ts, brand.ts, immutable.ts
│   ├── http/                    # http-error / app-error / query-error / map-to-app-error
│   ├── bus/                     # Event Bus (Observer, EventTarget nativo)
│   ├── i18n/                    # catálogo de strings (tags) — l10n-ready
│   ├── ports/ · ui/ · utils/    # contratos cross-cutting · design system · helpers
├── external/                    # EXTERNAL ADAPTERS (I/O real + segredos; server-only)
│   ├── core-api/                # result-fetch, map-to-server-response
│   ├── session/                 # SessionStore (compartilhável p/ escala horizontal) + cookie
│   └── config/                  # env.config (Zod fail-fast)
└── routes/ + router.tsx         # TanStack file-based (composition root / framework glue)
```

Segurança obrigatória: cookie `__Host-session`/sessionId opaco (HttpOnly/SameSite=Strict/Secure); CSRF via
SameSite + validação de origem; CSP/HSTS/nosniff/frame-deny via middleware. 401 → signOut + limpeza de cache.

## Development Workflow & Quality Gates

- **Naming (postfix por papel):** `*.value-object.ts`, `*.repository.port.ts`, `*.events.ts`,
  `*.use-case.ts`, `*.server-fn.ts`, `*.schema.ts`, `*.model.ts`, `*.repository.ts`, `*.queries.ts`,
  `*.view-model.ts`, `*.controller.ts`, `*.page.tsx`, `*.component.tsx`. `tests/` espelha `src/`.
- **Idioma:** código em EN; strings de UI via **i18n (tags)**; erros internos = literais kebab-case EN.
- **Quality gate (bloqueante):** `pnpm lint` (boundaries + MVVM) · `pnpm typecheck` · testes verdes ·
  `pnpm build`.
- **Automações:** `npm`/`yarn` bloqueados; `eslint --fix` ao salvar `*.ts/*.tsx`.
- **Backend `core-api`:** submódulo; contratos via agente `core-api-consultant`.

## Governance

Esta constituição **supersede** outras práticas, **abaixo apenas dos ADRs aceitos** (`handbook/adr/`).
Em conflito, prevalece o mais restritivo; divergências reais se resolvem por amenda aqui ou por novo ADR.

**Procedimento de amenda:** PR alterando este arquivo, com Sync Impact Report atualizado e propagação aos
templates/eslint/ADRs dependentes.

**Versionamento (semver):** MAJOR = remoção/redefinição incompatível; MINOR = novo princípio/seção ou
expansão material; PATCH = clarificações.

**Conformidade:** o "Constitution Check" do `/speckit-plan` verifica aderência. Os gates de lint
(boundaries, no-any, erasableSyntaxOnly, MVVM) e typecheck enforçam os princípios automaticamente.

**Version**: 1.2.1 | **Ratified**: 2026-05-29 | **Last Amended**: 2026-05-29
