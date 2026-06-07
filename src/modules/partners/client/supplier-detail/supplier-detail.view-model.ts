/**
 * ViewModel do detalhe — AGNÓSTICO (puro). Deriva o estado do Result + decide a ação de status.
 */
import { isOk, type Result } from '#shared/primitives/result.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { PartnersError } from '#modules/partners/client/data/repository/supplier.repository.ts'
import type { SupplierDetail } from '#modules/partners/client/data/model/supplier.model.ts'
import type { ActivationStatus, StatusAction } from '#modules/partners/client/domain/supplier.types.ts'

import { supplierDetailQueryOptions } from './supplier-detail.query.ts'

export type SupplierDetailState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: string }>
  | Readonly<{ status: 'ready'; supplier: SupplierDetail }>

export function deriveDetailState(
  result: Result<SupplierDetail, PartnersError>,
): SupplierDetailState {
  return isOk(result)
    ? { status: 'ready', supplier: result.value }
    : { status: 'error', errorTag: partnersErrorTag(result.error) }
}

/** Ação disponível conforme o status atual: ativo → inativar; inativo → reativar. */
export function statusActionFor(activation: ActivationStatus): StatusAction {
  return activation === 'active' ? 'deactivate' : 'reactivate'
}

export const supplierDetailViewModel = {
  query: supplierDetailQueryOptions,
}

export type { SupplierDetail } from '#modules/partners/client/data/model/supplier.model.ts'
