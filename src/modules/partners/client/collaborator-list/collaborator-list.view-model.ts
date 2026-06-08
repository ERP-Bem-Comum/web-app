/**
 * ViewModel da listagem de Colaboradores — AGNÓSTICO (objeto puro, zero React). Derivações: model → row.
 * Espelha `act-list.view-model.ts`.
 */
import type {
  CollaboratorListItem,
  CollaboratorListResponse,
} from '#modules/partners/client/data/model/collaborator.model.ts'
import type { CollaboratorRow } from '#modules/partners/client/domain/collaborator.types.ts'

import { collaboratorListQueryOptions } from './collaborator-list.query.ts'

export type CollaboratorListState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: string }>
  | Readonly<{ status: 'ready'; rows: readonly CollaboratorRow[]; meta: CollaboratorListResponse['meta'] }>

export function mapItemToRow(item: CollaboratorListItem): CollaboratorRow {
  return {
    id: item.id,
    name: item.name,
    email: item.email,
    occupationArea: item.occupationArea,
    role: item.role,
    registration: item.registration,
    activation: item.activation,
  }
}

export function mapResponseToRows(response: CollaboratorListResponse): readonly CollaboratorRow[] {
  return response.items.map(mapItemToRow)
}

export function totalPages(meta: CollaboratorListResponse['meta']): number {
  return Math.max(1, Math.ceil(meta.total / Math.max(1, meta.limit)))
}

export const collaboratorListViewModel = {
  query: collaboratorListQueryOptions,
}

export type { CollaboratorRow } from '#modules/partners/client/domain/collaborator.types.ts'
// A page (client-ui) consome a lista de áreas POR AQUI (boundary §XI não a deixa tocar `data/`).
export { OCCUPATION_AREAS } from '#modules/partners/client/data/model/collaborator.model.ts'
export type { OccupationArea } from '#modules/partners/client/data/model/collaborator.model.ts'
