# Módulo `auth` — Anatomia da feature-modelo

> **Esta é a feature de referência do frontend v2.** Leia-a antes de criar qualquer módulo novo:
> ela materializa a constituição (v1.2.1) e os ADRs [0001](../../../handbook/adr/0001-vertical-modular-architecture.md),
> [0002](../../../handbook/adr/0002-errors-as-values.md), [0004](../../../handbook/adr/0004-client-server-split-mvvm-ddd.md)
> e [0005](../../../handbook/adr/0005-auth-session-refresh-decisions.md). Cada arquivo aqui tem comentário
> de topo explicando **o porquê** — copie esse hábito.

## O que a Auth faz

Slice BFF completo: **login · logout · me · refresh silencioso · sessão · guard de rota**. O browser
**nunca** vê token: o cookie carrega só um `sessionId` opaco; os tokens (access + refresh) vivem no
`SessionStore` server-side. CRUD de usuários **não** é daqui (será um módulo Zero Trust futuro).

## A fronteira de ouro: `server/` (DDD) × `client/` (MVVM)

A divisão mais importante do módulo. **A server function é a única fronteira** entre os dois lados —
o `client/` toca o `server/` exclusivamente **chamando** server functions (RPC); jamais importa
`server/domain` ou `server/application` (o lint barra).

Cada camada é sub-agrupada por concern (as subpastas são organização visual — o **elemento de
boundary continua sendo a pasta da camada**: `client/data`, `server/adapters`, etc. Arquivos aninhados
herdam o tipo da camada). Imports cross-sublayer dentro do módulo usam `#modules/auth/…` (estáveis a
moves); imports entre irmãos da mesma subpasta usam `./`.

```
modules/auth/
├── server/                              # BFF · server-side · DDD · onde o token vive
│   ├── domain/                          # PURO (sem I/O): VOs, tipos, erros como valor
│   │   ├── value-objects/email.value-object.ts  # smart constructor: Email branded
│   │   ├── errors/auth.errors.ts        #   união de string literais (invalid-credentials | …)
│   │   └── session/                     #   o agregado Session e sua fábrica
│   │       ├── session.types.ts         #     Session, SessionId, AuthTokens, AuthUser (Readonly)
│   │       └── build-session.ts         #     regra pura: tokens + userId → Session
│   ├── application/                     # casos de uso (Result, sem throw)
│   │   ├── commands/                    #   mutações de estado
│   │   │   ├── login.use-case.ts        #     valida → core-api login → cria sessão
│   │   │   ├── logout.use-case.ts       #     revoga no backend (best-effort) + apaga sessão
│   │   │   └── refresh-session.use-case.ts  # SINGLE-FLIGHT (ADR-0005 §2)
│   │   └── queries/get-me.use-case.ts   #   leitura: sessão → userId
│   └── adapters/                        # borda: traduz mundo externo ↔ domínio
│       ├── server-fns/*.server-fn.ts    #   ←★ A FRONTEIRA: RPC login/logout/me
│       ├── core-api/                    #   tudo que fala com o core-api
│       │   ├── core-api-auth.ts         #     chama /api/v2/auth/* (HTTP) → Result
│       │   ├── auth.schema.ts           #     Zod dos responses (validação na borda)
│       │   └── decode-access-exp.ts     #     lê exp do JWT (decode-only, ADR-0005 §3)
│       ├── session.guard.ts             #   cookie → sessão → token (+ refresh silencioso)
│       └── auth.composition.ts          #   wiring lazy das deps (env só em runtime)
│
├── client/                              # FRONT · client-side · MVVM · só consome o BFF
│   ├── data/                            # "Model": padroniza o que o BFF já fez + portas
│   │   ├── model/auth.model.ts          #   Zod do retorno do BFF (CurrentUser…)
│   │   ├── repository/                  #   a PORTA → server fn
│   │   │   ├── auth.repository.ts        #     createAuthRepository (contrato)
│   │   │   └── auth.repository.instance.ts  #  instância default
│   │   ├── gateways/*.gateway.ts        #   funções finas que chamam a server fn
│   │   ├── events/{auth.events,auth.bus}.ts  # Event Bus: UsuarioAutenticado | SessaoEncerrada
│   │   └── helpers/{safe-redirect,auth-error-tag}.ts  # anti open-redirect (ADR-0005 §5) + tags
│   ├── usecase/                         # intenção de UI (opcional): emite eventos no bus
│   │   ├── login/{login.use-case,login.composition}.ts      # login → emit(UsuarioAutenticado)
│   │   └── logout/{logout.use-case,logout.composition}.ts   # logout → emit(SessaoEncerrada)
│   ├── view-model/                      # MVVM: orquestra a tela (TanStack Query + estado)
│   │   ├── login/                       #   {use-login.view-model, login-view (derivação pura)}
│   │   └── current-user/                #   {use-current-user.view-model, current-user-view (pura)}
│   └── ui/login/                        # views BURRAS (Princípio XI)
│       ├── login.page.tsx               #   template; zero fetch/lógica
│       ├── login-view.component.tsx     #   apresentação pura (props → JSX)
│       └── login-form.controller.ts     #   estado transiente do form (exceção ao "burras")
│
└── public-api/index.ts                  # ★ ÚNICO ponto de import por fora do módulo (ADR-0001)
```

## Fluxos (o caminho dos dados)

**Login** — `login.page` (burra) → `use-login.view-model` (orquestra) → `client/usecase/login` →
`auth.repository` (porta) → `login.server-fn` **[fronteira]** → `login.use-case` (server) →
`core-api-auth` → core-api. Sucesso: BFF cria sessão + seta cookie `__Host-session`; o use-case do client
emite `UsuarioAutenticado` no bus → `use-current-user` invalida o `me`.

**Refresh (silencioso)** — qualquer requisição passa pelo `session.guard`: se o access expirou, ele dispara
`refresh-session.use-case` **single-flight** (uma renovação compartilhada entre chamadas concorrentes —
ADR-0005 §2). Reuse real → signOut. **Nada disso chega ao browser.**

**Guard de rota** — `routes/_authenticated/route.tsx` (`beforeLoad`) chama `getCurrentUserFn` via
public-api; sem sessão → redireciona a `/login?redirect=<destino>`. `routes/_authenticated/dashboard.tsx`
é a rota protegida de exemplo. 401 do backend → `auth:expired` → o router manda ao login preservando o destino.

**Logout** — `logout.server-fn` revoga o refresh no core-api (best-effort) **e sempre** apaga a sessão
local + limpa o cookie; o client emite `SessaoEncerrada`.

## Regras que esta feature demonstra (e o lint cobra)

1. **Token nunca no browser** (Princípio I / ADR-0005). Verificável: o bundle do client não contém
   `accessToken`/`refreshToken`/`Bearer`/segredo (SC-002).
2. **Erros são valores** (`Result<T,E>`, ADR-0002): `throw` só na borda de infra, convertido na hora.
3. **`client/` não importa `server/domain|application`** — só chama server fn. Views burras não importam
   `data`/`usecase`/`repository` (orquestração é do view-model).
4. **Domínio puro**: branded types + smart constructors (`Email`), estado inválido irrepresentável.
5. **Strings = tags i18n** (`shared/i18n`), sem literais; erro de credencial genérico (anti-enumeração).
6. **TDD**: toda unidade pura tem teste antes da impl (`tests/modules/auth/**`); a `/login` tem teste DOM.

## Como rodar / validar

```bash
pnpm test         # unidades puras (node:test) — domain, application, view-model, use-cases
pnpm test:dom     # /login (Vitest + jsdom)
pnpm typecheck && pnpm lint && pnpm build
```

E2E manual (stack local): `docker compose up -d` → `https://app.localhost` → login com
`admin@bemcomum.dev` / `DevPassw0rd!2024`. Confira no DevTools: cookie `__Host-session` é opaco e
**não há token** em nenhum response/JS. Ver `specs/002-auth/quickstart.md`.
