/**
 * ViewModel do detalhe de ACT — AGNÓSTICO (puro). Deriva o estado do Result + decide a ação de situação.
 */
import { isOk, type Result } from '#shared/primitives/result.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { PartnersError } from '#modules/partners/client/data/repository/partners-error.ts'
import type { ActDetail } from '#modules/partners/client/data/model/act.model.ts'
import type { StatusAction } from '#modules/partners/client/domain/act.types.ts'

import { actDetailQueryOptions } from './act-detail.query.ts'

export type ActDetailState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: string }>
  | Readonly<{ status: 'ready'; act: ActDetail }>

export function deriveDetailState(result: Result<ActDetail, PartnersError>): ActDetailState {
  return isOk(result)
    ? { status: 'ready', act: result.value }
    : { status: 'error', errorTag: partnersErrorTag(result.error) }
}

/** Ação disponível conforme a situação atual: ativo → inativar; inativo → reativar. */
export function statusActionFor(active: boolean): StatusAction {
  return active ? 'deactivate' : 'reactivate'
}

export const actDetailViewModel = {
  query: actDetailQueryOptions,
}

export type { ActDetail } from '#modules/partners/client/data/model/act.model.ts'
// O detail-content (client-ui) consome a lista de áreas POR AQUI (boundary §XI não deixa tocar `data/`).
export { OCCUPATION_AREAS } from '#modules/partners/client/data/model/act.model.ts'
export type { OccupationArea } from '#modules/partners/client/data/model/act.model.ts'
