[← Voltar para ADRs](./README.md)

# ADR-0017: Borda HTTPS = Caddy; rate-limit no WAF (prod) + throttle do core-api

- **Status:** Accepted
- **Date:** 2026-06-24
- **Deciders:** Gabriel Aderaldo (Tech Lead) + assistente
- **Feature:** `specs/035-prod-deploy-hardening/` (D5) · **Pesquisa:** `research.md` R4

---

## Contexto

A arquitetura exige uma **borda única exposta** que termina TLS, redireciona HTTP→HTTPS e carimba security
headers (defesa em camadas com o middleware do BFF — ADR-0006). A topologia tem **duas situações**: QA
single-node (Docker Compose na VPS Magalu, ERP-INFRA) e produção AWS (LB + WAF). O `Caddyfile`/compose vivem
no **ERP-INFRA** (D1), mas a **escolha** da borda é decisão arquitetural.

A fonte fria (`reverse-proxy`, comparando Pingora/Caddy/Traefik/Envoy — research R4):
- **Caddy**: HTTPS automático (ACME o mais maduro), HTTP→HTTPS automático, manipulação de headers nativa,
  timeouts anti-slowloris (`read_header`/`read_body`); **sem rate-limit nativo** (precisa plugin/custom build).
- **Traefik**: rate-limit e security-headers como middleware nativo. **Pingora**: rate-limiter é biblioteca
  (Rust). **Envoy**: filtros completos, mas peso de service-mesh — desproporcional para uma borda única.

## Decisão

A borda é **Caddy** (TLS automático/ACME), com timeouts `read_header`/`read_body` (anti-slowloris). O
**rate-limit** fica fora da borda: **AWS WAF** na produção + o **throttle de login do core-api**
(`AUTH_LOGIN_RATE_LIMIT`, já existente) como defesa em profundidade; a borda de **QA** não faz rate-limit.

## Consequências

**Positivas**
- Simplicidade e TLS automático maduro, sem plugin nem build customizado de proxy.
- Headers redundantes na borda complementam a CSP dinâmica do BFF (ADR-0006).

**Negativas / custos**
- Sem rate-limit na borda de QA. Mitigação: WAF na prod + lockout/throttle de login no core-api.

**Ponto de troca / reversibilidade**
- Se rate-limit **na borda** virar requisito duro, trocar para **Traefik** (nativo) ou **Caddy + plugin** é
  uma mudança **localizada na borda** (config no ERP-INFRA), sem tocar no app.

## Alternativas consideradas

| Alternativa | Por que rejeitada |
|---|---|
| Traefik agora | Troca o que já funciona (Caddy/ACME) sem necessidade dura; reservado p/ quando rate-limit na borda for requisito. |
| Pingora / Envoy | Complexidade desproporcional para uma borda única (lib em Rust / service-mesh). |
| Rate-limit na borda já | Redundante com WAF (prod) + throttle do core-api; custo sem ganho no estágio atual. |

## Referências

- `specs/035-prod-deploy-hardening/research.md` R4 · `spec.md` FR-011/013/014
- ADR-0006 (security headers/CSP — defesa em camadas) · core-api `AUTH_LOGIN_RATE_LIMIT`
- reverse-proxy MCP (Caddy: automatic-https, caddyfile/options) · ERP-INFRA `platform/vps-qa/Caddyfile`
