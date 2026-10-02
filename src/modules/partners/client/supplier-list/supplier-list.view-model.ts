/**
 * ViewModel da listagem — AGNÓSTICO (objeto puro, zero React). Derivações: model → row.
 */
import type {
  SupplierListItem,
  SupplierListResponse,
} from '#modules/partners/client/data/model/supplier.model.ts'
import type { SupplierRow } from '#modules/partners/client/domain/supplier.types.ts'
import { maskCnpj, maskCpf } from '#shared/document/cnpj.ts'

import { supplierListQueryOptions } from './supplier-list.query.ts'

/** Estado cru da listagem (sem i18n; a page traduz `errorTag` ao montar o DataTableState). */
export type SupplierListState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: string }>
  | Readonly<{ status: 'ready'; rows: readonly SupplierRow[]; meta: SupplierListResponse['meta'] }>

/** CPF (11 dígitos) ou CNPJ (14) mascarado pelo tamanho; formato inesperado volta cru (não inventa). */
export function formatSupplierDocument(document: string): string {
  if (/^\d{11}$/.test(document)) return maskCpf(document)
  if (document.length === 14) return maskCnpj(document)
  return document
}

export function mapItemToRow(item: SupplierListItem): SupplierRow {
  return {
    id: item.id,
    name: item.name,
    document: formatSupplierDocument(item.document),
    personType: item.personType,
    email: item.email,
    serviceCategory: item.serviceCategory,
    activation: item.activation,
    contractCount: item.contractCount,
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
