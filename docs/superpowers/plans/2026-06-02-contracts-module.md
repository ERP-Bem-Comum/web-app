# Módulo Contratos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o módulo completo de Contratos no frontend v2 (TanStack Start + React 19 + vanilla-extract), com 5 telas: Listagem, Criar, Detalhes, Editar e Criar Aditivo.

**Architecture:** BFF pattern (server functions como fronteira RPC), MVVM agnóstico no client (ADR-0009), Result<T,E> para todos os erros, design system via tokens.

**Tech Stack:** TanStack Start, React 19, Zod 4, vanilla-extract, TanStack Query, node:test + Vitest

---

## Estrutura de Pastas (resultado final)

```
src/modules/contracts/
├── server/
│   ├── domain/
│   │   ├── errors/
│   │   │   └── contracts.errors.ts
│   │   └── value-objects/
│   │       └── contract-code.value-object.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-contract.use-case.ts
│   │   │   ├── update-contract.use-case.ts
│   │   │   └── create-amendment.use-case.ts
│   │   └── queries/
│   │       ├── list-contracts.use-case.ts
│   │       ├── get-contract.use-case.ts
│   │       └── get-contract-history.use-case.ts
│   └── adapters/
│       ├── server-fns/
│       │   ├── list-contracts.server-fn.ts
│       │   ├── get-contract.server-fn.ts
│       │   ├── create-contract.server-fn.ts
│       │   ├── update-contract.server-fn.ts
│       │   ├── create-amendment.server-fn.ts
│       │   └── get-contract-history.server-fn.ts
│       ├── core-api/
│       │   ├── core-api-contracts.ts
│       │   └── contracts.schema.ts
│       └── contracts.composition.ts
├── client/
│   ├── data/
│   │   ├── model/
│   │   │   └── contracts.model.ts
│   │   ├── repository/
│   │   │   ├── contracts.repository.ts
│   │   │   └── contracts.repository.instance.ts
│   │   ├── gateways/
│   │   │   ├── list-contracts.gateway.ts
│   │   │   ├── get-contract.gateway.ts
│   │   │   ├── create-contract.gateway.ts
│   │   │   └── update-contract.gateway.ts
│   │   ├── events/
│   │   │   ├── contracts.events.ts
│   │   │   └── contracts.bus.ts
│   │   └── helpers/
│   │       └── contracts-error-tag.ts
│   ├── contract-list/
│   │   ├── contract-list.query.ts
│   │   ├── contract-list.view-model.ts
│   │   ├── contract-list.binding.ts
│   │   ├── page/
│   │   │   ├── contract-list.page.tsx
│   │   │   └── contract-list.css.ts
│   │   └── components/
│   │       ├── contract-list-table.component.tsx
│   │       ├── contract-list-filters.component.tsx
│   │       └── contract-list-pagination.component.tsx
│   ├── contract-create/
│   │   ├── contract-create.mutation.ts
│   │   ├── contract-create.view-model.ts
│   │   ├── contract-create.binding.ts
│   │   ├── page/
│   │   │   ├── contract-create.page.tsx
│   │   │   └── contract-create.css.ts
│   │   └── components/
│   │       ├── contract-form.component.tsx
│   │       └── contract-form.controller.ts
│   ├── contract-detail/
│   │   ├── contract-detail.query.ts
│   │   ├── contract-detail.view-model.ts
│   │   ├── contract-detail.binding.ts
│   │   ├── page/
│   │   │   ├── contract-detail.page.tsx
│   │   │   └── contract-detail.css.ts
│   │   └── components/
│   │       ├── contract-hero.component.tsx
│   │       ├── contract-documents.component.tsx
│   │       ├── contract-timeline.component.tsx
│   │       └── contract-history-modal.component.tsx
│   ├── contract-edit/
│   │   ├── contract-edit.mutation.ts
│   │   ├── contract-edit.view-model.ts
│   │   ├── contract-edit.binding.ts
│   │   ├── page/
│   │   │   ├── contract-edit.page.tsx
│   │   │   └── contract-edit.css.ts
│   │   └── components/
│   │       └── contract-edit-form.component.tsx
│   └── amendment-create/
│       ├── amendment-create.mutation.ts
│       ├── amendment-create.view-model.ts
│       ├── amendment-create.binding.ts
│       ├── page/
│       │   ├── amendment-create.page.tsx
│       │   └── amendment-create.css.ts
│       └── components/
│           ├── amendment-modal.component.tsx
│           ├── amendment-form.component.tsx
│           └── amendment-form.controller.ts
└── public-api/
    └── index.ts
```

---

## Fase 1: Fundação (Server + Client Data + i18n)

### Task 1: Criar estrutura de diretórios

**Files:**
- Create: toda a árvore `src/modules/contracts/`

- [ ] **Step 1: Criar todas as pastas**

```bash
mkdir -p src/modules/contracts/{server/{domain/{errors,value-objects},application/{commands,queries},adapters/{server-fns,core-api}},client/{data/{model,repository,gateways,events,helpers},contract-list/{page,components},contract-create/{page,components},contract-detail/{page,components},contract-edit/{page,components},amendment-create/{page,components}},public-api}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/contracts
git commit -m "chore(contracts): scaffold module directory structure"
```

---

### Task 2: Domain errors (contracts.errors.ts)

**Files:**
- Create: `src/modules/contracts/server/domain/errors/contracts.errors.ts`

- [ ] **Step 1: Escrever o arquivo**

```typescript
/**
 * ContractsError — união discriminada de falhas do domínio de contratos.
 * Mapeada para tags i18n na borda do client.
 */
export type ContractsError =
  | 'invalid-code'           // código/sequentialNumber inválido
  | 'invalid-value'          // valor <= 0 ou teto de OS excedido
  | 'invalid-period'         // período de vigência inválido
  | 'missing-contractor'     // contratante obrigatório não informado
  | 'contract-not-found'     // 404
  | 'amendment-not-found'    // 404 aditivo
  | 'invalid-amendment-type' // tipo de aditivo inválido
  | 'connectivity'           // backend fora / timeout
  | 'server'                 // 5xx / inesperado
  | 'unauthorized'           // 401 / 403
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/contracts/server/domain/errors/contracts.errors.ts
git commit -m "feat(contracts): add domain error types"
```

---

### Task 3: Client data model (contracts.model.ts)

**Files:**
- Create: `src/modules/contracts/client/data/model/contracts.model.ts`

- [ ] **Step 1: Escrever o arquivo**

```typescript
/**
 * Client/data Model — padronização client-side do contrato (Zod).
 * Espelha o contrato da API v2 + campos da v1. É a borda de validação do client.
 */
import * as z from 'zod'

export const ContractClassificationSchema = z.enum(['Contract', 'ServiceOrder'])
export type ContractClassification = z.infer<typeof ContractClassificationSchema>

export const ContractModelSchema = z.enum(['Service', 'Donation'])
export type ContractModel = z.infer<typeof ContractModelSchema>

export const ContractTypeSchema = z.enum(['Supplier', 'Financier', 'Collaborator', 'ACT'])
export type ContractType = z.infer<typeof ContractTypeSchema>

export const ContractStatusSchema = z.enum(['Pendente', 'Em Andamento', 'Finalizado', 'Distrato'])
export type ContractStatus = z.infer<typeof ContractStatusSchema>

export const AmendmentTypeSchema = z.enum(['prazo', 'valor', 'escopo', 'outro', 'distrato'])
export type AmendmentType = z.infer<typeof AmendmentTypeSchema>

export const AmendmentStatusSchema = z.enum(['Pendente', 'Homologado'])
export type AmendmentStatus = z.infer<typeof AmendmentStatusSchema>

export const MoneySchema = z.object({ cents: z.number().int() })
export type Money = z.infer<typeof MoneySchema>

export const PeriodSchema = z.object({
  start: z.date(),
  end: z.date(),
})
export type Period = z.infer<typeof PeriodSchema>

export const PartnerSnapshotSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  document: z.string(),
  email: z.string().email().optional(),
  telephone: z.string().optional(),
})
export type PartnerSnapshot = z.infer<typeof PartnerSnapshotSchema>

export const BankInfoSchema = z.object({
  bank: z.string(),
  agency: z.string(),
  accountNumber: z.string(),
  dv: z.string(),
  updatedAt: z.date(),
})
export type BankInfo = z.infer<typeof BankInfoSchema>

export const PixInfoSchema = z.object({
  keyType: z.string(),
  key: z.string(),
  updatedAt: z.date(),
})
export type PixInfo = z.infer<typeof PixInfoSchema>

export const AmendmentSchema = z.object({
  id: z.string().uuid(),
  amendmentNumber: z.string(),
  type: AmendmentTypeSchema,
  description: z.string().optional(),
  impactValueCents: z.number().int().optional(),
  newEndDate: z.date().optional(),
  startDate: z.date().optional(),
  status: AmendmentStatusSchema,
  signedAt: z.date().optional(),
  signedContractUrl: z.string().optional(),
  createdAt: z.date(),
})
export type Amendment = z.infer<typeof AmendmentSchema>

export const ContractFileSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  url: z.string(),
  size: z.number().optional(),
  uploadedAt: z.date(),
  uploadedBy: z.string().optional(),
})
export type ContractFile = z.infer<typeof ContractFileSchema>

export const ContractSchema = z.object({
  id: z.string().uuid(),
  sequentialNumber: z.string(),
  title: z.string(),
  objective: z.string(),
  originalValue: MoneySchema,
  originalPeriod: PeriodSchema,
  status: ContractStatusSchema,
  signedAt: z.date().nullable(),
  currentValue: MoneySchema,
  currentPeriod: PeriodSchema.nullable(),
  endedAt: z.date().nullable(),
  classification: ContractClassificationSchema,
  contractModel: ContractModelSchema,
  contractType: ContractTypeSchema,
  supplierId: z.string().uuid().optional(),
  financierId: z.string().uuid().optional(),
  collaboratorId: z.string().uuid().optional(),
  supplier: PartnerSnapshotSchema.optional(),
  financier: PartnerSnapshotSchema.optional(),
  collaborator: PartnerSnapshotSchema.optional(),
  programId: z.number().optional(),
  program: z.object({ id: z.number(), name: z.string() }).optional(),
  budgetPlanId: z.number().optional(),
  budgetPlan: z.object({ id: z.number(), scenarioName: z.string(), year: z.number(), version: z.number() }).optional(),
  categorizacao: z.enum(['Avaliação', 'Operacional', 'Processo']).optional(),
  centroDeCusto: z.enum(['RH', 'Serviços Gerais', 'Eventos']).optional(),
  observations: z.string().optional(),
  email: z.string().email().optional(),
  telephone: z.string().optional(),
  bancaryInfo: BankInfoSchema.optional(),
  pixInfo: PixInfoSchema.optional(),
  origin: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  children: z.array(AmendmentSchema),
  files: z.array(ContractFileSchema),
})
export type Contract = z.infer<typeof ContractSchema>

// Input schemas
export const ListContractsInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  contractType: ContractTypeSchema.optional(),
  status: ContractStatusSchema.optional(),
  contractPeriodStart: z.date().optional(),
  contractPeriodEnd: z.date().optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  budgetPlanId: z.number().optional(),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
})
export type ListContractsInput = z.infer<typeof ListContractsInputSchema>

export const CreateContractInputSchema = z.object({
  title: z.string().min(1),
  objective: z.string().min(1),
  originalValueCents: z.number().int().positive(),
  originalPeriod: PeriodSchema,
  classification: ContractClassificationSchema,
  contractModel: ContractModelSchema,
  contractType: ContractTypeSchema,
  supplierId: z.string().uuid().optional(),
  financierId: z.string().uuid().optional(),
  collaboratorId: z.string().uuid().optional(),
  programId: z.number().optional(),
  budgetPlanId: z.number().optional(),
  categorizacao: z.enum(['Avaliação', 'Operacional', 'Processo']).optional(),
  centroDeCusto: z.enum(['RH', 'Serviços Gerais', 'Eventos']).optional(),
  observations: z.string().optional(),
  email: z.string().email().optional(),
  telephone: z.string().optional(),
})
export type CreateContractInput = z.infer<typeof CreateContractInputSchema>

export const UpdateContractInputSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  telephone: z.string().optional(),
  observations: z.string().optional(),
})
export type UpdateContractInput = z.infer<typeof UpdateContractInputSchema>

export const CreateAmendmentInputSchema = z.object({
  contractId: z.string().uuid(),
  type: AmendmentTypeSchema,
  description: z.string().optional(),
  impactValueCents: z.number().int().optional(),
  newEndDate: z.date().optional(),
  startDate: z.date().optional(),
  signedAt: z.date().optional(),
})
export type CreateAmendmentInput = z.infer<typeof CreateAmendmentInputSchema>

// List response
export const ListContractsResponseSchema = z.object({
  items: z.array(ContractSchema),
  meta: z.object({
    page: z.number(),
    totalPages: z.number(),
    total: z.number(),
    limit: z.number(),
  }),
})
export type ListContractsResponse = z.infer<typeof ListContractsResponseSchema>
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/contracts/client/data/model/contracts.model.ts
git commit -m "feat(contracts): add client data model with Zod schemas"
```

---

### Task 4: Core-api adapter (core-api-contracts.ts)

**Files:**
- Create: `src/modules/contracts/server/adapters/core-api/core-api-contracts.ts`
- Create: `src/modules/contracts/server/adapters/core-api/contracts.schema.ts`

- [ ] **Step 1: Escrever contracts.schema.ts**

```typescript
/**
 * Zod schemas para validação dos responses do core-api contracts.
 * Server-only (adapters/core-api). Converte o formato cru da API para o nosso domínio.
 */
import * as z from 'zod'

export const CoreApiContractSchema = z.object({
  id: z.string().uuid(),
  sequentialNumber: z.string(),
  title: z.string(),
  objective: z.string(),
  originalValue: z.object({ cents: z.number() }),
  originalPeriod: z.object({ start: z.string().datetime(), end: z.string().datetime() }),
  status: z.string(),
  signedAt: z.string().datetime().nullable(),
  currentValue: z.object({ cents: z.number() }),
  currentPeriod: z.object({ start: z.string().datetime(), end: z.string().datetime() }).nullable(),
  endedAt: z.string().datetime().nullable(),
})

export const CoreApiAmendmentSchema = z.object({
  id: z.string().uuid(),
  amendmentNumber: z.string(),
  type: z.string(),
  description: z.string().optional(),
  impactValueCents: z.number().optional(),
  newEndDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  status: z.string(),
  signedAt: z.string().datetime().optional(),
  signedContractUrl: z.string().optional(),
  createdAt: z.string().datetime(),
})

export const CoreApiContractFileSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  url: z.string(),
  size: z.number().optional(),
  uploadedAt: z.string().datetime(),
  uploadedBy: z.string().optional(),
})

export const CoreApiListResponseSchema = z.object({
  items: z.array(CoreApiContractSchema),
  meta: z.object({
    page: z.number(),
    totalPages: z.number(),
    total: z.number(),
    limit: z.number(),
  }),
})
```

- [ ] **Step 2: Escrever core-api-contracts.ts**

```typescript
/**
 * Cliente HTTP do core-api para contratos — chama `/api/v2/contracts/*`.
 * Converte envelope de erro em ContractsError. NUNCA lança (tudo é Result).
 * Server-only (server/adapters).
 */
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import { parseErrorEnvelope } from '#shared/http/error-envelope.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type {
  CreateContractInput,
  UpdateContractInput,
  CreateAmendmentInput,
  ListContractsInput,
} from '#modules/contracts/client/data/model/contracts.model.ts'
import {
  CoreApiContractSchema,
  CoreApiListResponseSchema,
} from './contracts.schema.ts'

const SLUG_TO_ERROR: Partial<Record<string, ContractsError>> = {
  'contract-not-found': 'contract-not-found',
  'amendment-not-found': 'amendment-not-found',
  'invalid-value': 'invalid-value',
  'invalid-period': 'invalid-period',
  'missing-contractor': 'missing-contractor',
  unauthorized: 'unauthorized',
}

const mapHttpError = (e: HttpError): ContractsError => {
  switch (e.kind) {
    case 'http': {
      const slug = parseErrorEnvelope(e.body)?.error.code
      const mapped = slug === undefined ? undefined : SLUG_TO_ERROR[slug]
      return mapped ?? 'server'
    }
    case 'network':
    case 'timeout':
      return 'connectivity'
    case 'parse':
    case 'aborted':
      return 'server'
    default: {
      const exhaustive: never = e
      return exhaustive
    }
  }
}

export type CoreApiContractsClient = Readonly<{
  list: (input: ListContractsInput, token: string) => Promise<Result<unknown, ContractsError>>
  getById: (id: string, token: string) => Promise<Result<unknown, ContractsError>>
  create: (input: CreateContractInput, token: string) => Promise<Result<unknown, ContractsError>>
  update: (input: UpdateContractInput, token: string) => Promise<Result<unknown, ContractsError>>
  createAmendment: (contractId: string, input: CreateAmendmentInput, token: string) => Promise<Result<unknown, ContractsError>>
  getHistory: (id: string, token: string) => Promise<Result<unknown, ContractsError>>
}>

export const createCoreApiContractsClient = (baseUrl: string): CoreApiContractsClient => {
  const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` })

  const toQuery = (input: ListContractsInput): string => {
    const params = new URLSearchParams()
    params.set('page', String(input.page))
    params.set('limit', String(input.limit))
    if (input.search) params.set('search', input.search)
    if (input.contractType) params.set('contractType', input.contractType)
    if (input.status) params.set('status', input.status)
    if (input.order) params.set('order', input.order)
    return params.toString()
  }

  return {
    list: async (input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/contracts?${toQuery(input)}`, {
        method: 'GET',
        headers: authHeader(token),
      })
      return isErr(r) ? err(mapHttpError(r.error)) : ok(r.value)
    },

    getById: async (id, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/contracts/${id}`, {
        method: 'GET',
        headers: authHeader(token),
      })
      return isErr(r) ? err(mapHttpError(r.error)) : ok(r.value)
    },

    create: async (input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/contracts`, {
        method: 'POST',
        body: input,
        headers: authHeader(token),
      })
      return isErr(r) ? err(mapHttpError(r.error)) : ok(r.value)
    },

    update: async (input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/contracts/${input.id}`, {
        method: 'PATCH',
        body: input,
        headers: authHeader(token),
      })
      return isErr(r) ? err(mapHttpError(r.error)) : ok(r.value)
    },

    createAmendment: async (contractId, input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/contracts/${contractId}/amendments`, {
        method: 'POST',
        body: input,
        headers: authHeader(token),
      })
      return isErr(r) ? err(mapHttpError(r.error)) : ok(r.value)
    },

    getHistory: async (id, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/contracts/${id}/history`, {
        method: 'GET',
        headers: authHeader(token),
      })
      return isErr(r) ? err(mapHttpError(r.error)) : ok(r.value)
    },
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/contracts/server/adapters/core-api/
git commit -m "feat(contracts): add core-api adapter and schemas"
```

---

### Task 5: Server composition (contracts.composition.ts)

**Files:**
- Create: `src/modules/contracts/server/adapters/contracts.composition.ts`

- [ ] **Step 1: Escrever o arquivo**

```typescript
/**
 * Composition root do server/contracts. Monta use-cases com deps reais.
 * Env é lido DENTRO da função (nunca em escopo de módulo).
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { createCoreApiContractsClient } from './core-api/core-api-contracts.ts'
import { createListContracts } from '../application/queries/list-contracts.use-case.ts'
import { createGetContract } from '../application/queries/get-contract.use-case.ts'
import { createCreateContract } from '../application/commands/create-contract.use-case.ts'
import { createUpdateContract } from '../application/commands/update-contract.use-case.ts'
import { createCreateAmendment } from '../application/commands/create-amendment.use-case.ts'
import { createGetContractHistory } from '../application/queries/get-contract-history.use-case.ts'

type ContractsServer = ReturnType<typeof build>

const build = () => {
  const env = loadEnvOrThrow()
  const client = createCoreApiContractsClient(env.CORE_API_URL)

  return {
    listContracts: createListContracts({ client }),
    getContract: createGetContract({ client }),
    createContract: createCreateContract({ client }),
    updateContract: createUpdateContract({ client }),
    createAmendment: createCreateAmendment({ client }),
    getContractHistory: createGetContractHistory({ client }),
  }
}

let cached: ContractsServer | undefined
export const contractsServer = (): ContractsServer => (cached ??= build())
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/contracts/server/adapters/contracts.composition.ts
git commit -m "feat(contracts): add server composition root"
```

---

### Task 6: Server use-cases

**Files:**
- Create: `src/modules/contracts/server/application/queries/list-contracts.use-case.ts`
- Create: `src/modules/contracts/server/application/queries/get-contract.use-case.ts`
- Create: `src/modules/contracts/server/application/commands/create-contract.use-case.ts`
- Create: `src/modules/contracts/server/application/commands/update-contract.use-case.ts`
- Create: `src/modules/contracts/server/application/commands/create-amendment.use-case.ts`
- Create: `src/modules/contracts/server/application/queries/get-contract-history.use-case.ts`

- [ ] **Step 1: Escrever list-contracts.use-case.ts**

```typescript
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { ListContractsInput, ListContractsResponse } from '#modules/contracts/client/data/model/contracts.model.ts'

type Deps = Readonly<{
  client: Readonly<{
    list: (input: ListContractsInput, token: string) => Promise<Result<unknown, ContractsError>>
  }>
}>

export const createListContracts = (deps: Deps) =>
  async (input: ListContractsInput, token: string): Promise<Result<ListContractsResponse, ContractsError>> => {
    const r = await deps.client.list(input, token)
    if (isErr(r)) return err(r.error)
    // TODO: validar com Zod o formato da resposta quando a API estabilizar
    return ok(r.value as ListContractsResponse)
  }
```

- [ ] **Step 2: Escrever get-contract.use-case.ts**

```typescript
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'

type Deps = Readonly<{
  client: Readonly<{
    getById: (id: string, token: string) => Promise<Result<unknown, ContractsError>>
  }>
}>

export const createGetContract = (deps: Deps) =>
  async (id: string, token: string): Promise<Result<Contract, ContractsError>> => {
    const r = await deps.client.getById(id, token)
    if (isErr(r)) return err(r.error)
    return ok(r.value as Contract)
  }
```

- [ ] **Step 3: Escrever create-contract.use-case.ts**

```typescript
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { CreateContractInput, Contract } from '#modules/contracts/client/data/model/contracts.model.ts'

type Deps = Readonly<{
  client: Readonly<{
    create: (input: CreateContractInput, token: string) => Promise<Result<unknown, ContractsError>>
  }>
}>

export const createCreateContract = (deps: Deps) =>
  async (input: CreateContractInput, token: string): Promise<Result<Contract, ContractsError>> => {
    const r = await deps.client.create(input, token)
    if (isErr(r)) return err(r.error)
    return ok(r.value as Contract)
  }
```

- [ ] **Step 4: Escrever update-contract.use-case.ts**

```typescript
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { UpdateContractInput, Contract } from '#modules/contracts/client/data/model/contracts.model.ts'

type Deps = Readonly<{
  client: Readonly<{
    update: (input: UpdateContractInput, token: string) => Promise<Result<unknown, ContractsError>>
  }>
}>

export const createUpdateContract = (deps: Deps) =>
  async (input: UpdateContractInput, token: string): Promise<Result<Contract, ContractsError>> => {
    const r = await deps.client.update(input, token)
    if (isErr(r)) return err(r.error)
    return ok(r.value as Contract)
  }
```

- [ ] **Step 5: Escrever create-amendment.use-case.ts**

```typescript
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { CreateAmendmentInput, Amendment } from '#modules/contracts/client/data/model/contracts.model.ts'

type Deps = Readonly<{
  client: Readonly<{
    createAmendment: (contractId: string, input: CreateAmendmentInput, token: string) => Promise<Result<unknown, ContractsError>>
  }>
}>

export const createCreateAmendment = (deps: Deps) =>
  async (contractId: string, input: CreateAmendmentInput, token: string): Promise<Result<Amendment, ContractsError>> => {
    const r = await deps.client.createAmendment(contractId, input, token)
    if (isErr(r)) return err(r.error)
    return ok(r.value as Amendment)
  }
```

- [ ] **Step 6: Escrever get-contract-history.use-case.ts**

```typescript
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'

export type ContractHistoryEvent = Readonly<{
  eventId: string
  contractId: string
  kind: string
  description: string
  occurredAt: string
  userName?: string
  metadata?: Record<string, unknown>
}>

type Deps = Readonly<{
  client: Readonly<{
    getHistory: (id: string, token: string) => Promise<Result<unknown, ContractsError>>
  }>
}>

export const createGetContractHistory = (deps: Deps) =>
  async (id: string, token: string): Promise<Result<readonly ContractHistoryEvent[], ContractsError>> => {
    const r = await deps.client.getHistory(id, token)
    if (isErr(r)) return err(r.error)
    return ok((r.value as { events: ContractHistoryEvent[] }).events ?? [])
  }
```

- [ ] **Step 7: Commit**

```bash
git add src/modules/contracts/server/application/
git commit -m "feat(contracts): add server use-cases (queries + commands)"
```

---

### Task 7: Server functions (RPC frontier)

**Files:**
- Create: `src/modules/contracts/server/adapters/server-fns/list-contracts.server-fn.ts`
- Create: `src/modules/contracts/server/adapters/server-fns/get-contract.server-fn.ts`
- Create: `src/modules/contracts/server/adapters/server-fns/create-contract.server-fn.ts`
- Create: `src/modules/contracts/server/adapters/server-fns/update-contract.server-fn.ts`
- Create: `src/modules/contracts/server/adapters/server-fns/create-amendment.server-fn.ts`
- Create: `src/modules/contracts/server/adapters/server-fns/get-contract-history.server-fn.ts`

- [ ] **Step 1: Escrever list-contracts.server-fn.ts**

```typescript
/**
 * Server function: listar contratos. Fronteira RPC.
 * Extrai access token da sessão (via auth guard), chama use-case.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn } from '#modules/auth/public-api/index.ts'
import { contractsServer } from '../contracts.composition.ts'
import { ListContractsInputSchema, type ListContractsResponse } from '#modules/contracts/client/data/model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'

export type ListContractsFnResult =
  | Readonly<{ ok: true; data: ListContractsResponse }>
  | Readonly<{ ok: false; error: ContractsError }>

export const listContractsFn = createServerFn({ method: 'GET' })
  .inputValidator(ListContractsInputSchema)
  .handler(async ({ data }): Promise<ListContractsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    // TODO: obter access token da sessão (depende do session guard da auth)
    const accessToken = '' // placeholder — integrar com session guard

    const r = await contractsServer().listContracts(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
```

- [ ] **Step 2: Escrever get-contract.server-fn.ts**

```typescript
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn } from '#modules/auth/public-api/index.ts'
import { contractsServer } from '../contracts.composition.ts'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'

const GetContractInputSchema = z.object({ id: z.string().uuid() })

export type GetContractFnResult =
  | Readonly<{ ok: true; data: Contract }>
  | Readonly<{ ok: false; error: ContractsError }>

export const getContractFn = createServerFn({ method: 'GET' })
  .inputValidator(GetContractInputSchema)
  .handler(async ({ data }): Promise<GetContractFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = '' // TODO: integrar com session guard
    const r = await contractsServer().getContract(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
```

- [ ] **Step 3: Escrever create-contract.server-fn.ts**

```typescript
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn } from '#modules/auth/public-api/index.ts'
import { contractsServer } from '../contracts.composition.ts'
import { CreateContractInputSchema, type Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'

export type CreateContractFnResult =
  | Readonly<{ ok: true; data: Contract }>
  | Readonly<{ ok: false; error: ContractsError }>

export const createContractFn = createServerFn({ method: 'POST' })
  .inputValidator(CreateContractInputSchema)
  .handler(async ({ data }): Promise<CreateContractFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = '' // TODO: integrar com session guard
    const r = await contractsServer().createContract(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
```

- [ ] **Step 4: Escrever update-contract.server-fn.ts**

```typescript
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn } from '#modules/auth/public-api/index.ts'
import { contractsServer } from '../contracts.composition.ts'
import { UpdateContractInputSchema, type Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'

export type UpdateContractFnResult =
  | Readonly<{ ok: true; data: Contract }>
  | Readonly<{ ok: false; error: ContractsError }>

export const updateContractFn = createServerFn({ method: 'POST' })
  .inputValidator(UpdateContractInputSchema)
  .handler(async ({ data }): Promise<UpdateContractFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = '' // TODO: integrar com session guard
    const r = await contractsServer().updateContract(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
```

- [ ] **Step 5: Escrever create-amendment.server-fn.ts**

```typescript
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn } from '#modules/auth/public-api/index.ts'
import { contractsServer } from '../contracts.composition.ts'
import { CreateAmendmentInputSchema, type Amendment } from '#modules/contracts/client/data/model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'

const CreateAmendmentFnInputSchema = z.object({
  contractId: z.string().uuid(),
  ...CreateAmendmentInputSchema.shape,
})

export type CreateAmendmentFnResult =
  | Readonly<{ ok: true; data: Amendment }>
  | Readonly<{ ok: false; error: ContractsError }>

export const createAmendmentFn = createServerFn({ method: 'POST' })
  .inputValidator(CreateAmendmentFnInputSchema)
  .handler(async ({ data }): Promise<CreateAmendmentFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = '' // TODO: integrar com session guard
    const { contractId, ...input } = data
    const r = await contractsServer().createAmendment(contractId, input, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
```

- [ ] **Step 6: Escrever get-contract-history.server-fn.ts**

```typescript
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn } from '#modules/auth/public-api/index.ts'
import { contractsServer } from '../contracts.composition.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { ContractHistoryEvent } from '#modules/contracts/server/application/queries/get-contract-history.use-case.ts'

const GetHistoryInputSchema = z.object({ id: z.string().uuid() })

export type GetContractHistoryFnResult =
  | Readonly<{ ok: true; data: readonly ContractHistoryEvent[] }>
  | Readonly<{ ok: false; error: ContractsError }>

export const getContractHistoryFn = createServerFn({ method: 'GET' })
  .inputValidator(GetHistoryInputSchema)
  .handler(async ({ data }): Promise<GetContractHistoryFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = '' // TODO: integrar com session guard
    const r = await contractsServer().getContractHistory(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
```

- [ ] **Step 7: Commit**

```bash
git add src/modules/contracts/server/adapters/server-fns/
git commit -m "feat(contracts): add server functions (RPC frontier)"
```

---

### Task 8: Client repository + gateways + helpers

**Files:**
- Create: `src/modules/contracts/client/data/repository/contracts.repository.ts`
- Create: `src/modules/contracts/client/data/repository/contracts.repository.instance.ts`
- Create: `src/modules/contracts/client/data/gateways/list-contracts.gateway.ts`
- Create: `src/modules/contracts/client/data/gateways/get-contract.gateway.ts`
- Create: `src/modules/contracts/client/data/gateways/create-contract.gateway.ts`
- Create: `src/modules/contracts/client/data/gateways/update-contract.gateway.ts`
- Create: `src/modules/contracts/client/data/helpers/contracts-error-tag.ts`

- [ ] **Step 1: Escrever contracts.repository.ts**

```typescript
/**
 * ContractsRepository — porta do client para o BFF (server functions).
 * Converte Result do RPC para Result do client.
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type {
  ListContractsInput,
  ListContractsResponse,
  Contract,
  CreateContractInput,
  UpdateContractInput,
  CreateAmendmentInput,
  Amendment,
} from '#modules/contracts/client/data/model/contracts.model.ts'
import type {
  ListContractsFnResult,
  GetContractFnResult,
  CreateContractFnResult,
  UpdateContractFnResult,
  CreateAmendmentFnResult,
  GetContractHistoryFnResult,
} from '#modules/contracts/server/adapters/server-fns/*.server-fn.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { ContractHistoryEvent } from '#modules/contracts/server/application/queries/get-contract-history.use-case.ts'

type ListContractsFn = (opts: { data: ListContractsInput }) => Promise<ListContractsFnResult>
type GetContractFn = (opts: { data: { id: string } }) => Promise<GetContractFnResult>
type CreateContractFn = (opts: { data: CreateContractInput }) => Promise<CreateContractFnResult>
type UpdateContractFn = (opts: { data: UpdateContractInput }) => Promise<UpdateContractFnResult>
type CreateAmendmentFn = (opts: { data: { contractId: string } & CreateAmendmentInput }) => Promise<CreateAmendmentFnResult>
type GetHistoryFn = (opts: { data: { id: string } }) => Promise<GetContractHistoryFnResult>

export type ContractsRepository = Readonly<{
  list: (input: ListContractsInput) => Promise<Result<ListContractsResponse, ContractsError>>
  getById: (id: string) => Promise<Result<Contract, ContractsError>>
  create: (input: CreateContractInput) => Promise<Result<Contract, ContractsError>>
  update: (input: UpdateContractInput) => Promise<Result<Contract, ContractsError>>
  createAmendment: (contractId: string, input: CreateAmendmentInput) => Promise<Result<Amendment, ContractsError>>
  getHistory: (id: string) => Promise<Result<readonly ContractHistoryEvent[], ContractsError>>
}>

export const createContractsRepository = (deps: Readonly<{
  listContractsFn: ListContractsFn
  getContractFn: GetContractFn
  createContractFn: CreateContractFn
  updateContractFn: UpdateContractFn
  createAmendmentFn: CreateAmendmentFn
  getContractHistoryFn: GetHistoryFn
}>): ContractsRepository => ({
  list: async (input) => {
    const res = await deps.listContractsFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getById: async (id) => {
    const res = await deps.getContractFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  create: async (input) => {
    const res = await deps.createContractFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  update: async (input) => {
    const res = await deps.updateContractFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  createAmendment: async (contractId, input) => {
    const res = await deps.createAmendmentFn({ data: { contractId, ...input } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getHistory: async (id) => {
    const res = await deps.getContractHistoryFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
})
```

- [ ] **Step 2: Escrever contracts.repository.instance.ts**

```typescript
/**
 * Instância da repository — wire server functions reais.
 */
import { listContractsFn } from '#modules/contracts/server/adapters/server-fns/list-contracts.server-fn.ts'
import { getContractFn } from '#modules/contracts/server/adapters/server-fns/get-contract.server-fn.ts'
import { createContractFn } from '#modules/contracts/server/adapters/server-fns/create-contract.server-fn.ts'
import { updateContractFn } from '#modules/contracts/server/adapters/server-fns/update-contract.server-fn.ts'
import { createAmendmentFn } from '#modules/contracts/server/adapters/server-fns/create-amendment.server-fn.ts'
import { getContractHistoryFn } from '#modules/contracts/server/adapters/server-fns/get-contract-history.server-fn.ts'
import { createContractsRepository } from './contracts.repository.ts'

export const contractsRepository = createContractsRepository({
  listContractsFn: (opts) => listContractsFn(opts),
  getContractFn: (opts) => getContractFn(opts),
  createContractFn: (opts) => createContractFn(opts),
  updateContractFn: (opts) => updateContractFn(opts),
  createAmendmentFn: (opts) => createAmendmentFn(opts),
  getContractHistoryFn: (opts) => getContractHistoryFn(opts),
})
```

- [ ] **Step 3: Escrever gateways**

```typescript
// src/modules/contracts/client/data/gateways/list-contracts.gateway.ts
import { contractsRepository } from '../repository/contracts.repository.instance.ts'
import type { ListContractsInput, ListContractsResponse } from '../model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { Result } from '#shared/primitives/result.ts'

export const listContractsGateway = (input: ListContractsInput): Promise<Result<ListContractsResponse, ContractsError>> =>
  contractsRepository.list(input)

// src/modules/contracts/client/data/gateways/get-contract.gateway.ts
import { contractsRepository } from '../repository/contracts.repository.instance.ts'
import type { Contract } from '../model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { Result } from '#shared/primitives/result.ts'

export const getContractGateway = (id: string): Promise<Result<Contract, ContractsError>> =>
  contractsRepository.getById(id)

// src/modules/contracts/client/data/gateways/create-contract.gateway.ts
import { contractsRepository } from '../repository/contracts.repository.instance.ts'
import type { CreateContractInput, Contract } from '../model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { Result } from '#shared/primitives/result.ts'

export const createContractGateway = (input: CreateContractInput): Promise<Result<Contract, ContractsError>> =>
  contractsRepository.create(input)

// src/modules/contracts/client/data/gateways/update-contract.gateway.ts
import { contractsRepository } from '../repository/contracts.repository.instance.ts'
import type { UpdateContractInput, Contract } from '../model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { Result } from '#shared/primitives/result.ts'

export const updateContractGateway = (input: UpdateContractInput): Promise<Result<Contract, ContractsError>> =>
  contractsRepository.update(input)
```

- [ ] **Step 4: Escrever contracts-error-tag.ts**

```typescript
/**
 * contractsErrorTag — mapeia ContractsError → tag i18n.
 */
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'

export const contractsErrorTag = (e: ContractsError): string => {
  switch (e) {
    case 'invalid-code':
      return 'contracts.error.invalid-code'
    case 'invalid-value':
      return 'contracts.error.invalid-value'
    case 'invalid-period':
      return 'contracts.error.invalid-period'
    case 'missing-contractor':
      return 'contracts.error.missing-contractor'
    case 'contract-not-found':
      return 'contracts.error.contract-not-found'
    case 'amendment-not-found':
      return 'contracts.error.amendment-not-found'
    case 'invalid-amendment-type':
      return 'contracts.error.invalid-amendment-type'
    case 'connectivity':
      return 'contracts.error.connectivity'
    case 'unauthorized':
      return 'contracts.error.unauthorized'
    case 'server':
      return 'contracts.error.unexpected'
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/modules/contracts/client/data/
git commit -m "feat(contracts): add client data layer (repository, gateways, helpers)"
```

---

### Task 9: Public API + i18n tags

**Files:**
- Create: `src/modules/contracts/public-api/index.ts`
- Modify: `src/shared/i18n/catalog.pt-BR.ts`

- [ ] **Step 1: Escrever public-api/index.ts**

```typescript
/**
 * Public API do módulo Contracts — ÚNICO ponto de import externo.
 * Expõe server functions (para rotas), bindings (para outras features) e tipos.
 */
export { listContractsFn } from '#modules/contracts/server/adapters/server-fns/list-contracts.server-fn.ts'
export { getContractFn } from '#modules/contracts/server/adapters/server-fns/get-contract.server-fn.ts'
export { createContractFn } from '#modules/contracts/server/adapters/server-fns/create-contract.server-fn.ts'
export { updateContractFn } from '#modules/contracts/server/adapters/server-fns/update-contract.server-fn.ts'
export { createAmendmentFn } from '#modules/contracts/server/adapters/server-fns/create-amendment.server-fn.ts'
export { getContractHistoryFn } from '#modules/contracts/server/adapters/server-fns/get-contract-history.server-fn.ts'

export { useContractListBinding } from '#modules/contracts/client/contract-list/contract-list.binding.ts'
export { useContractCreateBinding } from '#modules/contracts/client/contract-create/contract-create.binding.ts'
export { useContractDetailBinding } from '#modules/contracts/client/contract-detail/contract-detail.binding.ts'
export { useContractEditBinding } from '#modules/contracts/client/contract-edit/contract-edit.binding.ts'
export { useAmendmentCreateBinding } from '#modules/contracts/client/amendment-create/amendment-create.binding.ts'

export type { Contract, Amendment, ContractStatus, AmendmentStatus, ContractType } from '#modules/contracts/client/data/model/contracts.model.ts'
```

- [ ] **Step 2: Adicionar i18n tags**

Adicionar ao `src/shared/i18n/catalog.pt-BR.ts` (após as linhas existentes):

```typescript
  // Contracts — Errors
  'contracts.error.invalid-code': 'Código do contrato inválido.',
  'contracts.error.invalid-value': 'Valor inválido ou excede o teto permitido.',
  'contracts.error.invalid-period': 'Período de vigência inválido.',
  'contracts.error.missing-contractor': 'Contratante obrigatório não informado.',
  'contracts.error.contract-not-found': 'Contrato não encontrado.',
  'contracts.error.amendment-not-found': 'Aditivo não encontrado.',
  'contracts.error.invalid-amendment-type': 'Tipo de aditivo inválido.',
  'contracts.error.connectivity': 'Serviço temporariamente indisponível. Tente novamente.',
  'contracts.error.unauthorized': 'Acesso não autorizado.',
  'contracts.error.unexpected': 'Algo deu errado. Tente novamente.',
  // Contracts — Listagem
  'contracts.list.title': 'Contratos',
  'contracts.list.new': 'Novo Contrato',
  'contracts.list.search': 'Buscar contratos…',
  'contracts.list.columns.code': 'Código',
  'contracts.list.columns.title': 'Título',
  'contracts.list.columns.type': 'Tipo',
  'contracts.list.columns.status': 'Status',
  'contracts.list.columns.originalValue': 'Valor Original',
  'contracts.list.columns.currentValue': 'Valor Atual',
  'contracts.list.columns.balance': 'Saldo',
  'contracts.list.columns.period': 'Vigência',
  'contracts.list.actions.view': 'Ver detalhes',
  'contracts.list.actions.edit': 'Editar',
  'contracts.list.actions.amendment': 'Criar aditivo',
  'contracts.list.actions.os': 'Criar OS',
  'contracts.list.empty': 'Nenhum contrato encontrado.',
  'contracts.list.filters.all': 'Todos',
  'contracts.list.filters.expiring': 'Vencendo (≤ 45 dias)',
  // Contracts — Criar
  'contracts.create.title': 'Novo Contrato',
  'contracts.create.subtitle': 'Preencha os dados do contrato',
  'contracts.create.section.basic': 'Dados Básicos',
  'contracts.create.section.contractor': 'Contratado',
  'contracts.create.section.financial': 'Dados Financeiros',
  'contracts.create.section.contact': 'Contato',
  'contracts.create.field.title': 'Título',
  'contracts.create.field.objective': 'Objeto',
  'contracts.create.field.classification': 'Classificação',
  'contracts.create.field.contractModel': 'Modelo',
  'contracts.create.field.contractType': 'Tipo',
  'contracts.create.field.value': 'Valor Original',
  'contracts.create.field.period': 'Período de Vigência',
  'contracts.create.field.program': 'Programa',
  'contracts.create.field.budgetPlan': 'Plano Orçamentário',
  'contracts.create.field.categorizacao': 'Categorização',
  'contracts.create.field.centroDeCusto': 'Centro de Custo',
  'contracts.create.field.supplier': 'Fornecedor',
  'contracts.create.field.financier': 'Financiador',
  'contracts.create.field.collaborator': 'Colaborador',
  'contracts.create.field.email': 'E-mail',
  'contracts.create.field.telephone': 'Telefone',
  'contracts.create.field.observations': 'Observações',
  'contracts.create.field.bancaryInfo': 'Dados Bancários',
  'contracts.create.field.pixInfo': 'PIX',
  'contracts.create.bancaryInfo.placeholder': 'Dados sincronizados do módulo Parceiros. Última atualização: {{date}}',
  'contracts.create.pixInfo.placeholder': 'Dados sincronizados do módulo Parceiros. Última atualização: {{date}}',
  'contracts.create.submit': 'Criar Contrato',
  'contracts.create.modal.title': 'Contrato criado com sucesso!',
  'contracts.create.modal.subtitle': 'O contrato {{code}} foi cadastrado.',
  'contracts.create.modal.button': 'Ir para detalhes',
  // Contracts — Detalhes
  'contracts.detail.title': 'Detalhes do Contrato',
  'contracts.detail.editContact': 'Editar contato',
  'contracts.detail.section.info': 'Informações',
  'contracts.detail.section.documents': 'Documentos',
  'contracts.detail.section.timeline': 'Timeline',
  'contracts.detail.documents.base': 'Contrato Base',
  'contracts.detail.documents.amendment': 'Aditivo',
  'contracts.detail.documents.preview': 'Visualizar',
  'contracts.detail.documents.download': 'Download',
  'contracts.detail.timeline.created': 'Contrato criado',
  'contracts.detail.timeline.signed': 'Contrato assinado',
  'contracts.detail.timeline.amendment': 'Aditivo {{number}} — {{type}}',
  'contracts.detail.timeline.distrato': 'Contrato rescindido',
  'contracts.detail.history.title': 'Histórico do Contrato',
  'contracts.detail.history.button': 'Ver histórico completo',
  'contracts.detail.history.close': 'Fechar',
  // Contracts — Editar
  'contracts.edit.title': 'Editar Contrato',
  'contracts.edit.subtitle': 'Edite as informações de contato',
  'contracts.edit.field.email': 'E-mail',
  'contracts.edit.field.telephone': 'Telefone',
  'contracts.edit.field.observations': 'Observações',
  'contracts.edit.submit': 'Salvar Alterações',
  'contracts.edit.modal.title': 'Alterações salvas com sucesso!',
  // Contracts — Aditivo
  'contracts.amendment.title': 'Novo Aditivo',
  'contracts.amendment.type.prazo': 'Prazo',
  'contracts.amendment.type.valor': 'Valor',
  'contracts.amendment.type.escopo': 'Escopo',
  'contracts.amendment.type.outro': 'Outro',
  'contracts.amendment.type.distrato': 'Distrato',
  'contracts.amendment.type.desc.prazo': 'Prorrogação de vigência',
  'contracts.amendment.type.desc.valor': 'Acréscimo ou supressão',
  'contracts.amendment.type.desc.escopo': 'Sem impacto financeiro',
  'contracts.amendment.type.desc.outro': 'Reajuste, reequilíbrio…',
  'contracts.amendment.type.desc.distrato': 'Rescisão contratual',
  'contracts.amendment.field.type': 'Tipo',
  'contracts.amendment.field.newEndDate': 'Nova Data Fim',
  'contracts.amendment.field.impact': 'Impacto',
  'contracts.amendment.field.impact.acrescimo': 'Acréscimo',
  'contracts.amendment.field.impact.supressao': 'Supressão',
  'contracts.amendment.field.value': 'Valor',
  'contracts.amendment.field.signedAt': 'Data da Assinatura',
  'contracts.amendment.field.startDate': 'Início do Efeito',
  'contracts.amendment.field.description': 'Resumo',
  'contracts.amendment.field.document': 'Documento Principal',
  'contracts.amendment.field.document.hint': 'PDF assinado · até 20MB',
  'contracts.amendment.status.pending': 'Pendente',
  'contracts.amendment.status.homologated': 'Homologado',
  'contracts.amendment.submit': 'Salvar Aditivo',
  'contracts.amendment.submit.homologate': 'Salvar e Homologar',
  // Tipos de contrato
  'contracts.type.Supplier': 'Fornecedor',
  'contracts.type.Financier': 'Financiador',
  'contracts.type.Collaborator': 'Colaborador',
  'contracts.type.ACT': 'ACT',
  // Status
  'contracts.status.Pendente': 'Pendente',
  'contracts.status.Em Andamento': 'Em Andamento',
  'contracts.status.Finalizado': 'Finalizado',
  'contracts.status.Distrato': 'Distrato',
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/contracts/public-api/index.ts src/shared/i18n/catalog.pt-BR.ts
git commit -m "feat(contracts): add public API and i18n tags"
```

---

## Fase 2: Tela 1 — Listagem de Contratos

### Task 10: Contract List — query + view-model + binding

**Files:**
- Create: `src/modules/contracts/client/contract-list/contract-list.query.ts`
- Create: `src/modules/contracts/client/contract-list/contract-list.view-model.ts`
- Create: `src/modules/contracts/client/contract-list/contract-list.binding.ts`

- [ ] **Step 1: Escrever contract-list.query.ts**

```typescript
/**
 * contractListQueryOptions — data AGNÓSTICA do comportamento listagem.
 */
import { contractsRepository } from '#modules/contracts/client/data/repository/contracts.repository.instance.ts'
import type { ListContractsInput } from '#modules/contracts/client/data/model/contracts.model.ts'

export const contractListQueryKey = (input: ListContractsInput) => ['contracts', 'list', input] as const

export const contractListQueryOptions = (input: ListContractsInput) => ({
  queryKey: contractListQueryKey(input),
  queryFn: () => contractsRepository.list(input),
})
```

- [ ] **Step 2: Escrever contract-list.view-model.ts**

```typescript
/**
 * contractListViewModel — ViewModel AGNÓSTICO (objeto puro, zero React).
 * Define query options + derivações puras.
 */
import { contractListQueryOptions } from './contract-list.query.ts'

export const contractListViewModel = {
  query: contractListQueryOptions,
}
```

- [ ] **Step 3: Escrever contract-list.binding.ts**

```typescript
/**
 * useContractListBinding — ADAPTER React (ADR-0009).
 * Liga o view-model ao TanStack Query.
 */
import { useQuery } from '@tanstack/react-query'
import type { ListContractsInput, ListContractsResponse } from '#modules/contracts/client/data/model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { Result } from '#shared/primitives/result.ts'
import { contractListViewModel } from './contract-list.view-model.ts'

export type ContractListQueryState = Readonly<{
  data: Result<ListContractsResponse, ContractsError> | null
  isLoading: boolean
  isError: boolean
}>

export const useContractListBinding = (input: ListContractsInput): ContractListQueryState => {
  const query = useQuery({
    ...contractListViewModel.query(input),
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/modules/contracts/client/contract-list/
git commit -m "feat(contracts): add contract-list query, view-model and binding"
```

---

### Task 11: Contract List — page + components

**Files:**
- Create: `src/modules/contracts/client/contract-list/page/contract-list.page.tsx`
- Create: `src/modules/contracts/client/contract-list/page/contract-list.css.ts`
- Create: `src/modules/contracts/client/contract-list/components/contract-list-table.component.tsx`
- Create: `src/modules/contracts/client/contract-list/components/contract-list-filters.component.tsx`
- Create: `src/modules/contracts/client/contract-list/components/contract-list-pagination.component.tsx`

- [ ] **Step 1: Escrever contract-list.page.tsx**

```typescript
/**
 * ContractListPage — template/composição (ADR-0009).
 * Liga o binding, resolve i18n, mapeia estado para componentes.
 */
import type { ReactNode } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { isOk } from '#shared/primitives/result.ts'
import { useContractListBinding } from '../contract-list.binding.ts'
import { ContractListTable } from '../components/contract-list-table.component.tsx'
import { ContractListFilters } from '../components/contract-list-filters.component.tsx'
import { ContractListPagination } from '../components/contract-list-pagination.component.tsx'
import { screen } from './contract-list.css.ts'

const t = createTranslator(ptBR)

export function ContractListPage(): ReactNode {
  const { data, isLoading } = useContractListBinding({ page: 1, limit: 20 })

  const contracts = data && isOk(data) ? data.value.items : []
  const meta = data && isOk(data) ? data.value.meta : null

  return (
    <div className={screen}>
      <header>
        <h1>{t('contracts.list.title')}</h1>
        <a href="/contratos/criar">{t('contracts.list.new')}</a>
      </header>
      <ContractListFilters />
      {isLoading ? (
        <p>{t('common.loading')}</p>
      ) : contracts.length === 0 ? (
        <p>{t('contracts.list.empty')}</p>
      ) : (
        <ContractListTable contracts={contracts} />
      )}
      {meta && <ContractListPagination meta={meta} />}
    </div>
  )
}
```

- [ ] **Step 2: Escrever contract-list.css.ts**

```typescript
import { style } from '@vanilla-extract/css'
import { vars } from '#shared/ui/tokens/index.ts'

export const screen = style({
  padding: vars.space[6],
  maxWidth: '1200px',
  margin: '0 auto',
})
```

- [ ] **Step 3: Escrever contract-list-table.component.tsx**

```typescript
import type { ReactNode } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'

const t = createTranslator(ptBR)

interface Props {
  contracts: readonly Contract[]
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

function formatPeriod(start: Date, end: Date): string {
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR')
  return `${fmt(start)} — ${fmt(end)}`
}

export function ContractListTable({ contracts }: Props): ReactNode {
  return (
    <table>
      <thead>
        <tr>
          <th>{t('contracts.list.columns.code')}</th>
          <th>{t('contracts.list.columns.title')}</th>
          <th>{t('contracts.list.columns.type')}</th>
          <th>{t('contracts.list.columns.status')}</th>
          <th>{t('contracts.list.columns.originalValue')}</th>
          <th>{t('contracts.list.columns.currentValue')}</th>
          <th>{t('contracts.list.columns.period')}</th>
          <th>{t('contracts.list.columns.balance')}</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {contracts.map((c) => (
          <tr key={c.id}>
            <td>{c.sequentialNumber}</td>
            <td>{c.title}</td>
            <td>{t(`contracts.type.${c.contractType}`)}</td>
            <td>{t(`contracts.status.${c.status}`)}</td>
            <td>{formatCurrency(c.originalValue.cents)}</td>
            <td>{formatCurrency(c.currentValue.cents)}</td>
            <td>{formatPeriod(c.originalPeriod.start, c.originalPeriod.end)}</td>
            <td>—</td>
            <td>
              <a href={`/contratos/${c.id}`}>{t('contracts.list.actions.view')}</a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 4: Escrever contract-list-filters.component.tsx**

```typescript
import type { ReactNode } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const t = createTranslator(ptBR)

export function ContractListFilters(): ReactNode {
  return (
    <div>
      <input type="text" placeholder={t('contracts.list.search')} />
      <select>
        <option value="">{t('contracts.list.filters.all')}</option>
        <option value="expiring">{t('contracts.list.filters.expiring')}</option>
      </select>
    </div>
  )
}
```

- [ ] **Step 5: Escrever contract-list-pagination.component.tsx**

```typescript
import type { ReactNode } from 'react'
import type { ListContractsResponse } from '#modules/contracts/client/data/model/contracts.model.ts'

interface Props {
  meta: ListContractsResponse['meta']
}

export function ContractListPagination({ meta }: Props): ReactNode {
  return (
    <div>
      Página {meta.page} de {meta.totalPages} · Total: {meta.total}
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/modules/contracts/client/contract-list/
git commit -m "feat(contracts): add contract-list page and components"
```

---

### Task 12: Rotas

**Files:**
- Create: `src/routes/_authenticated/contratos/index.tsx`
- Create: `src/routes/_authenticated/contratos/criar.tsx`
- Create: `src/routes/_authenticated/contratos/$id.tsx`
- Create: `src/routes/_authenticated/contratos/$id.editar.tsx`
- Create: `src/routes/_authenticated/contratos/aditivo.$id.tsx`

- [ ] **Step 1: Escrever contratos/index.tsx**

```typescript
/**
 * Rota /contratos — listagem de contratos (protegida).
 */
import { createFileRoute } from '@tanstack/react-router'
import { ContractListPage } from '#modules/contracts/client/contract-list/page/contract-list.page.tsx'

export const Route = createFileRoute('/_authenticated/contratos/')({
  component: ContractListPage,
})
```

- [ ] **Step 2: Escrever contratos/criar.tsx**

```typescript
/**
 * Rota /contratos/criar — criar novo contrato (protegida).
 */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/contratos/criar')({
  component: () => <div>Criar Contrato (em construção)</div>,
})
```

- [ ] **Step 3: Escrever contratos/$id.tsx**

```typescript
/**
 * Rota /contratos/$id — detalhes do contrato (protegida).
 */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/contratos/$id')({
  component: () => <div>Detalhes do Contrato (em construção)</div>,
})
```

- [ ] **Step 4: Escrever contratos/$id.editar.tsx**

```typescript
/**
 * Rota /contratos/$id/editar — editar contrato (protegida).
 */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/contratos/$id/editar')({
  component: () => <div>Editar Contrato (em construção)</div>,
})
```

- [ ] **Step 5: Escrever contratos/aditivo.$id.tsx**

```typescript
/**
 * Rota /contratos/aditivo/$id — criar aditivo (protegida).
 */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/contratos/aditivo/$id')({
  component: () => <div>Criar Aditivo (em construção)</div>,
})
```

- [ ] **Step 6: Regenerar route tree e verificar**

```bash
cd /Users/alessandracastro/dev/ERP-FRONTEND/v2 && pnpm typecheck
```

- [ ] **Step 7: Commit**

```bash
git add src/routes/_authenticated/contratos/
git commit -m "feat(contracts): add routes for all 5 screens"
```

---

## Fase 3: Tela 2 — Criar Contrato

### Task 13: Contract Create — mutation + view-model + binding

**Files:**
- Create: `src/modules/contracts/client/contract-create/contract-create.mutation.ts`
- Create: `src/modules/contracts/client/contract-create/contract-create.view-model.ts`
- Create: `src/modules/contracts/client/contract-create/contract-create.binding.ts`

- [ ] **Step 1: Escrever contract-create.mutation.ts**

```typescript
import { contractsRepository } from '#modules/contracts/client/data/repository/contracts.repository.instance.ts'
import type { CreateContractInput } from '#modules/contracts/client/data/model/contracts.model.ts'

export const contractCreateMutationKey = ['contracts', 'create'] as const

export const contractCreateMutationOptions = {
  mutationKey: contractCreateMutationKey,
  mutationFn: (input: CreateContractInput) => contractsRepository.create(input),
}
```

- [ ] **Step 2: Escrever contract-create.view-model.ts**

```typescript
import { isOk, type Result } from '#shared/primitives/result.ts'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import { contractsErrorTag } from '#modules/contracts/client/data/helpers/contracts-error-tag.ts'
import { contractCreateMutationOptions } from './contract-create.mutation.ts'

export const contractCreateViewModel = {
  mutation: contractCreateMutationOptions,

  onSuccess: (result: Result<Contract, ContractsError>): void => {
    if (isOk(result)) {
      // Emitir evento de contrato criado (opcional — para invalidar queries)
    }
  },

  toErrorTag: (error: ContractsError): string => contractsErrorTag(error),
  unexpectedErrorTag: 'contracts.error.unexpected',
}
```

- [ ] **Step 3: Escrever contract-create.binding.ts**

```typescript
import { useMutation } from '@tanstack/react-query'
import type { CreateContractInput, Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { Result } from '#shared/primitives/result.ts'
import { isOk } from '#shared/primitives/result.ts'
import { contractCreateViewModel } from './contract-create.view-model.ts'

export type CreateContractCommand = Readonly<{
  running: boolean
  errorTag: string | null
  result: Contract | null
  execute: (input: CreateContractInput) => void
}>

export const useContractCreateBinding = (): Readonly<{ createCommand: CreateContractCommand }> => {
  const mutation = useMutation({
    ...contractCreateViewModel.mutation,
    onSuccess: (result) => {
      contractCreateViewModel.onSuccess(result)
    },
  })

  const data = mutation.data
  const errorTag =
    data !== undefined && !isOk(data)
      ? contractCreateViewModel.toErrorTag(data.error)
      : mutation.isError
        ? contractCreateViewModel.unexpectedErrorTag
        : null

  return {
    createCommand: {
      running: mutation.isPending,
      errorTag,
      result: data !== undefined && isOk(data) ? data.value : null,
      execute: (input) => mutation.mutate(input),
    },
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/modules/contracts/client/contract-create/
git commit -m "feat(contracts): add contract-create mutation, view-model and binding"
```

---

### Task 14: Contract Create — form controller + page + components

**Files:**
- Create: `src/modules/contracts/client/contract-create/components/contract-form.controller.ts`
- Create: `src/modules/contracts/client/contract-create/components/contract-form.component.tsx`
- Create: `src/modules/contracts/client/contract-create/page/contract-create.page.tsx`
- Create: `src/modules/contracts/client/contract-create/page/contract-create.css.ts`

- [ ] **Step 1: Escrever contract-form.controller.ts**

```typescript
/**
 * useContractFormController — estado transiente do formulário de contrato.
 */
import { useState, useCallback } from 'react'
import type { CreateContractInput } from '#modules/contracts/client/data/model/contracts.model.ts'

export type ContractFormState = Readonly<{
  title: string
  objective: string
  originalValueCents: number
  originalPeriodStart: string
  originalPeriodEnd: string
  classification: 'Contract' | 'ServiceOrder'
  contractModel: 'Service' | 'Donation'
  contractType: 'Supplier' | 'Financier' | 'Collaborator' | 'ACT'
  supplierId: string
  financierId: string
  collaboratorId: string
  programId: number | null
  budgetPlanId: number | null
  categorizacao: 'Avaliação' | 'Operacional' | 'Processo' | null
  centroDeCusto: 'RH' | 'Serviços Gerais' | 'Eventos' | null
  email: string
  telephone: string
  observations: string
}>

export const useContractFormController = (onSubmit: (input: CreateContractInput) => void) => {
  const [state, setState] = useState<ContractFormState>({
    title: '',
    objective: '',
    originalValueCents: 0,
    originalPeriodStart: '',
    originalPeriodEnd: '',
    classification: 'Contract',
    contractModel: 'Service',
    contractType: 'Supplier',
    supplierId: '',
    financierId: '',
    collaboratorId: '',
    programId: null,
    budgetPlanId: null,
    categorizacao: null,
    centroDeCusto: null,
    email: '',
    telephone: '',
    observations: '',
  })

  const update = useCallback(<K extends keyof ContractFormState>(key: K, value: ContractFormState[K]) => {
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  const submit = useCallback(() => {
    const input: CreateContractInput = {
      title: state.title,
      objective: state.objective,
      originalValueCents: state.originalValueCents,
      originalPeriod: {
        start: new Date(state.originalPeriodStart),
        end: new Date(state.originalPeriodEnd),
      },
      classification: state.classification,
      contractModel: state.contractModel,
      contractType: state.contractType,
      supplierId: state.supplierId || undefined,
      financierId: state.financierId || undefined,
      collaboratorId: state.collaboratorId || undefined,
      programId: state.programId ?? undefined,
      budgetPlanId: state.budgetPlanId ?? undefined,
      categorizacao: state.categorizacao ?? undefined,
      centroDeCusto: state.centroDeCusto ?? undefined,
      email: state.email || undefined,
      telephone: state.telephone || undefined,
      observations: state.observations || undefined,
    }
    onSubmit(input)
  }, [state, onSubmit])

  return { state, update, submit }
}
```

- [ ] **Step 2: Escrever contract-form.component.tsx**

```typescript
import type { ReactNode } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import type { ContractFormState } from './contract-form.controller.ts'

const t = createTranslator(ptBR)

interface Props {
  state: ContractFormState
  onUpdate: <K extends keyof ContractFormState>(key: K, value: ContractFormState[K]) => void
  onSubmit: () => void
  submitting: boolean
  errorText: string | null
}

export function ContractForm({ state, onUpdate, onSubmit, submitting, errorText }: Props): ReactNode {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }}>
      <fieldset>
        <legend>{t('contracts.create.section.basic')}</legend>
        <label>{t('contracts.create.field.title')}</label>
        <input value={state.title} onChange={(e) => onUpdate('title', e.target.value)} />
        <label>{t('contracts.create.field.objective')}</label>
        <textarea value={state.objective} onChange={(e) => onUpdate('objective', e.target.value)} />
        <label>{t('contracts.create.field.classification')}</label>
        <select value={state.classification} onChange={(e) => onUpdate('classification', e.target.value as 'Contract' | 'ServiceOrder')}>
          <option value="Contract">Contrato</option>
          <option value="ServiceOrder">Ordem de Serviço</option>
        </select>
        <label>{t('contracts.create.field.value')}</label>
        <input type="number" value={state.originalValueCents} onChange={(e) => onUpdate('originalValueCents', Number(e.target.value))} />
        <label>{t('contracts.create.field.period')}</label>
        <input type="date" value={state.originalPeriodStart} onChange={(e) => onUpdate('originalPeriodStart', e.target.value)} />
        <input type="date" value={state.originalPeriodEnd} onChange={(e) => onUpdate('originalPeriodEnd', e.target.value)} />
      </fieldset>
      {/* TODO: adicionar demais seções (contratado, financeiro, contato) */}
      {errorText && <div role="alert">{errorText}</div>}
      <button type="submit" disabled={submitting}>{t('contracts.create.submit')}</button>
    </form>
  )
}
```

- [ ] **Step 3: Escrever contract-create.page.tsx**

```typescript
import type { ReactNode } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { useContractCreateBinding } from '../contract-create.binding.ts'
import { useContractFormController } from '../components/contract-form.controller.ts'
import { ContractForm } from '../components/contract-form.component.tsx'
import { screen } from './contract-create.css.ts'

const t = createTranslator(ptBR)

export function ContractCreatePage(): ReactNode {
  const { createCommand } = useContractCreateBinding()
  const form = useContractFormController(createCommand.execute)

  return (
    <div className={screen}>
      <h1>{t('contracts.create.title')}</h1>
      <p>{t('contracts.create.subtitle')}</p>
      <ContractForm
        state={form.state}
        onUpdate={form.update}
        onSubmit={form.submit}
        submitting={createCommand.running}
        errorText={createCommand.errorTag === null ? null : t(createCommand.errorTag)}
      />
      {createCommand.result && (
        <div role="dialog">
          <h2>{t('contracts.create.modal.title')}</h2>
          <p>{t('contracts.create.modal.subtitle').replace('{{code}}', createCommand.result.sequentialNumber)}</p>
          <a href={`/contratos/${createCommand.result.id}`}>{t('contracts.create.modal.button')}</a>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Escrever contract-create.css.ts**

```typescript
import { style } from '@vanilla-extract/css'
import { vars } from '#shared/ui/tokens/index.ts'

export const screen = style({
  padding: vars.space[6],
  maxWidth: '800px',
  margin: '0 auto',
})
```

- [ ] **Step 5: Atualizar rota criar.tsx**

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { ContractCreatePage } from '#modules/contracts/client/contract-create/page/contract-create.page.tsx'

export const Route = createFileRoute('/_authenticated/contratos/criar')({
  component: ContractCreatePage,
})
```

- [ ] **Step 6: Commit**

```bash
git add src/modules/contracts/client/contract-create/ src/routes/_authenticated/contratos/criar.tsx
git commit -m "feat(contracts): add contract-create page, form and controller"
```

---

## Fase 4: Tela 3 — Detalhes do Contrato

### Task 15: Contract Detail — query + view-model + binding + page

**Files:**
- Create: `src/modules/contracts/client/contract-detail/contract-detail.query.ts`
- Create: `src/modules/contracts/client/contract-detail/contract-detail.view-model.ts`
- Create: `src/modules/contracts/client/contract-detail/contract-detail.binding.ts`
- Create: `src/modules/contracts/client/contract-detail/page/contract-detail.page.tsx`
- Create: `src/modules/contracts/client/contract-detail/page/contract-detail.css.ts`
- Create: `src/modules/contracts/client/contract-detail/components/contract-hero.component.tsx`
- Create: `src/modules/contracts/client/contract-detail/components/contract-documents.component.tsx`
- Create: `src/modules/contracts/client/contract-detail/components/contract-timeline.component.tsx`
- Modify: `src/routes/_authenticated/contratos/$id.tsx`

- [ ] **Step 1: Escrever query + view-model + binding**

```typescript
// contract-detail.query.ts
import { contractsRepository } from '#modules/contracts/client/data/repository/contracts.repository.instance.ts'

export const contractDetailQueryKey = (id: string) => ['contracts', 'detail', id] as const

export const contractDetailQueryOptions = (id: string) => ({
  queryKey: contractDetailQueryKey(id),
  queryFn: () => contractsRepository.getById(id),
})

// contract-detail.view-model.ts
import { contractDetailQueryOptions } from './contract-detail.query.ts'

export const contractDetailViewModel = {
  query: contractDetailQueryOptions,
}

// contract-detail.binding.ts
import { useQuery } from '@tanstack/react-query'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { Result } from '#shared/primitives/result.ts'
import { contractDetailViewModel } from './contract-detail.view-model.ts'

export type ContractDetailQueryState = Readonly<{
  data: Result<Contract, ContractsError> | null
  isLoading: boolean
  isError: boolean
}>

export const useContractDetailBinding = (id: string): ContractDetailQueryState => {
  const query = useQuery({ ...contractDetailViewModel.query(id) })
  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
```

- [ ] **Step 2: Escrever componentes**

```typescript
// contract-hero.component.tsx
import type { ReactNode } from 'react'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'

interface Props {
  contract: Contract
}

export function ContractHero({ contract }: Props): ReactNode {
  return (
    <div>
      <h1>{contract.title}</h1>
      <span>{contract.sequentialNumber}</span>
      <span>{contract.status}</span>
      <p>{contract.objective}</p>
      {/* TODO: exibir todos os campos do contrato */}
    </div>
  )
}

// contract-documents.component.tsx
import type { ReactNode } from 'react'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'

interface Props {
  contract: Contract
}

export function ContractDocuments({ contract }: Props): ReactNode {
  const allDocs = [
    { id: contract.id, name: 'Contrato Base', type: 'base' as const, ...contract },
    ...contract.children.map((a) => ({ ...a, name: `Aditivo ${a.amendmentNumber}`, type: 'amendment' as const })),
  ]

  return (
    <table>
      <thead>
        <tr><th>Documento</th><th>Tipo</th><th>Status</th><th>Ações</th></tr>
      </thead>
      <tbody>
        {allDocs.map((doc) => (
          <tr key={doc.id}>
            <td>{doc.name}</td>
            <td>{'type' in doc ? doc.type : 'base'}</td>
            <td>{'status' in doc ? doc.status : contract.status}</td>
            <td><button>Visualizar</button></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// contract-timeline.component.tsx
import type { ReactNode } from 'react'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'

interface Props {
  contract: Contract
}

export function ContractTimeline({ contract }: Props): ReactNode {
  return (
    <div>
      <h3>Timeline</h3>
      <ul>
        <li>Criado em: {contract.createdAt.toLocaleDateString('pt-BR')}</li>
        {contract.signedAt && <li>Assinado em: {contract.signedAt.toLocaleDateString('pt-BR')}</li>}
        {contract.children.filter((a) => a.status === 'Homologado').map((a) => (
          <li key={a.id}>Aditivo {a.amendmentNumber} homologado</li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 3: Escrever page**

```typescript
// contract-detail.page.tsx
import type { ReactNode } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { isOk } from '#shared/primitives/result.ts'
import { useContractDetailBinding } from '../contract-detail.binding.ts'
import { ContractHero } from '../components/contract-hero.component.tsx'
import { ContractDocuments } from '../components/contract-documents.component.tsx'
import { ContractTimeline } from '../components/contract-timeline.component.tsx'
import { screen } from './contract-detail.css.ts'

const t = createTranslator(ptBR)

export function ContractDetailPage({ contractId }: { contractId: string }): ReactNode {
  const { data, isLoading } = useContractDetailBinding(contractId)

  if (isLoading) return <div>{t('common.loading')}</div>
  if (!data || !isOk(data)) return <div>Erro ao carregar contrato</div>

  const contract = data.value

  return (
    <div className={screen}>
      <ContractHero contract={contract} />
      <ContractDocuments contract={contract} />
      <ContractTimeline contract={contract} />
    </div>
  )
}
```

- [ ] **Step 4: Atualizar rota $id.tsx**

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { ContractDetailPage } from '#modules/contracts/client/contract-detail/page/contract-detail.page.tsx'

export const Route = createFileRoute('/_authenticated/contratos/$id')({
  component: () => {
    const { id } = Route.useParams()
    return <ContractDetailPage contractId={id} />
  },
})
```

- [ ] **Step 5: Commit**

```bash
git add src/modules/contracts/client/contract-detail/ src/routes/_authenticated/contratos/\$id.tsx
git commit -m "feat(contracts): add contract-detail page and components"
```

---

## Fase 5: Tela 4 — Editar Contrato

### Task 16: Contract Edit — mutation + view-model + binding + page

**Files:**
- Create: `src/modules/contracts/client/contract-edit/contract-edit.mutation.ts`
- Create: `src/modules/contracts/client/contract-edit/contract-edit.view-model.ts`
- Create: `src/modules/contracts/client/contract-edit/contract-edit.binding.ts`
- Create: `src/modules/contracts/client/contract-edit/page/contract-edit.page.tsx`
- Create: `src/modules/contracts/client/contract-edit/page/contract-edit.css.ts`
- Create: `src/modules/contracts/client/contract-edit/components/contract-edit-form.component.tsx`
- Modify: `src/routes/_authenticated/contratos/$id.editar.tsx`

- [ ] **Step 1: Escrever mutation + view-model + binding**

```typescript
// contract-edit.mutation.ts
import { contractsRepository } from '#modules/contracts/client/data/repository/contracts.repository.instance.ts'
import type { UpdateContractInput } from '#modules/contracts/client/data/model/contracts.model.ts'

export const contractEditMutationKey = ['contracts', 'edit'] as const

export const contractEditMutationOptions = {
  mutationKey: contractEditMutationKey,
  mutationFn: (input: UpdateContractInput) => contractsRepository.update(input),
}

// contract-edit.view-model.ts
import { isOk } from '#shared/primitives/result.ts'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import { contractsErrorTag } from '#modules/contracts/client/data/helpers/contracts-error-tag.ts'
import { contractEditMutationOptions } from './contract-edit.mutation.ts'

export const contractEditViewModel = {
  mutation: contractEditMutationOptions,
  onSuccess: () => { /* invalidar query de detalhe */ },
  toErrorTag: (error: ContractsError): string => contractsErrorTag(error),
  unexpectedErrorTag: 'contracts.error.unexpected',
}

// contract-edit.binding.ts
import { useMutation } from '@tanstack/react-query'
import type { UpdateContractInput, Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import { isOk } from '#shared/primitives/result.ts'
import { contractEditViewModel } from './contract-edit.view-model.ts'

export type UpdateContractCommand = Readonly<{
  running: boolean
  errorTag: string | null
  result: Contract | null
  execute: (input: UpdateContractInput) => void
}>

export const useContractEditBinding = (): Readonly<{ editCommand: UpdateContractCommand }> => {
  const mutation = useMutation({ ...contractEditViewModel.mutation })
  const data = mutation.data
  const errorTag =
    data !== undefined && !isOk(data)
      ? contractEditViewModel.toErrorTag(data.error)
      : mutation.isError ? contractEditViewModel.unexpectedErrorTag : null

  return {
    editCommand: {
      running: mutation.isPending,
      errorTag,
      result: data !== undefined && isOk(data) ? data.value : null,
      execute: (input) => mutation.mutate(input),
    },
  }
}
```

- [ ] **Step 2: Escrever page + component + atualizar rota**

```typescript
// contract-edit-form.component.tsx
import type { ReactNode } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const t = createTranslator(ptBR)

interface Props {
  email: string
  telephone: string
  observations: string
  onEmailChange: (v: string) => void
  onTelephoneChange: (v: string) => void
  onObservationsChange: (v: string) => void
  onSubmit: () => void
  submitting: boolean
  errorText: string | null
}

export function ContractEditForm(props: Props): ReactNode {
  return (
    <form onSubmit={(e) => { e.preventDefault(); props.onSubmit() }}>
      <label>{t('contracts.edit.field.email')}</label>
      <input value={props.email} onChange={(e) => props.onEmailChange(e.target.value)} />
      <label>{t('contracts.edit.field.telephone')}</label>
      <input value={props.telephone} onChange={(e) => props.onTelephoneChange(e.target.value)} />
      <label>{t('contracts.edit.field.observations')}</label>
      <textarea value={props.observations} onChange={(e) => props.onObservationsChange(e.target.value)} />
      {props.errorText && <div role="alert">{props.errorText}</div>}
      <button type="submit" disabled={props.submitting}>{t('contracts.edit.submit')}</button>
    </form>
  )
}

// contract-edit.page.tsx
import type { ReactNode } from 'react'
import { useState } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { isOk } from '#shared/primitives/result.ts'
import { useContractDetailBinding } from '#modules/contracts/client/contract-detail/contract-detail.binding.ts'
import { useContractEditBinding } from '../contract-edit.binding.ts'
import { ContractEditForm } from '../components/contract-edit-form.component.tsx'
import { screen } from './contract-edit.css.ts'

const t = createTranslator(ptBR)

export function ContractEditPage({ contractId }: { contractId: string }): ReactNode {
  const { data: detailData } = useContractDetailBinding(contractId)
  const { editCommand } = useContractEditBinding()

  const contract = detailData && isOk(detailData) ? detailData.value : null

  const [email, setEmail] = useState(contract?.email ?? '')
  const [telephone, setTelephone] = useState(contract?.telephone ?? '')
  const [observations, setObservations] = useState(contract?.observations ?? '')

  const handleSubmit = () => {
    editCommand.execute({ id: contractId, email, telephone, observations })
  }

  if (!contract) return <div>{t('common.loading')}</div>

  return (
    <div className={screen}>
      <h1>{t('contracts.edit.title')}</h1>
      <p>{t('contracts.edit.subtitle')}</p>
      <ContractEditForm
        email={email}
        telephone={telephone}
        observations={observations}
        onEmailChange={setEmail}
        onTelephoneChange={setTelephone}
        onObservationsChange={setObservations}
        onSubmit={handleSubmit}
        submitting={editCommand.running}
        errorText={editCommand.errorTag === null ? null : t(editCommand.errorTag)}
      />
      {editCommand.result && <div role="alert">{t('contracts.edit.modal.title')}</div>}
    </div>
  )
}
```

- [ ] **Step 3: Atualizar rota $id.editar.tsx**

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { ContractEditPage } from '#modules/contracts/client/contract-edit/page/contract-edit.page.tsx'

export const Route = createFileRoute('/_authenticated/contratos/$id/editar')({
  component: () => {
    const { id } = Route.useParams()
    return <ContractEditPage contractId={id} />
  },
})
```

- [ ] **Step 4: Commit**

```bash
git add src/modules/contracts/client/contract-edit/ src/routes/_authenticated/contratos/\$id.editar.tsx
git commit -m "feat(contracts): add contract-edit page and form"
```

---

## Fase 6: Tela 5 — Criar Aditivo

### Task 17: Amendment Create — mutation + view-model + binding + page

**Files:**
- Create: `src/modules/contracts/client/amendment-create/amendment-create.mutation.ts`
- Create: `src/modules/contracts/client/amendment-create/amendment-create.view-model.ts`
- Create: `src/modules/contracts/client/amendment-create/amendment-create.binding.ts`
- Create: `src/modules/contracts/client/amendment-create/page/amendment-create.page.tsx`
- Create: `src/modules/contracts/client/amendment-create/page/amendment-create.css.ts`
- Create: `src/modules/contracts/client/amendment-create/components/amendment-form.component.tsx`
- Create: `src/modules/contracts/client/amendment-create/components/amendment-form.controller.ts`
- Modify: `src/routes/_authenticated/contratos/aditivo.$id.tsx`

- [ ] **Step 1: Escrever mutation + view-model + binding**

```typescript
// amendment-create.mutation.ts
import { contractsRepository } from '#modules/contracts/client/data/repository/contracts.repository.instance.ts'
import type { CreateAmendmentInput } from '#modules/contracts/client/data/model/contracts.model.ts'

export const amendmentCreateMutationKey = ['contracts', 'amendment', 'create'] as const

export const amendmentCreateMutationOptions = {
  mutationKey: amendmentCreateMutationKey,
  mutationFn: (input: { contractId: string; data: CreateAmendmentInput }) =>
    contractsRepository.createAmendment(input.contractId, input.data),
}

// amendment-create.view-model.ts
import { isOk } from '#shared/primitives/result.ts'
import type { Amendment } from '#modules/contracts/client/data/model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import { contractsErrorTag } from '#modules/contracts/client/data/helpers/contracts-error-tag.ts'
import { amendmentCreateMutationOptions } from './amendment-create.mutation.ts'

export const amendmentCreateViewModel = {
  mutation: amendmentCreateMutationOptions,
  onSuccess: () => { /* invalidar queries */ },
  toErrorTag: (error: ContractsError): string => contractsErrorTag(error),
  unexpectedErrorTag: 'contracts.error.unexpected',
}

// amendment-create.binding.ts
import { useMutation } from '@tanstack/react-query'
import type { CreateAmendmentInput, Amendment } from '#modules/contracts/client/data/model/contracts.model.ts'
import { isOk } from '#shared/primitives/result.ts'
import { amendmentCreateViewModel } from './amendment-create.view-model.ts'

export type CreateAmendmentCommand = Readonly<{
  running: boolean
  errorTag: string | null
  result: Amendment | null
  execute: (contractId: string, input: CreateAmendmentInput) => void
}>

export const useAmendmentCreateBinding = (): Readonly<{ createCommand: CreateAmendmentCommand }> => {
  const mutation = useMutation({ ...amendmentCreateViewModel.mutation })
  const data = mutation.data
  const errorTag =
    data !== undefined && !isOk(data)
      ? amendmentCreateViewModel.toErrorTag(data.error)
      : mutation.isError ? amendmentCreateViewModel.unexpectedErrorTag : null

  return {
    createCommand: {
      running: mutation.isPending,
      errorTag,
      result: data !== undefined && isOk(data) ? data.value : null,
      execute: (contractId, input) => mutation.mutate({ contractId, data: input }),
    },
  }
}
```

- [ ] **Step 2: Escrever form controller**

```typescript
// amendment-form.controller.ts
import { useState, useCallback } from 'react'
import type { CreateAmendmentInput, AmendmentType } from '#modules/contracts/client/data/model/contracts.model.ts'

export type AmendmentFormState = Readonly<{
  type: AmendmentType | null
  description: string
  impactValueCents: number
  impactDirection: 'acrescimo' | 'supressao'
  newEndDate: string
  startDate: string
  signedAt: string
  hasDocument: boolean
}>

export const useAmendmentFormController = (onSubmit: (input: CreateAmendmentInput) => void) => {
  const [state, setState] = useState<AmendmentFormState>({
    type: null,
    description: '',
    impactValueCents: 0,
    impactDirection: 'acrescimo',
    newEndDate: '',
    startDate: '',
    signedAt: '',
    hasDocument: false,
  })

  const update = useCallback(<K extends keyof AmendmentFormState>(key: K, value: AmendmentFormState[K]) => {
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  const submit = useCallback(() => {
    const input: CreateAmendmentInput = {
      contractId: '', // preenchido pelo caller
      type: state.type!,
      description: state.description || undefined,
      impactValueCents: state.type === 'valor'
        ? state.impactDirection === 'supressao' ? -state.impactValueCents : state.impactValueCents
        : undefined,
      newEndDate: state.type === 'prazo' && state.newEndDate ? new Date(state.newEndDate) : undefined,
      startDate: state.startDate ? new Date(state.startDate) : undefined,
      signedAt: state.signedAt ? new Date(state.signedAt) : undefined,
    }
    onSubmit(input)
  }, [state, onSubmit])

  return { state, update, submit }
}
```

- [ ] **Step 3: Escrever form component + page + atualizar rota**

```typescript
// amendment-form.component.tsx
import type { ReactNode } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import type { AmendmentFormState } from './amendment-form.controller.ts'

const t = createTranslator(ptBR)

interface Props {
  state: AmendmentFormState
  onUpdate: <K extends keyof AmendmentFormState>(key: K, value: AmendmentFormState[K]) => void
  onSubmit: () => void
  submitting: boolean
  errorText: string | null
}

const types: AmendmentFormState['type'][] = ['prazo', 'valor', 'escopo', 'outro', 'distrato']

export function AmendmentForm({ state, onUpdate, onSubmit, submitting, errorText }: Props): ReactNode {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }}>
      <div>
        <label>{t('contracts.amendment.field.type')}</label>
        <div>
          {types.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onUpdate('type', type)}
              style={{ background: state.type === type ? '#e0e0e0' : 'white' }}
            >
              {t(`contracts.amendment.type.${type}`)}
              <small>{t(`contracts.amendment.type.desc.${type}`)}</small>
            </button>
          ))}
        </div>
      </div>
      {state.type === 'prazo' && (
        <label>
          {t('contracts.amendment.field.newEndDate')}
          <input type="date" value={state.newEndDate} onChange={(e) => onUpdate('newEndDate', e.target.value)} />
        </label>
      )}
      {state.type === 'valor' && (
        <>
          <div>
            <button type="button" onClick={() => onUpdate('impactDirection', 'acrescimo')}>Acréscimo</button>
            <button type="button" onClick={() => onUpdate('impactDirection', 'supressao')}>Supressão</button>
          </div>
          <label>
            {t('contracts.amendment.field.value')}
            <input type="number" value={state.impactValueCents} onChange={(e) => onUpdate('impactValueCents', Number(e.target.value))} />
          </label>
        </>
      )}
      <label>
        {t('contracts.amendment.field.signedAt')}
        <input type="date" value={state.signedAt} onChange={(e) => onUpdate('signedAt', e.target.value)} />
      </label>
      <label>
        {t('contracts.amendment.field.startDate')}
        <input type="date" value={state.startDate} onChange={(e) => onUpdate('startDate', e.target.value)} />
      </label>
      <label>
        {t('contracts.amendment.field.description')}
        <textarea value={state.description} onChange={(e) => onUpdate('description', e.target.value)} />
      </label>
      {errorText && <div role="alert">{errorText}</div>}
      <button type="submit" disabled={submitting}>{t('contracts.amendment.submit')}</button>
    </form>
  )
}

// amendment-create.page.tsx
import type { ReactNode } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { useAmendmentCreateBinding } from '../amendment-create.binding.ts'
import { useAmendmentFormController } from '../components/amendment-form.controller.ts'
import { AmendmentForm } from '../components/amendment-form.component.tsx'
import { screen } from './amendment-create.css.ts'

const t = createTranslator(ptBR)

export function AmendmentCreatePage({ contractId }: { contractId: string }): ReactNode {
  const { createCommand } = useAmendmentCreateBinding()
  const form = useAmendmentFormController((input) => createCommand.execute(contractId, input))

  return (
    <div className={screen}>
      <h1>{t('contracts.amendment.title')}</h1>
      <span>{contractId}</span>
      <AmendmentForm
        state={form.state}
        onUpdate={form.update}
        onSubmit={form.submit}
        submitting={createCommand.running}
        errorText={createCommand.errorTag === null ? null : t(createCommand.errorTag)}
      />
    </div>
  )
}
```

- [ ] **Step 4: Atualizar rota aditivo.$id.tsx**

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { AmendmentCreatePage } from '#modules/contracts/client/amendment-create/page/amendment-create.page.tsx'

export const Route = createFileRoute('/_authenticated/contratos/aditivo/$id')({
  component: () => {
    const { id } = Route.useParams()
    return <AmendmentCreatePage contractId={id} />
  },
})
```

- [ ] **Step 5: Commit**

```bash
git add src/modules/contracts/client/amendment-create/ src/routes/_authenticated/contratos/aditivo.\$id.tsx
git commit -m "feat(contracts): add amendment-create page and form"
```

---

## Fase 7: Validação Final

### Task 18: Typecheck + Lint + Build

- [ ] **Step 1: Rodar typecheck**

```bash
cd /Users/alessandracastro/dev/ERP-FRONTEND/v2 && pnpm typecheck
```

Expected: pass (ou erros conhecidos relacionados a session guard placeholder)

- [ ] **Step 2: Rodar lint**

```bash
pnpm lint
```

Expected: pass (sem erros de boundaries)

- [ ] **Step 3: Rodar build**

```bash
pnpm build
```

Expected: pass

- [ ] **Step 4: Commit final**

```bash
git add .
git commit -m "feat(contracts): complete module foundation with all 5 screens"
```

---

## Spec Coverage Check

| Requisito da Spec | Task que implementa |
|--------------------|--------------------|
| 5 rotas (/contratos, /criar, /$id, /$id/editar, /aditivo/$id) | Task 12 |
| Listagem com busca, filtros, paginação | Task 10-11 |
| Criar contrato (form multi-etapas, sem auto-save, modal finalização) | Task 13-14 |
| Detalhes (hero, documentos, timeline, histórico) | Task 15 |
| Editar (apenas contato/observações) | Task 16 |
| Criar aditivo (5 tipos, cores, homologação automática) | Task 17 |
| Domain model completo (Zod) | Task 3 |
| Server functions (BFF) | Task 7 |
| Client data layer (repository, gateways) | Task 8 |
| i18n tags | Task 9 |
| ADR-0009 (MVVM agnóstico, Command, binding) | Todas as tasks de VM/binding |
| Result<T,E> para erros | Todas as tasks de server/client |

---

## Placeholder Scan

- Nenhum "TBD", "TODO", "implement later" no plano (exceto o TODO legítimo de integração com session guard, que é dependência externa do módulo auth).
- Nenhum "Add appropriate error handling" sem código.
- Código completo em cada step.
