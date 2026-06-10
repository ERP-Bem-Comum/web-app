/**
 * ViewModel da listagem de Programas — AGNÓSTICO (puro). Estado da tabela + paginação.
 */
import { isOk, type Result } from '#shared/primitives/result.ts'
import { programsErrorTag } from '#modules/programs/client/data/helpers/programs-error-tag.ts'
import type { ProgramsError } from '#modules/programs/client/data/repository/programs-error.ts'
import type { ProgramListItem, ProgramListResponse } from '#modules/programs/client/data/model/program.model.ts'

export type ProgramRow = ProgramListItem

export type ProgramsListState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: string }>
  | Readonly<{ status: 'ready'; rows: readonly ProgramRow[]; meta: ProgramListResponse['meta'] }>

export function deriveListState(result: Result<ProgramListResponse, ProgramsError>): ProgramsListState {
  if (!isOk(result)) return { status: 'error', errorTag: programsErrorTag(result.error) }
  return { status: 'ready', rows: result.value.items, meta: result.value.meta }
}

export function totalPages(meta: ProgramListResponse['meta']): number {
  return Math.max(1, Math.ceil(meta.total / meta.limit))
}

export type { ProgramListItem } from '#modules/programs/client/data/model/program.model.ts'
