# ERP Frontend

Frontend do sistema ERP financeiro, construido com [Next.js](https://nextjs.org/) (App Router) e [TypeScript](https://www.typescriptlang.org/).

## Funcionalidades

- Gestao de contas a pagar com fluxo de aprovacao/rejeicao
- Gestao de contratos, fornecedores e centros de custo
- Planos orcamentarios e acompanhamento financeiro
- Importacao de dados via Excel
- Dashboards com graficos e indicadores
- Gestao de usuarios e perfis de acesso
- Exportacao de relatorios (PDF, CSV)

## Tech Stack

- **Framework:** Next.js (App Router)
- **Linguagem:** TypeScript
- **UI:** Material UI + TailwindCSS
- **Formularios:** React Hook Form + Zod
- **Data Fetching:** TanStack Query (React Query) + Axios
- **Autenticacao:** NextAuth.js
- **Graficos:** Recharts, Chart.js, Highcharts
- **Package Manager:** pnpm

## Pre-requisitos

- [Node.js](https://nodejs.org/) v24+ (use `nvm use` para alinhar com `.nvmrc`)
- [pnpm](https://pnpm.io/) v10+ (habilite via `corepack enable` ou instale globalmente)
- Backend rodando

## Instalacao

1. Clone o repositorio:

```bash
git clone <url-do-repositorio>
cd frontend
```

2. Instale as dependencias:

```bash
pnpm install
```

3. Configure as variaveis de ambiente:

```bash
cp .env.example .env.local
```

Edite o `.env.local` com as configuracoes do seu ambiente:

| Variavel | Descricao | Exemplo |
|----------|-----------|---------|
| `NODE_ENV` | Ambiente de execucao | `development` |
| `NEXT_PUBLIC_API_URL` | URL do backend | `http://localhost:3003` |
| `NEXTAUTH_URL` | URL do frontend (para NextAuth) | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Chave secreta do NextAuth | Gere com `openssl rand -base64 32` |
| `NEXT_PUBLIC_DOMAIN_URL` | Dominio para otimizacao de imagens | `localhost` |
| `NEXT_PUBLIC_MAX_UPLOAD_MB` | Tamanho maximo de upload (MB) | `10` |
| `NEXT_PUBLIC_MAX_IMPORT_MB` | Tamanho maximo de importacao (MB) | `10` |

4. Certifique-se de que o **backend esta rodando** antes de iniciar o frontend.

## Executando

```bash
# Desenvolvimento (com hot-reload)
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000).

```bash
# Producao
pnpm build
pnpm start
```

## Scripts disponiveis

| Comando | Descricao |
|---------|-----------|
| `pnpm dev` | Inicia servidor de desenvolvimento |
| `pnpm build` | Compila para producao |
| `pnpm start` | Inicia servidor de producao |
| `pnpm lint` | Executa o linter |

## Docker

### Subir com Docker Compose

1. Edite as variaveis no `docker-compose.yml` (ou defina `NEXT_PUBLIC_API_URL` no ambiente).

2. Suba o container:

```bash
docker compose up -d
```

O frontend estara disponivel em [http://localhost:3000](http://localhost:3000).

> O backend precisa estar rodando para o frontend funcionar.

### Build manual (sem docker-compose)

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3003 \
  --build-arg NEXTAUTH_URL=http://localhost:3000 \
  --build-arg NEXTAUTH_SECRET=sua-chave-secreta \
  --build-arg NODE_ENV=production \
  -t erp-frontend .

docker run -p 3000:3000 erp-frontend
```

> **Nota:** As variaveis `NEXT_PUBLIC_*` precisam ser passadas como `--build-arg` porque o Next.js as injeta no bundle durante o build.

## Estrutura do Projeto

```
src/
  app/
    (auth)/              # Paginas de autenticacao (login, recuperar senha)
    (main)/              # Paginas principais (protegidas)
      (financeiro)/      # Modulo financeiro (cartao, conciliacao)
      (contracts)/       # Gestao de contratos
      (reports)/         # Relatorios
      (configuracoes)/   # Configuracoes do sistema
    api/                 # API routes (NextAuth)
  components/            # Componentes reutilizaveis
  services/              # Servicos de comunicacao com a API (Axios)
  lib/                   # Configuracao de bibliotecas (React Query)
  utils/                 # Funcoes utilitarias
public/
  images/                # Imagens estaticas
```

## Licenca

Este projeto e open source.
