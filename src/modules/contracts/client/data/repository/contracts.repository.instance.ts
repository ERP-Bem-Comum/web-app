/**
 * Instância da repository — wire server functions reais.
 */
import { listContractsFn } from '#modules/contracts/server/adapters/server-fns/list-contracts.query.fn.ts'
import { getContractFn } from '#modules/contracts/server/adapters/server-fns/get-contract.query.fn.ts'
import { createContractFn } from '#modules/contracts/server/adapters/server-fns/create-contract.service.fn.ts'
import { updateContractFn } from '#modules/contracts/server/adapters/server-fns/update-contract.service.fn.ts'
import { createAmendmentFn } from '#modules/contracts/server/adapters/server-fns/create-amendment.service.fn.ts'
import { getContractHistoryFn } from '#modules/contracts/server/adapters/server-fns/get-contract-history.query.fn.ts'
import { attachSignedDocumentFn } from '#modules/contracts/server/adapters/server-fns/attach-signed-document.service.fn.ts'
import { createContractsRepository } from './contracts.repository.ts'

export const contractsRepository = createContractsRepository({
  listContractsFn: (opts) => listContractsFn(opts),
  getContractFn: (opts) => getContractFn(opts),
  createContractFn: (opts) => createContractFn(opts),
  updateContractFn: (opts) => updateContractFn(opts),
  createAmendmentFn: (opts) => createAmendmentFn(opts),
  getContractHistoryFn: (opts) => getContractHistoryFn(opts),
  attachSignedDocumentFn: (opts) => attachSignedDocumentFn(opts),
})
