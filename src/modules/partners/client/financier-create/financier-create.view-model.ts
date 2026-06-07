/**
 * ViewModel da criação — AGNÓSTICO (puro). Mutation options + mapeamento de erro → tag i18n.
 */
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { PartnersError } from '#modules/partners/client/data/repository/partners-error.ts'

import { financierCreateMutationOptions } from './financier-create.mutation.ts'

export const financierCreateViewModel = {
  mutation: financierCreateMutationOptions,
  toErrorTag: (error: PartnersError): string => partnersErrorTag(error),
  unexpectedErrorTag: 'partners.error.server',
}
