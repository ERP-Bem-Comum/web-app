# Migração ERP Frontend — Next.js → TanStack Start

## What This Is

Migração do ERP Financeiro Frontend de Next.js 16 (App Router) para TanStack Start (Vite + TanStack Router + Nitro), usando arquitetura em camadas DDD-ish, Server Functions BFF como único padrão HTTP, shadcn/ui para interface, e auth via cookie HttpOnly. O módulo piloto é Contratos.

## Core Value

O módulo de Contratos deve funcionar 100% na nova arquitetura TanStack Start com feature module em camadas, enquanto o restante do sistema pode quebrar durante a transição (Strangler Fig).

## Requirements

### Validated

- ✓ ERP Financeiro funciona em Next.js 13/16 com App Router — legado existente
- ✓ Contrato OpenAPI definido em `handbook/contratos/openapi.yaml`
- ✓ Stack alvo instalado (TanStack Start, Router, Query, Vite, Nitro)
- ✓ Entry points básicos criados (`client.tsx`, `ssr.tsx`, `router.tsx`, `__root.tsx`)
- ✓ Dívidas técnicas críticas resolvidas (AUTH_BYPASS, path aliases, ignoreBuildErrors)

### Active

- [ ] Phase 1: Bootstrap Infraestrutura TanStack Start completo
- [ ] Phase 2: Auth e Layout Principal funcionando end-to-end
- [ ] Phase 3: Listar Contratos (tabela paginada, filtros, busca)
- [ ] Phase 4: Criar Contrato (formulário, validações, auto-save)
- [ ] Phase 5: Visualizar Detalhes e Timeline
- [ ] Phase 6: Adicionar Aditivo
- [ ] Phase 7: Atualizar Dados Bancários
- [ ] Phase 8: Auth Integração (redirecionamentos, logout)
- [ ] Phase 9: Exportação CSV/PDF e Upload de Arquivos
- [ ] Phase 10: Cleanup e remoção do legado Next.js
- [ ] Phase 11: Quality Gate (format, lint, typecheck, test, build)

### Out of Scope

- Migração de outras features (contas a pagar, receber, relatórios, etc.) — serão feitas em milestones futuros
- Manter todas as rotas legado funcionando — apenas login e contratos precisam funcionar
- Deploy Firebase durante a migração — será ajustado na Phase 10
- Orval code generation — será revisitado após migração

## Context

- Projeto brownfield com código legado Next.js em `src/app/`, `src/services/`, `src/components/`, `src/hooks/`
- Nova arquitetura em camadas: `src/features/<feature>/{domain,application,adapters,views}/`
- Routing file-based: `src/routes/` (TanStack Router)
- Server Functions BFF: `src/server/*.server.ts` (TanStack Start `createServerFn`)
- Auth migrando de NextAuth v4 para cookie HttpOnly custom
- MUI sendo eliminado; shadcn/ui + Tailwind v4 é o padrão novo
- Backend NestJS expõe REST API com contrato OpenAPI

## Constraints

- **Tech stack**: TanStack Start, React 19, Vite 6+, Tailwind v4, shadcn/ui, Zod v4, React Hook Form, Vitest
- **Security**: Cookie HttpOnly obrigatório; nenhum token em localStorage
- **Architecture**: Domain puro (sem throw, sem framework, apenas Result<T,E>); MUI proibido em código novo
- **Dependencies**: `src/legacy/` não pode ser importado por código novo
- **Performance**: Listagem <2s com 100 contratos; bundle inicial <500KB gzipped

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| TanStack Start em vez de Next.js | Full-stack React com Vite + Server Functions; melhor DX para BFF | — Pending |
| Strangler Fig (feature por feature) | Big-bang no framework, strangler no resto; minimiza risco | — Pending |
| shadcn/ui em vez de MUI | Consistência com Tailwind v4; componentes desacoplados | — Pending |
| Server Functions como único padrão HTTP | Centraliza auth, validação e parsing no BFF; frontend puro consome domain | — Pending |
| Contratos como feature piloto | Isolada, com regra real, testa todas as camadas | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-27 after debt-fix phase*
