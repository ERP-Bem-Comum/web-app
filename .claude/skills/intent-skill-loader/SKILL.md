---
name: intent-skill-loader
description: >
  Mapa tarefa → skill OFICIAL do TanStack Intent e como carregá-la. Use sempre que for
  mexer em TanStack Start/Router para trazer a doc da versão exata instalada (em vez de
  conhecimento genérico). Cobre os comandos list/load e a allowlist do package.json.
---

# Intent Skill Loader

O web-app tem **23 skills oficiais** versionadas dentro do `node_modules` (ex.: `@tanstack/
start-client-core@1.170.5`). Elas são a **fonte de verdade técnica** — carregue antes de codar.

## Comandos
```bash
pnpm dlx @tanstack/intent@latest list                 # ver tudo que está disponível
pnpm dlx @tanstack/intent@latest load <pkg>#<skill>   # imprime o SKILL.md no contexto
```

## Mapa tarefa → skill
| Tarefa | Skill |
|---|---|
| Server function, validação de input, error handling | `@tanstack/start-client-core#start-core/server-functions` |
| Middleware (request/server-fn), `createStart` global | `#start-core/middleware` |
| Onde o código roda (isomórfico, server/client-only) | `#start-core/execution-model` |
| Rotas de API server-side | `#start-core/server-routes` |
| Deploy (Cloudflare/Netlify/Vercel/Node), SPA, prerender | `#start-core/deployment` |
| Sessão, cookie, OAuth/PKCE, CSRF, rate limit | `#start-core/auth-server-primitives` |
| Bindings React, `useServerFn`, RSC | `@tanstack/react-start#react-start` (+ `/server-components`) |
| Migração de Next App Router | `@tanstack/react-start#lifecycle/migrate-from-nextjs` |
| Rotas, navegação, params, loaders, code-split, ssr, tipos | `@tanstack/router-core#router-core` (+ subs) |
| Proteção de rota (beforeLoad, redirect, _authenticated, RBAC) | `@tanstack/router-core#router-core/auth-and-guards` |
| Plugin de build / code-splitting automático | `@tanstack/router-plugin#router-plugin` |
| Rotas virtuais (programáticas) | `@tanstack/virtual-file-routes#virtual-file-routes` |

> **Lacuna conhecida:** `@tanstack/react-query` não traz skill Intent no `list` atual — para Query,
> apoie-se em `#router-core/data-loading` + doc oficial citando a versão de `package.json`.

## Allowlist (trust model)
`SKILL.md` é conteúdo de terceiros entrando no contexto. Recomendado declarar a allowlist:
```json
{ "intent": { "skills": ["@tanstack/react-start", "@tanstack/router-core", "@tanstack/start-client-core"] } }
```
Uma versão futura do Intent passará a exigir esse `intent.skills`.
