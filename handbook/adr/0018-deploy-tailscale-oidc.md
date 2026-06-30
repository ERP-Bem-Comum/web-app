[← Voltar para ADRs](./README.md)

# ADR-0018: Deploy sem segredo longevo — Tailscale (QA) + GitHub OIDC→AWS (prod gerenciada); actions por SHA

- **Status:** Accepted
- **Date:** 2026-06-24
- **Deciders:** Gabriel Aderaldo (Tech Lead) + assistente
- **Feature:** `specs/035-prod-deploy-hardening/` (D7) · **Pesquisa:** `research.md` R8

> **Emenda (2026-06-25):** reconciliado com **ERP-INFRA ADR-0002** (produção econômica em **AWS Lightsail
> single-node**, interina). O princípio "sem segredo longevo" e o SHA-pin permanecem; a produção **gerenciada**
> (OIDC→AWS/ECS) passa a ser explicitamente o **alvo de migração** (gatilhos do ADR-0002), não o baseline atual.

---

## Contexto

O fluxo de deploy anterior usava uma **chave SSH de longa duração** (`DEPLOY_SSH_KEY`) travada por
forced-command, e actions referenciadas por **tag** (`@v6`). A fonte fria (OWASP CI/CD Top 10 — research R8):

- **CICD-SEC-6 (credential hygiene):** segredos longevos em CI são exfiltrados (Codecov, Travis, etc.) →
  preferir credenciais **efêmeras/OIDC**.
- **CICD-SEC-8 (3rd-party):** **pinar actions por commit SHA** (tags são mutáveis).
- **CICD-SEC-4 (PPE):** não executar código de PR de fork com segredos.

Fato relevante da infra: a VPS de QA (`erp-bem-comum-qa`) **já está no tailnet** (Tailscale). A produção, no
baseline atual, é **AWS Lightsail single-node** (Docker Compose; ERP-INFRA ADR-0002); o alvo **gerenciado**
(ECS/RDS) só entra na migração (gatilhos do ADR-0002).

## Decisão

Deploy **sem segredo longevo**:
- **QA:** disparo via **Tailscale** — a VPS está no tailnet, então o deploy chega por identidade de
  dispositivo (ACL), **sem SSH público** com chave longeva.
- **Produção (baseline atual — ERP-INFRA ADR-0002, Lightsail single-node):** deploy por **script versionado**
  na instância (mesmo modelo do QA — imagens por digest, sem compilar no host); pode entrar pelo tailnet como o QA.
- **Produção gerenciada (alvo de migração):** **GitHub OIDC → AWS** (assume-role com credenciais efêmeras) —
  **sem** chave AWS de longa duração — quando a prod migrar para ECS/Fargate (gatilhos do ADR-0002).
- **Transversal:** actions de terceiros **pinadas por commit SHA**; `GITHUB_TOKEN` com **permissão mínima**;
  workflows não rodam PR de fork com segredos (anti-PPE). Rollback por **digest**.

## Consequências

**Positivas**
- Nenhum segredo de deploy de longa duração no repositório; acesso por **identidade** (tailnet/IAM), auditável.
- Reduz drasticamente o raio de impacto de um vazamento de secret de CI.

**Negativas / custos**
- Exige configurar ACL do tailnet (QA) e a role/trust OIDC na AWS (prod) — coordenação com o time de infra.

**Neutras**
- O `deploy-qa.yml`/`build-publish.yml` deste repo passam a ser reconciliados (o antigo referenciava a chave SSH).

## Alternativas consideradas

| Alternativa | Por que rejeitada |
|---|---|
| SSH público + chave longeva (forced-command) | CICD-SEC-6: segredo de longa duração; tailnet entrega acesso mais seguro. |
| Chave AWS de longa duração no CI | CICD-SEC-6: OIDC dá credencial efêmera, sem segredo armazenado. |
| Actions por tag (`@v6`) | CICD-SEC-8: tag é mutável; SHA é imutável. |

## Referências

- `specs/035-prod-deploy-hardening/research.md` R8 · `spec.md` FR-020/022/023
- OWASP CI/CD Top 10: CICD-SEC-4/6/8 · ADR-0016 (cosign keyless via OIDC) · constituição §IX
- ERP-INFRA `platform/vps-qa/` · `platform/aws-lightsail-prod/` · **ERP-INFRA ADR-0002** (Lightsail) · tailnet (`erp-bem-comum-qa`)
