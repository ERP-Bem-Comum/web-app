/**
 * ViewModel da edição de ACT — AGNÓSTICO (puro). Deriva o estado de carregamento e mapeia o detalhe do
 * Acordo para os valores iniciais do formulário (incl. conta/PIX). occupationArea vem como string
 * tolerante no detalhe; o form parte de um valor válido do enum (legado fora do enum → 'PARC').
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
    actNumber: a.actNumber,
    name: a.name,
    email: a.email,
    cnpj: a.cnpj,
    corporateName: a.corporateName,
    fantasyName: a.fantasyName,
    occupationArea: asOccupationArea(a.occupationArea),
    legalRepresentative: a.legalRepresentative,
    startDate: a.startDate,
    endDate: a.endDate,
    hasFinancialTransfer: a.hasFinancialTransfer,
    bankAccount: a.bankAccount,
    pixKey: a.pixKey,
  }
}

export function deriveEditState(result: Result<ActDetail, PartnersError>): ActEditState {
  return isOk(result)
    ? { status: 'ready', initial: detailToFormValues(result.value) }
    : { status: 'error', errorTag: partnersErrorTag(result.error) }
}
