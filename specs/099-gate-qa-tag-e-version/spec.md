# 099 — O gate de QA passa a valer: tag `:qa` condicionada + `/version`

**Tamanho:** M · **Status:** implementado · **Data:** 2026-08-10
**Origem:** investigação do run [31351504428](https://github.com/ERP-Bem-Comum/web-app/actions/runs/31351504428) (web-app + ERP-INFRA)

## Problema

O gate `Scan da imagem (Trivy — falha em HIGH/CRITICAL, SC-001)` reprovava toda promoção para
`develop` desde 28/07 — e **não segurava nada**.

1. O `push` da imagem roda **antes** do Trivy. A tag flutuante `:qa` era publicada junto com a
   `sha-…`, então a imagem reprovada já virava `:qa`.
2. `/opt/erp-qa/.env` consome `WEB_IMAGE=…bemcomum-web:qa`, e o `deploy.sh` da VPS dá `pull` na stack
   inteira. Esse `deploy.sh` é chamado **também** pelo `deploy-qa.yml` do **core-api** (branch `dev`).
3. Resultado: o front reprovado subia em QA de carona a cada merge no back — 27 deploys verdes do
   core-api entre 28/07 e 10/08. O gate protegia só o _job_ `deploy-qa` do repo do web.
4. E ninguém tinha como saber qual build estava rodando em QA: não existia endpoint de revisão.
5. Agravante: 12 promoções falharam sem ninguém notar. Cada merge dispara dois runs e o `CI` fica
   verde; só o `build-publish` quebrava.
6. Descoberto no caminho: **PR nenhum do front rodava CI**. O `ci.yml` disparava em `pull_request`
   para `[develop, main]`, mas todo PR do front vai para `go-live-front`.

## Escopo

| #   | Entrega                                       | Onde                                       |
| --- | --------------------------------------------- | ------------------------------------------ |
| P1  | `:qa` só é promovida **depois** do gate verde | `.github/workflows/build-publish.yml`      |
| P2  | `/version` devolve a revisão em execução      | `src/routes/version.ts` + `web.Dockerfile` |
| P3  | Falha do `build-publish` abre/comenta issue   | `.github/workflows/build-publish.yml`      |
| P4  | `ci.yml` roda em PR para `go-live-front`      | `.github/workflows/ci.yml`                 |

**Fora de escopo:** o re-pin da base (P0) saiu no PR #335. Renovate no digest do `FROM` fica para
follow-up. A ausência de Trivy no `core-api` é do outro repo.

## Critérios de aceite

- [x] Gate vermelho → `:qa` continua apontando para a última build verde
- [x] Gate verde → `:qa` aponta para o digest recém-escaneado, com provenance/SBOM preservados
- [x] `GET /version` → `200 {"revision":"<sha>"}`, `cache-control: no-store`
- [x] Sem build-arg (fora do CI), a revisão é `dev` — nunca um SHA mentiroso
- [x] Falha do `build-publish` deixa rastro humano (issue), não só um X no Actions
- [x] PR para `go-live-front` roda typecheck + lint + testes

## Riscos assumidos

**O gate passa a bloquear de verdade.** Antes, uma CVE da base não impedia a P.O. de validar em QA
(o front subia de carona). Agora impede. É o comportamento correto, mas o custo de um gate vermelho
deixa de ser invisível — por isso P3 e P4 entram **junto** com P1, não depois.
