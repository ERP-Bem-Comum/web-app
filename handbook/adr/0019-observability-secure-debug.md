[← Voltar para ADRs](./README.md)

# ADR-0019: Observabilidade para debug seguro em produção (correlation-id + OTel faseado + self-hosted no tailnet) — avança o ADR-0014

- **Status:** Accepted
- **Date:** 2026-06-24
- **Deciders:** Gabriel Aderaldo (Tech Lead) + assistente
- **Feature:** `specs/035-prod-deploy-hardening/` (D8) · **Pesquisa:** `research.md` R5, R9
- **Relacionado:** **avança** [ADR-0014](./0014-structured-logging-bff.md) (logging estruturado; telemetria adiada) — **não o superseda**

---

## Contexto

O ADR-0014 adotou `pino` (logs JSON server-side, redaction) e **adiou** telemetria (traces/métricas). Surgiu
um requisito explícito do Tech Lead: **debugar produção de forma rápida e fácil, porém totalmente segura** —
o que exige uma resposta além do log reativo.

A tensão central: **acesso rápido ao detalhe** × **nunca vazar o detalhe**. As fontes frias resolvem com um
padrão consagrado (research R5/R9):
- **OWASP Error Handling / REST:** resposta **genérica** ao usuário (sem stack/internals), detalhe **server-side**
  (RFC 7807).
- **OWASP Logging / Logging Vocabulary / MASTG-0022:** **correlation id** ("interaction identifier"), redaction
  (excluir token/cookie/segredo/PII/host interno; sem stack em info/warn), nível ajustável **sem desativar** o
  log, **proteger** o acesso aos logs (restringir + registrar).
- **OWASP CICD-SEC-10:** centralizar e **alertar**.
- **ERP-INFRA `docs/observability.md`:** baseline stdout JSON, `/health`+`/ready`, OTel vendor-neutral, sampling por ambiente.

Fato da infra: VPS de QA e backends ficam **no tailnet** → existe um canal **privado** pronto para acesso.

## Decisão

**Avançar** o roadmap do ADR-0014 (sem contradizê-lo), em duas ondas:

**Agora (junto da feature 035):**
- **Correlation/reference-id ponta-a-ponta:** `request_id` (do `x-req-id` do Nitro) — e um slot `trace_id` —
  em todo log; em erro, a **UI mostra mensagem genérica + o reference id** (sem stack/status/detalhe).
- **Redaction estendida** (token/cookie/senha/segredo/PII/host interno; sem stack em info/warn).
- **Nível default `info`**; debug verboso **gated + time-boxed** (mudança de config controlada), nunca por toggle público.
- **Acesso a logs/dashboards só por canal privado:** **Tailscale** (QA) / rede privada + IAM (prod); acesso **registrado**.

**Fase 1 (pós-MVP):**
- **OpenTelemetry**: `@opentelemetry/instrumentation-pino` injeta `trace_id` nos logs; spans no `src/start.ts`;
  propagação `traceparent` (W3C) BFF→core-api.
- **Backend self-hosted no tailnet:** **SigNoz** ou **Grafana (Loki+Tempo)** — dados **na própria infra**.
- **Error tracking GlitchTip self-hosted** (compatível com SDK Sentry), com scrubbing de PII (`beforeSend`),
  anexando `request_id`/`trace_id`.

## Consequências

**Positivas**
- Triagem **rápida** por reference-id (1 lookup → detalhe/trace), sem vazar nada ao client.
- Dados de observabilidade **ficam na infra** (privacidade/LGPD); acesso por identidade (tailnet/IAM).
- OTel é vendor-neutral: troca de backend sem reescrever a instrumentação.

**Negativas / custos**
- Operar a stack self-hosted (SigNoz/Grafana + GlitchTip) tem custo de infra/manutenção.

**Neutras / ponto de troca**
- Métricas (`/metrics`) e alerting de maturidade plena seguem **incrementais** (ADR-0014 fase 2).
- O backend é trocável (OTLP padrão) — SigNoz↔Grafana é decisão tática.

## Alternativas consideradas

| Alternativa | Por que rejeitada |
|---|---|
| SaaS (Datadog/Sentry cloud) | Dados saem da infra + custo recorrente; tailnet + self-hosted preserva privacidade. |
| Só logs, sem trace | Insuficiente para "debug rápido" cross-serviço (BFF↔core-api). |
| Expor dashboard publicamente | Aumenta superfície; viola "acesso restrito a logs" (OWASP). |
| Debug remoto (`--inspect`) exposto | RCE se exposto; só admissível efêmero **dentro** do tailnet. |

## Referências

- ADR-0014 (logging estruturado; roadmap de telemetria) · `specs/035-prod-deploy-hardening/research.md` R5/R9
- OWASP: Logging / Logging Vocabulary / Error Handling cheat sheets · MASTG-0022 · CI/CD CICD-SEC-10
- ERP-INFRA `docs/observability.md` · constituição §V (cadeia de erro), §IX (não vazar segredo/PII)
- `spec.md` FR-018/019/024–028
