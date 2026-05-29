<!--
SYNC IMPACT REPORT
==================
Version change: (template, unversioned) → 1.0.0 → 1.1.0 (same-session amendment)
Bump rationale:
  - 1.0.0: first concrete ratification (template → governing principles); establishment release.
  - 1.1.0 (MINOR): adopted the core-api-mirrored vertical-modular structure
    (`modules/` + `shared/` + `external/` + per-module `public-api`) and added Principle XI
    (Dumb Views, Orchestrating ViewModels — MVVM). Materially expanded guidance, no removals.

Modified principles (template slot → ratified name):
  - [PRINCIPLE_1_NAME] → I. BFF-Orchestrated Boundary
  - [PRINCIPLE_2_NAME] → II. Errors Are Values
  - [PRINCIPLE_3_NAME] → III. Vertical-Modular Architecture with Enforced Boundaries (rewritten in 1.1.0)
  - [PRINCIPLE_4_NAME] → IV. Make Illegal States Unrepresentable
  - [PRINCIPLE_5_NAME] → V. Server-State Is Not UI-State
  Added principles (beyond the 5 template slots):
  - VI. Validation at the Boundary
  - VII. Strict TypeScript & Healthy 6→7 Migration
  - VIII. Minimal Dependencies
  - IX. pnpm Only
  - X. Spec-Driven Development
  - XI. Dumb Views, Orchestrating ViewModels (MVVM) — added in 1.1.0

Added sections:
  - "Technology Constraints & Stack" (was [SECTION_2_NAME]) — folder structure rewritten in 1.1.0
  - "Development Workflow & Quality Gates" (was [SECTION_3_NAME])

Removed sections: none.

Templates & config requiring updates:
  - eslint.config.js ................................ ⚠ pending (boundaries elements/rules must be
    rewritten for modules/shared/external + public-api + MVVM dumb-view enforcement)
  - handbook/arquiteture.md ......................... ⚠ pending (divergence note: structure adopted
    is modules/shared/external, mirroring core-api, not features/lib/server)
  - .specify/templates/plan-template.md ............. ✅ dynamic Constitution Check placeholder, no change
  - .specify/templates/spec-template.md ............. ✅ no change required (tech-agnostic)
  - .specify/templates/tasks-template.md ............ ✅ no change required
  - .specify/templates/checklist-template.md ........ ✅ no change required

Follow-up TODOs: none. RATIFICATION_DATE set to first adoption date (2026-05-29).

Sources of truth consolidated: CLAUDE.md (v2), handbook/arquiteture.md and the core-api
modular-monolith architecture (handbook/core-api/01-architecture.md; ADR-0006).
-->

# ERP Bem Comum — Frontend v2 Constitution

> Front + BFF unificado em TanStack Start. Fontes normativas consolidadas:
> `CLAUDE.md` e `handbook/arquiteture.md`. Esta constituição governa o código de
> `src/`; conflitos com outras práticas são resolvidos a favor deste documento.

## Core Principles

### I. BFF-Orchestrated Boundary

Um app = front + BFF no mesmo processo. O browser **NUNCA** fala direto com o
`core-api` ou qualquer microserviço — fala apenas com as server functions do próprio
BFF, que autenticam, orquestram e normalizam. Tokens, refresh tokens, client secrets
e a URL do backend **NUNCA** chegam ao browser: o cookie carrega só um `sessionId`
opaco (`HttpOnly; SameSite=Strict; Secure`); os tokens vivem num `SessionStore`
server-side. Toda I/O e todo segredo ficam atrás da fronteira do BFF.

**Rationale:** centralizar I/O e segredos elimina classes inteiras de vazamento e
de acoplamento cliente↔backend, e dá um único ponto de auditoria de segurança.

### II. Errors Are Values

Erros são valores, não exceções: toda operação falível retorna `Result<T, E>` com
unions de erro em string-literal kebab-case. `throw` é **proibido** fora da borda de
infraestrutura; quando uma API nativa lança, o `catch` converte para `Result`
**imediatamente**, no mesmo módulo de borda. A **única** subclasse de `Error`
permitida é `QueryError`, que existe só para fazer a ponte entre `Result` e a API de
erro do TanStack Query (vive em `lib/http`, usada só por `queryFn`/`mutationFn`).
Engolir erros é proibido — todo `E` é propagado e tratado exaustivamente.

**Rationale:** erros-como-valores tornam o fluxo de falha visível ao compilador e à
revisão, eliminando caminhos de exceção invisíveis.

### III. Vertical-Modular Architecture with Enforced Boundaries

A arquitetura é **vertical e modular**, espelhando o modular-monolith do `core-api`
(ADR-0006). Cada módulo de negócio é um slice isolado em `src/modules/<módulo>/` com as
camadas `domain → application → adapters → ui`, e expõe um **`public-api/`** como único
ponto de import externo. O compartilhado vai para `src/shared/` (puro) ou `src/external/`
(adapters de I/O real). As fronteiras são **enforçadas por lint** (`eslint-plugin-boundaries`):

- `shared/` é **puro** e cross-cutting (`primitives`, `kernel`, `http` types, `ports`, `utils`,
  `ui` design-system); importa só `shared`. É a base que qualquer camada pode usar.
- `external/` são **adapters de I/O real** e segredos (`core-api` client, `session`, `config`);
  importa `shared` + `external`. Nunca importa módulos.
- `domain` é **puro**: VOs branded, tipos, regras, errors, repository ports; ZERO I/O, ZERO
  framework. Importa só `shared` + `domain` da mesma feature.
- `application` (use cases puros, factory functions + ports) importa `shared` + `domain`/`application`
  da mesma feature.
- `adapters` (server functions/BFF, http clients, schemas Zod, queries) importa `shared` + `external`
  + camadas da mesma feature + o `public-api` de qualquer outro módulo.
- `ui` (componentes + ViewModels) importa `shared` (incl. design-system) + camadas da mesma feature
  + o `public-api` de qualquer outro módulo.
- `public-api` re-exporta as camadas da própria feature; é o **único** ponto pelo qual outro
  módulo pode importar este.
- **Um módulo NUNCA importa internals de outro módulo** — cruzamento só via `public-api`,
  `shared`, `external` ou server function.

Violar a matriz de import é erro de lint, não convenção opcional.

**Rationale:** slices verticais com `public-api` mantêm cada módulo extraível e testável de
forma isolada, e impedem que o acoplamento entre módulos apodreça silenciosamente — o mesmo
contrato que o backend `core-api` já adota.

### IV. Make Illegal States Unrepresentable

O domínio usa **branded types + smart constructors** (`type CPF = Brand<string,'CPF'>`;
`CPF = (raw) => Result<CPF, CPFError>`) — estado inválido é irrepresentável. Toda
estrutura é imutável (`Readonly<>`, `readonly T[]`, `as const`); mudança de estado é
cópia por spread, nunca mutação. Commands, eventos e estados são **discriminated
unions** com campo discriminante, tratados por `switch` **exaustivo** com guarda
`const _: never = x` no `default`. `as` só é permitido dentro do smart constructor (ou
com comentário justificando); `any` é proibido — use `unknown` + narrowing.

**Rationale:** o compilador vira a primeira linha de defesa; bugs de estado inválido
deixam de compilar em vez de chegar em produção.

### V. Server-State Is Not UI-State

Estado remoto (dados do backend) vive **somente** no cache do TanStack Query. Estado
de UI efêmero (wizard, formulário, toggles) vive em `useReducer`/state machine tagged.
**Nunca** misturar os dois: não copiar dados de Query para `useState`, não guardar
estado de UI no cache de Query. A cadeia de erro server→ui é fixa:
`resultFetch → HttpError → mapToServerResponse → queryFn lança QueryError(mapToAppError) → AppError → switch na UI`.
A UI **nunca** inspeciona status HTTP — só `AppError` semântico.

**Rationale:** separar as duas naturezas de estado elimina sincronização manual,
cache stale e a maior fonte de bugs de re-render.

### VI. Validation at the Boundary

A validação com **Zod 4** acontece na fronteira, em dois pontos: no **input** da
server function E no **response do backend** (`*.schema.ts`). Para dentro da fronteira,
tudo é total e tipado via tipos do domínio (branded + smart constructors). Zod é
permitido apenas em `infrastructure` e `server` — nunca no `domain` nem na `ui`.

**Rationale:** a borda é o único lugar onde dados não confiáveis entram; validar ali
e converter para tipos do domínio mantém o núcleo livre de checagens defensivas.

### VII. Strict TypeScript & Healthy 6→7 Migration

TypeScript em modo estrito máximo. Proibido sintaxe não-apagável visando a migração
6→7 (`erasableSyntaxOnly`): **sem `enum`**, **sem `namespace`**, **sem parameter
properties**, **sem `import =`** — use union de literais + objeto `as const` e módulos
ESM. `import type` / `inline-type-imports` obrigatório (`verbatimModuleSyntax`).
Proibidos: `any`, `class` (exceto `QueryError` — ver Princípio II) e `this`. Extensões
`.ts`/`.tsx` explícitas em imports relativos quando exigido pelo resolver.

**Rationale:** alinhar com o compilador nativo do TS 7 desde já evita uma migração
dolorosa e mantém o output previsível (strip-types).

### VIII. Minimal Dependencies

Preferir APIs nativas a bibliotecas: `Intl`/`Temporal`, `crypto.randomUUID`,
`EventTarget`, `AbortController`, `fetch`. Adicionar uma dependência exige
justificativa explícita (custo, manutenção, superfície de ataque) — não é o default.

**Rationale:** cada dependência é superfície de ataque e dívida de manutenção; o nativo
é gratuito, auditado e estável.

### IX. pnpm Only

O gerenciador de pacotes é **pnpm**. `npm` e `yarn` são **proibidos** (há hook que
bloqueia comandos `npm`/`yarn`). Mudanças de dependência atualizam `pnpm-lock.yaml`.

**Rationale:** um único gerenciador garante lockfile determinístico e instalação
reproduzível em dev, CI e Docker.

### X. Spec-Driven Development

Toda feature segue o fluxo spec-kit: **constitution → specify → (clarify) → plan →
(checklist) → tasks → (analyze) → implement**. Código de produção não nasce antes de
uma spec versionada em `specs/`. Templates em `.specify/`; este documento é o piso de
conformidade verificado no "Constitution Check" do plano.

**Rationale:** especificar antes de implementar torna intenção, escopo e critérios de
aceite explícitos e revisáveis — e versiona a decisão, não só o código.

### XI. Dumb Views, Orchestrating ViewModels (MVVM)

A camada `ui` segue **MVVM**: as **views/pages são burras** (presentational, dumb) — recebem
dados e callbacks por props, renderizam JSX e encaminham eventos; nada além disso. **Toda** a
orquestração da tela e **todos** os estados vivem na **ViewModel** (presenter hook
`*.presenter.hook.ts`, ou store), que é o único lugar que liga server-state (TanStack Query) e
UI-state (`useReducer`/state machine) e expõe à view um modelo já pronto para render. É
**proibido** em arquivos de view/page (`*.component.tsx`, rotas): `useQuery`/`useMutation`,
importar `adapters`/server functions, ou carregar estado de negócio. `useState` em componente,
quando existir, é só toggle visual local e trivial — qualquer estado não-trivial sobe para a
ViewModel. Pages compõem ViewModels + views burras; não contêm lógica.

**Rationale:** separar View (render) de ViewModel (orquestração) torna a tela testável sem DOM,
elimina god-components e dá um único ponto de verdade para o estado de cada tela.

## Technology Constraints & Stack

Stack mandatória (substituições exigem amenda desta constituição):

- **Meta-framework:** Vite 8 + `@tanstack/react-start` (SSR + server functions).
- **Router:** `@tanstack/react-router` (file-based em `src/routes/`).
- **Server-state:** TanStack Query (cache client-only). **Forms:** TanStack Form + Zod.
- **Validação:** Zod 4 (só na borda). **UI:** React 19. **Tipos:** TypeScript estrito máximo.
- **Testes:** runner híbrido — `node:test` para puro (domain/lib/server), Vitest para DOM,
  Playwright + MSW para integração. ⚠ o alias `~/` resolve só no bundler: código testado
  por `node:test` usa imports relativos.

Estrutura de pastas (normativa — vertical-modular espelhando o `core-api`, ADR-0006):

```
src/
├── modules/<módulo>/        # vertical slice isolado (contracts, auth, ...)
│   ├── domain/              # PURO: VOs branded, tipos, regras, errors, repository.port
│   ├── application/         # use cases puros (factory functions) + ports (type)
│   │   ├── ports/
│   │   └── use-cases/
│   ├── adapters/            # I/O do módulo (única camada que toca infra)
│   │   ├── server/          # *.server-fn.ts (endpoints BFF)
│   │   ├── http/            # client do core-api
│   │   ├── schema/          # *.schema.ts (Zod do response do backend)
│   │   └── queries/         # *.queries.ts (queryKey factory + queryFn)
│   ├── ui/                  # *.component.tsx (views burras) + *.presenter.hook.ts (ViewModel)
│   └── public-api/          # index.ts — ÚNICO ponto de import externo ao módulo
├── shared/                  # cross-cutting PURO (sem framework/I/O)
│   ├── primitives/          # result.ts, brand.ts, immutable.ts
│   ├── kernel/              # VOs de domínio compartilhados (money, cpf, period, ...)
│   ├── http/                # http-error / app-error / query-error / map-to-app-error (tipos)
│   ├── ports/               # contratos cross-cutting (clock, session-store)
│   ├── ui/                  # design system
│   └── utils/               # id, date, string
├── external/                # EXTERNAL ADAPTERS (I/O real + segredos)
│   ├── core-api/            # result-fetch (baseURL), map-to-server-response
│   ├── session/             # session store + cookie HttpOnly
│   └── config/              # env.config
└── routes/ + router.tsx     # TanStack file-based router (composition root / framework glue)
```

> Divergência consciente do `handbook/arquiteture.md` (que descreve `features/lib/server`):
> o v2 adota a nomenclatura e a verticalidade do `core-api` (`modules/shared/external` +
> `public-api`). O handbook deve registrar essa divergência.

Segurança obrigatória: cookie `__Host-session` HttpOnly/SameSite=Strict/Secure; CSRF via
SameSite + validação `Sec-Fetch-Site`/`Origin`; CSP com nonce, HSTS, `nosniff`, frame-deny
via global middleware. 401 → signOut automático + limpeza de cache.

## Development Workflow & Quality Gates

- **Convenções de naming:** postfix por tipo de arquivo (`.value-object.ts`, `.aggregate.ts`,
  `.errors.ts`, `.repository.port.ts`, `.use-case.ts`, `.server-fn.ts`, `.client.ts`,
  `.schema.ts`, `.queries.ts`, `.component.tsx`, `.presenter.hook.ts`). `tests/` espelha `src/`.
- **Idioma:** código em EN; strings de UI via i18n; erros internos = literais kebab-case EN.
- **Quality gate (obrigatório antes de concluir qualquer tarefa de código):**
  `pnpm lint` (inclui boundaries) · `pnpm typecheck` (`tsc --noEmit`) · testes verdes ·
  `pnpm build` passa. Lint e typecheck são bloqueantes, não advisory.
- **Automações (hooks):** comandos `npm`/`yarn` são bloqueados; edição de `*.ts`/`*.tsx`
  dispara `eslint --fix` automático.
- **Backend `core-api`:** submódulo interno; dúvidas de contrato são delegadas ao agente
  `core-api-consultant`. Consultores read-only especialistas vivem em `.claude/agents/`.

## Governance

Esta constituição **supersede** outras práticas e convenções do projeto. Em conflito
entre este documento, `CLAUDE.md` e `handbook/arquiteture.md`, prevalece o mais restritivo;
divergências reais devem ser resolvidas por amenda aqui.

**Procedimento de amenda:** mudança proposta via PR alterando este arquivo, com Sync
Impact Report atualizado e propagação aos templates dependentes em `.specify/templates/`.

**Política de versionamento (semver da constituição):** MAJOR = remoção/redefinição
incompatível de princípio ou governança; MINOR = novo princípio/seção ou expansão
material de guidance; PATCH = clarificações e ajustes não-semânticos.

**Conformidade:** o "Constitution Check" do `/speckit-plan` verifica aderência antes do
design. Os gates de lint (boundaries, no-any, erasableSyntaxOnly) e typecheck enforçam
os princípios automaticamente em cada mudança. Complexidade fora do padrão deve ser
justificada na spec/plan.

**Version**: 1.1.0 | **Ratified**: 2026-05-29 | **Last Amended**: 2026-05-29
