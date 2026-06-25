[← Voltar para ADRs](./README.md)

# ADR-0016: Cadeia de suprimentos da imagem — provenance + SBOM attestations (cosign como reforço)

- **Status:** Accepted
- **Date:** 2026-06-24
- **Deciders:** Gabriel Aderaldo (Tech Lead) + assistente
- **Feature:** `specs/035-prod-deploy-hardening/` (D3) · **Pesquisa:** `research.md` R2, R8

---

## Contexto

O build de imagem anterior publicava com `provenance: false`. ADR-0003 endurece o supply-chain no nível de
**pacotes** (pnpm: frozen-lockfile, `minimumReleaseAge`, `--ignore-scripts`), mas **não** cobre a **imagem**
nem o **pipeline**. A fonte fria aponta a lacuna:

- `docker-docs` (research R2): build-policies de produção validam **provenance attestations** e que a imagem
  foi **buildada por CI confiável**; tags são mutáveis → referenciar por **digest**.
- OWASP CI/CD Top 10 (research R8): **CICD-SEC-8** (3rd-party/actions) e **CICD-SEC-6** (credential hygiene).

## Decisão

O build (GitHub Actions, `docker/build-push-action`) gera **provenance (SLSA) + SBOM attestations**; as
imagens são consumidas **por digest**; e adotamos **cosign** (assinatura) + uma **build-policy** que exige
proveniência de builder confiável como **reforço** (fase seguinte). Complementa o ADR-0003 (não o superseda).

## Consequências

**Positivas**
- Cadeia auditável fim-a-fim: dá para provar **quem** buildou e **o quê** está na imagem; detecta adulteração.
- Alinha o nível de imagem ao já feito em pacotes (ADR-0003).

**Negativas / custos**
- +tempo/complexidade no CI; cosign exige gestão de chave (preferir **keyless via OIDC** para não criar segredo longevo — ADR-0018).

**Neutras**
- O ghcr armazena as attestations junto da imagem; consumir por digest vira disciplina de deploy (rollback por digest).

## Alternativas consideradas

| Alternativa | Por que rejeitada |
|---|---|
| Manter `provenance: false` | Sem rastreabilidade; contraria a postura de supply-chain (ADR-0003). |
| Assinatura/registro manual | Frágil e fácil de esquecer; não é auditável de forma confiável. |
| Confiar só em scan de CVE | Scan ≠ proveniência; não prova origem nem integridade do build. |

## Referências

- `specs/035-prod-deploy-hardening/research.md` R2/R8 · `spec.md` FR-005/FR-023 · SC-001/SC-008
- ADR-0003 (supply-chain), ADR-0018 (OIDC no deploy) · constituição §VIII/§IX
- docker-docs: <https://docs.docker.com/build/policies/examples/> · <https://docs.docker.com/build/policies/validate-images/>
- OWASP CI/CD Top 10: CICD-SEC-8 / CICD-SEC-6
