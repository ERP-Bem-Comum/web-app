/**
 * ViewModel da edição de ACT — AGNÓSTICO (puro). Deriva o estado de carregamento e mapeia o detalhe
 * para os valores iniciais do formulário (7 campos). occupationArea/employmentRelationship vêm como
 * enum no detalhe; o form os trata como string (compatível).
 */
import { isOk, type Result } from '#shared/primitives/result.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { PartnersError } from '#modules/partners/client/data/repository/partners-error.ts'
import type {
  ActDetail,
  ActFormValues,
  OccupationArea,
} from '#modules/partners/client/data/model/act.model.ts'
import { OCCUPATION_AREAS } from '#modules/partners/client/data/model/act.model.ts'

export type ActEditState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: string }>
  | Readonly<{ status: 'ready'; initial: ActFormValues }>

const isOccupationArea = (v: string): v is OccupationArea =>
  (OCCUPATION_AREAS as readonly string[]).includes(v)
const asOccupationArea = (v: string): OccupationArea => (isOccupationArea(v) ? v : 'PARC')

export function detailToFormValues(a: ActDetail): ActFormValues {
  return {
    name: a.name,
    email: a.email,
    cpf: a.cpf,
    // o detalhe pode trazer área legada (string fora do enum); o form parte de um valor válido.
    occupationArea: asOccupationArea(a.occupationArea),
    role: a.role,
    startOfContract: a.startOfContract,
    employmentRelationship: a.employmentRelationship,
  }
}

export function deriveEditState(result: Result<ActDetail, PartnersError>): ActEditState {
  return isOk(result)
    ? { status: 'ready', initial: detailToFormValues(result.value) }
    : { status: 'error', errorTag: partnersErrorTag(result.error) }
}
