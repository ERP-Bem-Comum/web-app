/**
 * Cliente HTTP do core-api para o Financeiro — chama `/api/v2/financial/documents`. NUNCA lança (tudo é
 * Result; `throw` só na borda do `resultFetch`). Server-only (adapters). Anti-corruption: delega a
 * tradução aos mappers PUROS (`financial.mappers.ts`) e o erro a `mapHttpError`. Espelha `core-api-users.ts`.
 */
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import type { FinancialClient } from '#modules/financial/server/application/financial.use-cases.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'
import type {
  DocumentListResponse,
  ListDocumentsInput,
  ListPayableTitlesInput,
  PayableTitleListResponse,
} from '#modules/financial/server/domain/document.io.ts'
import { detailToModel, listToModel, payableTitlesToModel, mapHttpError } from './financial.mappers.ts'

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
    getById: async (id, token) => {
      const r = await resultFetch<unknown>(`${docs}/${id}`, { token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
    create: async (input, token) => {
      const r = await resultFetch<unknown>(docs, {
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
          body: { version: input.version, ...(input.reason !== undefined ? { reason: input.reason } : {}) },
          token,
        },
      )
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
  }
}
