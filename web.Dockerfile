# syntax=docker/dockerfile:1.10
#
# Front + BFF (TanStack Start + Nitro) — multi-stage. Runtime CHAINGUARD/WOLFI (ADR-0015).
#
#   base    → node 26.13 (toolchain de build) + pnpm via corepack       [digest-pin]
#   deps    → pnpm install (frozen, ignore-scripts) c/ supply-chain do pnpm-workspace.yaml (ADR-0003)
#   build   → pnpm build → .output (servidor Nitro node-server, SELF-CONTAINED, sem node_modules)
#   dev     → target de desenvolvimento (HMR; bind-mount de ./src vem do override do ERP-INFRA)
#   runtime → cgr.dev/chainguard/node (Wolfi, non-root 65532, zero-CVE), roda .output/server/index.mjs
#
# Por que Chainguard/Wolfi no runtime (ADR-0015): o `.output` do Nitro é JS puro (sem deps nativas em
# runtime), então a base pode ser mínima. A Chainguard patcha as CVEs da base muito mais rápido que o
# distroless Debian (que ficou com libssl3 vulnerável sem rebuild) — meta de zero HIGH/CRITICAL no Trivy.
# Healthcheck via `node` (sem curl/wget). Debug do container: via tailnet + logs/traces (ADR-0019).
#
# Versão do Node — a FONTE é o `.nvmrc` (CAS-108). Build e runtime estão no MESMO major, e
# `tests/architecture/node-version-single-source.test.ts` reprova divergência:
#   - base:    tag SEMPRE `major.minor` do `.nvmrc`; o digest fixa o patch.
#   - runtime: o tier free da Chainguard só publica `:latest`, então a tag não diz versão. O LABEL
#              `br.bemcomum.node.major` declara o major esperado, e o `build-publish.yml` roda `node --version`
#              dentro da imagem e barra a promoção da `:qa` se o major real divergir do `.nvmrc`.
#
# Atualizar digests:
#   docker buildx imagetools inspect node:26.13-bookworm-slim --format '{{.Manifest.Digest}}'
#   docker buildx imagetools inspect cgr.dev/chainguard/node:latest --format '{{.Manifest.Digest}}'
# Digests de 2026-11-12 (SGM #110338 — CAs eMudhra comprometidas; só Node novo remove a confiança):
#   base    → Node 26.13.1   ·   runtime → Node 26.13.1 (pacote apk nodejs-26 26.13.1-r0)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1 — base (toolchain) ───────────────────────────────────────────────
FROM node:26.13-bookworm-slim@sha256:5df79989ed685e09f0a98019db4cebfb22fb9df1a53c0161664a011f7ff6b0f1 AS base
# packageManager em package.json fixa a versão (com sha512); corepack lê dela e confere o hash.
# O Node 25+ deixou de distribuir o corepack ("Corepack will no longer be distributed starting with
# Node.js v25", nodejs.org/docs/v25 › corepack). A recomendação oficial é o módulo da comunidade (ADR-0023).
# Sem npm (ADR-0003): o tarball vem direto do registry e o BuildKit confere o sha256 ANTES de usar. É JS
# puro (independe da arquitetura) e não tem script de instalação. sha512 conferido contra o `integrity`
# do registry em 2026-11-12. Para atualizar: baixar o .tgz novo e trocar versão e `--checksum`.
ADD --checksum=sha256:9128cfe26aee0c99f4fc68c15c6b8b12309a68be0de2c012cdfea2a463cb722f \
    https://registry.npmjs.org/corepack/-/corepack-0.36.0.tgz /tmp/corepack.tgz
RUN mkdir -p /usr/local/lib/corepack \
    && tar -xzf /tmp/corepack.tgz -C /usr/local/lib/corepack --strip-components=1 \
    && rm /tmp/corepack.tgz \
    && ln -s /usr/local/lib/corepack/dist/corepack.js /usr/local/bin/corepack \
    && corepack enable \
    && corepack prepare pnpm@11.28.11 --activate
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
FROM cgr.dev/chainguard/node:latest@sha256:8828c6e74c782babb020e684f026a7747d91a0699e7f2a2163f905c47f65e4da AS runtime
LABEL org.opencontainers.image.title="bemcomum-web" \
      org.opencontainers.image.description="ERP Bem Comum — Front + BFF (TanStack Start)." \
      org.opencontainers.image.vendor="Envolve / Bem Comum" \
      org.opencontainers.image.licenses="proprietary" \
      org.opencontainers.image.base.name="cgr.dev/chainguard/node" \
      br.bemcomum.node.major="26"

# NODE_OPTIONS: heap cap p/ caber no envelope do container (default seguro p/ ~512 MB de prod;
# o deploy (compose/IaC do ERP-INFRA) sobrescreve por ambiente — ex.: 288 na VPS QA de 448 MB).
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    NODE_OPTIONS="--max-old-space-size=384"

WORKDIR /app
# Nitro empacota tudo em .output (self-contained, sem node_modules). Owner = nonroot (uid 65532).
COPY --from=build --chown=65532:65532 /app/.output ./.output

# Revisão embutida no BUILD (`/version` — FR-002). Tem que ser build-arg: o label OCI não é legível de
# DENTRO do container, e a env do compose diria só o que o deploy achou que subiu, não o que subiu.
# Declarado DEPOIS do COPY de propósito: um SHA novo a cada build não invalida a layer do `.output`.
ARG GIT_SHA=dev
ENV APP_REVISION=$GIT_SHA

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
