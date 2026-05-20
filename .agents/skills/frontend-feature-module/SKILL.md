---
name: frontend-feature-module
description: Cria ou expande uma feature seguindo a estrutura espelhada do projeto. Use para recurso novo com service, hook, tipos, validator, enum, componentes e páginas no App Router.
---

# frontend-feature-module

Use quando:
- o usuário pedir uma feature nova ou sub-feature consistente com o frontend existente
- a mudança exigir espelhar `services/`, `hooks/`, `types/`, `validators/`, `enums/` e `src/app/`

Não use quando:
- for bug fix pequeno em arquivo existente
- for só componente visual isolado
- for só ajuste de service ou hook já existente

## Workflow

1. Leia `AGENTS.md` e `CLAUDE.md`.
2. Escolha um recurso vizinho e use-o como referência real.
3. Crie ou ajuste, conforme o escopo:
   - `src/services/foo.ts`
   - `src/hooks/useFoo.ts`
   - `src/types/foo.ts`
   - `src/validators/foo.ts`
   - `src/enums/foo.ts`
   - `src/components/foo/`
   - `src/app/(main)/(grupo)/foo/`
4. Respeite as invariantes:
   - `fetch` só em `src/services/http-client.ts`
   - path alias canônico é `@/*`
   - novos charts usam `recharts`
   - não reintroduzir libs removidas
5. Se a feature tocar Next.js, leia antes a doc relevante em `node_modules/next/dist/docs/`.
6. Ao finalizar, sugira ou execute o gate com `$frontend-quality-gate` quando a mudança tocar código compilável.

## Entrega esperada

- mudança consistente com um vizinho do projeto
- nomes e arquivos alinhados à convenção local
- resumo curto dizendo qual recurso foi espelhado
