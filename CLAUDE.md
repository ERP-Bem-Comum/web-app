# CLAUDE.md

@AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`erp-financeiro-frontend` — Next.js App Router frontend para o ERP Financeiro. Consome uma API REST (NestJS) em `NEXT_PUBLIC_API_URL` (default `http://localhost:3003`).

> A documentação extensa fica em `DOCUMENTACAO_TECNICA.md`. **Atenção:** as versões listadas lá (Next 13.4, React 18, TS 5.7, etc.) estão defasadas — confie no `package.json` para versões. A descrição arquitetural também é parcial: lá ainda fala de Axios, lodash, file-saver, highcharts etc.; tudo isso saiu (ver "Dependências removidas" abaixo).

## Commands

**Package manager: pnpm** (fixado em `package.json` via `packageManager: pnpm@10.28.1`). Node 24.15+ via `engines`.

```bash
pnpm install            # instala deps
pnpm dev                # dev server (porta 3000) — Next 16 + Turbopack
pnpm build              # build de produção (Next standalone)
pnpm start              # serve o build
pnpm lint               # eslint .  (flat config em eslint.config.mjs)
pnpm format             # prettier --write .
pnpm format:check       # prettier --check .
docker compose up -d    # build/run do frontend em container
```

Não há suíte de testes configurada (sem Jest/Vitest/Playwright). **Não invente comando `pnpm test`.**

## Arquitetura — o que não dá pra inferir lendo um arquivo só

### Stack e camadas

```
src/app/                Next.js App Router (rotas, layouts, page.tsx)
src/components/         UI — ui/ (shadcn), layout/ (form fields, charts), e pastas por domínio
src/contexts/           Estado global por feature (approvals, cnab, contracts, payables, receivables)
src/hooks/              Hooks de domínio (useApprovals, usePayableContext, etc.) — orquestram React Query + contexts
src/services/           Camada HTTP. Um arquivo por recurso. Único lugar que faz chamada HTTP.
src/types/, enums/, validators/, utils/   Espelham serviços/recursos.
src/configurations/     colors.ts + globalZodConfig.ts (mensagens PT-BR para Zod)
lib/                    react-query.ts (QueryClient singleton) e utils.ts (cn de Tailwind)
handbook/               Refs oficiais (docker/, nodejs/, pnpm/, typescript/, eslint/) usadas pelos agents/skills do .claude/. Também tem protótipos HTML standalone soltos na raiz.
```

### App Router — route groups

`src/app/` usa route groups (parênteses) extensivamente para agrupar layouts sem afetar URL:

- `(auth)/` — login, recuperar-senha, nova-senha
- `(main)/` — área autenticada, com sub-grupos `(financeiro)`, `(contracts)`, `(reports)`, `(configuracoes)`, `(plano-orcamentario)`, `(gestao-parceiros)`, `(gestao-programa)`, `(gestao-usuario)`
- Rotas públicas fora de `(main)`: `/aprovar/acesso/[id]`, `/colaboradores/cadastro-completo`, `/consolidado-compartilhado`, `/plano-orcamentario-compartilhado` (fluxos de aprovação e visualização externa sem login).

### Estado — três camadas combinadas

1. **React Query** (`@tanstack/react-query`) é o estado de servidor — todo dado de API passa por ele. `queryClient` singleton em `lib/react-query.ts`, instanciado em `src/components/Providers.tsx`.
2. **React Contexts** em `src/contexts/` para estado cross-componente de uma feature (filtros, seleção em massa, estado de fluxo). Cada um tem hook companheiro em `src/hooks/`.
3. **React Hook Form + Zod** para estado local de formulário. `src/configurations/globalZodConfig.ts` define mensagens padrão em PT-BR — importe-o no boot dos forms.

### HTTP — `fetch` nativo via wrapper próprio

> **Axios saiu do projeto.** Tudo passa por `src/services/http-client.ts` (wrapper sobre `fetch`).

- `src/services/http-client.ts` exporta `createHttpClient({ baseURL, onRequest, onUnauthorized })` que devolve um cliente com `.get/.post/.put/.patch/.delete<T>(url, body?, config?)`. Retorna `{ data, status, statusText, headers }` (shape compatível com `AxiosResponse`). Em erro HTTP joga `HttpError` com `.response.{status,data,headers}` — narrow com `isHttpError(e)`.
  - Suporta `params` (query string), `headers`, `responseType: 'blob' | 'json' | 'text' | 'arraybuffer'`, `signal: AbortSignal`, `validateStatus`.
  - **FormData auto-detect**: se o `Content-Type` for `multipart/form-data` e o body for objeto, o wrapper monta o `FormData` (replicando o antigo `formDataAxiosTransformer`) e remove o header (browser define o boundary).
- `src/services/http-status.ts` exporta `HttpStatusCode` (drop-in para o enum que vinha do axios).
- **Três instâncias** no `src/services/`:
  - `api.ts` — autenticada via NextAuth (injeta `Bearer ${session.user.token}`); logout em 401 + `data.message === 'Unauthorized'`.
  - `apiOptions.ts` — Bearer se houver sessão NextAuth, senão Basic via cookies `ApprovalsPayableId` + `ApprovalsPassword` (fluxo de aprovação externa).
  - `apiShared.ts` — Basic auth via cookies `shareUsername` + `sharePassword` (fluxo de planejamento orçamentário compartilhado).
- Cada serviço (`src/services/payables.ts`, `contracts.ts`, etc.) chama `api.get/post/...` e devolve `Promise<T>` direto — quem orquestra estado é o React Query nos hooks.
- Ao adicionar endpoints novos: escreva manual em `src/services/<recurso>.ts` seguindo o mesmo padrão dos vizinhos. Sem geração de código.

### Utilidades nativas (substituíram libs)

- `src/utils/debounce.ts` — substitui `lodash-es#debounce`. API mínima sem `leading`/`trailing`/`maxWait`.
- `src/utils/saveBlob.ts` — substitui `file-saver#saveAs`. `URL.createObjectURL` + `<a download>`.
- `src/utils/cookies.ts` — substitui `nookies`. `parseCookies`/`setCookie`/`destroyCookie` com a mesma assinatura (primeiro parâmetro `_ctx` ignorado; só client-side via `document.cookie`).

### Autenticação

- NextAuth (Credentials provider) em `src/app/api/auth/[...nextauth]/route.ts`. `authorize()` chama `Login()` (que bate em `POST /login` do backend) e guarda `{ user, token }` na sessão JWT (`maxAge: 8h`).
- O `onRequest` hook do `api` em `src/services/api.ts` chama `getSession()` e injeta `Authorization: Bearer ${session.user.token}` em toda requisição.
- O `onUnauthorized` hook faz **`signOut({ callbackUrl: '/login' })` em 401 com `data.message === 'Unauthorized'`** — qualquer mudança no formato de erro do backend quebra esse fluxo.
- **⚠️ AUTH BYPASS está LIGADO.** `src/utils/authBypass.ts` exporta `AUTH_BYPASS_ENABLED = true`. Quando ligado, `getSession()` é ignorado e uma sessão fake (`token: 'dev-bypass-token'`) é usada — útil em dev, **perigoso em produção**. Antes de qualquer build de release, garanta que essa flag está `false`.

### Tooling — modo frouxo

O projeto está configurado em modo permissivo. Não conte com a tipagem pra te avisar:

- `next.config.js`: `typescript.ignoreBuildErrors: true` + `images.unoptimized: true`.
- `tsconfig.json`: `strict: false`, `noImplicitAny: false`, `target: "es5"`, `forceConsistentCasingInFileNames: false`, `module: "esnext"`, `moduleResolution: "bundler"`.
- `pnpm lint` é o que sobra de checagem automática — rode antes de afirmar que algo "passa".
- ESLint flat config em `eslint.config.mjs`: `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript` + `eslint-config-prettier/flat`. Ignora `handbook/**` e `public/**`. **Sem `@rocketseat/eslint-config`** (saiu na migração para Next 16 + flat config).
- Prettier 3 (`.prettierrc` ou defaults): `prettier-plugin-tailwindcss` ordena classes automaticamente.

### Estilo — Tailwind 4 + shadcn + MUI

- **Tailwind 4** (`tailwindcss@4.3.0` + `@tailwindcss/postcss`). Config CSS-first em `src/styles/globals.css` via `@import "tailwindcss"` + `@theme { ... }`. Há também um `tailwind.config.ts` legado (Tailwind 4 ainda aceita) para keyframes custom e plugin de utilitários (`reconciled-border`, `future-border`).
- **`postcss.config.js`**: só `'@tailwindcss/postcss': {}` — sem `autoprefixer` (Lightning CSS do Turbopack já faz autoprefix; ver `node_modules/next/dist/docs/01-app/03-api-reference/08-turbopack.md`). **Sem `postcss` declarado** como dep da raiz: vem como dep transitiva do `@tailwindcss/postcss`.
- **Animações** (`animate-in`, `fade-in-*`, `slide-*`, `zoom-*` usados pelo shadcn) vêm de `tw-animate-css` via `@import "tw-animate-css";` no `globals.css` (substituiu `tailwindcss-animate` que era do Tailwind 3).
- **shadcn/ui** (`components.json`, baseColor `slate`, alias `@/components`, `@/lib/utils`). Componentes shadcn ficam em `src/components/ui/`.
- **MUI** (`@mui/material` + `@mui/icons-material` + `@mui/x-date-pickers` + `@emotion/react` + `@emotion/styled`) coexiste com shadcn — formulários e date pickers usam MUI; cards/buttons/dialogs novos tendem a shadcn. Antes de criar um componente, procure o equivalente em `src/components/ui/` e `src/components/layout/`.

### Charts — recharts canônico

- **`recharts`** é o único pacote de charts no projeto. `highcharts`/`highcharts-react-official`/`chart.js` saíram. Usa `BarChart`/`LineChart`/`PieChart`/`ReferenceLine`/`Brush`/`Cell` etc.
- Wrapper `src/components/ui/chart.tsx` (shadcn) expõe `ChartContainer`/`ChartTooltip`/`ChartTooltipContent` para padronizar tooltips. Charts genéricos em `src/components/layout/charts/`.

### Geração de arquivos client-side

- `jspdf` + `html-to-image` para export de PDF a partir de DOM (`src/utils/export-pdf.ts`). `html-to-image#toCanvas` substituiu `html2canvas` (que estava sendo importado mas nunca esteve no `package.json`).
- `src/utils/saveBlob.ts` para qualquer download de blob (CSV, PDF baixado do backend, etc.).

### Ícones

- **Coexistência** de `react-icons` (~86 arquivos) e `lucide-react` (~39 arquivos). **Para componentes novos, prefira `lucide-react`** (tree-shaking melhor, naming via export). A consolidação não foi feita.

### Path aliases

`tsconfig.json` define:

- `@/*` → `./src/*` (forma canônica, **use essa**)
- `@components/*`, `@utils/*` → apontam para caminhos **absolutos quebrados** (`/src/...` com barra inicial). **Não use.**
- `@public/*` → `./public/*`

### Variáveis de ambiente

`.env.example` lista as obrigatórias. As `NEXT_PUBLIC_*` são injetadas em **build time** — no Docker, passe via `--build-arg` (já configurado no `docker-compose.yml`). `NEXT_PUBLIC_API_URL` no compose default aponta pro mock Prism (`:4010`), mas esse mock é dívida técnica a remover — use o backend real (`http://localhost:3003`) sobrescrevendo a variável.

### Convenções

- Idioma do código: nomes técnicos e identificadores em inglês; cópia de UI, comentários de domínio e enums de status em PT-BR (ex.: `enums/payables.ts`).
- Estrutura espelhada: ao criar um recurso novo (ex.: `Foo`), normalmente cria-se `services/foo.ts`, `hooks/useFoo.ts`, `types/foo.ts`, `validators/foo.ts`, `enums/foo.ts` (quando aplicável) e a página em `src/app/(main)/(grupo)/foo/`.

## Dependências removidas (poda 2026-05)

Saíram durante a poda em 6 ondas (consulte os helpers que substituíram antes de reintroduzir qualquer uma):

| Removida | Substituto |
| --- | --- |
| `axios` | `src/services/http-client.ts` + `src/services/http-status.ts` |
| `chart.js` | Recharts (era zero uso) |
| `firebase-admin`, `firebase-functions` | Zero uso. Hosting Firebase usa `frameworksBackend` no `firebase.json` — não exige esses pacotes |
| `sharp` | Zero uso (`next.config.js` tem `images.unoptimized: true`) |
| `react-loading` | `Loader2` de `lucide-react` |
| `tailwindcss-animate` | `tw-animate-css` (sucessor oficial para Tailwind 4) |
| `autoprefixer`, `postcss` (raiz) | Lightning CSS (Turbopack); `@tailwindcss/postcss` traz `postcss` como transitiva |
| `lodash-es`, `@types/lodash-es` | `src/utils/debounce.ts` + inline (typeof/Array.isArray/Number.isNaN/spread) |
| `file-saver`, `@types/file-saver` | `src/utils/saveBlob.ts` |
| `nookies`, `@types/cookie` | `src/utils/cookies.ts` |
| `highcharts`, `highcharts-react-official` | Recharts |
| `html2canvas` (era usado, nunca esteve declarado) | `html-to-image#toCanvas` |

## Dívida técnica conhecida (a remover)

Itens vestigiais a serem arrancados em janelas de cleanup:

- **`AUTH_BYPASS_ENABLED = true`** em `src/utils/authBypass.ts` — virar flag de env restrita a `NODE_ENV !== 'production'`.
- **TS frouxo** — `tsconfig.json` (`strict: false`, `target: "es5"`) + `next.config.js` (`typescript.ignoreBuildErrors: true`, `images.unoptimized: true`).
- **Path aliases quebrados** — `@components/*` e `@utils/*` no `tsconfig.json` têm `/src/...` com barra inicial. Remover ou consertar.
- **`lang="en"`** em `src/app/layout.tsx` — UI é PT-BR, trocar.
- **Conflito de ícones** — `react-icons` (86 arquivos) ainda coexiste com `lucide-react` (39). Consolidar em lucide.
- **ESLint vs eslint-config-next 16** — peer warns de `eslint-plugin-import`/`react`/`jsx-a11y` que ainda não declararam suporte a ESLint 10. Build passa; lint roda; mas o warning aparece toda vez.
- **Mock Prism `:4010`** no `docker-compose.yml` default — usar backend real.
