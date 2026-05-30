# Implementation Plan: Auth Security Hardening

**Branch**: `feat/v2-auth` (spec dir `003-auth-security-hardening`) | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-auth-security-hardening/spec.md`

## Summary

Endurecer a autenticação do v2 (front+BFF) contra OWASP WSTG/ASVS, **sem** OIDC/MFA (não existem no stack). Entregar (a) **controles defensivos** implementados no v2 e (b) um **runbook** de verificação manual. Gaps que pertencem ao backend ficam em [`backend-recommendations.md`](./backend-recommendations.md) (BE-REC-001..005), não implementados aqui.

**Abordagem técnica** (resolvida na pesquisa):
- **Security headers** em duas camadas: estáticos no **Caddy** (borda) + dinâmicos/transversais via **global request middleware** do TanStack Start (`src/start.ts` com `createStart({ requestMiddleware })`), que carimba toda resposta (SSR + server fn) usando `setResponseHeader(s)`.
- **CSP** estrita (`default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, **sem `unsafe-inline` em `script-src`**). ⚠️ **Ajuste forçado pela versão:** `nonce` em `<Scripts/>` **não é suportado** no Start 1.168 → usamos `script-src 'self'` (scripts de hidratação são same-origin); nonce nativo (`ssr.nonce`) fica reservado a `<style>` (CSS inlining), validado como item de pesquisa.
- **Sessão anti-fixation**: o login **já** gera novo `sessionId` (`genId()`) e o v2 **não tem sessão anônima** (cookie só nasce no login) → fixation já mitigado; vira **teste + verificação** + reforço explícito (descartar id anterior se existir).
- **Logout/expiração/cookie flags**: já implementados (logout apaga store + limpa cookie; store com TTL e auto-delete; cookie `__Host-` com flags) → **auditar + testar** contra regressão.
- **Guard completo**: `_authenticated/` + server fns já validam sessão → adicionar **teste de cobertura** que falha se rota autenticada nascer sem guard.
- **CSRF/origem**: `csrf-origin.ts` já aplicado no login → estender a **todas** as mutações e testar.
- **Rate-limit no BFF (FR-015)**: **adiado** (decisão do Tech Lead) → permanece só como BE-REC-001.

## Technical Context

**Language/Version**: TypeScript estrito (TS 6→7 healthy; `erasableSyntaxOnly`, `verbatimModuleSyntax`)

**Primary Dependencies**: `@tanstack/react-start` ^1.168.16, `@tanstack/react-router` ^1.170.9, `@tanstack/react-query` ^5.100.14, Zod 4, React 19. Nativos: Web Crypto (`crypto.getRandomValues`), `EventTarget`.

**Storage**: `SessionStore` server-side (in-memory, interface trocável) — sem novo storage nesta feature.

**Testing**: híbrido — `node:test` (`--experimental-strip-types`) para puro (middleware de headers, helpers, guard logic); **Vitest/jsdom** para DOM (`test:dom`). UI → **perguntar tipo de teste** (unit/BDD).

**Target Platform**: SSR Node (preset node-server/Nitro) atrás do Caddy (TLS na borda).

**Project Type**: Web app único (front + BFF, TanStack Start).

**Performance Goals**: headers não devem adicionar latência perceptível; CSP não pode quebrar hidratação/estilos.

**Constraints**: `throw` só na borda; `Result<T,E>`; boundaries de lint (client ⊥ server/domain); nenhum literal de UI (i18n tags); tokens nunca no browser.

**Scale/Scope**: ~7 arquivos novos/alterados no v2 (`src/start.ts`, módulo de security-headers em `shared/http`, ajustes em `__root.tsx`/`Caddyfile`, testes) + runbook. Sem mudança de backend.

## Constitution Check

*GATE: Must pass before Phase 0. Re-checked after Phase 1.*

| Princípio | Aderência | Nota |
|-----------|:---------:|------|
| I. BFF-Orchestrated Boundary | ✅ | Reforça a fronteira (tokens fora do browser, headers no BFF). |
| II. Errors Are Values | ✅ | Headers/middleware são efeitos de borda; lógica pura retorna valores. `throw` só onde o framework exige (rejeição de origem na server fn, já existente). |
| III. Client×Server Modular | ✅ | Headers vivem em `shared/http` + `src/start.ts` (composition root). Sem cruzar client↔server/domain. |
| IV. Illegal States Unrepresentable | ✅ | Conjunto de headers como `Readonly` const; CSP como dado tipado. |
| V. Server-State ≠ UI-State | ✅ | Sem novo estado de UI; não afeta Query/reducer. |
| VI. Validation at Boundary | ✅ | Sem novo input externo (headers são saída). Origem já validada por Zod/`csrf-origin`. |
| VII. Strict TS & 6→7 | ✅ | Sem `enum`/`class`/`any`; union de literais + `as const`. |
| VIII. Minimal Dependencies | ✅ | **Zero deps novas** — Web Crypto nativo, API do Start. |
| IX. pnpm Only | ✅ | Sem instalação. |
| X. Spec-Driven | ✅ | Esta spec/plan; ADR novo para a decisão de headers/CSP. |
| XI. Dumb Views / MVVM | ✅ | `__root.tsx` é glue (composition root), não view de negócio. |
| XII. Event Bus | ➖ | Não aplicável (sem reação cross-feature nova). |

**Resultado**: ✅ Sem violações. A constituição já prescreve "CSP/HSTS/nosniff/frame-deny via middleware" — o plano cumpre. Nenhuma entrada em Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/003-auth-security-hardening/
├── spec.md
├── plan.md                      # Este arquivo
├── research.md                  # Phase 0 — decisões (middleware, CSP/nonce, fixation)
├── data-model.md                # Phase 1 — entidades (SecurityHeaders, CSP, RunbookCase)
├── quickstart.md                # Phase 1 — como verificar manualmente
├── contracts/
│   ├── security-headers.md      # Contrato dos headers HTTP (nomes/valores)
│   └── guard-coverage.md        # Contrato: toda rota autenticada tem guard
├── backend-recommendations.md   # BE-REC-001..005 (fora de escopo de impl)
└── checklists/requirements.md
```

### Source Code (repository root)

```text
src/
├── start.ts                            # NOVO — createStart({ requestMiddleware: [securityHeaders, csrf] })
├── shared/http/
│   ├── security-headers.ts             # NOVO — builder PURO do conjunto de headers + CSP (testável)
│   └── csrf-origin.ts                  # EXISTE — reusar nas mutações
├── app/router.tsx                      # ajuste se ssr.nonce p/ <style> for adotado
├── routes/
│   ├── __root.tsx                      # ajuste mínimo (nonce em <style> se aplicável)
│   └── _authenticated/route.tsx        # EXISTE — guard (auditar)
└── modules/auth/server/...             # EXISTE — login (fixation), logout, store (auditar/testar)

Caddyfile                               # headers estáticos na borda (defesa em camadas)

tests/
├── shared/http/security-headers.test.ts   # NOVO (node:test)
├── routes/guard-coverage.test.ts          # NOVO — falha se rota _authenticated sem guard
└── modules/auth/server/...                # reforço: fixation/logout/expiração
```

**Structure Decision**: App único TanStack Start (Constituição §III). Novos arquivos respeitam camadas: builder puro em `shared/http`, composição em `src/start.ts` (composition root, como `router.tsx`). Caddy é infra de borda (fora de `src/`).

## Complexity Tracking

> Sem violações constitucionais — seção não aplicável.
