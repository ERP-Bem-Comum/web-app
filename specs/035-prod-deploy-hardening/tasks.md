# Tasks: Infra de produção do web-app (035)

**Input**: `specs/035-prod-deploy-hardening/` (spec.md, plan.md, research.md)

**Tests**: incluídos — o projeto tem **política de regressão zero** e governance tests (ARQUITETURA §9); o
`plan.md` define um plano TDD. Escreva os testes **antes** (RED) onde marcado.

**Organização**: agrupado por user story (P1 → P3), cada uma entregável e testável de forma independente.

## Format: `[ID] [P?] [Story] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: US1/US2 (P1) · US3/US4 (P2) · US5 (P3)
- Caminhos exatos nas descrições

---

## Phase 1: Setup

**Purpose**: ponto de partida verde + reservar governança.

- [ ] T001 Rodar baseline `pnpm verify` (typecheck+lint+test) e registrar verde — toda mudança parte daqui (regressão zero).
- [ ] T002 [P] Confirmar branch `035-prod-deploy-hardening` e que a faxina não-commitada **não** entra nos commits desta feature (commitar infra 035 de forma isolada).

---

## Phase 2: Foundational (Blocking) — governança + contrato de env

**⚠️ CRITICAL**: as decisões viram ADR (governam o resto) e o contrato de env é dependência de US1 (boot) e US3 (readiness).

- [ ] T003 [P] ADR — **base de imagem distroless/hardened** (D2) em `handbook/adr/00NN-web-image-distroless.md` (skill `adr-author`; atualizar índice).
- [ ] T004 [P] ADR — **supply-chain: provenance + SBOM (+ cosign/policy)** (D3) em `handbook/adr/00NN-image-provenance-sbom.md`.
- [ ] T005 [P] ADR — **borda Caddy + estratégia de rate-limit (WAF/core-api)** (D5) em `handbook/adr/00NN-edge-caddy-rate-limit.md`.
- [ ] T006 [P] ADR — **deploy: Tailscale (QA) + OIDC→AWS (prod), actions por SHA** (D7) em `handbook/adr/00NN-deploy-tailscale-oidc.md`.
- [ ] T006b [P] ADR — **observabilidade / debug seguro** (D8): correlation/reference-id + OTel faseado + backend self-hosted no tailnet (SigNoz/Grafana) + GlitchTip — **avança o ADR-0014** em `handbook/adr/00NN-observability-secure-debug.md`.
- [ ] T006c [P] ADR — **baseUrls runtime + browser-só-BFF** (D9): core-api público via HTTPS, mas o browser nunca o chama direto; baseUrls = env server-side runtime (nunca `VITE_`) — reafirma §III/ADR-0005 em `handbook/adr/00NN-baseurls-runtime-bff-only.md`.
- [ ] T007 Amenda ao **ADR-0006** (headers COOP/CORP/Permissions-Policy/`no-store`) (D6) — adicionar amendência datada, sem reescrever a decisão original.
- [ ] T008 Estender **contrato de env** (D9): `.env.example` + `src/external/config/env.config.ts` com **base URL(s) do core-api runtime** (`CORE_API_URL` + adicionais se houver, ex.: pública/interna ou v1/v2), `LOG_LEVEL`/`NODE_ENV` opcionais, slots roadmap (`JWT_SIGNING_KEY`/`SESSION_SECRET`/`OIDC_*`) comentados — tudo **server-side, sem `VITE_`** (DNS muda = env + restart, sem rebuild). Garantir (lint/test) que **nenhuma URL/segredo** vai a `VITE_`.

**Checkpoint**: governança registrada + contrato de env pronto.

---

## Phase 3: User Story 1 — Imagem versionada + boot fail-fast (P1) 🎯 MVP

**Goal**: imagem de produção **distroless non-root** publicável; boot **falha-rápido** com env inválido; ambientes só puxam.

**Independent Test**: `docker run` da imagem `runtime` com `CORE_API_URL` válido → `/health` 200 (non-root); sem env válido → exit ≠ 0 com erro claro.

### Tests (RED first)
- [ ] T009 [P] [US1] Teste `parseEnv`: slots novos válidos/inválidos → `Result` em `tests/external/config/env.config.test.ts` (deve falhar antes de T008/impl).

### Implementation
- [ ] T010 [US1] Criar `web.Dockerfile` multi-stage: `deps` → `build` (`pnpm build` → `.output`) → `dev` (HMR) → `runtime` **distroless** (`gcr.io/distroless/nodejs24`, non-root, `STOPSIGNAL SIGTERM`, `HEALTHCHECK` via `node` fetch a `/health`, base **pinada por digest**, labels OCI).
- [ ] T011 [P] [US1] Revisar `.dockerignore`: contexto enxuto — sem `.env`/segredos, `handbook/`, `specs/`, `tests/`, `.claude/`, `core-api`.
- [ ] T012 [US1] Ajustar `NODE_OPTIONS` (`--max-old-space-size`) p/ caber em ≈448 MB (QA) sem OOM; documentar no Dockerfile.
- [ ] T013 [US1] Smoke local: build `runtime`, `docker run` com `CORE_API_URL` válido → `/health` 200 rodando **non-root**; com env ausente → exit ≠ 0 (valida FR-001/002, SC-002/SC-007).
- [ ] T014 [US1] Documentar (no `plan.md`/issue no **ERP-INFRA**) os requisitos de hardening que o compose deve setar: `cap_drop:[ALL]`, `read_only:true`+`tmpfs:/tmp`, `pids_limit`, `no-new-privileges`, seccomp default (R3/CIS).

**Checkpoint**: imagem MVP deployável e segura.

---

## Phase 4: User Story 2 — Acesso seguro (headers, same-origin, token server-side) (P1)

**Goal**: conjunto de headers estendido (OWASP Secure Headers); invariante **sem CORS**; sessão confirmada.

**Independent Test**: toda resposta carrega CSP+nonce, HSTS, nosniff, frame-ancestors, **COOP/CORP/Permissions-Policy**; nenhum `Access-Control-*`; cookie `__Host-session` opaco HttpOnly/Secure/SameSite=Strict.

### Tests (RED first)
- [ ] T015 [P] [US2] Estender `tests/shared/http/security-headers.test.ts`: presença de `Cross-Origin-Opener-Policy`/`Cross-Origin-Resource-Policy`/`Permissions-Policy` (+ `Cache-Control: no-store` onde aplicável) e **ausência** de `Access-Control-*` (RED).

### Implementation
- [ ] T016 [US2] `src/shared/http/security-headers.ts`: adicionar COOP `same-origin`, CORP `same-origin`, `Permissions-Policy` (desligar APIs não usadas) ao builder puro; manter CSP+nonce e ordem determinística.
- [ ] T017 [US2] `src/start.ts`: aplicar os novos headers no middleware (sem quebrar nonce/CSP/HSTS); definir `Cache-Control: no-store` em respostas sensíveis.
- [ ] T018 [US2] Confirmar **invariante sem-CORS**: nenhum ponto emite `Access-Control-*` (coberto por T015).
- [ ] T019 [US2] Auditar o cookie de sessão (`__Host-session`): HttpOnly, Secure, **SameSite=Strict**, sem `Domain`, path `/`; ajustar se divergir (FR-017, R7).

**Checkpoint**: US1 + US2 = MVP de produção seguro e deployável.

---

## Phase 5: User Story 3 — Observabilidade (logs + health/ready) (P2)

**Goal**: logs JSON com `service`/`request_id`; `/ready` para o LB; `/health` segue liveness puro.

**Independent Test**: falha na borda gera 1 linha JSON (redacted) com `service`/`request_id`; `/ready` 200 (env ok + core-api alcançável) / 503; `/health` 200 sem tocar backend.

### Tests (RED first)
- [ ] T020 [P] [US3] Teste da rota `/ready` (200 quando env ok + core-api alcançável; 503 quando não) — Vitest/jsdom ou node:test conforme a forma da rota.

### Implementation
- [ ] T021 [US3] `src/external/logging/logger.ts`: campos `service: "web-app"` + `request_id` (do `x-req-id` do Nitro) **+ slot `trace_id`** (p/ OTel da Fase 1); nível por `LOG_LEVEL` (default `info`); **estender redaction** (token/cookie/senha/segredo/PII/host interno; sem stack em info/warn — MASTG-0022).
- [ ] T022 [US3] Criar rota **`/ready`** (readiness): valida env carregado + **probe leve** ao `CORE_API_URL` (timeout curto) → 200/503; não compõe dados (não é fronteira).
- [ ] T023 [US3] Confirmar `/health` permanece liveness puro (não chama o core-api).
- [ ] T023a [US3] **Reference-id seguro na UI**: estado de erro mostra mensagem genérica + `request_id` (sem stack/status/detalhe) — fecha o loop de triagem (FR-024).
- [ ] T023b [US3] **Debug gated + time-boxed**: elevar nível a `debug` por janela curta via config controlada; nunca por toggle público; default `info` (FR-026).
- [ ] T023c [US3] Documentar **acesso a logs/dashboards só por canal privado** (Tailscale na QA / IAM+rede privada na prod); acesso registrado (FR-027).

**Checkpoint**: produção observável, com triagem por reference-id, e roteável pelo LB.

---

## Phase 6: User Story 4 — CI confiável sem segredo longevo (P2)

**Goal**: build/publish no ghcr com provenance/SBOM; deploy sem chave longeva; actions por SHA.

**Independent Test**: push na branch de QA publica `:qa`+`:sha` com attestation; deploy autentica sem segredo longevo; auditoria confirma actions pinadas por SHA.

### Implementation
- [ ] T024 [US4] `.github/workflows/build-publish.yml` (recriar): build `linux/amd64` → ghcr `:qa` + `:sha-<short>`; **provenance + SBOM**; actions **pinadas por commit SHA**; `permissions: { contents: read, packages: write }`; **não** rodar PR de fork com segredo (CICD-SEC-4).
- [ ] T025 [US4] `.github/workflows/deploy-qa.yml` (reconciliar): disparo de deploy via **Tailscale** (VPS no tailnet) em vez de SSH público com chave longeva; rollback por digest.
- [ ] T026 [P] [US4] Documentar/parametrizar deploy de **prod via GitHub OIDC→AWS** (sem chave longeva) — coordenação com ERP-INFRA/infra (CICD-SEC-6).
- [ ] T027 [P] [US4] Adicionar **scan de imagem** no CI (falha em High/Critical — SC-001); opcional docker-bench.

**Checkpoint**: esteira de entrega segura (cadeia de suprimentos).

---

## Phase 7: User Story 5 — Paridade dev/prod local (P3)

**Goal**: o target `dev` da imagem é consumido pelo `local/` do ERP-INFRA (HMR em `app.localhost`).

**Independent Test**: `up.sh` do ERP-INFRA builda o target `dev` deste repo e sobe `https://app.localhost`.

### Implementation
- [ ] T028 [US5] Confirmar que o target `dev` do `web.Dockerfile` é compatível com o override (`build: target: dev`) do ERP-INFRA; ajustar se necessário.
- [ ] T029 [P] [US5] Documentar o fluxo local (README/handbook) apontando para `ERP-INFRA/local/` (não duplicar compose aqui).

**Checkpoint**: todas as histórias funcionais e independentes.

---

## Phase 8: Polish & Cross-Cutting

- [ ] T030 [P] Atualizar índice de ADRs (`handbook/adr/README.md`) com os ADRs novos + amenda do 0006.
- [ ] T031 Rodar o gate final `pnpm verify` + scan de imagem; garantir **regressão zero** (typecheck/lint/test verdes).
- [ ] T032 [P] Abrir issue/PR no **ERP-INFRA**: requisitos de hardening do compose (`cap_drop`/`read_only`/`pids_limit`) + nome da imagem/tag.
- [ ] T033 [P] Registrar follow-ups: `/metrics` Prometheus + dashboards/alerting de maturidade plena (ADR-0014 fase 2), store de sessão **Valkey** (HA, alinha ADR-0030 core-api), cosign/policy de proveniência. (OTel/GlitchTip saíram daqui → **Phase 9**.)

---

## Phase 9: Fase 1 — Observabilidade avançada (pós-MVP, D8)

**Goal**: tracing ponta-a-ponta + error tracking, **self-hosted e privado**. Não bloqueia o MVP.

- [ ] T034 [Fase1] **OpenTelemetry**: `@opentelemetry/instrumentation-pino` injeta `trace_id` nos logs; spans no `src/start.ts`; propagar `traceparent` (W3C) BFF→core-api.
- [ ] T035 [Fase1] **Backend self-hosted no tailnet**: subir **SigNoz** ou **Grafana (Loki+Tempo)** acessível só pela tailnet (coordenar infra/ERP-INFRA); exportar OTLP.
- [ ] T036 [Fase1] **GlitchTip self-hosted** (Sentry-compat): capturar exceções com `beforeSend`/scrubbing de PII; anexar `request_id`/`trace_id`.
- [ ] T037 [Fase1] Verificar: trace ponta-a-ponta visível; dados só na infra; acesso só por tailnet/IAM; 0 PII/token nas exceções.

**Checkpoint**: debug de produção rápido (trace + reference-id) e totalmente privado.

---

## Dependencies & Execution Order

- **Phase 1 (Setup)** → **Phase 2 (Foundational: ADRs + env)** bloqueia as user stories.
- **US1 (P1)** e **US2 (P1)** podem rodar em paralelo após a Phase 2 (arquivos distintos: Dockerfile/CI vs headers/start). Juntas = **MVP**.
- **US3 (P2)** depende de T008 (env) e de `/health` existente; independente de US1/US2.
- **US4 (P2)** depende de US1 (precisa do `web.Dockerfile` para o build do CI).
- **US5 (P3)** depende de US1 (target `dev`).
- **Phase 8 (Polish)** após as histórias desejadas.
- **Phase 9 (Fase 1 obs.)** após o MVP (P1) + US3 (campos de log/trace) + tailnet disponível; **não bloqueia** o P1.

### Within each story
- Testes (marcados RED) **antes** da implementação.
- `security-headers.ts` (puro) antes de `start.ts` (aplicação).
- `web.Dockerfile` antes do `build-publish.yml` (US4).

### Parallel opportunities
- Phase 2: T003–T006 (ADRs) em paralelo.
- US1 e US2 em paralelo (equipes/arquivos distintos).
- Dentro de US1: T011 (`.dockerignore`) em paralelo com T010.

---

## Implementation Strategy

### MVP First (P1 = US1 + US2)
1. Phase 1 (Setup) → 2. Phase 2 (ADRs + env) → 3. US1 + US2 → **STOP & VALIDATE**: imagem deployável + postura de segurança HTTP. Demo/deploy QA.

### Incremental Delivery
MVP (P1) → US3 (observabilidade) → US4 (CI seguro) → US5 (paridade dev). Cada incremento agrega valor sem quebrar o anterior.

---

## Notes
- `[P]` = arquivos diferentes, sem dependência. `[Story]` mapeia rastreabilidade.
- Verifique os testes falharem antes de implementar (TDD).
- Commit por tarefa/grupo lógico; manter `spec.md`/`plan.md`/`tasks.md` coerentes com a mudança.
- **Regressão zero**: não fechar nenhuma fase com typecheck/lint/test vermelho.
- Cada decisão (D2/D3/D5/D7) **já** vira ADR na Phase 2 — "converter aprendizados em artefatos".
