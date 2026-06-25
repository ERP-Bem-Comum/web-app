# syntax=docker/dockerfile:1.10
#
# Front + BFF (TanStack Start + Nitro) — multi-stage. Runtime CHAINGUARD/WOLFI (ADR-0015).
#
#   base    → node 24 (toolchain de build) + pnpm via corepack          [digest-pin]
#   deps    → pnpm install (frozen, ignore-scripts) c/ supply-chain do pnpm-workspace.yaml (ADR-0003)
#   build   → pnpm build → .output (servidor Nitro node-server, SELF-CONTAINED, sem node_modules)
#   dev     → target de desenvolvimento (HMR; bind-mount de ./src vem do override do ERP-INFRA)
#   runtime → cgr.dev/chainguard/node (Wolfi, non-root 65532, zero-CVE), roda .output/server/index.mjs
#
# Por que Chainguard/Wolfi no runtime (ADR-0015): o `.output` do Nitro é JS puro (sem deps nativas em
# runtime), então a base pode ser mínima. A Chainguard patcha as CVEs da base muito mais rápido que o
# distroless Debian (que ficou com libssl3 vulnerável sem rebuild) — meta de zero HIGH/CRITICAL no Trivy.
# ⚠️ O tier free só publica :latest (hoje Node 26; Node 24 fixo exige Chainguard pago). O runtime roda o
# bundle portável do Nitro, então o major do Node do runtime ≠ do build (node:24) é aceitável.
# Healthcheck via `node` (sem curl/wget). Debug do container: via tailnet + logs/traces (ADR-0019).
#
# Atualizar digests:
#   docker buildx imagetools inspect node:24-bookworm-slim --format '{{.Manifest.Digest}}'
#   docker buildx imagetools inspect cgr.dev/chainguard/node:latest --format '{{.Manifest.Digest}}'
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1 — base (toolchain) ───────────────────────────────────────────────
FROM node:24-bookworm-slim@sha256:b31e7a42fdf8b8aa5f5ed477c72d694301273f1069c5a2f71d53c6482e99a2fc AS base
# packageManager em package.json fixa a versão; corepack lê dela.
RUN corepack enable && corepack prepare pnpm@11.5.0 --activate
WORKDIR /app

# ── Stage 2 — deps ───────────────────────────────────────────────────────────
# pnpm-workspace.yaml é OBRIGATÓRIO: carrega a política de supply-chain (minimumReleaseAge / trust /
# allowBuilds — ADR-0003). --ignore-scripts barra postinstall malicioso; --prod=false p/ ter o build.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod=false --ignore-scripts

# ── Stage 3 — build ──────────────────────────────────────────────────────────
FROM deps AS build
COPY . .
RUN pnpm build

# ── Stage 4 — dev (HMR) ──────────────────────────────────────────────────────
# Consumido pelo override do ERP-INFRA (build: target: dev) com bind-mount de ./src.
FROM deps AS dev
ENV NODE_ENV=development
EXPOSE 3000
COPY . .
CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "3000"]

# ── Stage 5 — runtime (produção, distroless) ─────────────────────────────────
FROM cgr.dev/chainguard/node:latest@sha256:05d2ed6a0b3e6d3b9ca1d7f0b76e88dd06b91fa95c4f1e849f99bba7bd5a21b8 AS runtime
LABEL org.opencontainers.image.title="bemcomum-web" \
      org.opencontainers.image.description="ERP Bem Comum — Front + BFF (TanStack Start)." \
      org.opencontainers.image.vendor="Envolve / Bem Comum" \
      org.opencontainers.image.licenses="proprietary" \
      org.opencontainers.image.base.name="cgr.dev/chainguard/node"

# NODE_OPTIONS: heap cap p/ caber no envelope do container (default seguro p/ ~512 MB de prod;
# o deploy (compose/IaC do ERP-INFRA) sobrescreve por ambiente — ex.: 288 na VPS QA de 448 MB).
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    NODE_OPTIONS="--max-old-space-size=384"

WORKDIR /app
# Nitro empacota tudo em .output (self-contained, sem node_modules). Owner = nonroot (uid 65532).
COPY --from=build --chown=65532:65532 /app/.output ./.output

# Non-root explícito (a tag :nonroot já usa 65532; reforço p/ CIS/Docker-Bench — ADR-0015).
USER 65532:65532
EXPOSE 3000
STOPSIGNAL SIGTERM

# Chainguard/Wolfi (zero-CVE): probe via node (sem curl/wget). /health não toca o backend
# (liveness — src/routes/health.tsx). O binário node fica em /usr/bin/node nesta base.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["/usr/bin/node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

# ENTRYPOINT herdada da base = ["/usr/bin/node"]; passamos o entry do Nitro como CMD.
CMD ["/app/.output/server/index.mjs"]
