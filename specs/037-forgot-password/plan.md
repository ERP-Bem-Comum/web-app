# Plan — Recuperar Senha (037-forgot-password)

## Abordagem

Fatia vertical no módulo `auth`, espelhando LOGIN. Nova feature-client paralela
`client/forgot-password/` (viewModel + bind + page + components/forms), um novo método no client
HTTP do auth, uma server fn pública e uma rota pública. Reaproveita o layout do login (só-tokens).

## Constitution Check (§I–§XII)

| §                               | Como cumprimos                                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| I Vertical-modular              | tudo em `src/modules/auth`; cross-módulo só via public-api (rota consome a public-api)                                                           |
| II Erros como valores           | `forgotPassword` retorna `Result<void, AuthError>`; server fn devolve `{ ok }` valor                                                             |
| III Server fn = única fronteira | `request-password-reset.server-fn.ts` compõe e chama o core-api; client não compõe                                                               |
| IV Estados ilegais              | resultado da fn = união discriminada `{ ok:true }                                                                                                | { ok:false; error }` |
| V Cadeia de erro                | UI não olha status HTTP; erro trafega como valor até o binding                                                                                   |
| VI TS estrito/apagável          | sem any/enum; tipos derivados do contrato da fn                                                                                                  |
| VII Imutabilidade               | `Readonly<>` nos tipos e props                                                                                                                   |
| VIII Deps mínimas               | reusa resultFetch/Zod/Query/Router já instalados; nenhuma dep nova                                                                               |
| IX Segurança                    | rota pública sem sessão; Zod valida email na borda; CSRF de origem no handler; token nunca no browser; **anti-enumeração: sempre 202 → sucesso** |
| X DS só-tokens                  | `*.css.ts` com `vars.*`, sem hex/px cru; i18n para texto                                                                                         |
| XI MVVM                         | view burra (form component + modal), view-model puro, binding React isolado                                                                      |
| XII Eventos                     | N/A (sem efeito de domínio no client; sucesso é só UI)                                                                                           |

## Arquivos a criar

### Server (BFF)

- `server/adapters/core-api/core-api-auth.ts` — **editar**: add `forgotPassword({ email }) => Result<void, AuthError>` (202 → ok).
- `server/adapters/auth.composition.ts` — **editar**: passthrough `forgotPassword`.
- `server/adapters/server-fns/request-password-reset.server-fn.ts` — nova server fn (Zod {email}, CSRF, chama composition; **sempre ok no 202**, `AuthError` só em rede/5xx).

### Client (MVVM)

- `client/data/model/auth.model.ts` — **editar**: `ForgotPasswordInputSchema` ({ email }).
- `client/data/repository/auth.repository.ts` — **editar**: `requestPasswordReset` na porta.
- `client/data/repository/auth.repository.instance.ts` — **editar**: injeta a nova fn.
- `client/forgot-password/bind/forgot-password.mutation.ts` — mutation pura.
- `client/forgot-password/viewModel/forgot-password.view-model.ts` — derivação pura (errorTag).
- `client/forgot-password/bind/forgot-password.binding.ts` — binding React (useMutation + navegação).
- `client/forgot-password/components/forms/forgot-password-form.controller.ts` — estado transiente + Zod.
- `client/forgot-password/components/forms/forgot-password-form.component.tsx` — view burra.
- `client/forgot-password/components/forms/forgot-password-form.css.ts` — só-tokens.
- `client/forgot-password/components/success-modal.component.tsx` (+ `.css.ts`) — modal <dialog> nativo.
- `client/forgot-password/page/forgot-password.page.tsx` (+ `.css.ts`) — reusa shell do login.

### Rota + i18n

- `src/routes/recuperar-senha.tsx` — rota pública espelhando `/login`. Importa a page DIRETO do módulo
  (como `login.tsx` faz), NÃO via public-api: o barrel é carregado por testes node:test (`.ts`) e não pode
  reexportar `.tsx` (o loader `--experimental-strip-types` não resolve `.tsx`). Só `getCurrentUserFn` (guard)
  vem do public-api.
- `src/shared/i18n/catalog.pt-BR.ts` — chaves `auth.forgot.*`.
- `src/modules/auth/client/login/components/forms/login-form.component.tsx` — liga o link ao `/recuperar-senha` (via `Link` do router, passado por prop mantendo a view burra).

## Testes

- `tests/modules/auth/server/adapters/core-api-auth-client.test.ts` — **editar**: forgotPassword 202 → ok; rede → connectivity; 5xx → server.
- `tests/modules/auth/client/forgot-password/forgot-password-view-model.test.ts` — errorTag puro.
- `tests/modules/auth/client/forgot-password/forgot-password-form.spec.tsx` — DOM: submit válido chama execute; anti-enumeração (sucesso sempre no ok); modal aparece; cancelar/entendi navegam.

## Gates

`pnpm typecheck`, `pnpm lint`, `pnpm verify` (typecheck+lint+test node), `pnpm test:dom`.
Regressão zero.
