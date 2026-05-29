# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é

Frontend **v2** do ERP Bem Comum — migração para **TanStack Start** (front + BFF no mesmo processo). O browser só fala com o BFF (server functions), que orquestra o backend `core-api` e nunca expõe tokens/segredos. `src/` ainda está sendo construído; siga a arquitetura abaixo ao criar código.

## Stack

- **Meta-framework:** Vite 8 + `@tanstack/react-start` (SSR + server functions) · **Router:** `@tanstack/react-router` (file-based em `src/routes/`)
- **Server-state:** TanStack Query · **Validação:** Zod 4 (só na borda) · **UI:** React 19
- **TypeScript** estrito máximo · **pnpm** (nunca npm/yarn) · **Backend:** `core-api` (submódulo, interno)

## Comandos

```bash
pnpm dev            # dev server (http://localhost:3000)
pnpm build          # build de produção (.output/)
pnpm lint           # eslint .   (lint:fix p/ autofix)
pnpm typecheck      # tsc --noEmit
docker compose up -d # stack local: mysql + core-api + web + caddy (https://app.localhost)
```

## Arquitetura (camadas — enforçada por lint)

Fonte normativa: **`handbook/arquiteture.md`**. Estrutura por feature:

```
src/features/<feature>/{domain,application,infrastructure,ui}
src/lib/   src/server/ (BFF)   src/components/ui/
```

- **Erros são valores** (`Result<T,E>`), `throw` só na borda de infra. **Branded types + smart constructors** no domínio.
- **Imports entre camadas** seguem a matriz em `handbook/reference/_LINT-SETUP.md` (`eslint-plugin-boundaries`): `domain` puro; feature não importa outra feature (só via `lib`); Zod só em `infrastructure`/`server`.
- **Server-state (Query) ≠ UI-state (reducer).** Cadeia de erro: `resultFetch → HttpError → mapToServerResponse → QueryError(AppError) → UI`.
- **TS 6→7 saudável:** sem `enum`/`namespace`/parameter-properties (`erasableSyntaxOnly`); `import type` (`verbatimModuleSyntax`).

## Backend `core-api`

Submódulo em `core-api/` (branch `dev`). Auth: `POST /api/v2/auth/login {email,password}` → `{accessToken,refreshToken,userId}` (JWT ES256). Docs consolidadas em `handbook/core-api/`. **Para qualquer dúvida do backend, delegue ao agente `core-api-consultant`.**

## Stack local (Docker)

`docker-compose.yml` (+ `Caddyfile`, `web.Dockerfile`): `mysql` (infra) → `core-api` (back, interno) → `web` (front+BFF) → `caddy` (https, único exposto). Usuário de dev semeado: `admin@bemcomum.dev` / `DevPassw0rd!2024`.

## Processo: Spec-Driven Development (spec-kit)

Respeite o fluxo do spec-kit (skills `/speckit-*`): **constitution → specify → (clarify) → plan → (checklist) → tasks → (analyze) → implement**. Templates em `.specify/`, princípios em `.specify/memory/constitution.md`.

## Agentes especialistas (delegue proativamente)

Em `.claude/agents/` — consultores read-only, cada um com fonte de verdade em `handbook/reference/<x>/`:
`react-expert`, `typescript-expert`, `zod-expert`, `tanstack-start-expert`, `tanstack-router-expert`, `tanstack-query-expert`, `vite-expert`, `nodejs-expert`, `docker-expert`, `pnpm-expert`, `claude-code-expert`, e **`core-api-consultant`** (backend). Eles respondem citando o arquivo-fonte.

## Automações (hooks)

- Bash com `npm`/`yarn` é **bloqueado** (use pnpm) — `.claude/hooks/block-non-pnpm.sh`.
- Edição de `*.ts/*.tsx` dispara `eslint --fix` automático — `.claude/hooks/eslint-fix.sh`.

<!-- SPECKIT START -->
**Spec ativa:** `specs/001-v2-foundation/` — Fundação Técnica do v2.
Plano de implementação: [`specs/001-v2-foundation/plan.md`](specs/001-v2-foundation/plan.md).
Constituição (normativa): [`.specify/memory/constitution.md`](.specify/memory/constitution.md) (v1.1.0 —
arquitetura vertical-modular `modules/shared/external` + `public-api`; MVVM com views burras).
<!-- SPECKIT END -->
