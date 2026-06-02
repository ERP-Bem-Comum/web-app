/**
 * Instância da repository — wire server functions reais.
 */
import { listContractsFn } from '#modules/contracts/server/adapters/server-fns/list-contracts.server-fn.ts'
import { getContractFn } from '#modules/contracts/server/adapters/server-fns/get-contract.server-fn.ts'
import { createContractFn } from '#modules/contracts/server/adapters/server-fns/create-contract.server-fn.ts'
import { updateContractFn } from '#modules/contracts/server/adapters/server-fns/update-contract.server-fn.ts'
import { createAmendmentFn } from '#modules/contracts/server/adapters/server-fns/create-amendment.server-fn.ts'
import { getContractHistoryFn } from '#modules/contracts/server/adapters/server-fns/get-contract-history.server-fn.ts'
import { createContractsRepository } from './contracts.repository.ts'

export const contractsRepository = createContractsRepository({
  listContractsFn: (opts) => listContractsFn(opts),
  getContractFn: (opts) => getContractFn(opts),
  createContractFn: (opts) => createContractFn(opts),
  updateContractFn: (opts) => updateContractFn(opts),
  createAmendmentFn: (opts) => createAmendmentFn(opts),
  getContractHistoryFn: (opts) => getContractHistoryFn(opts),
})
