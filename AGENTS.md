<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

## Projeto: `erp-financeiro-frontend`

Frontend Next.js 16 (App Router) / React 19 / TS 6 / Tailwind 4 que consome a API NestJS em `NEXT_PUBLIC_API_URL` (default `http://localhost:3003`).

### Antes de qualquer mudança

- **Leia `CLAUDE.md` na raiz** — é a fonte canônica de contexto do projeto (arquitetura, route groups, camadas de estado, padrões de auth, dívida técnica, lista das libs que já saíram nesta poda). Codex CLI: leia esse arquivo manualmente no início da sessão, já que `AGENTS.md` não suporta imports.
- Versões reais estão em `package.json` (Next 16.2.6, React 19.2.6, TS 6.0.3, Tailwind 4.3); `DOCUMENTACAO_TECNICA.md` está defasada e descreve Next 13 / React 18.
- Package manager fixo: **pnpm** (`packageManager: pnpm@10.28.1`, `engines.node: >=24.15.0`). **Não use `npm` nem `yarn`.**

### Avisos críticos

- ⚠️ `AUTH_BYPASS_ENABLED = true` em `src/utils/authBypass.ts`. **Nunca habilite isso em build de produção** — a sessão fake substitui `getSession()` quando ligado.
- TS está em modo frouxo (`strict: false`, `noImplicitAny: false`, `target: "es5"`, `typescript.ignoreBuildErrors: true`). Não confie só no compilador — rode `pnpm lint` antes de afirmar que algo "passa".
- Path alias canônico: `@/*` → `./src/*`. `@components/*` e `@utils/*` estão quebrados no `tsconfig.json`, **não use**.
- Não há suíte de testes (sem Jest/Vitest/Playwright). **Não invente `pnpm test`.**
- Variáveis `NEXT_PUBLIC_*` são injetadas em build time — no Docker, passe via `--build-arg`.

### Libs que JÁ SAÍRAM do projeto (não reintroduzir sem motivo forte)

Houve poda recente que removeu 14 deps. Antes de adicionar qualquer uma dessas, considere o substituto que já existe:

| Não use | Use |
| --- | --- |
| `axios` | `src/services/http-client.ts` (`createHttpClient`) + `src/services/http-status.ts` |
| `lodash-es#debounce` | `src/utils/debounce.ts` |
| `lodash-es#isBoolean/isNaN/isArray/isObject` | `typeof x === 'boolean'` / `Number.isNaN(x)` / `Array.isArray(x)` / `typeof === 'object' && x !== null` |
| `lodash-es#omit` | destructure: `const { keyToOmit: _, ...rest } = obj` |
| `file-saver` | `src/utils/saveBlob.ts` |
| `nookies` | `src/utils/cookies.ts` |
| `highcharts` / `highcharts-react-official` / `chart.js` | `recharts` (canônico) |
| `tailwindcss-animate` | `tw-animate-css` (já importado em `globals.css`) |
| `react-loading` | `Loader2` de `lucide-react` |
| `html2canvas` | `html-to-image#toCanvas` |
| `autoprefixer`, `postcss` (raiz) | Lightning CSS (Turbopack) cuida; `@tailwindcss/postcss` traz `postcss` como transitiva |
| `firebase-admin` / `firebase-functions` | Não eram usados; Firebase Hosting usa `frameworksBackend` no `firebase.json` |
| `sharp` | Não era usado (`images.unoptimized: true` no `next.config.js`) |

### Convenções

- Idioma: identificadores em inglês; cópia de UI, comentários de domínio e enums de status em PT-BR.
- **HTTP:** um arquivo por recurso em `src/services/`. **Único lugar que chama `fetch` é `src/services/http-client.ts`.** Os outros services consomem as instâncias `api`/`apiOptions`/`apiShared` exportadas de `api.ts`/`apiOptions.ts`/`apiShared.ts`. Hooks em `src/hooks/` orquestram React Query + contexts.
- **Estado:** React Query (servidor) + React Contexts (cross-componente por feature) + React Hook Form + Zod (forms). Importe `src/configurations/globalZodConfig.ts` no boot dos forms (mensagens PT-BR).
- **Estrutura espelhada:** novo recurso `Foo` → `services/foo.ts`, `hooks/useFoo.ts`, `types/foo.ts`, `validators/foo.ts`, `enums/foo.ts` (quando aplicável), e página em `src/app/(main)/(grupo)/foo/`.
- **UI:** shadcn (`src/components/ui/`) e MUI coexistem — formulários/date pickers tendem a MUI; cards/buttons/dialogs novos tendem a shadcn. Procure equivalente existente antes de criar.
- **Charts:** sempre `recharts`. Padrões em `src/components/layout/charts/` e wrapper shadcn em `src/components/ui/chart.tsx`.
- **Ícones:** para componentes novos, prefira `lucide-react` (consolidação com `react-icons` é dívida técnica).
- **Tailwind 4:** config CSS-first em `src/styles/globals.css` (`@import "tailwindcss"; @theme { ... }`). `tailwind.config.ts` ainda existe para keyframes/plugin custom. `tw-animate-css` provê `animate-in`/`fade-in-*`/`slide-*`/`zoom-*` usados pelo shadcn.

### Comandos

```bash
pnpm install            # instala deps
pnpm dev                # dev server (porta 3000, Turbopack)
pnpm build              # build de produção (standalone)
pnpm start              # serve o build
pnpm lint               # eslint . (flat config em eslint.config.mjs)
pnpm format             # prettier --write .
pnpm format:check       # prettier --check .
docker compose up -d    # build/run em container
```

### Como cada CLI consome este arquivo

- **Codex CLI (OpenAI)** lê `AGENTS.md` automaticamente, caminhando do git root até o cwd. Não suporta `@import` — leia `CLAUDE.md` manualmente quando precisar de mais detalhe.
- **Claude Code** lê `CLAUDE.md` automaticamente; ele importa este arquivo via `@AGENTS.md` no topo.
- **Gemini CLI (Google)** lê `GEMINI.md` automaticamente; ele importa este arquivo e o `CLAUDE.md` via Memory Import Processor (`@arquivo`).

### Camada Codex local

- Configuração repo-scoped do Codex fica em `.codex/config.toml`.
- Subagents customizados do Codex ficam em `.codex/agents/*.toml`.
- Skills repo-scoped do Codex ficam em `.agents/skills/*/SKILL.md`.
