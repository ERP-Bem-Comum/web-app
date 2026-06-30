/**
 * ViewModel da edição — AGNÓSTICO (puro). Deriva o estado de carregamento e mapeia o detalhe
 * carregado para os valores iniciais do formulário.
 */
import { isOk, type Result } from '#shared/primitives/result.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { PartnersError } from '#modules/partners/client/data/repository/supplier.repository.ts'
import type { SupplierDetail, SupplierFormValues } from '#modules/partners/client/data/model/supplier.model.ts'

export type SupplierEditState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: string }>
  | Readonly<{ status: 'ready'; initial: SupplierFormValues }>

export function detailToFormValues(s: SupplierDetail): SupplierFormValues {
  return {
    name: s.name,
    corporateName: s.corporateName,
    fantasyName: s.fantasyName,
    email: s.email,
    cnpj: s.cnpj,
    serviceCategory: s.serviceCategory,
    bankAccount: s.bankAccount,
    pixKey: s.pixKey,
    serviceRating: s.serviceRating,
    ratingComment: s.ratingComment,
  }
}

export function deriveEditState(result: Result<SupplierDetail, PartnersError>): SupplierEditState {
  return isOk(result)
    ? { status: 'ready', initial: detailToFormValues(result.value) }
    : { status: 'error', errorTag: partnersErrorTag(result.error) }
}
