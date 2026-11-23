/**
 * ViewModel do detalhe de colaborador — AGNÓSTICO (puro). Deriva o estado a partir do Result e decide a
 * ação de ativação (inativar exige motivo — spec 133).
 */
import { isOk, type Result } from '#shared/primitives/result.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { PartnersError } from '#modules/partners/client/data/repository/partners-error.ts'
import {
  DEACTIVATION_REASONS,
  type CollaboratorDetail,
  type DeactivationReason,
} from '#modules/partners/client/data/model/collaborator.model.ts'
import type { ActivationStatus, StatusAction } from '#modules/partners/client/domain/collaborator.types.ts'

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

/** Ação disponível conforme a ativação atual: ativo → inativar; inativo → reativar. */
export function statusActionFor(activation: ActivationStatus): StatusAction {
  return activation === 'active' ? 'deactivate' : 'reactivate'
}

/** Motivos que o usuário pode escolher ao inativar (ordem do core-api). */
export const deactivationReasonOptions: readonly DeactivationReason[] = DEACTIVATION_REASONS

/** Valor do <select> → motivo tipado; vazio ou desconhecido → `null` (o botão Confirmar fica bloqueado). */
export function parseDeactivationReason(value: string): DeactivationReason | null {
  return deactivationReasonOptions.find((r) => r === value) ?? null
}

/** Chave i18n do subtítulo de status do cabeçalho: inativo mostra o motivo, quando gravado. */
export function activationSubtitleKeys(
  c: Pick<CollaboratorDetail, 'activation' | 'deactivationReason'>,
): readonly string[] {
  if (c.activation === 'active') return []
  return c.deactivationReason === undefined
    ? ['partners.collaborators.status.inactive']
    : [
        'partners.collaborators.status.inactive',
        `partners.collaborators.deactivationReason.${c.deactivationReason}`,
      ]
}

export const collaboratorDetailViewModel = {
  query: collaboratorDetailQueryOptions,
}

export type {
  CollaboratorDetail,
  DeactivationReason,
} from '#modules/partners/client/data/model/collaborator.model.ts'
