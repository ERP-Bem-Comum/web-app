/**
 * partnersErrorTag — mapeia `PartnersError` → tag i18n (§V: a UI nunca olha status; trata só a tag).
 * `switch` exaustivo com guarda `never` (§IV) — adicionar um erro novo sem mapear quebra o build.
 */
import type { PartnersError } from '#modules/partners/client/data/repository/partners-error.ts'

export const partnersErrorTag = (e: PartnersError): string => {
  switch (e) {
    case 'not-found':
      return 'partners.error.not-found'
    case 'validation':
      return 'partners.error.validation'
    case 'unauthorized':
      return 'partners.error.unauthorized'
    case 'forbidden':
      return 'partners.error.forbidden'
    case 'conflict':
      return 'partners.error.conflict'
    case 'connectivity':
      return 'partners.error.connectivity'
    case 'server':
      return 'partners.error.server'
    case 'collaborator-import-malformed':
      return 'partners.error.collaborator-import-malformed'
    case 'invalid-registration-transition':
      return 'partners.error.invalid-registration-transition'
    case 'deactivation-reason-required':
      return 'partners.error.deactivation-reason-required'
    case 'invalid-service-category':
      return 'partners.error.invalid-service-category'
    case 'act-number-duplicate':
      return 'partners.error.act-number-duplicate'
    case 'invalid-cnpj':
      return 'partners.error.invalid-cnpj'
    case 'invalid-act-period':
      return 'partners.error.invalid-act-period'
    case 'act-payment-target-required':
      return 'partners.error.act-payment-target-required'
    case 'invalid-state':
      return 'partners.error.invalid-state'
    case 'invalid-ibge-code':
      return 'partners.error.invalid-ibge-code'
    default: {
      const _exhaustive: never = e
      return _exhaustive
    }
  }
}
