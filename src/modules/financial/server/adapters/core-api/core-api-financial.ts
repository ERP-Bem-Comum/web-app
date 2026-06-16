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
} from '#modules/financial/server/domain/document.io.ts'
import { detailToModel, listToModel, mapHttpError } from './financial.mappers.ts'

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
    getById: async (id, token) => {
      const r = await resultFetch<unknown>(`${docs}/${id}`, { token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
    create: async (input, token) => {
      const r = await resultFetch<unknown>(docs, {
        method: 'POST',
        body: { ...input, asDraft: false },
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
      const r = await resultFetch<unknown>(`${docs}/${input.id}`, { method: 'DELETE', token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return ok(undefined)
    },
  }
}
