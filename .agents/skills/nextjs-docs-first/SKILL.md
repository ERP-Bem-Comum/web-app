---
name: nextjs-docs-first
description: Obriga a consulta da doc local do Next.js antes de mexer em App Router, metadata, route handlers, middleware/proxy ou next.config.js.
---

# nextjs-docs-first

Use quando:
- a tarefa tocar `src/app/`
- houver dúvida sobre Server vs Client Components
- a mudança envolver `next.config.js`, metadata, route handlers, proxy/middleware, params ou searchParams

Não use quando:
- a tarefa for só CSS, service, hook ou contexto sem impacto de Next.js
- a mudança for puramente documental

## Workflow

1. Identifique o tópico do Next envolvido.
2. Leia primeiro a doc relevante em `node_modules/next/dist/docs/`.
3. Cite no raciocínio final qual arquivo local da doc foi usado.
4. Só depois proponha ou implemente a mudança.
5. Preserve as convenções já documentadas em `AGENTS.md` e `CLAUDE.md`.

## Gotchas locais

- O projeto usa Next 16.2.6 com App Router.
- `DOCUMENTACAO_TECNICA.md` está defasada para decisões de Next.
- Páginas existentes podem ser mais client-heavy do que o ideal; não replique isso sem necessidade.
