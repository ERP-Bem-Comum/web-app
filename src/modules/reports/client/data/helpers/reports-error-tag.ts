/**
 * reportsErrorTag — mapeia `ReportsError` → tag i18n (§V: a UI nunca olha status; trata só a tag). `switch`
 * exaustivo com guarda `never` (§IV). Espelha `financial-error-tag.ts`.
 */
import type { ReportsError } from '#modules/reports/client/data/repository/reports-error.ts'

export const reportsErrorTag = (e: ReportsError): string => {
  switch (e) {
    case 'unauthorized':
      return 'reports.error.unauthorized'
    case 'forbidden':
      return 'reports.error.forbidden'
    case 'validation':
      return 'reports.error.validation'
    case 'connectivity':
      return 'reports.error.connectivity'
    case 'server':
      return 'reports.error.server'
    default: {
      const _exhaustive: never = e
      return _exhaustive
    }
  }
}
