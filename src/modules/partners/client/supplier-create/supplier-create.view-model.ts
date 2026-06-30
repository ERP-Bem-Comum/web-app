/**
 * ViewModel da criação — AGNÓSTICO (puro). Mutation options + mapeamento de erro → tag i18n.
 */
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { PartnersError } from '#modules/partners/client/data/repository/supplier.repository.ts'

import { supplierCreateMutationOptions } from './supplier-create.mutation.ts'

export const supplierCreateViewModel = {
  mutation: supplierCreateMutationOptions,
  toErrorTag: (error: PartnersError): string => partnersErrorTag(error),
  unexpectedErrorTag: 'partners.error.server',
}
