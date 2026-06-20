/**
 * reconciliationErrorTag — mapeia `ReconciliationError` → tag i18n (§V: a UI nunca olha status; trata só
 * a tag). `switch` exaustivo com guarda `never` (§IV). Espelha `financial-error-tag.ts`.
 */
import type { ReconciliationError } from '#modules/financial/client/data/repository/reconciliation-error.ts'

export const reconciliationErrorTag = (e: ReconciliationError): string => {
  switch (e) {
    case 'not-found':
      return 'financial.recon.error.not-found'
    case 'validation':
      return 'financial.recon.error.validation'
    case 'conflict':
      return 'financial.recon.error.conflict'
    case 'unauthorized':
      return 'financial.recon.error.unauthorized'
    case 'forbidden':
      return 'financial.recon.error.forbidden'
    case 'connectivity':
      return 'financial.recon.error.connectivity'
    case 'server':
      return 'financial.recon.error.server'
    case 'import-unsupported-format':
      return 'financial.recon.error.import-unsupported-format'
    case 'import-empty-content':
      return 'financial.recon.error.import-empty-content'
    case 'import-malformed':
      return 'financial.recon.error.import-malformed'
    case 'import-empty-statement':
      return 'financial.recon.error.import-empty-statement'
    case 'period-closed':
      return 'financial.recon.error.period-closed'
    case 'period-has-pending':
      return 'financial.recon.error.period-has-pending'
    case 'invalid-period-range':
      return 'financial.recon.error.invalid-period-range'
    case 'period-not-found':
      return 'financial.recon.error.period-not-found'
    case 'reconciliation-not-balanced':
      return 'financial.recon.error.reconciliation-not-balanced'
    case 'transaction-already-reconciled':
      return 'financial.recon.error.transaction-already-reconciled'
    case 'account-closed':
      return 'financial.recon.error.account-closed'
    case 'payable-not-found':
      return 'financial.recon.error.payable-not-found'
    case 'title-not-paid':
      return 'financial.recon.error.title-not-paid'
    case 'empty-reconciliation':
      return 'financial.recon.error.empty-reconciliation'
    case 'reconciliation-already-undone':
      return 'financial.recon.error.reconciliation-already-undone'
    case 'export-unsupported-format':
      return 'financial.recon.error.export-unsupported-format'
    case 'unavailable':
      return 'financial.recon.error.unavailable'
    default: {
      const _exhaustive: never = e
      return _exhaustive
    }
  }
}
