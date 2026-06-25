[← Voltar para ADRs](./README.md)

# ADR-0015: Imagem de produção do web-app em base distroless/hardened (non-root, sem shell)

- **Status:** Accepted
- **Date:** 2026-06-24
- **Deciders:** Gabriel Aderaldo (Tech Lead) + assistente
- **Feature:** `specs/035-prod-deploy-hardening/` (D2) · **Pesquisa:** `research.md` R1

---

## Contexto

O web-app empacota, via Nitro, um diretório `.output` **self-contained** — JS puro, **sem `node_modules`
em runtime**. A imagem anterior (deletada na faxina) usava `node:24-alpine`. Restrições já fixas: ADR-0003
(supply-chain: digest pin, frozen-lockfile), constituição §VIII (mínimo de deps) e §IX (segurança por
construção). Forças em tensão: **superfície de ataque** × **debugabilidade** (shell no container) × **tamanho**.

A fonte fria (`docker-docs`, "Building best practices" — research R1) recomenda base **mínima** e separar a
imagem de build da de produção: "A small image with minimal dependencies can considerably lower the attack
surface." Como o runtime do web-app **não tem dependências nativas** (diferente do core-api, que usa
`bookworm-slim` por causa do esbuild/musl — ver Dockerfile do core-api), uma base sem shell é viável.

## Decisão

A imagem de **runtime** usa base **distroless** (`gcr.io/distroless/nodejs24`) **ou** uma Docker Hardened
Image — **non-root por padrão, sem shell, superfície mínima**. O build é **multi-stage** (`deps` → `build` →
`dev` → `runtime`), com o estágio de build em `node` slim/alpine (tem toolchain), e o `runtime` copiando só o
`.output`.

Detalhes:
- **Digest pin** da base (ADR-0003); atualização do digest é mudança revisada.
- `HEALTHCHECK` via **`node` fetch** a `/health` — não depende de `curl`/`wget` (ausentes em distroless).
- `STOPSIGNAL SIGTERM`; entrypoint Node direto (o `distroless/nodejs` encaminha sinais como PID 1).
- Estágio `dev` (HMR) preservado para o override do ERP-INFRA (paridade dev/prod).

## Consequências

**Positivas**
- Superfície de ataque mínima; **non-root** por construção; menos CVEs herdadas da base (§IX).
- Healthcheck via `node` já é o padrão do projeto — compatível sem ajustes.

**Negativas / custos**
- Sem shell ⇒ não há `docker exec sh` para debug ad-hoc. Mitigação: acesso a logs/traces via tailnet
  (ADR-0019) e, se necessário, uma *debug image* separada — nunca a de produção.
- Distroless exige acompanhar o digest e a cadência de updates da imagem.

**Neutras**
- O estágio de build continua "gordo" (toolchain), mas é descartado — não vai ao runtime.

## Alternativas consideradas

| Alternativa | Por que rejeitada |
|---|---|
| `node:24-alpine` no runtime | Traz shell + mais superfície; mantido **só** no estágio de build. |
| `node:24-bookworm-slim` no runtime | Maior; justificado no core-api (deps nativas), **desnecessário** aqui (Nitro `.output` é JS puro). |
| Chainguard Images | Equivalente a "hardened image" — aceitável; tratado como variante de FR-004, não rejeitado. |

## Referências

- `specs/035-prod-deploy-hardening/research.md` R1 · `spec.md` FR-001/004 · SC-001/SC-007
- ADR-0003 (supply-chain), constituição §VIII/§IX
- docker-docs: <https://docs.docker.com/build/building/best-practices/> (Choose the right base image; Pin base image versions)
- Referência local: `handbook/reference/docker/` · espelho de padrões: `core-api/Dockerfile` (multi-stage, non-root, digest pin)
