/**
 * financialErrorTag — mapeia `FinancialError` → tag i18n (§V: a UI nunca olha status; trata só a tag).
 * `switch` exaustivo com guarda `never` (§IV). Espelha `users-error-tag.ts`.
 */
import type { FinancialError } from '#modules/financial/client/data/repository/financial-error.ts'

export const financialErrorTag = (e: FinancialError): string => {
  switch (e) {
    case 'not-found':
      return 'financial.error.not-found'
    case 'invalid-transition':
      return 'financial.error.invalid-transition'
    case 'net-value-invalid':
      return 'financial.error.net-value-invalid'
    case 'retention-not-allowed':
      return 'financial.error.retention-not-allowed'
    case 'document-incomplete':
      return 'financial.error.document-incomplete'
    case 'validation':
      return 'financial.error.validation'
    case 'unauthorized':
      return 'financial.error.unauthorized'
    case 'forbidden':
      return 'financial.error.forbidden'
    case 'conflict':
      return 'financial.error.conflict'
    case 'connectivity':
      return 'financial.error.connectivity'
    case 'server':
      return 'financial.error.server'
    default: {
      const _exhaustive: never = e
      return _exhaustive
    }
  }
}
