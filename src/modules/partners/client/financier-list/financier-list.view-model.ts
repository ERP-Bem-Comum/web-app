/**
 * ViewModel da listagem — AGNÓSTICO (objeto puro, zero React). Derivações: model → row.
 * Espelha `supplier-list.view-model.ts`.
 */
import type {
  FinancierListItem,
  FinancierListResponse,
} from '#modules/partners/client/data/model/financier.model.ts'
import type { FinancierRow } from '#modules/partners/client/domain/financier.types.ts'

import { financierListQueryOptions } from './financier-list.query.ts'

/** Estado cru da listagem (sem i18n; a page traduz `errorTag` ao montar o DataTableState). */
export type FinancierListState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: string }>
  | Readonly<{ status: 'ready'; rows: readonly FinancierRow[]; meta: FinancierListResponse['meta'] }>

export function mapItemToRow(item: FinancierListItem): FinancierRow {
  return {
    id: item.id,
    name: item.name,
    corporateName: item.corporateName,
    legalRepresentative: item.legalRepresentative,
    cnpj: item.cnpj,
    telephone: item.telephone,
    activation: item.activation,
  }
}

export function mapResponseToRows(response: FinancierListResponse): readonly FinancierRow[] {
  return response.items.map(mapItemToRow)
}

/** Total de páginas a partir do meta (para o paginador). */
export function totalPages(meta: FinancierListResponse['meta']): number {
  return Math.max(1, Math.ceil(meta.total / Math.max(1, meta.limit)))
}

export const financierListViewModel = {
  query: financierListQueryOptions,
}

export type { FinancierRow } from '#modules/partners/client/domain/financier.types.ts'
