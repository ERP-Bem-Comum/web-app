/**
 * Cliente HTTP do core-api para contratos — chama `/api/v2/contracts/*`.
 * Converte envelope de erro em ContractsError. NUNCA lança (tudo é Result).
 * Server-only (server/adapters).
 *
 * Mapeamento completo entre o formato da API real (backend dev) e o domínio do frontend.
 * Campos não suportados pelo backend são preenchidos com defaults (não persistem).
 */
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import { parseErrorEnvelope } from '#shared/http/error-envelope.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import type { ContractsError } from '#modules/contracts/server/adapters/contracts-shared.types.ts'
import type { ContractHistoryEvent } from '#modules/contracts/server/adapters/contracts-shared.types.ts'
import type {
  Contract,
  Amendment,
  ListContractsInput,
  ListContractsResponse,
  CreateContractInput,
  UpdateContractInput,
  CreateAmendmentInput,
} from '#modules/contracts/server/domain/contracts.types.ts'
import {
  CoreApiListResponseSchema,
  CoreApiContractListItemSchema,
  CoreApiContractDetailSchema,
  CoreApiTimelineSchema,
  CoreApiAmendmentSchema,
} from './contracts.schema.ts'

const SLUG_TO_ERROR: Partial<Record<string, ContractsError>> = {
  'contract-not-found': 'contract-not-found',
  'amendment-not-found': 'amendment-not-found',
  'invalid-value': 'invalid-value',
  'invalid-period': 'invalid-period',
  'missing-contractor': 'missing-contractor',
  'unauthorized': 'unauthorized',
  'contract-sequential-number-duplicated': 'server',
  'contract-not-pending': 'server',
  'amendment-contract-mismatch': 'server',
  'activate-contract-no-signed-document': 'server',
  'amendment-retroactive-to-contract-start': 'server',
  'ContractNotActive': 'server',
  'contract-repo-conflict': 'server',
  'amendment-repo-conflict': 'server',
  'document-already-deleted': 'server',
  'document-already-superseded': 'server',
  'document-contract-mismatch': 'server',
  'document-magic-bytes-mismatch': 'server',
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

// ─── Mappers: API → Domain ──────────────────────────────────────────────────

const statusApiToDomain = (apiStatus: 'Pending' | 'Active' | 'Expired' | 'Terminated') => {
  const map: Record<typeof apiStatus, Contract['status']> = {
    Pending: 'Pendente',
    Active: 'Em Andamento',
    Expired: 'Finalizado',
    Terminated: 'Distrato',
  }
  return map[apiStatus]
}

const statusDomainToApi = (domainStatus: Contract['status']): 'Pending' | 'Active' | 'Expired' | 'Terminated' | undefined => {
  const map: Record<Contract['status'], 'Pending' | 'Active' | 'Expired' | 'Terminated'> = {
    Pendente: 'Pending',
    'Em Andamento': 'Active',
    Finalizado: 'Expired',
    Distrato: 'Terminated',
  }
  return map[domainStatus]
}

const parseIsoDate = (s: string): Date => new Date(s)

const apiPeriodToDomain = (p: { kind: 'Fixed'; start: string; end: string } | { kind: 'Indefinite'; start: string }) => ({
  start: parseIsoDate(p.start),
  end: p.kind === 'Fixed' ? parseIsoDate(p.end) : parseIsoDate(p.start),
})

const amendmentKindToType = (kind: 'Addition' | 'Suppression' | 'TermChange' | 'Misc'): Amendment['type'] => {
  const map: Record<typeof kind, Amendment['type']> = {
    Addition: 'valor',
    Suppression: 'valor',
    TermChange: 'prazo',
    Misc: 'outro',
  }
  return map[kind]
}

const amendmentTypeToKind = (type: Amendment['type']): 'Addition' | 'Suppression' | 'TermChange' | 'Misc' => {
  const map: Record<Amendment['type'], 'Addition' | 'Suppression' | 'TermChange' | 'Misc'> = {
    prazo: 'TermChange',
    valor: 'Addition',
    escopo: 'Misc',
    outro: 'Misc',
    distrato: 'Misc',
  }
  return map[type]
}

const apiAmendmentToDomain = (a: {
  id: string
  contractId: string
  amendmentNumber: string
  description: string
  status: string
  createdAt: string
  kind: 'Addition' | 'Suppression' | 'TermChange' | 'Misc'
  impactValueCents?: number
  newEndDate?: string
  startDate?: string
}): Amendment => {
  const base: Pick<Amendment, 'id' | 'amendmentNumber' | 'description' | 'status' | 'createdAt' | 'type' | 'startDate'> = {
    id: a.id,
    amendmentNumber: a.amendmentNumber,
    description: a.description || undefined,
    status: a.status === 'Homologated' ? 'Homologado' : 'Pendente',
    createdAt: parseIsoDate(a.createdAt),
    type: amendmentKindToType(a.kind),
    startDate: a.startDate ? parseIsoDate(a.startDate) : undefined,
  }
  switch (a.kind) {
    case 'Addition':
      return { ...base, impactValueCents: a.impactValueCents }
    case 'Suppression':
      return { ...base, impactValueCents: a.impactValueCents }
    case 'TermChange':
      return { ...base, newEndDate: a.newEndDate ? parseIsoDate(a.newEndDate) : undefined }
    case 'Misc':
      return { ...base }
  }
}

const apiDocumentToDomain = (d: {
  id: string
  fileName: string
  sizeBytes: number
  uploadedAt: string
}): Contract['files'][number] => ({
  id: d.id,
  name: d.fileName,
  url: '', // Backend não expõe URL direta; download via rota futura
  size: d.sizeBytes,
  uploadedAt: parseIsoDate(d.uploadedAt),
  uploadedBy: undefined,
})

const apiContractToDomain = (c: {
  id: string
  sequentialNumber: string
  title: string
  objective: string
  originalValue: { cents: number }
  originalPeriod: { kind: 'Fixed'; start: string; end: string } | { kind: 'Indefinite'; start: string }
  status: 'Pending' | 'Active' | 'Expired' | 'Terminated'
  signedAt?: string
  currentValue?: { cents: number }
  currentPeriod?: { kind: 'Fixed'; start: string; end: string } | { kind: 'Indefinite'; start: string }
  endedAt?: string
}): Contract => ({
  id: c.id,
  sequentialNumber: c.sequentialNumber,
  title: c.title,
  objective: c.objective,
  originalValue: { cents: c.originalValue.cents },
  originalPeriod: apiPeriodToDomain(c.originalPeriod),
  status: statusApiToDomain(c.status),
  signedAt: c.signedAt ? parseIsoDate(c.signedAt) : null,
  currentValue: { cents: c.currentValue?.cents ?? c.originalValue.cents },
  currentPeriod: c.currentPeriod ? apiPeriodToDomain(c.currentPeriod) : null,
  endedAt: c.endedAt ? parseIsoDate(c.endedAt) : null,
  // Campos não suportados pelo backend (preenchidos com defaults)
  classification: 'Contract',
  contractModel: 'Service',
  contractType: 'Supplier',
  supplierId: undefined,
  financierId: undefined,
  collaboratorId: undefined,
  supplier: undefined,
  financier: undefined,
  collaborator: undefined,
  programId: undefined,
  program: undefined,
  budgetPlanId: undefined,
  budgetPlan: undefined,
  categorizacao: undefined,
  centroDeCusto: undefined,
  observations: undefined,
  email: undefined,
  telephone: undefined,
  bancaryInfo: undefined,
  pixInfo: undefined,
  origin: undefined,
  createdAt: new Date(), // Não retornado pela API em list-item; preenchido no detalhe
  updatedAt: undefined,
  children: [],
  files: [],
})

const apiContractDetailToDomain = (raw: unknown): Contract => {
  const parsed = CoreApiContractDetailSchema.safeParse(raw)
  if (!parsed.success) {
    // Fallback: tenta parsear como list-item (resposta de escrita)
    const listParsed = CoreApiContractListItemSchema.safeParse(raw)
    if (listParsed.success) {
      return apiContractToDomain(listParsed.data)
    }
    throw new Error(`[contracts] resposta inválida do core-api: ${parsed.error.message}`)
  }

  const c = parsed.data
  const base = apiContractToDomain(c)

  return {
    ...base,
    children: c.amendments.map(apiAmendmentToDomain),
    files: c.documents.map(apiDocumentToDomain),
  }
}

const apiListResponseToDomain = (raw: unknown): ListContractsResponse => {
  const parsed = CoreApiListResponseSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(`[contracts] resposta inválida do core-api (list): ${parsed.error.message}`)
  }
  return {
    items: parsed.data.items.map(apiContractToDomain),
    meta: parsed.data.meta,
  }
}

const toStr = (v: unknown): string => (typeof v === 'string' ? v : '')

const apiTimelineEntryToDomain = (e: Record<string, unknown>): ContractHistoryEvent => ({
  eventId: toStr(e.eventId),
  contractId: toStr(e.contractId),
  kind: toStr(e.kind),
  description: toStr(e.kind), // Backend não envia description; usamos kind como fallback
  occurredAt: toStr(e.occurredAt),
  userName: typeof e.actor === 'string' ? e.actor : undefined,
  metadata: typeof e.subjectAmendmentId === 'string' ? { subjectAmendmentId: e.subjectAmendmentId } : undefined,
})

const apiTimelineToDomain = (raw: unknown): readonly ContractHistoryEvent[] => {
  const parsed = CoreApiTimelineSchema.safeParse(raw)
  if (!parsed.success) {
    // Tentar formato antigo { events: [...] } para compatibilidade
    const legacyShape = { events: [] as unknown[] }
    if (raw && typeof raw === 'object' && 'events' in raw && Array.isArray((raw as Record<string, unknown>).events)) {
      legacyShape.events = (raw as Record<string, unknown>).events as unknown[]
    }
    if (legacyShape.events.length > 0) {
      return legacyShape.events.map((e) => apiTimelineEntryToDomain(e as Record<string, unknown>))
    }
    throw new Error(`[contracts] resposta inválida do core-api (timeline): ${parsed.error.message}`)
  }
  return parsed.data.map((e) => apiTimelineEntryToDomain(e as unknown as Record<string, unknown>))
}

// ─── Mappers: Domain → API ──────────────────────────────────────────────────

const domainPeriodToApi = (p: { start: Date; end: Date }) => ({
  periodStart: p.start.toISOString().slice(0, 10), // YYYY-MM-DD (PlainDate do backend)
  periodEnd: p.end.toISOString().slice(0, 10),
})

export type CoreApiContractsClient = Readonly<{
  list: (input: ListContractsInput, token: string) => Promise<Result<ListContractsResponse, ContractsError>>
  getById: (id: string, token: string) => Promise<Result<Contract, ContractsError>>
  create: (input: CreateContractInput, token: string) => Promise<Result<Contract, ContractsError>>
  update: (input: UpdateContractInput, token: string) => Promise<Result<Contract, ContractsError>>
  createAmendment: (contractId: string, input: CreateAmendmentInput, token: string) => Promise<Result<Amendment, ContractsError>>
  getHistory: (id: string, token: string) => Promise<Result<readonly ContractHistoryEvent[], ContractsError>>
}>

export const createCoreApiContractsClient = (baseUrl: string): CoreApiContractsClient => {
  const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` })

  const toQuery = (input: ListContractsInput): string => {
    const params = new URLSearchParams()
    params.set('page', String(input.page))
    params.set('limit', String(input.limit))
    params.set('order', input.order)
    if (input.search) params.set('search', input.search)
    if (input.status) {
      const apiStatus = statusDomainToApi(input.status)
      if (apiStatus) params.set('status', apiStatus)
    }
    // Send all filters even if backend currently ignores some
    if (input.contractType) params.set('contractType', input.contractType)
    if (input.contractPeriodStart) params.set('contractPeriodStart', input.contractPeriodStart.toISOString().slice(0, 10))
    if (input.contractPeriodEnd) params.set('contractPeriodEnd', input.contractPeriodEnd.toISOString().slice(0, 10))
    if (input.minValue !== undefined) params.set('minValue', String(input.minValue))
    if (input.maxValue !== undefined) params.set('maxValue', String(input.maxValue))
    if (input.budgetPlanId !== undefined) params.set('budgetPlanId', String(input.budgetPlanId))
    return params.toString()
  }

  return {
    list: async (input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/contracts?${toQuery(input)}`, {
        method: 'GET',
        headers: authHeader(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      try {
        return ok(apiListResponseToDomain(r.value))
      } catch {
        return err('server')
      }
    },

    getById: async (id, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/contracts/${id}`, {
        method: 'GET',
        headers: authHeader(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      try {
        return ok(apiContractDetailToDomain(r.value))
      } catch {
        return err('server')
      }
    },

    create: async (input, token) => {
      // O backend espera: mode, sequentialNumber, title, objective, originalValueCents, periodStart, periodEnd, signedAt?
      // O frontend não envia sequentialNumber nem mode. Geramos um sequentialNumber e usamos mode='Pending'.
      const body = {
        mode: 'Pending' as const,
        sequentialNumber: `${String(Math.floor(Math.random() * 900 + 100)).padStart(3, '0')}/${String(new Date().getFullYear())}`, // Formato exigido pelo backend: XXX/YYYY
        title: input.title,
        objective: input.objective,
        originalValueCents: input.originalValueCents,
        ...domainPeriodToApi(input.originalPeriod),
        classification: input.classification,
        contractModel: input.contractModel,
        contractType: input.contractType,
        supplierId: input.supplierId,
        financierId: input.financierId,
        collaboratorId: input.collaboratorId,
        programId: input.programId,
        budgetPlanId: input.budgetPlanId,
        categorizacao: input.categorizacao,
        centroDeCusto: input.centroDeCusto,
        observations: input.observations,
        email: input.email,
        telephone: input.telephone,
        bancaryInfo: input.bancaryInfo,
        pixInfo: input.pixInfo,
      }
      const r = await resultFetch<unknown>(`${baseUrl}/contracts`, {
        method: 'POST',
        body,
        headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      try {
        // A API de criação retorna um contractListItem (não detalhe enriquecido)
        const parsed = CoreApiContractListItemSchema.safeParse(r.value)
        if (!parsed.success) throw new Error(parsed.error.message)
        return ok(apiContractToDomain(parsed.data))
      } catch {
        return err('server')
      }
    },

    update: (_input, _token) => {
      // O backend NÃO possui rota de update geral de contrato (PATCH /contracts/:id).
      // Apenas activate, end e documentos. Retornamos erro até o backend implementar.
      return Promise.resolve(err('server'))
    },

    createAmendment: async (contractId, input, token) => {
      const kind = amendmentTypeToKind(input.type)
      const body: Record<string, unknown> = {
        kind,
        amendmentNumber: `ADT-${String(Date.now())}`,
        description: input.description ?? '',
      }
      if (kind === 'Addition' || kind === 'Suppression') {
        body.impactValueCents = input.impactValueCents ?? 0
      }
      if (kind === 'TermChange') {
        body.newEndDate = input.newEndDate ? input.newEndDate.toISOString().slice(0, 10) : undefined
      }

      const r = await resultFetch<unknown>(`${baseUrl}/contracts/${contractId}/amendments`, {
        method: 'POST',
        body,
        headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      try {
        const parsed = CoreApiAmendmentSchema.safeParse(r.value)
        if (!parsed.success) throw new Error(parsed.error.message)
        return ok(apiAmendmentToDomain(parsed.data))
      } catch {
        return err('server')
      }
    },

    getHistory: async (id, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/contracts/${id}/history`, {
        method: 'GET',
        headers: authHeader(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      try {
        return ok(apiTimelineToDomain(r.value))
      } catch {
        return err('server')
      }
    },
  }
}
