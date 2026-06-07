/**
 * ViewModel da listagem — AGNÓSTICO (objeto puro, zero React). Derivações: model → row.
 */
import type {
  SupplierListItem,
  SupplierListResponse,
} from '#modules/partners/client/data/model/supplier.model.ts'
import type { SupplierRow } from '#modules/partners/client/domain/supplier.types.ts'

import { supplierListQueryOptions } from './supplier-list.query.ts'

/** Estado cru da listagem (sem i18n; a page traduz `errorTag` ao montar o DataTableState). */
export type SupplierListState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: string }>
  | Readonly<{ status: 'ready'; rows: readonly SupplierRow[]; meta: SupplierListResponse['meta'] }>

export function mapItemToRow(item: SupplierListItem): SupplierRow {
  return {
    id: item.id,
    name: item.name,
    cnpj: item.cnpj,
    email: item.email,
    serviceCategory: item.serviceCategory,
    activation: item.activation,
  }
}

export function mapResponseToRows(response: SupplierListResponse): readonly SupplierRow[] {
  return response.items.map(mapItemToRow)
}

/** Total de páginas a partir do meta (para o paginador). */
export function totalPages(meta: SupplierListResponse['meta']): number {
  return Math.max(1, Math.ceil(meta.total / Math.max(1, meta.limit)))
}

export const supplierListViewModel = {
  query: supplierListQueryOptions,
}

export type { SupplierRow } from '#modules/partners/client/domain/supplier.types.ts'
