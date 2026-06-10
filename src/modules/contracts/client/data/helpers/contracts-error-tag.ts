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
    case 'contract-not-active':
      return 'contracts.error.contract-not-active'
    case 'amendment-not-extending':
      return 'contracts.error.amendment-not-extending'
    case 'amendment-invalid-new-end-date':
      return 'contracts.error.amendment-invalid-new-end-date'
    case 'amendment-cannot-extend-indefinite':
      return 'contracts.error.amendment-cannot-extend-indefinite'
    case 'amendment-suppression-exceeds-value':
      return 'contracts.error.amendment-suppression-exceeds-value'
    case 'connectivity':
      return 'contracts.error.connectivity'
    case 'unauthorized':
      return 'contracts.error.unauthorized'
    case 'server':
      return 'contracts.error.unexpected'
    case 'not-implemented':
      return 'contracts.error.not-implemented'
    case 'invalid-pdf':
      return 'contracts.attach.error.invalid-pdf'
    case 'file-too-large':
      return 'contracts.attach.error.too-large'
    case 'invalid-signed-at':
      return 'contracts.attach.error.invalid-date'
    case 'no-signed-document':
      return 'contracts.attach.error.no-document'
    case 'document-conflict':
      return 'contracts.attach.error.conflict'
    case 'storage-unavailable':
      return 'contracts.attach.error.storage'
    default: {
      const _exhaustive: never = e
      return _exhaustive
    }
  }
}
