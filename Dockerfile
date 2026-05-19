ARG NODE_ENV 
ARG NEXT_PUBLIC_API_URL 
ARG NEXTAUTH_SECRET 
ARG NEXTAUTH_URL

# Etapa 1: Build
FROM node:20 AS builder

ARG NODE_ENV 
ARG NEXT_PUBLIC_API_URL 
ARG NEXTAUTH_SECRET 
ARG NEXTAUTH_URL

ENV NODE_ENV=$NODE_ENV
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL

WORKDIR /app

# Copia os arquivos de dependência
COPY package.json yarn.lock ./

# Instala dependências (inclusive dev)
RUN yarn install --frozen-lockfile

# Copia o restante do projeto
COPY . .

# Compila o projeto Next.js
RUN yarn build

# Etapa 2: Runtime
FROM node:20-alpine AS runner

ARG NODE_ENV 
ARG NEXT_PUBLIC_API_URL 
ARG NEXTAUTH_SECRET 
ARG NEXTAUTH_URL

ENV NODE_ENV=$NODE_ENV
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL

WORKDIR /app

# Copia apenas o necessário
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "server.js"]
