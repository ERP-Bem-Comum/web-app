---
description: "Task list — Auth Security Hardening (TDD)"
---

# Tasks: Endurecimento de Segurança da Autenticação (Auth Hardening)

**Input**: `specs/003-auth-security-hardening/` (spec ✅, plan ✅, research ✅, data-model ✅, contracts ✅, quickstart ✅)

**Tests**: **TDD** — teste antes da impl. Runner: `node:test`. Estado pós-implementação: **197 testes verdes**.

**Branch**: `feat/v2-auth`. **Arquitetura**: v1.2.1 / ADR-0004 + ADR-0006.

## Format: `[ID] [P?] [Story] Description`

> Legenda de status: `[x]` feito/verificado · `[ ]` pendente (validação **manual** do runbook, depende de rodar a app).
> Boundaries (lint): builder puro de headers em `shared/http`; middleware global em `src/start.ts` (composition root).

---

## Phase 1: Setup

- [x] T001 Baseline verde antes de começar (`pnpm lint`/`typecheck`/`test`/`build`) — confirmado (179 testes, build ok).
- [x] T002 Fixar valores normativos (headers + CSP baseline de `contracts/security-headers.md`) como fonte dos testes.

---

## Phase 2: Foundational (bloqueia US1–US4)

### shared/http — builder puro dos headers + CSP (TDD)

- [x] T003 Teste `node:test` CSP → `tests/shared/http/security-headers.test.ts`: `serializeCsp` determinístico; SEM `unsafe-inline` em `script-src`; inclui `frame-ancestors 'none'`/`object-src 'none'`/`base-uri 'self'`.
- [x] T004 Teste `node:test` builder (mesmo arquivo): `buildSecurityHeaders({https:true})` inclui HSTS; `{https:false}` omite; sempre `nosniff`/`DENY`/`Referrer-Policy`. + `isHttpsFromForwardedProto` (trust-proxy).
- [x] T005 Impl `src/shared/http/security-headers.ts` — `serializeCsp` + `buildSecurityHeaders` + `CSP_BASELINE` (`as const`) + `isHttpsFromForwardedProto`. Green.

### src/start.ts — middleware global (composition root)

- [x] T006 Impl `src/start.ts` — `createStart({ requestMiddleware: [securityHeadersMiddleware, csrfMiddleware] })`. HTTPS via `x-forwarded-proto` (trust-proxy, R1). Adicionado `src/start.ts` ao `boundaries/ignore` no `eslint.config.js`.
- [x] T006a Re-registrar CSRF do Start: `createCsrfMiddleware({ filter: ctx => ctx.handlerType === 'serverFn' })` no `requestMiddleware` (criar `src/start.ts` desativa o CSRF automático — R1).

**Checkpoint**: headers aplicados em toda resposta; CSRF do Start preservado. ✅

---

## Phase 3: User Story 1 - Security headers & CSP (Priority: P1) 🎯 MVP

- [x] T007 Lógica do middleware coberta pelos testes puros (T003/T004: `buildSecurityHeaders` + `isHttpsFromForwardedProto`). O middleware em si (iterar headers → `setResponseHeader`) é wiring fino do runtime do Start → verificação de runtime fica no runbook (RB-HDR-04).
- [x] T008 Wiring: `securityHeadersMiddleware` é **global request middleware** → cobre SSR e server fns por definição (doc Start `middleware.md` L440-441).
- [x] T009 [P] Caddy (defesa em camadas): headers estáticos em `Caddyfile` (`header` no site `app.localhost`: nosniff, X-Frame-Options DENY, Referrer-Policy, HSTS, `-Server`). CSP fica no app.
- [ ] T010 **Validação manual** RB-HDR-01..05 (`quickstart.md`): `curl -I` + DevTools + iframe. Preencher status.

**Checkpoint**: SC-001 — código pronto; falta evidência manual (T010).

---

## Phase 4: User Story 2 - Sessão anti-fixation & logout efetivo (Priority: P1)

> Estado atual já mitiga (R3/R4): testes de regressão + reforço.

- [x] T011 Teste `node:test` anti-fixation → `tests/modules/auth/server/application/login-fixation.test.ts` (login gera `sessionId` novo via `genId()`; id forjado não é reutilizado; sem sessão anônima).
- [x] T012 Teste de entropia/opacidade do `genId()` (mesmo arquivo) — `crypto.randomUUID` único e no formato UUIDv4.
- [x] T013 Logout invalida server-side — COBERTO: `tests/modules/auth/server/application/logout.test.ts` (002, apaga store) + `session-guard.test.ts` (id ausente → `session-not-found` → cookie limpo). Verificado.
- [x] T014 [P] Flags do cookie (regressão) — COBERTO por `tests/external/session/cookie.test.ts` (002). Verificado.
- [x] T015 [P] Expiração do store (regressão) — COBERTO por `tests/external/session/session-store.test.ts` (002). Verificado.
- [ ] T016 **Validação manual** RB-SESS-01..05 (`quickstart.md`). Preencher status.

**Checkpoint**: SC-003/SC-004 — código/testes prontos; falta evidência manual (T016).

---

## Phase 5: User Story 3 - Guard completo (Priority: P1)

- [x] T017 Teste `node:test` cobertura de guard → `tests/routes/guard-coverage.test.ts` (varre `src/routes/`; allowlist `['index','login','health']`; **falha** se rota de conteúdo fora de `_authenticated/`).
- [x] T018 Teste passa hoje e documenta a allowlist (rota pública nova = editar `PUBLIC_ROUTES` conscientemente).
- [x] T019 Server fn sem sessão → erro — COBERTO: `tests/modules/auth/server/adapters/session-guard.test.ts` (002: sem sessão no store → `err(session-not-found)`, independe de verbo). Verificado.
- [ ] T020 **Validação manual** RB-GUARD-01..04 (`quickstart.md`: forced browsing, open-redirect, verbo). Preencher status.

**Checkpoint**: SC-005 — código/testes prontos; falta evidência manual (T020).

---

## Phase 6: User Story 4 - CSRF & não-vazamento & anti-enumeration (Priority: P2)

- [x] T021 CSRF de origem (regressão) — COBERTO por `tests/shared/http/csrf-origin.test.ts` (002: cross-site rejeitado). Verificado.
- [x] T022 Impl: `isSameOriginRequest` aplicado em `logout.server-fn.ts` (padrão p/ mutações; complementa o CSRF global do Start).
- [x] T023 Teste `node:test` anti-enumeration → `tests/modules/auth/server/application/login-uniform-error.test.ts` (email inválido e credencial rejeitada → mesmo `invalid-credentials`; email inválido nem chega ao backend).
- [x] T024 Não-vazamento de token (SC-002): `pnpm build` + grep no bundle client (`.output/public`) por `refreshToken|CORE_API_URL` → **nada vazou**. ✅
- [ ] T025 **Validação manual** RB-CSRF-01 e RB-ENUM-01 (`quickstart.md`). Preencher status.

**Checkpoint**: SC-002 ✅ (verificado); SC-006 — testes prontos; falta evidência manual (T025).

---

## Phase 7: Polish & Cross-Cutting

- [x] T026 ADR `handbook/adr/0006-security-headers-csp.md` (2 camadas + `script-src 'self'` + trust-proxy + CSRF re-wire) + índice atualizado.
- [x] T027 Comentários inline didáticos em `security-headers.ts` e `src/start.ts` (porquê do CSRF re-wire, HSTS condicional, `script-src 'self'`).
- [x] T028 Follow-ups registrados: (a) endurecer `style-src` via `ssr.nonce` (research R2); (b) BE-REC-001..005 em `backend-recommendations.md` p/ repasse ao time.
- [x] T029 Quality gate: `pnpm typecheck` ✅ · `pnpm test` (197) ✅ · `pnpm lint` ✅ · `pnpm build` ✅.
- [ ] T030 **Fechar o runbook** (`quickstart.md`): preencher status de todos os casos manuais (T010/T016/T020/T025) → confirmar SC-008.

---

## Status final

- **Código + testes automatizados: COMPLETOS** (197 testes verdes; lint/typecheck/build verdes; 0 vazamento de token).
- **Pendente: validação MANUAL do runbook** (T010, T016, T020, T025, T030) — exige rodar a app (`pnpm dev` / docker) e preencher evidências. Esta parte é do operador, não automatizável aqui.
- **US5/FR-015 (rate-limit): DEFERRED** → BE-REC-001 (backend).

## Notes
- Sem deps novas (Web Crypto + API do Start). Boundaries enforçados por lint.
- Grande parte de US2/US3/US4 era **auditar/testar** o que o 002 já entregou (login `genId`, logout, store, guard, csrf-origin) — confirmado por testes existentes + novos.
