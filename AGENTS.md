# AGENTS.md — web-app (TanStack Start · front + BFF)

> **Fonte de verdade única** para agentes de IA (Claude Code, Kimi, etc.). `CLAUDE.md` é um stub
> que importa este arquivo. Regras por camada vivem em `.claude/rules/`; o roteamento, em `.claude/agents/`.

## IMPORTANTE
- ❌ Nunca `npm`/`yarn`. **Sempre `pnpm`** (ADR-0003). O hook `PreToolUse(Bash)` bloqueia.
- A **server function é a ÚNICA fronteira** client↔server. O browser nunca fala com o `core-api`.
- **Token nunca no browser.** **Erros são valores** (`Result`), não exceções.

## O que é este repositório
Front + **BFF unificado** do ERP Bem Comum (frontend v2). Stack fixa (mudar exige ADR com `supersedes`):
**TanStack Start** (Vite + Nitro) · **React 19** · **TypeScript strict** (6→7) · **pnpm 11** ·
**vanilla-extract** · **Zod 4** · **TanStack Query/Router**. O BFF orquestra o `core-api` e entrega
uma resposta completa por caso de uso.

## Hierarquia de fontes (em conflito, vence a de cima)
1. `handbook/adr/` — 20 ADRs imutáveis (`README.md` tem o índice).
2. `.specify/memory/constitution.md` — princípios §I–§XII (v1.2.1).
3. `handbook/ARQUITETURA.md` + `src/modules/auth/` (a **feature-modelo** em código).
4. `eslint.config.js` + `tsconfig.json` — **autoridade executável** (se o texto divergir, o lint vence).
5. `.claude/rules/*` → `.claude/agents/*` → skills.

## Idioma
Código e identificadores em **EN**; texto ao humano via **i18n (PT)**; documentação e commits em **PT**;
erros internos em `kebab-case` EN; eventos no passado (EN).

## Invariantes (§I–§XII — resumo; texto integral na constituição)
| § | Princípio | Em uma linha |
|---|---|---|
| I | Vertical-modular | feature = fatia vertical; import externo só por `public-api` |
| II | Erros como valores | `Result<T,E>`; `throw` só na borda; `QueryError` é a única `Error` |
| III | Server fn = única fronteira | o BFF compõe e entrega a `fn` completa; o client não compõe |
| IV | Estados ilegais irrepresentáveis | branded types + smart constructors; união discriminada + `switch` |
| V | Cadeia de erro fim-a-fim | a UI nunca olha status HTTP; `401` num lugar só |
| VI | TS estrito e apagável | `strict` + `erasableSyntaxOnly`; sem `any`/`enum`/`namespace` |
| VII | Imutabilidade por padrão | `Readonly<>`, `as const`, `immutable()` |
| VIII | Mínimo de deps + supply-chain | pnpm 11; prefira o nativo |
| IX | Segurança por construção | token nunca no browser; cookie `__Host-session` opaco; Zod na borda; CSP |
| X | Design system só-tokens | vanilla-extract; proibido hex/px cru; Atomic Design |
| XI | MVVM + views burras | ViewModel orquestra; View só apresenta; server-state ≠ UI-state |
| XII | Reatividade por eventos | Event Bus; eventos no passado; emissor e ouvinte não se conhecem |

## Pipeline spec-kit (escala por tamanho — skill `pipeline-maestro`)
- **S** (fix pontual): nota no PR/commit; ADR só se houver decisão.
- **M** (feature pequena): `spec.md` + `plan.md` em `specs/<###-slug>/` (templates `.fe.md`).
- **L** (amplo): `specify → plan → tasks → implement` com gates (review-spec, review-plan/Constitution Check).
- Decisão arquitetural em qualquer tamanho → **ADR** (skill `adr-author`).
- Sempre deixe **algum** documento criado/atualizado, proporcional ao tamanho.

## Roteamento (comece SEMPRE pelo `web-app-orchestrator`)
**Orquestradores:** `web-app-orchestrator` (entrada única, classifica e roteia) · `client-orchestrator`
(camada MVVM) · `server-orchestrator` (camada BFF/DDD).

**Experts por tecnologia:** `tanstack-start-expert` · `tanstack-router-expert` · `tanstack-query-expert`
· `react-expert` · `vanilla-extract-expert` · `zod-expert` · `typescript-expert` ·
`security-frontend-expert` · `testing-expert`.

**Skills do projeto:** `pipeline-maestro` · `intent-skill-loader` · `module-scaffolder` · `code-reviewer`
· `ts-quality-checker` · `adr-author`.

**Skills OFICIAIS do TanStack (fonte de verdade técnica — 23 skills):** carregue via
`pnpm dlx @tanstack/intent@latest load <pkg>#<skill>` (mapa na skill `intent-skill-loader`). Prefira-as
a conhecimento genérico de framework — elas versionam com o pacote instalado.

## Comandos essenciais
```bash
pnpm install
pnpm dev | build | start
pnpm verify            # gate: typecheck + lint + testes
pnpm typecheck | lint | lint:fix
pnpm test              # node:test (puro)
pnpm test:dom          # Vitest + jsdom
pnpm test:e2e          # Playwright (regressão visual, baseline -linux)
pnpm dlx @tanstack/intent@latest list      # skills oficiais disponíveis
```

## Hooks ativos (`.claude/settings.json`)
| Evento | Script | Função |
|---|---|---|
| SessionStart | `session-start-context.sh` | injeta branch + feature + hierarquia de fontes |
| UserPromptSubmit | `inject-spec-context.sh` | injeta a feature spec-kit corrente |
| PreToolUse(Bash) | `block-non-pnpm.sh` | bloqueia npm/yarn (força pnpm) |
| PostToolUse(Edit\|Write) | `eslint-fix.sh` | `eslint --fix` no arquivo + marca sessão "suja" |
| Stop | `verify-gate.sh` | lembra/roda o gate se a sessão tocou código |

## Anti-padrões (NÃO fazer)
`npm`/`yarn` · `client/` importando `server/domain`/`application` · UI tocando `data`/`server-fn` ·
`throw` no domínio/aplicação · proteger RPC só no `beforeLoad` · token no browser · mocks em `src/`
(ADR-0011) · hex/px cru · editar `routeTree.gen.ts` à mão · editar ADR `Accepted` · fechar com
typecheck/lint/test vermelho.

## Política de regressão zero
Não existe "o erro não é meu". Saídas válidas: (1) consertar a causa, (2) corrigir o gate com
justificativa, (3) escalar ao humano com diagnóstico. **Nunca** finalizar com gate vermelho.

## Onde ler mais
`handbook/ARQUITETURA.md` (mapa visual) · `handbook/adr/` (decisões) · `.specify/memory/constitution.md`
(princípios) · `src/modules/auth/README.md` (anatomia) · `.claude/README.md` (este diretório).
