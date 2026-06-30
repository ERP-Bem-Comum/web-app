/**
 * ViewModel da criação de ACT — AGNÓSTICO (puro). Mutation options + mapeamento de erro → tag i18n.
 */
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { PartnersError } from '#modules/partners/client/data/repository/partners-error.ts'

import { actCreateMutationOptions } from './act-create.mutation.ts'

export const actCreateViewModel = {
  mutation: actCreateMutationOptions,
  toErrorTag: (error: PartnersError): string => partnersErrorTag(error),
  unexpectedErrorTag: 'partners.error.server',
}
