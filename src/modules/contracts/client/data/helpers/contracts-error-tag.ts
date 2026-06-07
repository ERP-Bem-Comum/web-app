/**
 * contractsErrorTag — mapeia ContractsError → tag i18n.
 */
import type { ContractsError } from '#modules/contracts/client/data/repository/contracts.repository.ts'

export const contractsErrorTag = (e: ContractsError): string => {
  switch (e) {
    case 'invalid-code':
      return 'contracts.error.invalid-code'
    case 'invalid-value':
      return 'contracts.error.invalid-value'
    case 'invalid-period':
      return 'contracts.error.invalid-period'
    case 'missing-contractor':
      return 'contracts.error.missing-contractor'
    case 'contract-not-found':
      return 'contracts.error.contract-not-found'
    case 'amendment-not-found':
      return 'contracts.error.amendment-not-found'
    case 'invalid-amendment-type':
      return 'contracts.error.invalid-amendment-type'
    case 'connectivity':
      return 'contracts.error.connectivity'
    case 'unauthorized':
      return 'contracts.error.unauthorized'
    case 'server':
      return 'contracts.error.unexpected'
    case 'not-implemented':
      return 'contracts.error.not-implemented'
  }
}
