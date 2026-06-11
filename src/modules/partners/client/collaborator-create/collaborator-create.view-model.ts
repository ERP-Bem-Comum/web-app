/**
 * ViewModel da criação de colaborador — AGNÓSTICO (puro). Mutation options + erro → tag i18n.
 */
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { PartnersError } from '#modules/partners/client/data/repository/partners-error.ts'

import { collaboratorCreateMutationOptions } from './collaborator-create.mutation.ts'

export const collaboratorCreateViewModel = {
  mutation: collaboratorCreateMutationOptions,
  toErrorTag: (error: PartnersError): string => partnersErrorTag(error),
  unexpectedErrorTag: 'partners.error.server',
}
