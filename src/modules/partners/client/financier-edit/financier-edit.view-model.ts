/**
 * ViewModel da edição — AGNÓSTICO (puro). Deriva o estado de carregamento e mapeia o detalhe
 * carregado para os valores iniciais do formulário (6 campos).
 */
import { isOk, type Result } from '#shared/primitives/result.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { PartnersError } from '#modules/partners/client/data/repository/partners-error.ts'
import type { FinancierDetail, FinancierFormValues } from '#modules/partners/client/data/model/financier.model.ts'

export type FinancierEditState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: string }>
  | Readonly<{ status: 'ready'; initial: FinancierFormValues }>

export function detailToFormValues(f: FinancierDetail): FinancierFormValues {
  return {
    name: f.name,
    corporateName: f.corporateName,
    legalRepresentative: f.legalRepresentative,
    cnpj: f.cnpj,
    telephone: f.telephone,
    address: f.address,
  }
}

export function deriveEditState(result: Result<FinancierDetail, PartnersError>): FinancierEditState {
  return isOk(result)
    ? { status: 'ready', initial: detailToFormValues(result.value) }
    : { status: 'error', errorTag: partnersErrorTag(result.error) }
}
