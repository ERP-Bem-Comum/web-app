# Contract — Health

## core-api (upstream)

- **Request**: `GET /health` (sem prefixo `/api/v2`)
- **Response**: `200 OK` · `{ "status": "ok" }`
- **Fonte**: `core-api/src/shared/http/app.ts:162`
- **Headers**: `/health` NÃO recebe `cache-control: no-store` (esse hook é restrito a `/api/v2`).

## Frontend BFF (esta fundação)

- **Rota de health própria** (FR-002, decisão F1): `routes/health.tsx` → `GET /health` no **front**, retornando/exibindo
  `{ "status": "ok" }`. Confirma que a aplicação (router + SSR + runtime) está no ar, **sem** depender do backend.
- A rota inicial (`/`, SSR) serve como **smoke** adicional: renderiza sem erro.
- **Não** proxia o `/health` do *backend* nesta fundação (decisão R2) — a rota de health do front reporta a saúde
  do próprio front. Proxy/agregação de health do backend fica para feature de observabilidade futura.
- Critério de aceite (US1): `pnpm dev` → `http://localhost:3000/` renderiza e `http://localhost:3000/health`
  responde saudável; `pnpm build` conclui.
