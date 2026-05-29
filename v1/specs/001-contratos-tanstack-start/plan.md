# Implementation Plan: Migração do Módulo de Contratos para TanStack Start

**Branch**: `001-contratos-tanstack-start` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-contratos-tanstack-start/spec.md`

## Summary

Migrar o módulo de Contratos do ERP Financeiro de Next.js 16 (App Router) para TanStack Start (Vite + TanStack Router + Nitro), usando arquitetura em camadas DDD-ish, Server Functions BFF como único padrão HTTP, shadcn/ui para interface, e auth via cookie HttpOnly. O restante do sistema intencionalmente quebra. O contrato OpenAPI em `handbook/contratos/openapi.yaml` é a fonte da verdade.

## Technical Context

**Language/Version**: TypeScript 5.8+ (strict mode)

**Primary Dependencies**:
- **Framework**: TanStack Start (`@tanstack/react-start`), TanStack Router (`@tanstack/react-router`)
- **Build**: Vite 6+, Nitro (vite plugin)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`), shadcn/ui, lucide-react
- **Data Fetching**: TanStack Query (já instalado)
- **Forms**: react-hook-form + Zod v4
- **HTTP**: `resultFetch` (wrapper custom) + Server Functions (`createServerFn`)
- **Tests**: Vitest + @testing-library/react + MSW

**Storage**: N/A (frontend BFF; backend é NestJS com PostgreSQL)

**Testing**: Vitest + MSW para mocks de rede

**Target Platform**: Web (Chrome, Firefox, Safari, Edge modernos)

**Project Type**: Web application (SPA/MPA híbrida com SSR via Nitro)

**Performance Goals**: Listagem carrega em <2s com 100 contratos; bundle inicial <500KB gzipped

**Constraints**:
- Cookie HttpOnly obrigatório para auth (nenhum token em localStorage)
- MUI proibido em código novo (shadcn/ui apenas)
- `src/legacy/` não pode ser importado por código novo
- Domain puro: sem `throw`, sem framework, apenas `Result<T, E>`

**Scale/Scope**: ~15 endpoints REST, ~20 schemas, 6 rotas de UI, 1 feature

## Constitution Check

✅ **Camadas DDD** — domain em `src/features/contracts/domain/`, puro, sem framework  
✅ **Server Functions BFF** — único padrão HTTP, nenhum axios/fetch direto em components  
✅ **shadcn/ui** — código novo usa Tailwind + shadcn, MUI só em legacy  
✅ **Auth HttpOnly** — cookie-based, nunca localStorage  
✅ **Test-First** — domain ≥80%, adapters happy+erro  
✅ **Strangler Fig** — uma feature por vez; resto pode quebrar  

## Project Structure

### Documentation (this feature)

```text
specs/001-contratos-tanstack-start/
├── plan.md              # This file
├── spec.md              # User stories e requisitos
├── tasks.md             # Breakdown acionável
└── research.md          # Notas de pesquisa (compatibilidade, versões)
```

### Source Code (repository root — pós-migração parcial)

```text
src/
├── app/
│   └── __root.tsx          # Root layout TanStack Start (substitui src/app/layout.tsx)
├── client.tsx              # Entry client
├── ssr.tsx                 # Entry server
├── router.tsx              # createRouter + routeTree.gen
├── routes/
│   ├── login.tsx           # Tela de login (auth cookie)
│   ├── _authenticated.tsx  # Layout autenticado (sidebar + topbar)
│   └── _authenticated/
│       └── contratos/
│           ├── index.tsx         # Listagem (US2)
│           ├── adicionar.tsx     # Criar contrato (US3)
│           ├── detalhes.$id.tsx  # Detalhes + timeline (US4)
│           └── aditivo.$id.tsx   # Criar aditivo (US5)
├── features/
│   └── contracts/
│       ├── domain/
│       │   ├── types.ts      # Branded types (ContractId, etc.)
│       │   ├── schemas.ts    # Zod schemas (input + response)
│       │   └── errors.ts     # String literal unions
│       ├── application/
│       │   ├── ports.ts      # FooRepo, FooNotifier
│       │   └── use-cases/
│       │       ├── list-contracts.ts
│       │       ├── get-contract.ts
│       │       ├── create-contract.ts
│       │       ├── update-contract.ts
│       │       └── create-aditive.ts
│       ├── adapters/
│       │   ├── http/
│       │   │   ├── contracts.ts   # resultFetch + parse
│       │   │   └── parse.ts       # DTO → domain
│       │   └── queries.ts         # queryKey factory
│       └── views/
│           ├── components/
│           │   ├── ContractsTable.tsx
│           │   ├── ContractFilters.tsx
│           │   ├── ContractForm.tsx
│           │   ├── ContractDetail.tsx
│           │   ├── ContractTimeline.tsx
│           │   └── AditiveForm.tsx
│           └── hooks/
│               ├── use-contracts.ts
│               ├── use-contract.ts
│               └── use-create-contract.ts
├── server/
│   ├── env.ts              # Zod-validated env (API_URL, AUTH_SECRET)
│   ├── middleware/
│   │   └── auth.ts         # Lê cookie → context.session
│   ├── auth.server.ts      # login, logout, getSession
│   └── contracts.server.ts # Server Functions BFF (list, get, create, update, delete, upload, csv, pdf)
├── shared/
│   └── http/
│       └── result-fetch.ts # Wrapper fetch retornando Result
├── legacy/                 # Código Next.js legado (movido durante migração)
│   └── ...
└── ... (outros arquivos legados não-migrados)

tests/
└── features/
    └── contracts/
        ├── domain/
        │   └── *.test.ts
        ├── application/
        │   └── *.test.ts
        └── adapters/
            └── http/
                └── *.test.ts
```

**Structure Decision**: Single project com arquitetura em camadas DDD-ish (`src/features/<feature>/`) + file-based routing (`src/routes/`). O legado Next.js vai para `src/legacy/` e é gradualmente removido.

## Research Notes

### Compatibilidade de Pacotes

| Pacote | Versão Atual | Compatível com TanStack Start | Notas |
|--------|-------------|-------------------------------|-------|
| React | 19.2.6 | ✅ Sim | TanStack Start suporta React 18+ |
| TanStack Query | 5.100.11 | ✅ Sim | Já instalado, manter |
| react-hook-form | 7.76.0 | ✅ Sim | Funciona em qualquer React app |
| Zod | 4.4.3 | ✅ Sim | Usar v4 em todo código novo |
| MUI | 9.0.1 | ⚠️ Funciona mas não usar em código novo | Manter em `src/legacy/` apenas |
| date-fns | 4.2.1 | ✅ Sim | Sem incompatibilidades |
| axios | 1.16.1 | ⚠️ Usar apenas internamente em `resultFetch` | Não expor em components/hooks |
| next-auth | 4.24.14 | ❌ Remover | Substituir por auth custom cookie-based |
| Tailwind | 4.3.0 | ✅ Sim | Migrar de postcss para `@tailwindcss/vite` |
| firebase-functions | 7.2.5 | ⚠️ Revisar deploy | `firebase.json` precisa apontar para `.output/` do Nitro |

### Decisões de Arquitetura

1. **Axios**: Manter como cliente HTTP interno do `resultFetch` temporariamente. Migrar para `fetch` nativo é desejável mas não bloqueante.
2. **Orval**: Não migrar agora. O OpenAPI serve como documentação e contrato com backend; os clients são gerados manualmente via Server Functions.
3. **MUI**: Não usado em nenhum componente de contratos na migração. shadcn/ui é o padrão.
4. **Fonts**: Substituir `next/font/google` por imports CSS padrão (`@import` no CSS ou `<link>` no HTML).
5. **Images**: Substituir `next/image` por `<img>` padrão ou `@unpic/react`.

## Complexity Tracking

Nenhuma violação da constituição identificada.
