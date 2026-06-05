# syntax=docker/dockerfile:1.10
#
# Front + BFF (TanStack Start + Nitro) — multi-stage.
# Modelo: core-api/Dockerfile (digest-pin, non-root, signal-safe, BuildKit cache).
#
#   base    → node 24 alpine (digest-pin) + tini + pnpm via corepack
#   deps    → pnpm install (frozen, ignore-scripts) com supply-chain de pnpm-workspace.yaml
#   build   → pnpm build → .output (servidor Nitro standalone, self-contained)
#   dev     → target de desenvolvimento (HMR via bind-mount no compose.override)
#   runtime → imagem final mínima, non-root, roda node .output/server/index.mjs
#
# Atualizar digest: docker buildx imagetools inspect node:24-alpine --format '{{.Manifest.Digest}}'
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1 — base ───────────────────────────────────────────────────────────
FROM node:24-alpine@sha256:2bdb65ed1dab192432bc31c95f94155ca5ad7fc1392fb7eb7526ab682fa5bf14 AS base
RUN apk add --no-cache tini
# packageManager em package.json fixa pnpm@11.5.0; corepack lê dele.
RUN corepack enable && corepack prepare pnpm@11.5.0 --activate
WORKDIR /app

# ── Stage 2 — deps ───────────────────────────────────────────────────────────
# pnpm-workspace.yaml é OBRIGATÓRIO: carrega minimumReleaseAge / trustPolicy / allowBuilds.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod=false --ignore-scripts

# ── Stage 3 — build ──────────────────────────────────────────────────────────
FROM deps AS build
COPY . .
RUN pnpm build

# ── Stage 4 — dev ────────────────────────────────────────────────────────────
# Usado pelo compose.override com bind-mount de ./src. node_modules vem da imagem.
FROM deps AS dev
ENV NODE_ENV=development
EXPOSE 3000
COPY . .
ENTRYPOINT ["tini", "--"]
CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "3000"]

# ── Stage 5 — runtime (produção) ─────────────────────────────────────────────
FROM base AS runtime
LABEL org.opencontainers.image.title="bemcomum-web" \
      org.opencontainers.image.description="ERP Bem Comum — Front + BFF (TanStack Start)." \
      org.opencontainers.image.vendor="Envolve / Bem Comum" \
      org.opencontainers.image.licenses="proprietary" \
      org.opencontainers.image.base.name="docker.io/library/node:24-alpine"

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Nitro empacota tudo em .output (self-contained, sem node_modules — verificado).
COPY --from=build /app/.output ./.output

ARG APP_UID=10001
ARG APP_GID=10001
RUN addgroup -S -g ${APP_GID} app \
 && adduser -S -u ${APP_UID} -G app -h /app -s /sbin/nologin app \
 && chown -R app:app /app
USER app:app

EXPOSE 3000
STOPSIGNAL SIGTERM

# /health não toca o backend (src/routes/health.tsx) — alvo de liveness ideal.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["node","-e","fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

ENTRYPOINT ["tini", "--", "node", ".output/server/index.mjs"]
