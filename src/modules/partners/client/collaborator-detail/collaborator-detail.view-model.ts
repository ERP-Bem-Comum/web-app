/**
 * ViewModel do detalhe de colaborador — AGNÓSTICO (puro). Deriva o estado a partir do Result.
 */
import { isOk, type Result } from '#shared/primitives/result.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { PartnersError } from '#modules/partners/client/data/repository/partners-error.ts'
import type { CollaboratorDetail } from '#modules/partners/client/data/model/collaborator.model.ts'

import { collaboratorDetailQueryOptions } from './collaborator-detail.query.ts'

export type CollaboratorDetailState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: string }>
  | Readonly<{ status: 'ready'; collaborator: CollaboratorDetail }>

export function deriveDetailState(
  result: Result<CollaboratorDetail, PartnersError>,
): CollaboratorDetailState {
  return isOk(result)
    ? { status: 'ready', collaborator: result.value }
    : { status: 'error', errorTag: partnersErrorTag(result.error) }
}

export const collaboratorDetailViewModel = {
  query: collaboratorDetailQueryOptions,
}

export type { CollaboratorDetail } from '#modules/partners/client/data/model/collaborator.model.ts'
