---
name: frontend-feature-module
description: >
  Receita para criar um recurso novo no `erp-financeiro-frontend` seguindo a
  estrutura espelhada do projeto: `services/foo.ts` → `hooks/useFoo.ts` →
  `types/foo.ts` → `validators/foo.ts` (se tem form) → `enums/foo.ts` (se tem
  status) → componentes em `src/components/foo/` → página em
  `src/app/(main)/(grupo)/foo/`. Use sempre que for criar uma feature do zero
  ou adicionar uma sub-feature consistente com as existentes.
---

# frontend-feature-module

Receita operacional para criar feature nova no `erp-financeiro-frontend`. Acionada pelo [`frontend-orchestrator`](../../agents/frontend-orchestrator.md).

---

## Quando usar

- "Cria a feature de **Foo** (CRUD + listagem + form)"
- "Adicionar página de **Bar** dentro de `(financeiro)`"
- "Quero um recurso novo que segue o padrão dos outros"

**Não** use para:
- Bug fix pontual num arquivo existente.
- Componente UI isolado (use [`tailwind-shadcn-mui-expert`](../../agents/tailwind-shadcn-mui-expert.md)).

---

## Princípio: estrutura espelhada

Para qualquer recurso `Foo`, **espelhe** a estrutura de um vizinho próximo (ex.: `payables`, `contracts`, `bank-account`). Olhe pelo menos 1 recurso vizinho antes de escrever.

```
src/
├── services/foo.ts                      ← HTTP (único lugar que chama o `api`)
├── hooks/useFoo.ts                      ← React Query (useGetFoo, useCreateFoo, ...)
├── types/foo.ts                         ← Tipos (Foo, FooRow, ParamsFoo, ...)
├── validators/foo.ts                    ← Schema Zod (se tem form)
├── enums/foo.ts                         ← Enums de status PT-BR (se aplicável)
├── contexts/fooContext.tsx              ← Context (se tem estado cross-componente)
├── components/foo/
│   ├── FooTable.tsx                     ← Tabela / listagem
│   ├── FormFoo.tsx                      ← Form de criar/editar
│   ├── FoosTableComponents/             ← Sub-componentes da tabela
│   └── FormComponents/                  ← Sub-componentes do form
└── app/(main)/(grupo)/foo/
    ├── page.tsx                         ← Listagem
    ├── adicionar/page.tsx               ← Criar
    ├── detalhes/[id]/page.tsx           ← Visualizar
    └── editar/[id]/page.tsx             ← Editar
```

---

## Workflow

### Passo 1 — Escolher um vizinho e inventariar

Identifique um recurso vizinho similar e leia:
- `src/services/<vizinho>.ts`
- `src/hooks/use<Vizinho>.ts`
- `src/types/<vizinho>.ts`
- `src/components/<vizinho>/`
- `src/app/(main)/(grupo)/<vizinho>/`

> **Não invente padrão novo.** Replique o do vizinho.

### Passo 2 — Tipos (`src/types/foo.ts`)

```ts
import { Meta, PaginationParams } from './global'

export type Foo = {
  name: string
  value: number
  // ...
}

export type FooRow = Foo & {
  id: number
  createdAt: string
}

export type ParamsFoo = {
  paginationParams: PaginationParams
  search?: string
  fooParams?: { /* filtros específicos */ }
}
```

### Passo 3 — Service (`src/services/foo.ts`)

Siga o template em [`react-query-fetch-expert`](../../agents/react-query-fetch-expert.md) §"Padrão service por recurso". Padrão essencial:

- `try/catch` → `handleError<T>(error)` retornando `Response<T>`.
- `flattenParams(params)` para query string.
- `queryClient.invalidateQueries` dentro de mutations.
- `HttpStatusCode.Created`/`.Ok` em vez de hardcoded.

### Passo 4 — Hook (`src/hooks/useFoo.ts`)

Siga o template em [`react-query-fetch-expert`](../../agents/react-query-fetch-expert.md) §"Padrão hook de domínio". Padrão essencial:

- `useQuery` com `queryKey: ['foo', params]`.
- `staleTime`/`gcTime` em `1000*60*5` (5min).
- `placeholderData: keepPreviousData`.
- `enabled: !!id` para queries dependentes.

### Passo 5 — Validador (se tem form) (`src/validators/foo.ts`)

Siga o template em [`react-hook-form-zod-expert`](../../agents/react-hook-form-zod-expert.md) §"Schema típico". Padrão essencial:

- `z.coerce.number()` para inputs numéricos.
- `required_error`/`invalid_type_error` em vez de `.refine`.
- `z.date({ required_error, invalid_type_error })` para datas.

### Passo 6 — Enum (se tem status PT-BR) (`src/enums/foo.ts`)

```ts
export enum FooStatus {
  Ativo = 'Ativo',
  Inativo = 'Inativo',
  Pendente = 'Pendente',
}
```

> Status em **PT-BR** (cópia de UI). Identificadores em inglês.

### Passo 7 — Componentes (`src/components/foo/`)

- `FooTable.tsx` — tabela usando o padrão de outras (provavelmente `@/components/ui/table`).
- `FormFoo.tsx` — form com `useForm<FooFormData>` + `zodResolver(fooSchema)`.
- Sub-componentes auxiliares (export buttons, action buttons, etc.).

Ver:
- [`tailwind-shadcn-mui-expert`](../../agents/tailwind-shadcn-mui-expert.md) para escolha shadcn vs MUI.
- [`react-hook-form-zod-expert`](../../agents/react-hook-form-zod-expert.md) para o form.

### Passo 8 — Páginas (`src/app/(main)/(grupo)/foo/`)

Escolha o grupo correto (`(financeiro)`, `(contracts)`, `(reports)`, etc.) com base no contexto da feature. Páginas geralmente:

```tsx
// src/app/(main)/(grupo)/foo/page.tsx
'use client'
import { FooTable } from '@/components/foo/FooTable'

export default function FoosPage() {
  return <FooTable />
}
```

> Páginas autenticadas hoje são **Client Components** (legado da migração); para componente novo, considere começar Server se não precisar de hooks. Ver [`nextjs-app-router-expert`](../../agents/nextjs-app-router-expert.md).

### Passo 9 — Gate de qualidade

Antes de fechar:

```bash
pnpm lint
pnpm format:check
pnpm build
```

Ou use a skill [`frontend-quality-checker`](../frontend-quality-checker/SKILL.md).

---

## Checklist final

- [ ] `types/foo.ts` — exporta `Foo`, `FooRow`, `ParamsFoo`
- [ ] `services/foo.ts` — `try/catch` → `Response<T>`; `invalidateQueries` nas mutations
- [ ] `hooks/useFoo.ts` — `useGet*`/`useCreate*`/`useUpdate*`/`useDelete*` com `queryKey` no padrão `['foo', ...]`
- [ ] `validators/foo.ts` (se form) — schema Zod com mensagens PT-BR
- [ ] `enums/foo.ts` (se status) — values em PT-BR
- [ ] `components/foo/FooTable.tsx`, `FormFoo.tsx` — espelhando vizinho
- [ ] `app/(main)/(grupo)/foo/page.tsx` (+ `adicionar`, `editar`, `detalhes` conforme escopo)
- [ ] `pnpm build` verde
- [ ] Nenhuma lib da poda reintroduzida (ver tabela em `AGENTS.md`)

---

## Anti-padrões

1. **Pular um vizinho de referência** — sempre olhe um existente antes.
2. **Inventar shape diferente para `Response<T>`** — use o padrão em `@/types/global`.
3. **`axios`** — passou; use `api` de `@/services/api` (que usa `http-client`).
4. **`fetch` direto no hook** — passe pelo service.
5. **Renomear convenções** (`useGet*` → `useFetch*`, etc.) — mantenha o nome.

---

## Changelog

- **2026-05-20:** Criação. Receita para a estrutura espelhada do frontend.
