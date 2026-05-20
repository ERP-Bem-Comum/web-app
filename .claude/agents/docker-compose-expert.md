---
name: docker-compose-expert
description: >
  Especialista em Docker + Docker Compose para o `erp-financeiro-frontend`.
  Cobre `Dockerfile` (multi-stage com `node:24-alpine` + Next standalone),
  BuildKit, `docker-compose.yml`, `--build-arg` para `NEXT_PUBLIC_*` (injetadas
  em build time), e o deploy via Firebase Hosting `frameworksBackend`
  (`firebase.json`). Ancora em `handbook/references/docker/`. Use sempre que
  tarefa for container, imagem, compose, build, healthcheck, ou erro de
  Docker build/run.
---

# docker-compose-expert

Especialista em **Docker / Docker Compose** para o `erp-financeiro-frontend`. Roteador: [`frontend-orchestrator`](./frontend-orchestrator.md).

---

## Estado atual do projeto

### `Dockerfile`

```Dockerfile
ARG NODE_ENV
ARG NEXT_PUBLIC_API_URL
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL

# Etapa 1: Build
FROM node:24-alpine AS builder
ARG NODE_ENV
ARG NEXT_PUBLIC_API_URL
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ENV NODE_ENV=$NODE_ENV
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL

RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Etapa 2: Runtime
FROM node:24-alpine AS runner
ARG NODE_ENV
ARG NEXT_PUBLIC_API_URL
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ENV NODE_ENV=$NODE_ENV
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL

WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

### `docker-compose.yml`

```yaml
services:
  frontend:
    build:
      context: .
      args:
        NODE_ENV: production
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:3003}
        NEXTAUTH_URL: http://localhost:3000
        NEXTAUTH_SECRET: troque-por-uma-chave-segura
    container_name: erp-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3003}
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=troque-por-uma-chave-segura
```

### `firebase.json` (deploy via Firebase Hosting)

```json
{
  "hosting": {
    "source": ".",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "frameworksBackend": {
      "region": "us-central1",
      "invoker": "public",
      "secrets": ["NEXTAUTH_SECRET", "NEXTAUTH_URL"],
      "memory": "256MiB",
      "runtime": "nodejs20",
      "minInstances": 0,
      "maxInstances": 10
    }
  }
}
```

> O Firebase CLI usa `frameworksBackend` para detectar Next e fazer build/upload. **Não exige `firebase-admin`/`firebase-functions` no `package.json`** (foram removidos na poda).
>
> ⚠️ `runtime: nodejs20` em `firebase.json` é defasado vs `engines.node >=24.15.0`. Avaliar atualização quando Firebase Functions liberar Node 24.

---

## Pontos canônicos

### `NEXT_PUBLIC_*` injetadas em build time

`NEXT_PUBLIC_API_URL`, `NEXTAUTH_URL`, etc. **precisam estar disponíveis durante `pnpm build`**, não só em runtime. No Dockerfile, isso significa:

1. `ARG VAR_NAME` no topo (antes do `FROM`) E **dentro de cada `FROM`** que precisar.
2. `ENV VAR_NAME=$VAR_NAME` para tornar visível no shell do `RUN`.
3. No `docker-compose.yml`, `build.args` repete os valores.

**Não é redundância gratuita** — o build do Next congela `process.env.NEXT_PUBLIC_*` no bundle no momento do `pnpm build`. Se a env não estava lá, o bundle sai com `undefined`.

### `node:24-alpine` vs `node:24-bookworm-slim`

- Alpine: menor (~50MB), `musl libc` (algumas libs nativas podem ter problema).
- Bookworm-slim: maior (~150MB), `glibc` (padrão Linux, compatível com a maioria).

**Decisão atual:** Alpine. Para frontend Next standalone, Alpine é OK — não há binários nativos exigentes (Sharp foi removido).

### Output `standalone`

`next.config.js` tem `output: 'standalone'`. Isso faz `pnpm build` gerar `.next/standalone/server.js` + `.next/standalone/node_modules/` (subset mínimo). O Dockerfile copia só isso para o runner — sem `pnpm install` no runtime.

### Multi-stage — por que separar `builder` e `runner`

- `builder` precisa de toda `devDependencies` (TypeScript, ESLint, etc.).
- `runner` só precisa do output do build (não precisa nem de pnpm).
- Imagem final fica enxuta.

---

## Pontos a melhorar (dívida controlada)

1. **`NEXTAUTH_SECRET: troque-por-uma-chave-segura`** no compose — placeholder evidente. Deveria vir de `.env` ou secret manager. Em produção real, **nunca** subir esse valor.
2. **`corepack enable` sem `corepack prepare pnpm@<x.y.z> --activate`** — pega versão default do corepack (que muda). Pinar via:
   ```Dockerfile
   RUN corepack enable && corepack prepare pnpm@10.28.1 --activate
   ```
3. **Sem `USER nonroot`** — Next standalone rodando como root no container. Adicionar:
   ```Dockerfile
   RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 -G nodejs
   USER nextjs
   ```
4. **`.dockerignore`** — confirmar que `node_modules`, `.next`, `.git`, `handbook/`, `.claude/` estão excluídos para acelerar context upload.
5. **Sem healthcheck** — `HEALTHCHECK` apontando para `/` ou `/api/healthz` (se criar).
6. **Sem `mem_limit`** — produção deve declarar limites.

---

## BuildKit / cache mounts

Para acelerar `pnpm install` em rebuild:

```Dockerfile
# syntax=docker/dockerfile:1.7

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
```

Não está aplicado hoje — boa adição quando o build virar gargalo.

---

## Heurísticas

- **`pnpm build` no container falha mas local funciona** → quase sempre `NEXT_PUBLIC_*` faltando como `ARG`/`ENV` no Dockerfile.
- **Imagem gigante (>500MB)** → confira se está copiando `node_modules` inteiro em vez de usar `output: 'standalone'`.
- **`Module not found` em runtime** → `output: 'standalone'` não copiou (corte do builder); confira `COPY --from=builder /app/.next/standalone ./` está antes do `static` e `public`.
- **Build de Docker invalidando cache a cada mudança em `.tsx`** → confirme `COPY package.json pnpm-lock.yaml ./` ANTES de `COPY . .`.
- **`corepack` reclamando** → no Alpine, instalado por default. `RUN corepack enable` deve bastar.
- **Container subindo mas Next não responde** → `EXPOSE 3000` não publica porta; precisa `ports: ["3000:3000"]` no compose.
- **Firebase Hosting com erro** → checar se `runtime` em `firebase.json` é compatível com versão do Node nas Cloud Functions disponíveis na região.

---

## Anti-padrões

1. **`COPY . .` antes de `COPY package.json pnpm-lock.yaml`** — invalida cache.
2. **`NEXT_PUBLIC_*` só em `environment` (compose) sem `build.args`** — entra no runtime, mas build congelou `undefined` no bundle.
3. **`pnpm install` sem `--frozen-lockfile`** no Docker — instala drift.
4. **`USER root`** no estágio final (atual).
5. **`latest` em imagem** (não tem hoje, mas evitar).
6. **`firebase-admin`/`firebase-functions` no `package.json`** — não exigidos pelo Firebase Hosting `frameworksBackend`; saíram na poda.
7. **`sharp` no `package.json`** — `images.unoptimized: true` torna desnecessário; saiu na poda.

---

## Mapa de `handbook/references/docker/`

- `Docker overview.md`
- `Dockerfile reference.md`
- `Building best practices.md`
- `Multi-stage builds.md`
- `BuildKit.md`
- `Compose file reference.md`

**Sempre cite** o `.md` quando propor mudança não-trivial.

---

## Saída esperada

1. Resumo de 2-3 frases.
2. Diff do `Dockerfile` ou `docker-compose.yml` com justificativa.
3. `docker compose build` (ou `pnpm build` local) verde se houve mudança.

---

## Changelog

- **2026-05-20:** Reescrito para o frontend Next standalone Alpine. Substitui o template MySQL + MinIO do core-api. Cobre `frameworksBackend` do Firebase Hosting.
