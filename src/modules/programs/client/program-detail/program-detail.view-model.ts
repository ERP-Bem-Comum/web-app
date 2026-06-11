/**
 * ViewModel do detalhe de Programa — AGNÓSTICO (puro). Deriva o estado + mapeia detalhe → form values.
 */
import { isOk, type Result } from '#shared/primitives/result.ts'
import { programsErrorTag } from '#modules/programs/client/data/helpers/programs-error-tag.ts'
import type { ProgramsError } from '#modules/programs/client/data/repository/programs-error.ts'
import type { ProgramDetail, ProgramFormValues } from '#modules/programs/client/data/model/program.model.ts'

import { programDetailQueryOptions } from './program-detail.query.ts'

export type ProgramDetailState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: string }>
  | Readonly<{ status: 'ready'; program: ProgramDetail }>

export function deriveDetailState(result: Result<ProgramDetail, ProgramsError>): ProgramDetailState {
  return isOk(result)
    ? { status: 'ready', program: result.value }
    : { status: 'error', errorTag: programsErrorTag(result.error) }
}

export function detailToFormValues(p: ProgramDetail): ProgramFormValues {
  return {
    name: p.name,
    sigla: p.sigla,
    director: p.director,
    generalCharacteristics: p.generalCharacteristics,
  }
}

export const programDetailViewModel = {
  query: programDetailQueryOptions,
}

export type { ProgramDetail } from '#modules/programs/client/data/model/program.model.ts'
