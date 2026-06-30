# web-app — Front + BFF (TanStack Start)

Front + **BFF unificado** do ERP Bem Comum (frontend v2). Stack: **TanStack Start** (Vite + Nitro) ·
React 19 · TypeScript strict · pnpm 11 · vanilla-extract · Zod 4. O browser nunca fala com o `core-api`
direto — toda comunicação passa pela **server function** (a única fronteira).

> **Contexto canônico (humanos e agentes de IA):** [`AGENTS.md`](./AGENTS.md) — arquitetura, invariantes
> (§I–§XII), ADRs ([`handbook/adr/`](./handbook/adr/)) e roteamento. `CLAUDE.md` é um stub que o importa.

## Desenvolvimento local

A stack local completa (MySQL + MinIO + `core-api` + `web` + Caddy) vive no repositório **ERP-INFRA**, não
aqui — este repo entrega apenas a **imagem** (ADR-0001 do ERP-INFRA). No mono_repo (ERP-INFRA irmão deste):

```bash
cd ../ERP-INFRA/local && ./up.sh     # → https://app.localhost  (HMR via target `dev` da imagem)
./down.sh                            # para (./down.sh -v zera os volumes)
```

Sem o mono_repo, rode só o app contra um `core-api` alcançável:

```bash
pnpm install
CORE_API_URL=http://localhost:3001/api/v2 pnpm dev   # → http://localhost:3000
```

> Boot **fail-fast** (ADR-0020): sem `CORE_API_URL` válida, o servidor encerra no boot (não sobe quebrado).

## Build & deploy

- **Imagem**: [`web.Dockerfile`](./web.Dockerfile) — multi-stage, runtime **distroless** non-root (ADR-0015);
  `pnpm build` → `.output` (servidor Nitro self-contained).
- **CI**: [`build-publish.yml`](./.github/workflows/build-publish.yml) publica
  `ghcr.io/erp-bem-comum/bemcomum-web:qa` (provenance + SBOM); [`deploy-qa.yml`](./.github/workflows/deploy-qa.yml)
  faz o deploy via **Tailscale**. O ambiente **só puxa** a imagem — nunca compila (ADR-0018).
- **Observabilidade** (ADR-0019): logs JSON em stdout; `X-Request-Id` em toda resposta; `/health` (liveness)
  e `/ready` (readiness).

## Comandos

| Comando | O quê |
|---|---|
| `pnpm dev` · `build` · `start` | dev (HMR) · build · servir `.output` |
| `pnpm verify` | **gate**: typecheck + lint + testes (`node:test`) |
| `pnpm test:dom` | testes DOM (Vitest + jsdom) |
| `pnpm test:e2e` | Playwright (regressão visual; baseline `-linux`) |
