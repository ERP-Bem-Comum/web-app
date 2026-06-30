/**
 * ViewModel da listagem de ACTs (Acordos de Cooperação) — AGNÓSTICO (objeto puro, zero React).
 * Derivações: model → row.
 */
import type { ActListItem, ActListResponse } from '#modules/partners/client/data/model/act.model.ts'
import type { ActRow } from '#modules/partners/client/domain/act.types.ts'

import { actListQueryOptions } from './act-list.query.ts'

export type ActListState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: string }>
  | Readonly<{ status: 'ready'; rows: readonly ActRow[]; meta: ActListResponse['meta'] }>

export function mapItemToRow(item: ActListItem): ActRow {
  return {
    id: item.id,
    actNumber: item.actNumber,
    name: item.name,
    corporateName: item.corporateName,
    occupationArea: item.occupationArea,
    hasFinancialTransfer: item.hasFinancialTransfer,
    active: item.active,
    contractCount: item.contractCount,
  }
}

export function mapResponseToRows(response: ActListResponse): readonly ActRow[] {
  return response.items.map(mapItemToRow)
}

export function totalPages(meta: ActListResponse['meta']): number {
  return Math.max(1, Math.ceil(meta.total / Math.max(1, meta.limit)))
}

export const actListViewModel = {
  query: actListQueryOptions,
}

export type { ActRow } from '#modules/partners/client/domain/act.types.ts'
// A page (client-ui) consome a lista de áreas POR AQUI (boundary §XI não a deixa tocar `data/`).
export { OCCUPATION_AREAS } from '#modules/partners/client/data/model/act.model.ts'
export type { OccupationArea } from '#modules/partners/client/data/model/act.model.ts'
