# Implementation Plan: Política de senha alinhada ao #32 (mínimo 12)

**Branch**: `feat/contracts-detail-and-partners` (spec dir `021-password-policy`) | **Date**: 2026-06-10 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/021-password-policy/spec.md`

## Summary

O front valida senha com mínimo **8 fixo** e teto **15** espúrio; o backend (#32) exige **12** e publica a regra em `GET /api/v2/auth/password-policy` → `{ minLength: 12, maxLength: 128 }`. Auditoria do código real confirmou que o **único** fluxo do front que coleta senha nova é **Trocar Senha (Minha Conta)** — cadastro de usuário é por convite (sem senha) e recuperação por link não existe. Abordagem (frontend-only, aditiva): criar uma **leitura da política como infra reutilizável no módulo `auth`** (server fn pública + queryOptions, exposta via `public-api`), tornar o **validador puro parametrizável** (limites por argumento, default seguro 12/128, corrige o teto 15), threar `minLength/maxLength` até a **modal de Trocar Senha** (via binding → page → props, mantendo a view burra), alinhar o **schema de borda** (`newPassword.min(8) → min(12)`) e mapear o **422 `password-too-short`** para uma tag i18n amigável (o `password-weak` já existe). As regras de complexidade pré-existentes da modal (maiúscula/dígito/símbolo) **permanecem** (stricter/safe; remover seria regressão fora de escopo).

## Technical Context

**Language/Version**: TypeScript strict (erasableSyntaxOnly), React 19, TanStack Start (Vite+Nitro), TanStack Query, Zod 4, vanilla-extract.

**Storage**: N/A no front (server-state via TanStack Query; backend persiste).

**Testing**: `node:test` (puro, `*.test.ts`, imports `#`) p/ o validador parametrizável; Vitest+jsdom (`*.spec.tsx`) p/ a modal (mostra min dinâmico, bloqueia <min) se necessário.

**Project Type**: Web app (front + BFF). Server function = única fronteira client↔server.

**Constraints**: invariantes v2 (lint): `Result<T,E>` sem throw fora da borda; sem `any`; imutabilidade; só-tokens; strings de UI = i18n; views burras (page/component sem `useQuery`/`useMutation`); boundaries por `public-api`; Zod na borda (response do core-api); naming por postfix. **Sem tocar core-api.**

**Scale/Scope**: 1 fluxo (Trocar Senha). ~5 arquivos novos (auth: leitura da política) + ~6 editados (users: validador, schema, modal, erros, i18n). Aditivo.

## Constitution Check

| Princípio | Status | Como cumpre |
|---|---|---|
| II — Erros como valor | ✅ | Query fn devolve `Result`/`{ok,error}`; sem throw fora da borda. |
| III — Server fn única fronteira | ✅ | Leitura da política via `*.query.fn.ts` (auth); client toca server só pela porta. |
| IV — Estados ilegais irrepresentáveis | ✅ | `PasswordPolicy` tipado; `UsersError` += `password-too-short` (union + switch exaustivo no error-tag). |
| V — Cadeia de erro → i18n | ✅ | `password-too-short`/`password-weak` → tags amigáveis; UI nunca olha status HTTP. |
| VI — Zod na borda | ✅ | Response de `/password-policy` validado por Zod; `newPassword` min 12 no schema de borda. |
| VII — Imutabilidade | ✅ | Tipos `Readonly<>`; validador puro sem mutação. |
| IX — Boundaries / public-api | ✅ | `passwordPolicyQueryOptions` + tipo exposto via `auth/public-api`; users consome por lá. |
| X — Só-tokens | ✅ | Sem cor/px crus; reuso do CSS existente da modal. |
| XI — Views burras / server≠UI state | ✅ | `useQuery` da política no **binding** (não na page/component); a modal recebe `minLength/maxLength` por props; validador puro. |
| i18n | ✅ | Mensagens novas no catálogo; rótulo da regra de tamanho reflete o min dinâmico. |

**Resultado**: PASS. Sem Complexity Tracking.

## Project Structure

```text
specs/021-password-policy/
├── plan.md · research.md · data-model.md · quickstart.md
├── contracts/password-policy.md
└── checklists/requirements.md
```

### Arquivos a tocar

```text
NOVOS — leitura da política (módulo auth; o endpoint é /api/v2/auth/password-policy)
src/modules/auth/server/adapters/server-fns/get-password-policy.query.fn.ts   # server fn pública (sem auth): fetch + Zod do response {minLength,maxLength}
src/modules/auth/server/adapters/core-api/<schema>                            # Zod PasswordPolicyResponseSchema (na borda) [pode morar junto da fn]
src/modules/auth/client/data/gateways/password-policy.gateway.ts             # chama a query fn (porta client→server)
src/modules/auth/client/data/model/auth.model.ts                             # + type PasswordPolicy (e schema client se necessário)
src/modules/auth/client/<password-policy>/password-policy.query.ts           # passwordPolicyQueryOptions (queryKey ['auth','password-policy'], staleTime alto)
src/modules/auth/public-api/index.ts                                         # exporta passwordPolicyQueryOptions + PasswordPolicy

EDITADOS — consumo (módulo users) + i18n
src/modules/users/client/domain/password-policy.ts          # evaluatePassword(pw, limits={minLength:12,maxLength:128}); corrige teto; mantém complexidade
src/modules/users/client/my-account/my-account.binding.ts   # useQuery(passwordPolicyQueryOptions) → {minLength,maxLength} c/ fallback {12,128}; expõe no binding
src/modules/users/client/my-account/page/my-account.page.tsx# passa minLength/maxLength p/ a modal
src/modules/users/client/my-account/components/reset-password-modal.component.tsx # recebe limites por props; usa no validador + rótulo da regra de tamanho
src/modules/users/server/adapters/users.io-schemas.ts       # ChangePasswordInputSchema.newPassword: min(8) → min(12)
src/modules/users/server/domain/errors/users.errors.ts      # UsersError += 'password-too-short'
src/modules/users/client/data/repository/users-error.ts     # idem (cópia client)
src/modules/users/server/adapters/core-api/core-api-users.ts# SLUG_TO_ERROR += 'password-too-short' → 'password-too-short'
src/modules/users/client/data/helpers/users-error-tag.ts    # + case 'password-too-short' → tag
src/shared/i18n/catalog.pt-BR.ts                            # tag users.error.password-too-short + rótulo dinâmico da regra de tamanho
```

**Structure Decision**: a leitura da política vive no **auth** (dono do endpoint `/api/v2/auth/...`), exposta por `public-api` → vira infra reutilizável (FR-007) para os futuros fluxos de cadastro-com-senha/recuperação. O consumo e a correção de tamanho vivem no **users** (dono da Trocar Senha).

## Complexity Tracking

> Sem violações. Nada a justificar.

## Migrations Drizzle (core-api)

- [x] **nenhuma** — frontend-only; `GET /password-policy` e `change-password` já entregues no #32.

## Contrato HTTP (consumo — core-api NÃO muda)

- `GET /api/v2/auth/password-policy` → 200 `{ minLength: number, maxLength: number }` (público, sem auth). Validado por Zod na borda.
- `POST /api/v2/auth/change-password` (já consumido) — recusa por tamanho → **422 `password-too-short`**; senha comum → **422 `password-too-common`** (já mapeado p/ `password-weak`).

## Estimativa de Pipeline (W0 size)

- **Tamanho**: [x] **S/M** — leitura simples (1 número) + parametrização do validador + mapeamento de erro. Sem agregado/migration.
- **Plano de testes W0 (RED)**:
  - `node:test` — `evaluatePassword(pw, limits)`: rejeita `length < minLength`, aceita `>= minLength`, respeita `maxLength`; default 12/128; complexidade preservada.
  - `node:test` — mapeamento `password-too-short` → tag (`usersErrorTag`).
  - (opcional) Vitest — modal exibe o min dinâmico e bloqueia submit < min.
