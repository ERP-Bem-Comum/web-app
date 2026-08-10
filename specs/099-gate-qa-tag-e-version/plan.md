# 099 — Plano

## P1 · `:qa` só com gate verde

Tirar `type=raw,value=qa` do `metadata-action` (fica só a `sha-…`, imutável) e promover a flutuante
**depois** do Trivy:

```yaml
- name: Promove a tag :qa (só depois do gate verde)
  run: |
    docker buildx imagetools create --tag ${{ env.IMAGE }}:qa ${{ env.IMAGE }}@${{ steps.build.outputs.digest }}
```

`imagetools create` é retag no registry — não rebuilda, não perde cache `gha`, e aponta para o mesmo
digest do índice, então **provenance e SBOM continuam válidos**.

**Alternativas rejeitadas:** inverter build/push (`load: true` + push depois) custa um rebuild ou o
carregamento da imagem no runner e resolve menos — a `sha-…` também sumiria do registry em caso de
falha, e é ela que dá rastreabilidade do que foi escaneado.

## P2 · `/version`

- `web.Dockerfile`, stage `runtime`: `ARG GIT_SHA=dev` + `ENV APP_REVISION=$GIT_SHA`, declarados
  **depois** do `COPY .output` — um SHA novo a cada build não invalida a layer do bundle.
- `build-push-action`: `build-args: GIT_SHA=${{ github.sha }}`.
- `src/routes/version.ts`: server route no molde do `/ready` (`server.handlers.GET` devolvendo
  `Response`), **sem component**. Page route não serve: `process.env` não existe no client e daria
  mismatch de hidratação.
- `APP_REVISION` fica **fora** do `EnvSchema`, pelo mesmo precedente documentado de `LOG_LEVEL`/
  `NODE_ENV` (`env.config.ts`): diagnóstico de camada baixa tem que responder mesmo se a config quebrar.

Por que build-arg e não label OCI: o label não é legível de dentro do container. Por que não a env do
compose: ela diria o que o deploy _achou_ que subiu, não o que subiu.

## P3 · Aviso de falha

Step `if: failure()` no fim do `build-push`, no mesmo molde do aviso da `TS_AUTHKEY`: procura issue
aberta com o título e comenta, ou cria. Exige `issues: write` — como o job não tinha bloco próprio de
`permissions`, ele foi criado repetindo o que era herdado + `issues: write` (least privilege mantido).

## P4 · CI nos PRs do front

`ci.yml`: `pull_request.branches: [go-live-front, develop, main]`.

## Validação executada

| O quê                                                                                                                      | Resultado                                                  |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `GET /version` em container sob restrições reais de QA (`--read-only --tmpfs /tmp --cap-drop ALL --memory 448m`, heap 288) | `200 {"revision":"abc123fake"}`, `cache-control: no-store` |
| Build sem `--build-arg`                                                                                                    | `APP_REVISION=dev`                                         |
| `/health` e HEALTHCHECK do Dockerfile                                                                                      | 200 · `Health=healthy`, 0 restarts, sem OOM                |
| Parse dos dois workflows + ordem dos steps, permissions, tags e build-args                                                 | conferido                                                  |
| `pnpm verify`                                                                                                              | 1728 testes, 0 falhas                                      |
| `pnpm test:dom`                                                                                                            | 108 arquivos, 640 testes, 0 falhas                         |

`src/app/routeTree.gen.ts` regenerado pelo build (não editado à mão).

## O que NÃO dá para validar antes do merge

O `build-publish.yml` só dispara em `push` na `develop`. A promoção da tag e o aviso de falha só se
provam na primeira promoção depois do merge. Mitigação: os steps foram mantidos triviais (um comando
cada) e o parse do YAML foi conferido.
