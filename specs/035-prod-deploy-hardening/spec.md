# Feature Specification: Infra de produção do web-app (imagem, CI, env/secrets, borda, logs, prontidão)

**Feature Branch**: `035-prod-deploy-hardening`

**Created**: 2026-06-24

**Status**: Draft

**Input**: User description: "Pela primeira vez pensar o projeto corretamente para produção: imagens Docker e arquivos de deploy corretos, variáveis de ambiente e secrets de maneira correta, necessidade de CORS, como o BFF deve funcionar, logs de sistema e tudo mais para uma produção correta. Montar do zero (não recuperar a infra antiga), a partir da stack que temos e do backend, usando os MCPs frios como autoridade para práticas melhores e mais seguras."

> **Variante `-fe` (frontend / web-app).** A spec descreve o **quê** (jornadas, requisitos, critérios); o **como**
> (Dockerfile, workflow, headers concretos) fica no `plan.md`. Decisões em aberto estão marcadas
> `[NEEDS CLARIFICATION]` **com a recomendação embutida** (a resolver no review-spec / clarify). Cada decisão
> resolvida deve virar **ADR** (princípio "converter aprendizados em artefatos").
>
> **Pesquisa de suporte:** ver [`research.md`](./research.md) — achados das fontes frias (MCPs
> `docker-docs`, `reverse-proxy`, `security`/OWASP) com URLs.

## Contexto: as duas situações de deploy

A infra real (fonte: repo **ERP-INFRA** + **core-api@dev** ADR-0021) tem **dois ambientes-alvo**, e este
spec deve servir aos dois com **uma única imagem**:

| | **A — PBE/QA (MagaluCloud)** | **B — Produção (AWS, via Codebit)** |
|---|---|---|
| Forma | 1 VPS `BV1-2-10` · Docker Compose · Caddy+web+core-api+MySQL | LB+WAF · ≥2 réplicas stateless · RDS · S3 · Secrets Manager · CloudWatch |
| Disponibilidade | instância única, downtime curto no restart | HA (planejada); hoje o corte é single-instance |
| IaC | `compose.yaml` **já existe** no ERP-INFRA | `platform/` ainda **vazio** (time de infra preenche) |

**Fronteira de propriedade (a confirmar — FR-021):** este repo entrega **imagem + CI + prontidão do app**;
o **compose/Caddyfile/IaC vivem no ERP-INFRA**. A imagem é publicada no ghcr e os ambientes só fazem `pull`.

## Clarifications

### Session 2026-06-24 — decisões (seguir com as recomendações)

Todos os `[NEEDS CLARIFICATION]` foram resolvidos com as recomendações do [`research.md`](./research.md).
Cada decisão de peso vira **ADR** no `handbook/adr/` (rastreado no `plan.md`).

- **D1 (FR-021) Escopo:** este repo entrega **imagem + CI + prontidão do app**; `compose`/`Caddyfile`/IaC
  permanecem no **ERP-INFRA**. (decisão de fronteira de repo — registrada aqui, sem ADR próprio)
- **D2 (FR-004) Base da imagem:** **distroless/hardened** no `runtime` → ADR.
- **D3 (FR-005) Cadeia de suprimentos:** **provenance + SBOM** no build; cosign/policy como reforço → ADR.
- **D4 (FR-010) Secrets:** QA por **Docker secrets-file**; prod por **AWS Secrets Manager** (env no startup);
  nunca na imagem/git (segue catálogo do ERP-INFRA; ADR só se divergir).
- **D5 (FR-013/014) Borda + rate-limit:** **Caddy** + timeouts anti-slowloris; rate-limit no **AWS WAF** (prod)
  + throttle de login do core-api; QA **sem** rate-limit na borda → ADR (escolha de borda).
- **D6 (FR-016) Headers extras:** adicionar **COOP, CORP, Permissions-Policy** + `Cache-Control: no-store` →
  amenda ADR-0006.
- **D7 (FR-022) Deploy:** QA via **Tailscale** (VPS no tailnet); prod via **GitHub OIDC→AWS**; actions pinadas
  por SHA → ADR.
- **D8 (FR-018/019/024–028) Observabilidade — debug seguro em prod:** **agora** correlation/reference-id
  ponta-a-ponta (id **seguro** na UI, `service`/`request_id`/`trace_id` nos logs, redaction estendida), nível
  default `info` com debug **gated+time-boxed**, e acesso a logs/dashboards **só via Tailscale (QA)/IAM (prod)**.
  **Faseado (Fase 1, pós-MVP):** OpenTelemetry (trace_id nos logs, spans BFF→core-api) + backend
  **self-hosted no tailnet** (SigNoz ou Grafana Loki+Tempo) + **GlitchTip self-hosted** (Sentry-compat) p/
  exceções com scrubbing. → **ADR** que **avança** o ADR-0014 (não o superseda).
- **D9 (FR-008/009/029) baseUrls runtime + browser-só-BFF:** o core-api passa a ser **exposto via HTTPS** (para
  outros consumidores), mas o **browser do nosso front continua falando só com o BFF** — preserva §III/§IX/
  ADR-0005 e a postura **same-origin sem CORS**. As baseUrls (`CORE_API_URL` + adicionais) são **env
  server-side runtime** validadas por Zod: trocar DNS = mudar env + restart, **sem recompilar**; **nunca
  `VITE_`** (inlinaria no bundle e exigiria rebuild). → **ADR** reafirmando o browser-só-BFF sob o novo contexto.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Publicar e subir o web-app a partir de imagem versionada (Priority: P1)

Como **operador de deploy**, eu publico uma imagem imutável do web-app no registry e o ambiente
(QA ou prod) sobe **só puxando** essa imagem, com boot **falha-rápido** se a configuração estiver inválida —
sem nunca compilar no servidor.

**Why this priority**: sem uma imagem de produção correta e um boot previsível, não há deploy nenhum. É a
base de tudo.

**Independent Test**: `docker run` da imagem publicada com `CORE_API_URL` válido sobe e responde `/health`
200; com env inválido/ausente, o processo **sai diferente de zero** com mensagem clara e **não** sobe quebrado.

**Acceptance Scenarios**:

1. **Given** a imagem `ghcr.io/erp-bem-comum/bemcomum-web` publicada e `CORE_API_URL` válido, **When** o
   container inicia, **Then** ele responde `/health` 200 rodando **non-root** e encerra limpo no `SIGTERM`.
2. **Given** `CORE_API_URL` ausente/ inválido, **When** o container inicia, **Then** ele **falha no boot**
   (exit ≠ 0) com erro de configuração legível e **não** aceita tráfego.
3. **Given** o ambiente, **When** o deploy roda, **Then** ele faz `pull` por **digest/tag** e **nunca**
   compila no servidor; rollback = apontar para o digest anterior.

---

### User Story 2 - Acesso seguro do usuário final (HTTPS, headers, same-origin, token server-side) (Priority: P1)

Como **usuário final**, acesso o app por uma **única origem HTTPS**; o browser só fala com o web (BFF), nunca
com o core-api; meus dados de sessão nunca expõem token no browser.

**Why this priority**: é a postura de segurança de produção (constituição §IX) — inegociável antes de expor à internet.

**Independent Test**: requisição à borda retorna 301 HTTP→HTTPS; toda resposta carrega os headers de
segurança; o payload do browser **não** contém access/refresh token; não há header `Access-Control-Allow-*`.

**Acceptance Scenarios**:

1. **Given** o app atrás da borda, **When** acesso por HTTP, **Then** sou redirecionado a HTTPS e a resposta
   traz HSTS, CSP (com nonce), `X-Content-Type-Options`, `frame-ancestors 'none'`, `Referrer-Policy`.
2. **Given** uma sessão autenticada, **When** inspeciono cookies/payload, **Then** vejo apenas um cookie
   **opaco** `__Host-session` (HttpOnly, Secure, SameSite=Strict) — nenhum token.
3. **Given** uma origem externa, **When** ela tenta ler a resposta do BFF via browser, **Then** é bloqueada
   pela Same-Origin Policy (o app **não** emite CORS).

---

### User Story 3 - Operar e diagnosticar produção (logs, health, ready) (Priority: P2)

Como **operador**, quando algo quebra em produção eu tenho **logs estruturados** e endpoints de health para
o orquestrador/LB decidirem reinício e roteamento.

**Why this priority**: produção cega é o problema que o ADR-0014 começou a resolver; readiness é o que o LB
de prod consome.

**Independent Test**: uma falha na borda do core-api gera 1 linha JSON em stdout com `service`/`request_id`/
`level`, **sem** token/PII; `/health` responde sem tocar o backend; `/ready` reflete a prontidão (config +
alcance do core-api).

**Acceptance Scenarios**:

1. **Given** uma exceção na server fn, **When** ela é convertida em `Result` na borda, **Then** o stack vai
   ao log (JSON, redacted) e o client recebe só o erro **tipado** (sem detalhe).
2. **Given** o orquestrador, **When** consulta `/health`, **Then** recebe 200 enquanto o processo vive (sem
   depender do core-api); **When** consulta `/ready`, **Then** recebe 200 só se config ok e core-api alcançável, senão 503.

---

### User Story 4 - Pipeline publica imagem confiável sem segredo longevo (Priority: P2)

Como **mantenedor do CI**, a esteira builda e publica a imagem com **proveniência auditável** e dispara o
deploy **sem** chaves de longa duração expostas.

**Why this priority**: cadeia de suprimentos é o vetor de ataque moderno (OWASP CI/CD Top 10); o workflow
antigo usa chave SSH longeva e `provenance:false`.

**Independent Test**: o build publica imagem com attestation de proveniência/SBOM; o deploy autentica sem
segredo longevo no repositório; actions de terceiros estão pinadas por SHA.

**Acceptance Scenarios**:

1. **Given** um push na branch de QA, **When** o CI roda, **Then** ele builda `linux/amd64`, publica `:qa` +
   `:sha-<short>` no ghcr **com provenance/SBOM** e dispara o deploy.
2. **Given** o workflow, **When** auditado, **Then** todas as actions de terceiros estão **pinadas por commit
   SHA** e o `GITHUB_TOKEN` tem permissão mínima.

---

### User Story 5 - Paridade dev/prod local (Priority: P3)

Como **dev**, subo a stack local que **espelha** produção (mesma imagem/contrato) em poucos minutos, via o
`local/` do ERP-INFRA, sem segredo real.

**Why this priority**: paridade dev/prod evita bugs que só aparecem em ambiente realista; o ERP-INFRA já
provê o `local/` (este repo só precisa expor o **target `dev`** e o contrato de env).

**Independent Test**: o override do ERP-INFRA builda o `dev` target deste repo e sobe `https://app.localhost`.

**Acceptance Scenarios**:

1. **Given** o mono_repo, **When** rodo o `up.sh` do ERP-INFRA, **Then** o web sobe com HMR a partir do
   **target `dev`** da imagem e fala com o core-api pela rede interna.

### Edge Cases

- Boot com env inválido → falha-rápido (não subir quebrado) — coberto por US1.
- Restart na VPS single-instance → sessões in-memory se perdem (re-login) — **aceito** neste corte (HA adiada).
- core-api fora do ar → `/ready` 503 (sai de rota), `/health` segue 200 (não reinicia o pod à toa).
- FS read-only → todo caminho de escrita do runtime deve ir para `tmpfs` (ex.: `/tmp`); validar que Nitro/Node não exige escrita fora disso.
- Memória apertada na VPS (448 MB p/ o web) → `NODE_OPTIONS=--max-old-space-size` ajustado p/ não dar OOM.

## Requirements *(mandatory)*

### Functional Requirements

**Imagem & build**
- **FR-001**: A imagem de produção DEVE empacotar o `.output` do Nitro (self-contained), ser **multi-stage**,
  rodar **non-root**, ser **signal-safe** (init PID 1 + `STOPSIGNAL SIGTERM`), expor `HEALTHCHECK` via `node`
  fetch a `/health`, e ter a base **pinada por digest**.
- **FR-002**: O contexto de build DEVE ser enxuto via `.dockerignore` — **sem** `.env`/segredos, sem
  `handbook/`, `specs/`, `tests/`, `.claude/`.
- **FR-003**: A imagem DEVE expor um **target `dev`** (HMR) consumido pelo override do ERP-INFRA, além do
  `runtime`, e carregar **labels OCI**.
- **FR-004**: A base da imagem `runtime` DEVE ser **distroless** (`gcr.io/distroless/nodejs24`) ou Docker
  Hardened Image — superfície mínima, **non-root por padrão**, sem shell (healthcheck via `node`); o estágio de
  build pode usar slim/alpine. **(D2 — vira ADR.)**
- **FR-005**: O build DEVE produzir imagem com **provenance + SBOM attestations** (SLSA) no build-push;
  **cosign** + build-policy que exige proveniência de builder confiável como reforço. **(D3 — vira ADR.)**

**Runtime / hardening (o app habilita; o compose/IaC do ERP-INFRA aplica)**
- **FR-006**: O serviço DEVE ser executável com **FS root read-only** (escrita só em `tmpfs`), **sem
  capabilities** (liga na porta 3000, não privilegiada), `no-new-privileges`, **seccomp default** e
  `pids_limit` — o spec DEVE declarar esses requisitos para o compose/IaC do ERP-INFRA setá-los (CIS/Docker-Bench).
- **FR-007**: O processo DEVE caber no envelope de memória dos alvos (≈448 MB na VPS QA; 512 MB no sizing prod)
  via `NODE_OPTIONS` apropriado, sem OOM em uso normal.

**Config / env / secrets**
- **FR-008**: Toda configuração DEVE ser **server-only**, validada por **Zod fail-fast no boot**, **nunca** com
  prefixo `VITE_` (não pode ir ao bundle do browser).
- **FR-009**: O `.env.example` DEVE documentar o **contrato de env**: **base URL(s) do core-api**
  (`CORE_API_URL` + adicionais se houver — ex.: pública/interna ou v1/v2) como **env server-side runtime**
  (trocar DNS = mudar env + restart, **sem recompilar**); `LOG_LEVEL`/`NODE_ENV` opcionais; e os **slots
  futuros** do catálogo do ERP-INFRA que o BFF lerá (`JWT_SIGNING_KEY`, `SESSION_SECRET`,
  `OIDC_CLIENT_ID/SECRET`) — marcados como roadmap. **(D9.)**
- **FR-010**: Segredos DEVEM ser geridos por **Docker secrets-file** na QA (já no compose do ERP-INFRA) e por
  **AWS Secrets Manager** na prod, injetados em env no startup (docs/secrets.md); **nunca** segredo na imagem
  nem no git. **(D4 — segue o catálogo do ERP-INFRA; ADR só se divergir.)**

**Borda / proxy / TLS / CORS**
- **FR-011**: A borda DEVE ser o **único serviço exposto**, terminar **TLS** (ACME), **redirecionar
  HTTP→HTTPS**, e garantir que o browser fale **só com o web** (o core-api nunca é exposto à internet).
- **FR-012**: O web/BFF **NÃO DEVE** emitir CORS (`Access-Control-*`) — **invariante same-origin** (OWASP:
  desabilitar CORS quando não há chamada cross-origin esperada); jamais `*` nem refletir `Origin`.
- **FR-029**: Mesmo com o **core-api exposto via HTTPS**, o **browser do front NÃO DEVE** chamá-lo diretamente —
  toda chamada client→core-api passa pela **server function** (BFF), preservando §III/§IX/ADR-0005 e a postura
  **same-origin sem CORS**. As base URLs do core-api são consumidas **só server-side** (D9, FR-009).
- **FR-013**: O proxy de borda DEVE ser **Caddy** (ACME maduro, TLS automático — confirmado pela fonte fria),
  com timeouts `read_header`/`read_body` (anti-slowloris). Reavaliar Traefik só se rate-limit nativo na borda
  virar requisito duro. **(D5 — vira ADR.)**
- **FR-014**: Rate-limit na borda DEVE ser provido pelo **AWS WAF** (prod) + throttle de login do core-api (já
  existe, `AUTH_LOGIN_RATE_LIMIT`); a borda QA fica **sem** rate-limit. **(D5.)**

**Segurança HTTP (headers) & sessão**
- **FR-015**: Toda resposta DEVE carregar o conjunto atual de headers (CSP com nonce per-request, HSTS
  condicional a `x-forwarded-proto`, `nosniff`, `frame-ancestors 'none'`, `Referrer-Policy`) — já implementado
  em `src/shared/http/security-headers.ts` + `src/start.ts` (ADR-0006).
- **FR-016**: O conjunto de headers DEVE ser estendido com `Cross-Origin-Opener-Policy: same-origin`,
  `Cross-Origin-Resource-Policy: same-origin`, `Permissions-Policy` (desligar APIs não usadas) e
  `Cache-Control: no-store` em respostas sensíveis (OWASP Secure Headers). **(D6 — amenda ADR-0006.)**
- **FR-017**: O token **nunca** DEVE chegar ao browser; a sessão DEVE ser um cookie **opaco** `__Host-session`
  HttpOnly, Secure, **SameSite=Strict**, com CSRF same-origin — confirmado por OWASP Session/CSRF + OAuth 2.0 BCP.

**Observabilidade**
- **FR-018**: O app DEVE emitir **logs estruturados JSON em stdout** (1 evento/linha) com, no mínimo,
  `timestamp`, `level`, `service` (=`web-app`), `request_id`, `message`; com **redaction** (sem token/PII).
  Hoje o pino já emite JSON+redaction (ADR-0014) — **gap**: garantir os campos `service` e `request_id`.
- **FR-019**: O app DEVE expor `/health` (**liveness**, não toca o backend — já existe) e **adicionar
  `/ready`** (**readiness**: config carregada + core-api alcançável → 200, senão 503) para o LB/orquestrador.

**Debug seguro em produção (D8)**
- **FR-024**: Em erro, a UI DEVE exibir uma **mensagem genérica + um `reference id`** curto e não-sensível
  (= `request_id`); o **detalhe** (stack/causa) vive só no log server-side (OWASP Error Handling / RFC 7807).
  A UI **nunca** expõe stack/status HTTP/detalhe técnico.
- **FR-025**: Os logs DEVEM carregar `request_id` **e** `trace_id` (W3C `traceparent` propagado BFF→core-api)
  para correlação ponta-a-ponta; a **redaction** DEVE excluir token/cookie/senha/segredo/PII/host interno e
  stack em `info`/`warn` (MASTG-0022 + OWASP "data to exclude").
- **FR-026**: O nível de log default em prod DEVE ser `info`; debug verboso DEVE ser **gated + time-boxed**
  (mudança de config controlada — OWASP "customizable logging"), **nunca** ligado por padrão nem por toggle público.
- **FR-027**: O acesso a logs/traces/dashboards DEVE ser **apenas por canal privado** — **Tailscale** (QA) /
  rede privada + IAM (prod) — e DEVE ser **registrado**; nada de painel de observabilidade exposto na internet.
- **FR-028** *(faseado — Fase 1, pós-MVP)*: o sistema DEVE ganhar **tracing OpenTelemetry** (trace_id nos logs
  via `instrumentation-pino`; spans BFF→core-api) com backend **self-hosted no tailnet** (SigNoz ou Grafana
  Loki+Tempo) e **error tracking GlitchTip self-hosted** (Sentry-compat) com scrubbing de PII. **Avança o ADR-0014.**

**CI/CD**
- **FR-020**: A imagem DEVE ser **buildada no GitHub Actions** e publicada no ghcr (`:qa` + `:sha-<short>`);
  os ambientes **só puxam**, nunca compilam. O `deploy-qa.yml` atual (referencia o `web.Dockerfile` deletado)
  DEVE ser reconciliado/recriado coerente.
- **FR-021**: O **escopo de propriedade** é: este repo = **imagem + CI + prontidão do app**;
  `compose`/`Caddyfile`/IaC **permanecem no ERP-INFRA**. **(D1.)**
- **FR-022**: A **autenticação de deploy** DEVE ser, na QA, via **Tailscale** (a VPS está no tailnet) em vez de
  SSH público com chave longeva; e, na prod, via **GitHub OIDC→AWS** sem chave longeva (OWASP CICD-SEC-6).
  **(D7 — vira ADR.)**
- **FR-023**: O workflow DEVE pinar actions de terceiros por **commit SHA** (CICD-SEC-8), usar `GITHUB_TOKEN`
  de **permissão mínima**, e não rodar código de PR de fork com segredos (CICD-SEC-4 / PPE).

### Artefatos-chave *(em vez de entidades de dados — esta feature é de infra)*

- **Imagem do web-app**: artefato OCI imutável publicado no ghcr; identidade por digest; consumido por QA e prod.
- **Contrato de env**: conjunto de variáveis server-only validadas no boot (`.env.example` é a fonte da forma).
- **Slots de secret**: nomes/propósitos no catálogo do ERP-INFRA; valores só no Secrets Manager (nunca no repo).
- **Endpoints operacionais**: `/health` (liveness) e `/ready` (readiness).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A imagem de produção tem **0 vulnerabilidades High/Critical** no scan e tamanho compatível com o
  alvo (distroless/hardened reduz vs alpine) — medível no CI.
- **SC-002**: Boot com env inválido **falha em < 2s** com mensagem clara (exit ≠ 0); boot válido fica `ready`
  em tempo previsível.
- **SC-003**: **0 segredos na imagem** e **0 variáveis `VITE_` com segredo** (verificável por scan + lint
  `no-secrets`).
- **SC-004**: **100% das respostas** carregam o conjunto de headers de segurança (teste de governança
  estende `tests/shared/http/security-headers.test.ts`).
- **SC-005**: **Nenhum** access/refresh token observável no browser (cookies/payload) — auditável.
- **SC-006**: `/health` responde 200 independente do core-api; `/ready` reflete a dependência (200/503) e o LB
  tira de rota quando 503.
- **SC-007**: O container passa os checks relevantes do **CIS/Docker-Bench** (non-root, no-new-privileges,
  cap_drop, read-only fs, pids_limit).
- **SC-008**: Deploy é **reproduzível por digest** e o **rollback** é apontar um digest anterior — sem rebuild.

## Impacto Arquitetural (web-app / BFF) *(obrigatório — toca `src/` + infra)*

- **Módulo(s) vertical(is) afetado(s)**: **nenhum módulo novo**. Toca transversais: `src/start.ts` (headers),
  `src/shared/http/security-headers.ts` (novos headers), `src/external/config/env.config.ts` (contrato de env),
  `src/external/logging/` (campos `service`/`request_id`), `src/routes/health.tsx` + novo `src/routes/ready`.
  Fora de `src/`: `web.Dockerfile`, `.dockerignore`, `.env.example`, `.github/workflows/`.
- **Server functions novas/alteradas (Princ. III)?**: nenhuma server fn de negócio. `/ready` é **server
  route** (não server-fn) — endpoint operacional, não fronteira de dados.
- **Integração core-api**: `/ready` checa **alcance** do `CORE_API_URL` (não compõe dados). A server fn segue
  a única fronteira client↔server (§III intacta).
- **Novos agregados / Value Objects?**: nenhum (feature de infra; `EnvConfig` já é Readonly + Result).
- **Eventos no client (Event Bus)?**: nenhum.
- **Design System**: nenhum átomo/molécula novo.
- **Possíveis violações da constituição (I–XII)?**: nenhuma esperada — a feature **reforça** §IX (token nunca
  no browser, CSP/headers, secrets) e §V (cadeia de erro/observabilidade). Atenção: manter o env loader como
  borda (throw só no boot, §II) e não vazar segredo em log (§IX).

## Assumptions

- **ERP-INFRA é dono** do `compose.yaml`/`Caddyfile`/IaC; este repo entrega **imagem + CI + prontidão do app**
  (a confirmar em FR-021).
- **Produção = AWS gerenciada (Codebit)**; o corte atual é **single-instance** (QA Magalu), então **sessão
  in-memory é aceitável** agora — store compartilhado (Valkey) fica adiado, alinhado ao ADR-0030 do core-api.
- **Montar do zero** (não recuperar a infra antiga deletada na faxina); usar a stack atual + contrato do core-api.
- **Cada `[NEEDS CLARIFICATION]` resolvido vira um ADR** (FR-004 base-image, FR-005 attestations, FR-010
  secrets, FR-013/014 borda/rate-limit, FR-016 headers, FR-022 deploy-auth).

## Out of Scope

- **IaC da AWS** e provisionamento (responsabilidade do time de infra / Codebit); este repo não cria Terraform/k8s.
- **Recriar `docker-compose`/`Caddyfile`** neste repo (vivem no ERP-INFRA).
- **Tracing OpenTelemetry + error tracking (GlitchTip self-hosted)** — **faseados (Fase 1, pós-MVP — D8)**, não fora de escopo.
- **Métricas `/metrics` Prometheus + dashboards/alerting de maturidade plena** — incrementais (ADR-0014 fase 2).
- **Store de sessão compartilhado / multi-instância (HA)** — adiado até a 2ª réplica (alinha ADR-0030 do core-api).
- **Mudanças no core-api** ou no fluxo de login OIDC (Zitadel) — roadmap separado.
- **Anonimização de dump / dados de staging** (ERP-INFRA + security).
