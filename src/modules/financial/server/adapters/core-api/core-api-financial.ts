/**
 * Cliente HTTP do core-api para o Financeiro — chama `/api/v2/financial/documents`. NUNCA lança (tudo é
 * Result; `throw` só na borda do `resultFetch`). Server-only (adapters). Anti-corruption: delega a
 * tradução aos mappers PUROS (`financial.mappers.ts`) e o erro a `mapHttpError`. Espelha `core-api-users.ts`.
 */
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import { resultFetch, resultFetchBytes } from '#external/core-api/result-fetch.ts'
import type { FinancialClient } from '#modules/financial/server/application/financial.use-cases.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'
import type {
  DocumentListResponse,
  ListDocumentsInput,
  ListPayableTitlesInput,
  PayableTitleListResponse,
  PayableCountsInput,
  PayableCounts,
  RecentPayment,
} from '#modules/financial/server/domain/document.io.ts'
import type {
  PreviewRemittanceInput,
  RemittancePreview,
} from '#modules/financial/server/domain/remittance.io.ts'
import { previewToModel } from './remittance.mappers.ts'
import {
  detailToModel,
  listToModel,
  payableTitlesToModel,
  payableCountsToModel,
  recentPaymentsToModel,
  dashboardCostCentersToModel,
  dashboardNoContractSuppliersToModel,
  timelineToModel,
  mapHttpError,
} from './financial.mappers.ts'

// #201: status PT→EN completo (a listagem por título cobre os 7 status, não só os da Fatia 1).
const STATUS_TO_BACKEND_FULL: Partial<Record<string, string>> = {
  Rascunho: 'Draft',
  Aberto: 'Open',
  Aprovado: 'Approved',
  Transmitido: 'Transmitted',
  Recusado: 'Refused',
  Pago: 'Paid',
  Conciliado: 'Reconciled',
}

// #536: filtros da contagem agregada (sem status/paginação — o backend devolve o breakdown completo).
const buildCountsQuery = (input: PayableCountsInput): string => {
  const p = new URLSearchParams()
  if (input.type !== undefined) p.set('documentType', input.type)
  if (input.supplierRef !== undefined) p.set('supplierRef', input.supplierRef)
  if (input.dueFrom !== undefined) p.set('dueFrom', input.dueFrom)
  if (input.dueTo !== undefined) p.set('dueTo', input.dueTo)
  return p.toString()
}

const buildTitlesQuery = (input: ListPayableTitlesInput): string => {
  const p = new URLSearchParams()
  const status = input.status === undefined ? undefined : STATUS_TO_BACKEND_FULL[input.status]
  if (status !== undefined) p.set('status', status)
  if (input.type !== undefined) p.set('documentType', input.type) // endpoint usa `documentType`
  if (input.supplierRef !== undefined) p.set('supplierRef', input.supplierRef)
  if (input.dueFrom !== undefined) p.set('dueFrom', input.dueFrom)
  if (input.dueTo !== undefined) p.set('dueTo', input.dueTo)
  p.set('page', String(input.page))
  p.set('pageSize', String(input.pageSize))
  return p.toString()
}

// Status do front (PT) → status do core-api (EN) para o filtro de lista (Fatia 1: Draft|Open|Approved).
const STATUS_TO_BACKEND: Partial<Record<string, string>> = {
  Rascunho: 'Draft',
  Aberto: 'Open',
  Aprovado: 'Approved',
}

const buildListQuery = (input: ListDocumentsInput): string => {
  const p = new URLSearchParams()
  const status = input.status === undefined ? undefined : STATUS_TO_BACKEND[input.status]
  if (status !== undefined) p.set('status', status)
  if (input.supplierRef !== undefined) p.set('supplierRef', input.supplierRef)
  if (input.type !== undefined) p.set('type', input.type)
  if (input.dueFrom !== undefined) p.set('dueFrom', input.dueFrom)
  if (input.dueTo !== undefined) p.set('dueTo', input.dueTo)
  if (input.issuedFrom !== undefined) p.set('issuedFrom', input.issuedFrom) // #163
  if (input.issuedTo !== undefined) p.set('issuedTo', input.issuedTo)
  p.set('page', String(input.page))
  p.set('pageSize', String(input.pageSize))
  return p.toString()
}

export const createCoreApiFinancialClient = (baseUrl: string): FinancialClient => {
  const docs = `${baseUrl}/documents`
  return {
    list: async (input, token): Promise<Result<DocumentListResponse, FinancialError>> => {
      const r = await resultFetch<unknown>(`${docs}?${buildListQuery(input)}`, { token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return listToModel(r.value)
    },
    listPayableTitles: async (input, token): Promise<Result<PayableTitleListResponse, FinancialError>> => {
      const r = await resultFetch<unknown>(`${baseUrl}/payable-titles?${buildTitlesQuery(input)}`, { token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return payableTitlesToModel(r.value)
    },
    // #536: contagem agregada por status (chips) — 1 request.
    getPayableCounts: async (input, token): Promise<Result<PayableCounts, FinancialError>> => {
      const r = await resultFetch<unknown>(`${baseUrl}/payable-titles/counts?${buildCountsQuery(input)}`, {
        token,
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return payableCountsToModel(r.value)
    },
    getRecentPayments: async (token): Promise<Result<readonly RecentPayment[], FinancialError>> => {
      const r = await resultFetch<unknown>(`${baseUrl}/dashboard/recent-payments`, { token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return recentPaymentsToModel(r.value)
    },
    // #241/#237: KPI "Despesas por Centro de Custo" (cost-centers + variação M-1 vs M-2). Gate reference:read.
    getDashboardCostCenters: async (token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/dashboard/cost-centers`, { token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return dashboardCostCentersToModel(r.value)
    },
    // #242: widget "Fornecedores sem Contrato" (top-5 por total pago). Gate reference:read.
    getDashboardNoContractSuppliers: async (token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/dashboard/no-contract-suppliers`, { token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return dashboardNoContractSuppliersToModel(r.value)
    },
    // VAN (core-api#728): PRÉ-VOO do lote. Custom method AIP-136 — o literal `:preview` faz parte do path
    // (não é query param) e por isso NÃO é encodado. Leitura pura: apesar do POST, não consome NSA, não
    // prende título e não toca no bucket da VAN. O POST existe porque a seleção (até 200 ids) vai no corpo.
    previewRemittance: async (
      input: PreviewRemittanceInput,
      token,
    ): Promise<Result<RemittancePreview, FinancialError>> => {
      const r = await resultFetch<unknown>(`${baseUrl}/remittances:preview`, {
        method: 'POST',
        body: { documentIds: input.documentIds },
        token,
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return previewToModel(r.value)
    },
    getById: async (id, token) => {
      const r = await resultFetch<unknown>(`${docs}/${id}`, { token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
    getTimeline: async (id, token) => {
      const r = await resultFetch<unknown>(`${docs}/${id}/timeline`, { token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return timelineToModel(r.value)
    },
    getSourceFile: async (id, token) => {
      // #568: comprovante-fonte INLINE (bytes) COM o token — nunca alcançável pelo browser (CA4). O client
      // recebe base64 + mimeType e monta o blob/File. Erro (404 sem anexo, 403 RBAC) → FinancialError.
      const r = await resultFetchBytes(`${docs}/${id}/source-file`, { token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return ok({ base64: r.value.base64, mimeType: r.value.contentType })
    },
    create: async (input, token) => {
      // #577: com comprovante → rota atômica dedicada (`/with-source-file` cria o doc JÁ com o anexo, Draft
      // OU Open); sem comprovante → create normal. O corpo é o mesmo (o `sourceFile` viaja no spread).
      const url = input.sourceFile !== undefined ? `${docs}/with-source-file` : docs
      const r = await resultFetch<unknown>(url, {
        method: 'POST',
        body: { asDraft: false, ...input }, // input.asDraft (rascunho) tem precedência
        token,
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
    adjust: async (input, token) => {
      const { id, ...body } = input
      const r = await resultFetch<unknown>(`${docs}/${id}`, { method: 'PATCH', body, token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
    approve: async (input, token) => {
      const r = await resultFetch<unknown>(`${docs}/${input.id}/approve`, {
        method: 'POST',
        body: { version: input.version },
        token,
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
    // #270: vencimento de UM título isolado (não propaga pai↔filhos). Devolve o documento atualizado.
    updatePayableDueDate: async (input, token) => {
      const r = await resultFetch<unknown>(`${docs}/${input.documentId}/payables/${input.payableId}`, {
        method: 'PATCH',
        body: { version: input.version, dueDate: input.dueDate },
        token,
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
    undoApproval: async (input, token) => {
      const r = await resultFetch<unknown>(`${docs}/${input.id}/undo-approval`, {
        method: 'POST',
        body: { version: input.version },
        token,
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
    cancel: async (input, token) => {
      // O core-api exige `version` no corpo do DELETE (optimistic lock); versão defasada → 409.
      const r = await resultFetch<unknown>(`${docs}/${input.id}`, {
        method: 'DELETE',
        body: { version: input.version },
        token,
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return ok(undefined)
    },
    registerManualPayment: async (input, token) => {
      // #224: baixa manual de UM título. `version` = do documento (optimistic lock do agregado).
      const r = await resultFetch<unknown>(
        `${docs}/${input.documentId}/payables/${input.payableId}/manual-payment`,
        {
          method: 'POST',
          body: {
            version: input.version,
            ...(input.paidAt !== undefined ? { paidAt: input.paidAt } : {}),
            ...(input.reason !== undefined ? { reason: input.reason } : {}),
          },
          token,
        },
      )
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
  }
}
