# Research — Infra de produção do web-app (035)

> **Método (a pedido do Tech Lead):** as decisões abaixo foram pesquisadas nas **fontes frias** (MCPs do
> tailnet) — `docker-docs` (doc oficial Docker/Compose), `reverse-proxy` (Pingora/Caddy/Traefik/Envoy),
> `security` (OWASP cheatsheets/CI-CD-Top10/OAuth-BCP/Docker-Bench-CIS) — buscando práticas **melhores e mais
> seguras**, não replicar a infra antiga (feita antes dos MCPs). Ver [[mcps-frios-autoridade-infra]].
> Fontes de verdade do projeto: repo **ERP-INFRA** e **core-api@dev** (ADR-0021, 0005, 0030).

## Resumo executivo

A infra antiga (deletada na faxina + `ERP-INFRA/platform/vps-qa`) já acertou muita coisa (multi-stage,
non-root, digest pin, secrets-file, Caddy ACME, pino JSON, `__Host-session`, sem CORS). A pesquisa fria
aponta **deltas de endurecimento** que viram os `[NEEDS CLARIFICATION]` do `spec.md`. Nada exige trocar a
arquitetura — só elevar o nível de segurança/cadeia de suprimentos.

---

## R1 — Base da imagem (→ FR-004)

**Achado (docker-docs):** "escolha uma base mínima; use uma imagem para build e outra (mais magra) para
produção — reduz superfície de ataque". O `.output` do Nitro é **self-contained** (JS puro, **sem
node_modules em runtime**), então não há dependência nativa que exija glibc/alpine.

**Melhor/mais seguro:** **distroless** (`gcr.io/distroless/nodejs24`) ou **Docker Hardened Image** — non-root
por padrão, **sem shell** (menos superfície), e nosso `HEALTHCHECK` já é via `node` (compatível, não precisa
de `curl`/`wget`). Trade-off: debug mais difícil (sem shell).

**Recomendação:** distroless/hardened no `runtime`; manter alpine/slim só no estágio de build. Vira ADR.

- https://docs.docker.com/build/building/best-practices/ (Choose the right base image; Pin base image versions)

## R2 — Cadeia de suprimentos da imagem (→ FR-005)

**Achado (docker-docs):** templates de build-policy de produção validam **provenance attestations** e que a
imagem foi **buildada por CI confiável**; "Docker Hardened Images são permitidas por digest pois trazem
attestations". O workflow antigo usava `provenance: false`.

**Melhor/mais seguro:** ligar **provenance + SBOM** no `build-push`; avaliar **cosign** + policy que exige
proveniência. Tags são mutáveis → **pinar por digest** (também no compose, ver R6).

**Recomendação:** provenance+SBOM já; cosign/policy como reforço. Vira ADR.

- https://docs.docker.com/build/policies/examples/ (Image attestation and provenance)
- https://docs.docker.com/build/policies/validate-images/

## R3 — Hardening de runtime / container (→ FR-006, SC-007)

**Achado (security/Docker-Bench-CIS + docker-docs):** CIS Docker Benchmark v1.6.0 — restringir capabilities
(`--cap-drop=all` e readicionar só o necessário; 5.4), manter **seccomp default** (bloqueia syscalls
perigosas), e o Compose suporta `read_only`, `tmpfs`, `pids_limit`, `cap_drop`, `security_opt`. O compose QA
antigo tinha `no-new-privileges`+`mem_limit`, mas **faltavam** `cap_drop`/`read_only`/`pids_limit`.

**Recomendação (a aplicar no compose/IaC do ERP-INFRA; o app só precisa ser compatível):** `cap_drop: [ALL]`
(liga na 3000, não precisa capability), `read_only: true` + `tmpfs:/tmp`, `pids_limit`, `no-new-privileges`,
seccomp default. Rodar o **docker-bench** como verificação.

- https://github.com/docker/docker-bench-security (tests/5_container_runtime.sh — 5.4 capabilities)
- https://docs.docker.com/reference/compose-file/services/ (pids_limit, tmpfs, read_only)
- https://docs.docker.com/engine/security/seccomp/

## R4 — Proxy de borda + rate-limit (→ FR-013, FR-014)

**Achado (reverse-proxy, compara os 4):**
- **Caddy**: HTTPS automático por padrão, ACME o mais maduro, HTTP→HTTPS automático; timeouts
  `read_header`/`read_body` mitigam slowloris; **matchers** `client_ip`/`remote_ip`; manipula headers nativo.
  **Não tem rate-limit no core** (precisa plugin community / build custom).
- **Traefik**: rate-limit e security-headers como **middleware nativo** (config).
- **Pingora**: rate-limiter existe mas é **biblioteca Rust** (você escreve código), não config.
- **Envoy**: rate-limit/bandwidth filters, mas peso de service-mesh — overkill p/ borda única.

**Recomendação:** manter **Caddy** (TLS automático, simples) + adicionar timeouts anti-slowloris. Rate-limit:
confiar no **AWS WAF** (prod) + throttle de login do core-api (já existe, `AUTH_LOGIN_RATE_LIMIT`); QA fica sem
rate-limit na borda. Trocar p/ Traefik só se rate-limit nativo na borda virar requisito duro. Vira ADR.

- https://caddyserver.com/docs/automatic-https · https://caddyserver.com/docs/caddyfile/matchers
- https://caddyserver.com/docs/caddyfile/options (timeouts read_header/read_body; proxy_protocol allow/deny)

## R5 — Headers de segurança HTTP (→ FR-015, FR-016)

**Achado (security/OWASP cheatsheets):** o builder atual (`security-headers.ts`) está **alinhado**: CSP+nonce
sem `unsafe-inline` em script-src, `frame-ancestors 'none'` (que **obsoleta** X-Frame-Options, mantido como
fallback), `Referrer-Policy: strict-origin-when-cross-origin`, `nosniff`, HSTS 2a. **`X-XSS-Protection`** deve
ser **omitido ou `0`** (já está omitido — correto).

**Deltas (OWASP Secure Headers + XS-Leaks):** adicionar **`Cross-Origin-Opener-Policy: same-origin` (COOP)**,
**`Cross-Origin-Resource-Policy: same-origin` (CORP)**, **`Permissions-Policy`** (desligar APIs não usadas) e
**`Cache-Control: no-store`** em respostas sensíveis.

**Recomendação:** adicionar COOP/CORP/Permissions-Policy + no-store; estender o teste de governança. Custo baixo.

- https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/XS_Leaks_Cheat_Sheet.html (COOP/CORP/Fetch-Metadata)
- https://owasp.org/www-project-secure-headers/

## R6 — CORS & same-origin (→ FR-012) — **confirmado**

**Achado (security/OWASP):** "Desabilite headers CORS se chamadas cross-domain não são esperadas"; "seja
específico; nunca `*` nem reflita `Origin`". Same-origin (protocolo+host+porta) é a defesa do browser.

**Conclusão:** como front+BFF são **a mesma origem** atrás de uma borda, o browser faz requisições
same-origin → **o web/BFF não precisa de CORS** (postura mais segura). O core-api (interno) mantém
`CORS_ORIGINS` vazio. Registrar como **invariante**.

- https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html (CORS)
- https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html (CORS)

## R7 — Sessão / BFF (→ FR-017) — **confirmado**

**Achado (security/OAuth-BCP + Session/CSRF cheatsheets):** tokens **MUST NOT** ir a URL/browser history;
manter server-side (padrão BFF). Cookie: prefixo **`__Host-`** (path=/, Secure, sem Domain), **HttpOnly**,
**`SameSite=Strict`** (preferível) — exatamente o `__Host-session` opaco do ADR-0005. CSRF: SameSite +
verificação de origem (Sec-Fetch) — já há `csrfMiddleware` + `csrf-origin`.

**Conclusão:** arquitetura de sessão atual **valida-se** como best-practice. Para o login OIDC futuro
(Zitadel): PKCE + `form_post response mode`.

- https://github.com/oauthstuff/draft-ietf-oauth-security-topics (A04 attacks-and-mitigations)
- https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html

## R8 — CI/CD & secrets (→ FR-020, FR-022, FR-023)

**Achado (security/OWASP CI/CD Top 10):**
- **CICD-SEC-6 (credential hygiene):** segredos longevos em env são roubados (Codecov etc.) → preferir
  **short-lived/OIDC**. O deploy antigo usa `DEPLOY_SSH_KEY` longevo.
- **CICD-SEC-8 (3rd party):** **pinar actions por commit SHA** (tags são mutáveis; o workflow antigo usa `@v6`).
- **CICD-SEC-4 (PPE):** não rodar código de PR de fork com segredos.

**Melhor/mais seguro:** **prod via GitHub OIDC→AWS** (sem chave longeva). **QA:** a VPS está no **tailnet**
(`erp-bem-comum-qa`), então deploy via **Tailscale** evita SSH público com chave longeva — alternativa mais
segura ao forced-command. Pinar actions por SHA; `GITHUB_TOKEN` mínimo. Secrets: catálogo do ERP-INFRA, prod
no **AWS Secrets Manager** injetado em env no startup; nunca na imagem/git.

- https://github.com/OWASP/www-project-top-10-ci-cd-security-risks (CICD-SEC-04/06/08)
- `ERP-INFRA/docs/secrets.md` (slots, "secrets chegam via env no startup"; proibido: secret na imagem/git)

## R9 — Observabilidade (→ FR-018, FR-019)

**Achado (ERP-INFRA/docs/observability.md):** baseline = stdout JSON (campos `timestamp`/`level`/`service`/
`request_id`/`message`); `/health` (liveness, sem deps) + `/ready` (readiness: DB/deps + config) consumidos
pelo orquestrador (liveness reinicia; readiness tira do LB). Métricas `/metrics` Prometheus + tracing OTel
são baseline, mas o web-app os **adiou** (ADR-0014).

**Gaps no web-app:** o pino já emite JSON+redaction; falta garantir **`service`** e **`request_id`** nos logs
e **criar `/ready`** (só existe `/health`). Métricas/OTel ficam como follow-up explícito.

- `ERP-INFRA/docs/observability.md` · web-app ADR-0014 (pino, telemetria adiada)

---

## Decisões já fechadas (não são NEEDS CLARIFICATION)

- **Disponibilidade:** instância única, downtime curto no restart → sessão in-memory aceitável; HA/Valkey
  adiado (alinha ADR-0030 do core-api).
- **Montar do zero:** não recuperar a infra deletada; reconstruir a partir da stack + contrato do core-api.
- **Imagem única** serve QA e prod; ambientes só fazem `pull` (nunca compilam).

## Pendência operacional

- **MCPs do tailnet** ficaram "connecting" no cliente até o handshake; exigem Tailscale ligado. Fallback de
  acesso direto documentado em `scratchpad/mcp.sh`. Ver [[mcps-frios-autoridade-infra]].
