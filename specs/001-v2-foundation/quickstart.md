# Quickstart — Fundação Técnica do v2

## Pré-requisitos

- pnpm (nunca npm/yarn). Deps já instaladas (`node_modules` presente).
- Stack Docker local opcional (mysql + core-api + caddy) — já rodando neste ambiente.

## Subir o app (após a implementação)

### Modo dev local (HMR rápido — recomendado no dia a dia)

```bash
# 1. Expor o core-api ao host (uma vez): adicionar ao serviço core-api no docker-compose.yml:
#      ports:
#        - '3001:3000'
#    e recriar: docker compose up -d core-api
# 2. .env: CORE_API_URL=http://localhost:3001/api/v2
pnpm dev            # → http://localhost:3000
```

### Modo dev dockerizado (paridade com produção)

```bash
docker compose up -d            # web deixa de crashar quando src/ existir
# acessar via Caddy:
#   https://app.localhost          → front + BFF
#   https://api.localhost/docs     → Swagger do core-api (DEV-ONLY)
# BFF usa CORE_API_URL=http://core-api:3000/api/v2 (rede interna)
```

## Validar (quality gate)

```bash
pnpm lint          # boundaries (modules/shared/external) + MVVM + invariantes TS
pnpm typecheck     # tsc --noEmit
node --test        # testes puros de shared/ e external/ (quando criados)
pnpm build         # build de produção (.output/)
```

## Critérios de aceite verificáveis

- [ ] `pnpm dev` sobe em `:3000`; rota `/` renderiza (SSR) sem erro (SC-001, FR-001).
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` passam (SC-002, FR-016/017/003).
- [ ] `result-fetch` retorna `Result` em 2xx/4xx/5xx/timeout/abort — nunca lança (SC-003, FR-011/012).
- [ ] Toda variante de `HttpError` tem tradução p/ `AppError` e p/ status (SC-004, FR-008/013).
- [ ] Inspeção do browser: nenhum token/segredo/URL do backend visível (SC-005, FR-015).
- [ ] Esboço de módulo consumindo só `shared`/`external`/`public-api` não dispara erro de boundary (SC-006).

## Credenciais de dev (core-api semeado)

`admin@bemcomum.dev` / `DevPassw0rd!2024` (usado pela feature Auth, próxima spec).
