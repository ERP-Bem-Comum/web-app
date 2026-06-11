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
import { octetStreamFetch } from '#external/core-api/octet-stream-fetch.ts'
import { documentContentFetch } from '#external/core-api/document-content-fetch.ts'
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
  CoreApiDocumentSchema,
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
  'activate-contract-no-signed-document': 'no-signed-document',
  'activate-contract-invalid-signed-at': 'invalid-signed-at',
  'amendment-retroactive-to-contract-start': 'server',
  // Validações de aditivo do core-api (422) — a UI já barra antes; defesa p/ mensagem clara.
  AmendmentDescriptionRequired: 'invalid-value',
  'amendment-description-required': 'invalid-value',
  AmendmentImpactValueZero: 'invalid-value',
  'amendment-impact-value-zero': 'invalid-value',
  'money-negative-value': 'invalid-value',
  'ContractNotActive': 'contract-not-active',
  // Aditivo de PRAZO: a nova data de término precisa estender a vigência atual (ser posterior).
  'create-amendment-term-change-not-extending': 'amendment-not-extending',
  'create-amendment-invalid-new-end-date': 'amendment-invalid-new-end-date',
  'amendment-invalid-new-end-date': 'amendment-invalid-new-end-date',
  'create-amendment-cannot-extend-indefinite': 'amendment-cannot-extend-indefinite',
  // Aditivo de VALOR (supressão): não pode exceder o valor atual do contrato.
  'amendment-suppression-exceeds-current-value': 'amendment-suppression-exceeds-value',
  'contract-repo-conflict': 'server',
  'amendment-repo-conflict': 'server',
  'document-already-deleted': 'document-conflict',
  'document-already-superseded': 'document-conflict',
  'document-contract-mismatch': 'document-conflict',
  'document-magic-bytes-mismatch': 'invalid-pdf',
  'storage-unavailable': 'storage-unavailable',
  'storage-upload-failed': 'storage-unavailable',
  'storage-permission-denied': 'storage-unavailable',
  // Distrato (#32, CTR-HTTP-DISTRATO-DOCUMENTO): encerrar exige doc `signed_termination` + data efetiva.
  'terminate-no-signed-document': 'terminate-no-document',
  'terminate-invalid-date': 'terminate-invalid-date',
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

// D9 (ADR-0013): aceita string p/ tolerar status futuros do backend (ex.: 'Cancelled' do #32).
// Status conhecidos mapeiam normalmente; DESCONHECIDO degrada para 'Finalizado' (terminal seguro,
// não-acionável) só p/ não zerar a linha — a UI/fluxo próprio de cancelamento é slice futuro.
const statusApiToDomain = (apiStatus: string): Contract['status'] => {
  const map: Record<string, Contract['status']> = {
    Pending: 'Pendente',
    Active: 'Em Andamento',
    Expired: 'Finalizado',
    Terminated: 'Distrato',
  }
  return map[apiStatus] ?? 'Finalizado'
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

// Normaliza string ausente/vazia → undefined (o backend pode devolver "" em metadados opcionais).
const blankToUndefined = (s: string | null | undefined): string | undefined =>
  s != null && s.trim() !== '' ? s : undefined

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

// ⚠️ GAMBIARRA TEMPORÁRIA (até o backend ter um `kind` distrato): o core-api colapsa
// escopo/outro/distrato em `Misc`, perdendo a identidade. Para o distrato funcionar como aditivo
// (linha na tabela + efeito ao homologar), marcamos a descrição na escrita e detectamos na leitura.
// A gambiarra fica CONTIDA no BFF — o client/UI recebe `type: 'distrato'` e a descrição já limpa.
// Substituir por um kind próprio — ver handbook/core-api/tickets/CTR-HTTP-DISTRATO-DOCUMENTO.md.
const DISTRATO_MARKER = '[[distrato]] '

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
      // Backend guarda supressão como valor POSITIVO + kind Suppression; no domínio do front a
      // convenção é SINAL (negativo = supressão), p/ composição/tabela exibirem "−" corretamente.
      return { ...base, impactValueCents: a.impactValueCents !== undefined ? -a.impactValueCents : undefined }
    case 'TermChange':
      return { ...base, newEndDate: a.newEndDate ? parseIsoDate(a.newEndDate) : undefined }
    case 'Misc': {
      // Gambiarra: descrição marcada → é um distrato. Devolve type 'distrato' + descrição sem o marcador.
      if (a.description.startsWith(DISTRATO_MARKER)) {
        const desc = a.description.slice(DISTRATO_MARKER.length)
        return { ...base, type: 'distrato', description: desc === '' ? undefined : desc }
      }
      return base
    }
  }
}

const apiDocumentToDomain = (d: {
  id: string
  fileName: string
  sizeBytes: number
  uploadedAt: string
  parentType?: 'Contract' | 'Amendment'
  parentId?: string
  categoria?: string
}): Contract['files'][number] => ({
  id: d.id,
  name: d.fileName,
  // `url` vazia de propósito: o conteúdo é obtido pela rota .../documents/:id/content (via BFF),
  // usando o `id` do documento — não há mais URL estática (CTR-HTTP-DOCUMENT-CONTENT religado).
  url: '',
  size: d.sizeBytes,
  uploadedAt: parseIsoDate(d.uploadedAt),
  uploadedBy: undefined,
  parentType: d.parentType,
  parentId: d.parentId,
  categoria: d.categoria,
})

const apiContractToDomain = (c: {
  id: string
  sequentialNumber: string
  title: string
  objective: string
  originalValue: { cents: number }
  originalPeriod: { kind: 'Fixed'; start: string; end: string } | { kind: 'Indefinite'; start: string }
  status: string
  signedAt?: string
  currentValue?: { cents: number }
  currentPeriod?: { kind: 'Fixed'; start: string; end: string } | { kind: 'Indefinite'; start: string }
  endedAt?: string
  // CTR-NUMBER-PROGRAM (#32): metadados do agregado + bloco program (id + snapshot.{name,sigla}).
  classification?: 'CT' | 'OS' | null
  programId?: string | null
  budgetPlanId?: string | null
  categorizacao?: string | null
  centroDeCusto?: string | null
  program?: { id: string; snapshot: { name: string; sigla: string; programNumber: number } | null } | null
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
  // Classificação real do backend (CT/OS → domínio); default Contract quando ausente (ADR-0013).
  classification: c.classification === 'OS' ? 'ServiceOrder' : 'Contract',
  contractModel: 'Service',
  contractType: 'Supplier',
  supplierId: undefined,
  financierId: undefined,
  collaboratorId: undefined,
  supplier: undefined,
  financier: undefined,
  collaborator: undefined,
  // Programa + metadados (#32). `program` = bloco composto (sigla na coluna do grid).
  programId: blankToUndefined(c.programId),
  program: c.program?.snapshot
    ? { id: c.program.id, name: c.program.snapshot.name, sigla: c.program.snapshot.sigla }
    : undefined,
  budgetPlanId: blankToUndefined(c.budgetPlanId),
  budgetPlan: undefined,
  categorizacao: blankToUndefined(c.categorizacao),
  centroDeCusto: blankToUndefined(c.centroDeCusto),
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

type ContractorDto = Readonly<{
  type: 'supplier' | 'financier' | 'collaborator' | 'act'
  id: string
  snapshot: Readonly<{
    name: string
    document: string
    updatedAt?: string
    bankAccount?: Readonly<{ bank: string; agency: string; accountNumber: string; checkDigit: string }> | null
    pixKey?: Readonly<{ keyType: string; key: string }> | null
  }>
}>

const CONTRACTOR_TYPE: Record<ContractorDto['type'], Contract['contractType']> = {
  supplier: 'Supplier',
  financier: 'Financier',
  collaborator: 'Collaborator',
  act: 'ACT',
}

// Mapeia o `contractor.snapshot` do detalhe → contratado + dados bancários/PIX no domínio do front.
const mapContractorToDomain = (k: ContractorDto): Partial<Contract> => {
  const snapshot = { id: k.id, name: k.snapshot.name, document: k.snapshot.document }
  const updatedAt = k.snapshot.updatedAt ? parseIsoDate(k.snapshot.updatedAt) : new Date()
  const bank = k.snapshot.bankAccount
  const pix = k.snapshot.pixKey
  return {
    contractType: CONTRACTOR_TYPE[k.type],
    supplierId: k.type === 'supplier' ? k.id : undefined,
    financierId: k.type === 'financier' ? k.id : undefined,
    collaboratorId: k.type === 'collaborator' ? k.id : undefined,
    supplier: k.type === 'supplier' ? snapshot : undefined,
    financier: k.type === 'financier' ? snapshot : undefined,
    collaborator: k.type === 'collaborator' ? snapshot : undefined,
    ...(bank != null ? { bancaryInfo: { bank: bank.bank, agency: bank.agency, accountNumber: bank.accountNumber, dv: bank.checkDigit, updatedAt } } : {}),
    ...(pix != null ? { pixInfo: { keyType: pix.keyType, key: pix.key, updatedAt } } : {}),
  }
}

// Errors-as-values (C3 / ADR-0002): falha de parse vira Result.err, NUNCA throw. A UI nunca recebe
// exceção crua — a cadeia de erro segue como valor.
export const apiContractDetailToDomain = (raw: unknown): Result<Contract, ContractsError> => {
  const parsed = CoreApiContractDetailSchema.safeParse(raw)
  if (!parsed.success) {
    // Fallback: tenta parsear como list-item (resposta de escrita)
    const listParsed = CoreApiContractListItemSchema.safeParse(raw)
    if (listParsed.success) {
      return ok(apiContractToDomain(listParsed.data))
    }
    return err('server')
  }

  const c = parsed.data
  const base = apiContractToDomain(c)

  return ok({
    ...base,
    // Contratado (nome/documento) + dados bancários/PIX + tipo, vindos do snapshot do detalhe.
    ...(c.contractor != null ? mapContractorToDomain(c.contractor) : {}),
    // Metadados editáveis (PATCH /contracts/:id) — a rota gorda os devolve no detalhe.
    observations: blankToUndefined(c.observations),
    email: blankToUndefined(c.email),
    telephone: blankToUndefined(c.telephone),
    children: c.amendments.map(apiAmendmentToDomain),
    files: c.documents.map(apiDocumentToDomain),
  })
}

const apiListResponseToDomain = (raw: unknown): Result<ListContractsResponse, ContractsError> => {
  const parsed = CoreApiListResponseSchema.safeParse(raw)
  if (!parsed.success) return err('server') // errors-as-values (C3), sem throw
  const items = parsed.data.items.map(apiContractToDomain)
  const m = parsed.data.meta
  // Normaliza o meta da API (atual `currentPage/itemsPerPage/totalItems` ou legado `page/limit/total`)
  // para o shape de domínio `{ page, totalPages, total, limit }`.
  return ok({
    items,
    meta: {
      page: m.currentPage ?? m.page ?? 1,
      totalPages: m.totalPages ?? 1,
      total: m.totalItems ?? m.total ?? items.length,
      limit: m.itemsPerPage ?? m.limit ?? items.length,
    },
  })
}

const toStr = (v: unknown): string => (typeof v === 'string' ? v : '')

const apiTimelineEntryToDomain = (e: Record<string, unknown>): ContractHistoryEvent => ({
  eventId: toStr(e.eventId),
  contractId: toStr(e.contractId),
  kind: toStr(e.kind),
  description: toStr(e.kind), // Backend não envia description; usamos kind como fallback
  occurredAt: toStr(e.occurredAt),
  ...(typeof e.actor === 'string' ? { userName: e.actor } : {}),
  ...(typeof e.subjectAmendmentId === 'string' ? { metadata: { subjectAmendmentId: e.subjectAmendmentId } } : {}),
})

const apiTimelineToDomain = (raw: unknown): Result<readonly ContractHistoryEvent[], ContractsError> => {
  const parsed = CoreApiTimelineSchema.safeParse(raw)
  if (!parsed.success) {
    // Tentar formato antigo { events: [...] } para compatibilidade
    const legacyShape = { events: [] as unknown[] }
    if (raw && typeof raw === 'object' && 'events' in raw && Array.isArray((raw as Record<string, unknown>).events)) {
      legacyShape.events = (raw as Record<string, unknown>).events as unknown[]
    }
    if (legacyShape.events.length > 0) {
      return ok(legacyShape.events.map((e) => apiTimelineEntryToDomain(e as Record<string, unknown>)))
    }
    return err('server') // errors-as-values (C3), sem throw
  }
  return ok(parsed.data.map((e) => apiTimelineEntryToDomain(e as unknown as Record<string, unknown>)))
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
  uploadDocument: (contractId: string, input: Readonly<{ bytes: Uint8Array; fileName: string }>, token: string) => Promise<Result<void, ContractsError>>
  uploadTerminationDocument: (contractId: string, input: Readonly<{ bytes: Uint8Array; fileName: string }>, token: string) => Promise<Result<void, ContractsError>>
  activate: (contractId: string, signedAtIso: string, token: string) => Promise<Result<Contract, ContractsError>>
  uploadAmendmentDocument: (contractId: string, amendmentId: string, input: Readonly<{ bytes: Uint8Array; fileName: string; signedAt: string }>, token: string) => Promise<Result<void, ContractsError>>
  homologateAmendment: (contractId: string, amendmentId: string, homologatedBy: string, token: string) => Promise<Result<Contract, ContractsError>>
  endContract: (contractId: string, terminatedAt: string, reason: string, token: string) => Promise<Result<Contract, ContractsError>>
  getDocumentContent: (contractId: string, documentId: string, token: string) => Promise<Result<Readonly<{ bytes: Uint8Array; fileName: string; contentType: string }>, ContractsError>>
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
    if (input.budgetPlanId !== undefined) params.set('budgetPlanId', input.budgetPlanId)
    return params.toString()
  }

  return {
    list: async (input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/contracts?${toQuery(input)}`, {
        method: 'GET',
        headers: authHeader(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      const listR = apiListResponseToDomain(r.value)
      if (isErr(listR)) return err('server')
      const listResp = listR.value
      // Enriquecimento N+1: o GET /contracts (lista) NÃO devolve o contratado; buscamos o detalhe de
      // cada item só p/ exibir o nome no grid. Degrada por item (mantém sem contratado em caso de falha).
      // Limitado pelo tamanho da página. (Ideal: o core-api incluir o `contractor` na própria lista.)
      const items = await Promise.all(
        listResp.items.map(async (item) => {
          const d = await resultFetch<unknown>(`${baseUrl}/contracts/${item.id}`, {
            method: 'GET',
            headers: authHeader(token),
          })
          if (isErr(d)) return item
          const fullR = apiContractDetailToDomain(d.value)
          if (isErr(fullR)) return item
          const full = fullR.value
          return {
            ...item,
            contractType: full.contractType,
            supplierId: full.supplierId,
            financierId: full.financierId,
            collaboratorId: full.collaboratorId,
            supplier: full.supplier,
            financier: full.financier,
            collaborator: full.collaborator,
            // Vigência/valor vigentes (refletem aditivos homologados) p/ o grid mostrar a data estendida.
            currentPeriod: full.currentPeriod,
            currentValue: full.currentValue,
            // Aditivos do contrato — p/ o grid exibir a QUANTIDADE na coluna Aditivos (lista não traz).
            children: full.children,
          }
        }),
      )
      return ok({ ...listResp, items })
    },

    getById: async (id, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/contracts/${id}`, {
        method: 'GET',
        headers: authHeader(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return apiContractDetailToDomain(r.value)
    },

    create: async (input, token) => {
      // #32: o backend GERA o sequentialNumber (não enviamos número — ADR-0013 / CTR-CONTRACT-SEQUENTIAL-NUMBER).
      // Body: mode + title/objective/valor/período + contractor:{type,id} + classification (CT/OS) + metadados.
      // mode='Pending' (D7 — cadastro+assinatura segue o fluxo de 2 passos: criar → anexar doc → ativar).
      // `contractor` derivado do tipo selecionado.
      const contractor =
        input.supplierId !== undefined
          ? { type: 'supplier' as const, id: input.supplierId }
          : input.financierId !== undefined
            ? { type: 'financier' as const, id: input.financierId }
            : input.collaboratorId !== undefined
              ? { type: 'collaborator' as const, id: input.collaboratorId }
              : undefined
      const body = {
        mode: 'Pending' as const,
        title: input.title,
        objective: input.objective,
        originalValueCents: input.originalValueCents,
        ...domainPeriodToApi(input.originalPeriod),
        ...(contractor !== undefined ? { contractor } : {}),
        // Domínio (Contract/ServiceOrder) → wire do #32 (CT/OS).
        classification: input.classification === 'ServiceOrder' ? 'OS' : 'CT',
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
        // resultFetch já injeta `content-type: application/json` quando há body. Repetir o header
        // (com outra capitalização) gerava content-type duplicado → o Fastify do core-api respondia 415.
        headers: authHeader(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      // A API de criação retorna um contractListItem (não detalhe enriquecido). Errors-as-values (C3).
      const parsed = CoreApiContractListItemSchema.safeParse(r.value)
      if (!parsed.success) return err('server')
      return ok(apiContractToDomain(parsed.data))
    },

    update: async (input, token) => {
      // PATCH /contracts/:id — metadados editáveis (title/objective/observations/email/
      // telephone). Valor/período seguem imutáveis (mudam só via aditivo). A Tela 4 só
      // edita contato + observações; enviamos apenas os campos definidos (o backend exige
      // ≥1 e valida com `.strict()`). A resposta é o detalhe gordo (contractFullDetail).
      const body: Record<string, unknown> = {}
      if (input.email !== undefined) body.email = input.email
      if (input.telephone !== undefined) body.telephone = input.telephone
      if (input.observations !== undefined) body.observations = input.observations

      const r = await resultFetch<unknown>(`${baseUrl}/contracts/${input.id}`, {
        method: 'PATCH',
        body,
        // resultFetch já injeta content-type quando há body; repetir → header duplicado → 415 (ver `create`).
        headers: authHeader(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return apiContractDetailToDomain(r.value)
    },

    createAmendment: async (contractId, input, token) => {
      const signedValue = input.impactValueCents ?? 0
      // valor: o SINAL decide Addition (+) vs Suppression (−). O backend exige o valor SEMPRE positivo,
      // com o sentido no `kind` (supressão com valor negativo → money-negative-value 422).
      const kind =
        input.type === 'valor'
          ? signedValue < 0 ? 'Suppression' : 'Addition'
          : amendmentTypeToKind(input.type)
      const body: Record<string, unknown> = {
        kind,
        amendmentNumber: `ADT-${String(Date.now())}`,
        // Gambiarra distrato: marca a descrição p/ a leitura reconhecer (kind no backend é Misc).
        description: input.type === 'distrato' ? `${DISTRATO_MARKER}${input.description ?? ''}` : input.description ?? '',
      }
      if (kind === 'Addition' || kind === 'Suppression') {
        body.impactValueCents = Math.abs(signedValue)
      }
      if (kind === 'TermChange') {
        body.newEndDate = input.newEndDate ? input.newEndDate.toISOString().slice(0, 10) : undefined
      }

      const r = await resultFetch<unknown>(`${baseUrl}/contracts/${contractId}/amendments`, {
        method: 'POST',
        body,
        // resultFetch já injeta content-type quando há body; repetir → header duplicado → 415 (ver `create`).
        headers: authHeader(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      // Errors-as-values (C3): parse falho → err, sem throw.
      const parsed = CoreApiAmendmentSchema.safeParse(r.value)
      if (!parsed.success) return err('server')
      return ok(apiAmendmentToDomain(parsed.data))
    },

    getHistory: async (id, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/contracts/${id}/history`, {
        method: 'GET',
        headers: authHeader(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return apiTimelineToDomain(r.value)
    },

    uploadDocument: async (contractId, { bytes, fileName }, token) => {
      // POST /contracts/:id/documents — corpo binário (octet-stream), metadados na query.
      // categoria=signed_contract (documento assinado do contrato); mimeType allowlist application/pdf.
      const r = await octetStreamFetch<unknown>(`${baseUrl}/contracts/${contractId}/documents`, {
        token,
        bytes,
        query: {
          categoria: 'signed_contract',
          fileName,
          mimeType: 'application/pdf',
          signedElectronically: 'true',
        },
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      // Validação do response na fronteira (§IX). Não devolvemos o meta — o use-case só precisa do ok/err.
      const parsed = CoreApiDocumentSchema.safeParse(r.value)
      if (!parsed.success) return err('server')
      return ok(undefined)
    },

    uploadTerminationDocument: async (contractId, { bytes, fileName }, token) => {
      // POST /contracts/:id/documents — corpo binário, metadados na query. categoria=signed_termination
      // (pré-requisito do /end Terminate, #32). A query de doc de CONTRATO NÃO leva signedAt.
      const r = await octetStreamFetch<unknown>(`${baseUrl}/contracts/${contractId}/documents`, {
        token,
        bytes,
        query: {
          categoria: 'signed_termination',
          fileName,
          mimeType: 'application/pdf',
          signedElectronically: 'true',
        },
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      const parsed = CoreApiDocumentSchema.safeParse(r.value)
      if (!parsed.success) return err('server')
      return ok(undefined)
    },

    activate: async (contractId, signedAtIso, token) => {
      // POST /contracts/:id/activate — { signedAt }. Exige o documento signed_contract já enviado
      // (senão o backend responde activate-contract-no-signed-document → 'no-signed-document').
      // headers só authHeader: o resultFetch injeta content-type application/json (duplicar → 415).
      const r = await resultFetch<unknown>(`${baseUrl}/contracts/${contractId}/activate`, {
        method: 'POST',
        body: { signedAt: signedAtIso },
        headers: authHeader(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return apiContractDetailToDomain(r.value)
    },

    uploadAmendmentDocument: async (contractId, amendmentId, { bytes, fileName, signedAt }, token) => {
      // POST /contracts/:id/amendments/:amendmentId/documents — binário (octet-stream) + metadados na query.
      // #32: a query de doc de ADITIVO exige `signedAt` (data de assinatura no MESMO passo do upload+attach —
      // amendmentDocumentUploadQuerySchema). Sem ele o core-api responde 400 validation.
      const r = await octetStreamFetch<unknown>(`${baseUrl}/contracts/${contractId}/amendments/${amendmentId}/documents`, {
        token,
        bytes,
        query: { categoria: 'signed_amendment', fileName, mimeType: 'application/pdf', signedElectronically: 'true', signedAt },
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      const parsed = CoreApiDocumentSchema.safeParse(r.value)
      if (!parsed.success) return err('server')
      return ok(undefined)
    },

    homologateAmendment: async (contractId, amendmentId, homologatedBy, token) => {
      // POST /contracts/:id/amendments/:amendmentId/homologate — { homologatedBy }. Exige o documento
      // signed_amendment já enviado (parsePendingWithDocument no backend). Devolve o contrato atualizado.
      const r = await resultFetch<unknown>(`${baseUrl}/contracts/${contractId}/amendments/${amendmentId}/homologate`, {
        method: 'POST',
        body: { homologatedBy },
        headers: authHeader(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return apiContractDetailToDomain(r.value)
    },

    endContract: async (contractId, terminatedAt, reason, token) => {
      // POST /contracts/:id/end — { kind:'Terminate', terminatedAt, reason } = distrato (#32).
      // Exige um doc `signed_termination` Active já anexado (subido antes pelo use-case) → senão 422
      // terminate-no-signed-document. terminatedAt (YYYY-MM-DD) não-futura → senão 422 terminate-invalid-date.
      const r = await resultFetch<unknown>(`${baseUrl}/contracts/${contractId}/end`, {
        method: 'POST',
        body: { kind: 'Terminate', terminatedAt, reason },
        headers: authHeader(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return apiContractDetailToDomain(r.value)
    },

    getDocumentContent: async (contractId, documentId, token) => {
      // GET /contracts/:id/documents/:documentId/content — bytes do documento (preview/download via BFF).
      // CTR-HTTP-DOCUMENT-CONTENT. Ownership (doc ↔ contrato, direto ou via aditivo) é verificada no core-api.
      const r = await documentContentFetch(`${baseUrl}/contracts/${contractId}/documents/${documentId}/content`, { token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return ok({ bytes: r.value.bytes, fileName: r.value.fileName ?? 'documento.pdf', contentType: r.value.contentType })
    },
  }
}
