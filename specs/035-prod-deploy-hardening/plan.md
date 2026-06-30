# Implementation Plan: Infra de produção do web-app (035)

**Branch**: `035-prod-deploy-hardening` | **Date**: 2026-06-24 | **Spec**: [`spec.md`](./spec.md)

**Input**: Feature specification from `specs/035-prod-deploy-hardening/spec.md` · Research em [`research.md`](./research.md)

> **Variante `-fe`.** Esta é uma feature **transversal / de infra** (não um módulo vertical novo): entrega a
> **imagem**, o **CI** e a **prontidão de produção do app**. As seções de "módulo vertical client×server" e
> "design system" ficam **N/A**; em troca há uma seção **Infra / Deploy Plan**. O `compose`/`Caddyfile`/IaC
> vivem no **ERP-INFRA** (decisão D1).

## Summary

Reconstruir, do zero e com práticas frias mais seguras (research R1–R9), a entrega de produção do web-app:
**imagem distroless** non-root com `.output` do Nitro (provenance+SBOM), **`.env.example`** como contrato de
env server-only (Zod fail-fast), **`/ready`** + campos de log `service`/`request_id`, **headers extras**
(COOP/CORP/Permissions-Policy/no-store) e um **CI** que publica no ghcr e faz deploy sem segredo longevo
(Tailscale na QA, OIDC na prod). Borda = Caddy (no ERP-INFRA). Postura **same-origin sem CORS**, **token nunca
no browser** — confirmadas. Disponibilidade single-instance (HA/Valkey adiados).

## Technical Context

**Language/Version**: TypeScript estrito (6→7, `erasableSyntaxOnly`) · Node 24 LTS
**Meta-framework**: Vite + `@tanstack/react-start` (SSR + server functions) · Nitro (preset node-server, `.output` self-contained)
**Server-state**: TanStack Query · **Validação**: Zod 4 (env no boot; borda de server fn) · **UI**: React 19
**Design System**: vanilla-extract — **N/A** nesta feature
**Testes**: `node:test` (puro: builder de headers, parse de env) + Vitest/jsdom (rota `/ready`) + governance test de headers
**Storage**: N/A — segredos/sessão server-only (`external/`); sessão in-memory (single-instance)
**Target Platform**: navegador moderno + **BFF Node** em container (QA: VPS Magalu Docker Compose; Prod: AWS gerenciado)
**Project Type**: web app (front + BFF unificado) — **mudança transversal/infra**
**Performance Goals**: boot inválido falha < 2s (SC-002); imagem sem CVE High/Critical (SC-001); caber em ≈448 MB (QA)
**Constraints**: token nunca no browser · CSP/HSTS · same-origin (sem CORS) · **browser só fala com o BFF** (core-api público, mas client→core-api só via server fn — D9) · **baseUrls = env server-side runtime, nunca `VITE_`** (sem rebuild no DNS) · FS read-only + non-root · mínimo de deps · sem segredo na imagem/git
**Scale/Scope**: 0 módulos novos · ~5 arquivos `src/` transversais + 4 arquivos de infra + CI + 3–4 ADRs

## Constitution Check

*GATE: passou antes da Fase 0; re-checar após implementação.* Princípios I–XII (`.specify/memory/constitution.md`).

| Princípio | Aderência | Nota |
|---|---|---|
| I. BFF-Orchestrated Boundary | ✓ | browser só fala com o web; core-api nunca exposto (FR-011); `/ready` é rota **operacional**, não fronteira de dados |
| II. Errors Are Values | ✓ | env loader: `throw` só na borda do boot (§II); logging é efeito ortogonal (ADR-0014) |
| III. Client×Server Modular | ✓ | nenhum módulo novo; só transversais (`start.ts`, `external/*`, `routes/*`); sem cross-import |
| IV. Illegal States Unrepresentable | ✓ | `EnvConfig` = `Readonly` + `Result`; sem estado novo representável ilegalmente |
| V. Server-State ≠ UI-State | ✓ | feature não muda estado de UI |
| VI. Validation at the Boundary | ✓ | Zod valida env no boot; nenhuma server fn de negócio nova |
| VII. Strict TS 6→7 | ✓ | sem enum/namespace; código novo apagável |
| VIII. Minimal Dependencies | ✓ | **0 deps de runtime novas** (distroless/provenance/headers/`/ready`/Tailscale são infra/CI/nativo) |
| IX. pnpm Only / Segurança por construção | ✓ | pnpm mantido; a feature **reforça** segurança (CSP+, secrets, supply-chain, non-root) |
| X. Spec-Driven | ✓ | spec+research versionados; decisões D2/D3/D5/D7 → ADR; D6 amenda ADR-0006 |
| XI. Framework-Agnostic Client (MVVM) | ✓ | não toca a camada client/MVVM |
| XII. Reactive Flow via Event Bus | ✓ | sem eventos novos |

**Resultado:** ✅ sem violações. Ver *Complexity Tracking* para as duas notas de forma (feature fora de `src/` e transversal).

## Project Structure

### Documentation (this feature)

```text
specs/035-prod-deploy-hardening/
├── spec.md          # o quê (+ Clarifications D1–D7)
├── research.md      # R1–R9 (fontes frias / MCPs)
├── plan.md          # este arquivo
└── tasks.md         # próximo passo (fases + US P1/P2/P3)
```

### Source & Infra tocados (transversal — sem módulo novo)

```text
web-app/
├── web.Dockerfile                         # (novo) multi-stage: deps → build → dev → runtime(distroless)
├── .dockerignore                          # (revisar) contexto enxuto, sem segredo/handbook/specs/tests
├── .env.example                           # (estende) contrato server-only: CORE_API_URL + LOG_LEVEL/NODE_ENV + slots roadmap
├── .github/workflows/
│   ├── build-publish.yml                  # (recriar) build linux/amd64 → ghcr :qa + :sha, provenance+SBOM, actions por SHA
│   └── deploy-qa.yml                       # (reconciliar) trigger de deploy via Tailscale (sem chave SSH longeva)
└── src/
    ├── start.ts                           # (estende) aplica COOP/CORP/Permissions-Policy + no-store
    ├── shared/http/security-headers.ts    # (estende) builder: novos headers (puro/testável)
    ├── external/config/env.config.ts      # (estende) doc/validação dos slots de env
    ├── external/logging/logger.ts         # (ajusta) campos service=web-app + request_id
    └── routes/
        ├── health.tsx                     # (existe) liveness
        └── ready.ts                       # (novo) readiness: env ok + alcance do core-api → 200/503
```

**Structure Decision**: transversal. Nenhuma pasta `src/modules/<m>/` nova. `compose.yaml`/`Caddyfile`/IaC
**não** entram neste repo (D1 — vivem no ERP-INFRA). A imagem é o artefato de integração entre os repos.

## Server Functions & Contratos do BFF *(a fronteira — Princ. I)*

Nenhuma **server function de negócio** nova. A fronteira client↔server permanece intacta.

| Endpoint | Tipo | Input | Output | core-api |
|---|---|---|---|---|
| `/health` | server route (liveness) | — | 200 enquanto o processo vive (não toca backend) | — |
| `/ready` | server route (readiness) | — | 200 se env ok + core-api alcançável; senão **503** | `GET` leve a `CORE_API_URL` (só alcance, não compõe dados) |

- **Cadeia de erro (Princ. II/V):** inalterada para o negócio. `/ready` não expõe status HTTP ao usuário — é
  consumido pelo orquestrador/LB.

## Integração core-api *(prontidão)*

| Capacidade | Prontidão | Estratégia Fase 1 |
|---|---|---|
| Alcance do core-api p/ readiness | 🟢 | `/ready` faz um probe leve a `CORE_API_URL` (timeout curto); não bloqueia liveness |
| Contrato de auth/sessão | 🟢 | inalterado; `__Host-session` opaco, token server-side (R7) |
| Secrets futuros do BFF (`JWT_SIGNING_KEY`/`SESSION_SECRET`/`OIDC_*`) | 🔵 roadmap | só documentados no `.env.example`; não implementados aqui |

## Design System Impact

**N/A** — feature de infra; nenhum átomo/molécula/organismo, nenhum token novo.

## Data Model (client × server)

- **server**: `EnvConfig` (`Readonly<z.infer>`, já existe) estendido com slots opcionais (`LOG_LEVEL`, `NODE_ENV`).
- **client**: sem mudança.

## Infra / Deploy Plan *(o coração desta feature)*

| Item | Decisão | Entrega | Verificação |
|---|---|---|---|
| Imagem `runtime` | D2 distroless/hardened | `web.Dockerfile` multi-stage, non-root, tini/STOPSIGNAL, HEALTHCHECK via `node` | scan 0 High/Critical (SC-001); roda non-root |
| Contexto de build | — | `.dockerignore` enxuto | sem segredo/handbook/specs/tests no contexto |
| Supply-chain | D3 provenance+SBOM | flags no `build-push`; cosign/policy follow-up | attestation presente no ghcr |
| Hardening runtime | R3/CIS | **requisitos** p/ o ERP-INFRA: `cap_drop:[ALL]`, `read_only`+`tmpfs`, `pids_limit`, `no-new-privileges`, seccomp default | docker-bench (SC-007) |
| Env contract / baseUrls | D9/FR-008/009/029 | `.env.example` + `env.config.ts` com **múltiplas baseUrls runtime** (sem `VITE_`); browser só via BFF | lint `no-secrets`; boot fail-fast (SC-002); **nenhuma URL/segredo em `VITE_`** |
| Secrets | D4 | doc do contrato; valores no Secrets Manager (prod)/secrets-file (QA) | 0 segredo na imagem/git (SC-003) |
| Headers | D6 | COOP/CORP/Permissions-Policy + no-store em `security-headers.ts`+`start.ts` | governance test (SC-004) |
| CORS | FR-012 | **não** emitir `Access-Control-*` (invariante) | teste: ausência dos headers |
| Observabilidade (agora) | D8/FR-018,024-027 | **reference-id seguro na UI**; `service`/`request_id`/`trace_id` + redaction estendida; nível `info` c/ debug gated; rota `/ready`; acesso **só via tailnet/IAM** | log tem campos; `/ready` 200/503 (SC-006); **0 detalhe ao client** |
| Observabilidade (Fase 1, pós-MVP) | D8/FR-028 | **OTel** (trace_id+spans BFF→core-api) + backend **self-hosted no tailnet** (SigNoz/Grafana) + **GlitchTip self-hosted** | trace ponta-a-ponta; dados na infra; acesso privado |
| CI build/publish | D3/FR-020 | `build-publish.yml`: linux/amd64 → ghcr `:qa`+`:sha`, actions por SHA, `GITHUB_TOKEN` mínimo | imagem publicada + reproduzível por digest (SC-008) |
| Deploy | D7 | QA via **Tailscale**; prod via **OIDC→AWS** | sem chave longeva no repo |

### ADRs a escrever (skill `adr-author`)

- **ADR — base de imagem distroless/hardened** (D2) · **ADR — supply-chain: provenance/SBOM/cosign** (D3) ·
  **ADR — borda Caddy + estratégia de rate-limit (WAF/core-api)** (D5) · **ADR — deploy: Tailscale (QA) + OIDC (prod)** (D7).
- **ADR — observabilidade / debug seguro** (D8): correlation/reference-id + OTel faseado + backend self-hosted
  no tailnet (SigNoz/Grafana) + GlitchTip — **avança o ADR-0014** (não o superseda).
- **ADR — baseUrls runtime + browser-só-BFF** (D9): core-api público via HTTPS, mas o browser nunca o chama
  direto; baseUrls = env server-side runtime (nunca `VITE_`) — **reafirma §III/ADR-0005 sob o novo contexto**.
- **Amenda ao ADR-0006** (headers COOP/CORP/Permissions-Policy/no-store) (D6).

## Plano de Testes (TDD)

- **Puro (`node:test`)**: `security-headers.ts` (novos headers no set; serialização determinística);
  `parseEnv` (slots novos válidos/ inválidos → `Result`).
- **DOM/Integração (Vitest/jsdom)**: rota `/ready` (200 quando env ok + core-api alcançável; 503 quando não).
- **Governança**: estende `tests/shared/http/security-headers.test.ts` (presença de COOP/CORP/Permissions-Policy,
  ausência de `Access-Control-*`).
- **Escreva o teste antes (RED)** — listar suites que falham primeiro.
- **CI gates**: `pnpm verify` (typecheck+lint+test) + scan de imagem + (futuro) docker-bench.

## Execução por incremento (mapeada às user stories)

- **P1 (US1 imagem + US2 segurança):** `web.Dockerfile` + `.dockerignore` + `.env.example` + headers extras +
  invariante sem-CORS. MVP deployável e seguro.
- **P2 (US3 observabilidade + US4 CI):** `/ready` + campos de log + `build-publish.yml`/`deploy-qa.yml` (provenance, Tailscale/OIDC, SHA-pin).
- **P3 (US5 paridade dev):** confirmar target `dev` consumido pelo override do ERP-INFRA.
- **Fase 1 (pós-MVP, D8):** OTel (trace_id+spans) + backend self-hosted no tailnet (SigNoz/Grafana) + GlitchTip
  self-hosted — observabilidade avançada para debug seguro; não bloqueia o MVP.

## Complexity Tracking

| Nota de forma | Por que | Alternativa rejeitada porque |
|---|---|---|
| Feature vive majoritariamente **fora de `src/`** (Dockerfile/CI/coordenação com ERP-INFRA) | infra de deploy é transversal por natureza; não cabe num módulo vertical | forçar em `src/modules/` distorceria a arquitetura |
| Toca **vários transversais** (`start.ts`, `external/*`, `routes/*`) em vez de 1 módulo | endurecimento de produção é cross-cutting (headers, env, logs, health) | dividir em features minúsculas perderia a coerência da "produção correta" |

> Nenhuma das duas é violação de §I–§XII — são características de uma feature de infra. Registradas por transparência.
