/**
 * ViewModel do detalhe — AGNÓSTICO (puro). Deriva o estado do Result + decide a ação de status.
 */
import { isOk, type Result } from '#shared/primitives/result.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { PartnersError } from '#modules/partners/client/data/repository/partners-error.ts'
import type { FinancierDetail } from '#modules/partners/client/data/model/financier.model.ts'
import type { ActivationStatus, StatusAction } from '#modules/partners/client/domain/financier.types.ts'

import { financierDetailQueryOptions } from './financier-detail.query.ts'

export type FinancierDetailState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: string }>
  | Readonly<{ status: 'ready'; financier: FinancierDetail }>

export function deriveDetailState(
  result: Result<FinancierDetail, PartnersError>,
): FinancierDetailState {
  return isOk(result)
    ? { status: 'ready', financier: result.value }
    : { status: 'error', errorTag: partnersErrorTag(result.error) }
}

/** Ação disponível conforme o status atual: ativo → inativar; inativo → reativar. */
export function statusActionFor(activation: ActivationStatus): StatusAction {
  return activation === 'active' ? 'deactivate' : 'reactivate'
}

export const financierDetailViewModel = {
  query: financierDetailQueryOptions,
}

export type { FinancierDetail } from '#modules/partners/client/data/model/financier.model.ts'
