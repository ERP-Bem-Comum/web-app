/**
 * Public API do módulo Contracts — ÚNICO ponto de import externo.
 * Expõe server functions (para rotas), bindings (para outras features) e tipos.
 */
export { listContractsFn } from '#modules/contracts/server/adapters/server-fns/list-contracts.server-fn.ts'
export { getContractFn } from '#modules/contracts/server/adapters/server-fns/get-contract.server-fn.ts'
export { createContractFn } from '#modules/contracts/server/adapters/server-fns/create-contract.server-fn.ts'
export { updateContractFn } from '#modules/contracts/server/adapters/server-fns/update-contract.server-fn.ts'
export { createAmendmentFn } from '#modules/contracts/server/adapters/server-fns/create-amendment.server-fn.ts'
export { getContractHistoryFn } from '#modules/contracts/server/adapters/server-fns/get-contract-history.server-fn.ts'

export { useContractListBinding } from '#modules/contracts/client/contract-list/contract-list.binding.ts'
export { useContractCreateBinding } from '#modules/contracts/client/contract-create/contract-create.binding.ts'
export { useContractDetailBinding } from '#modules/contracts/client/contract-detail/contract-detail.binding.ts'
export { useContractEditBinding } from '#modules/contracts/client/contract-edit/contract-edit.binding.ts'
export { useAmendmentCreateBinding } from '#modules/contracts/client/amendment-create/amendment-create.binding.ts'

export type { Contract, Amendment, ContractStatus, AmendmentStatus, ContractType } from '#modules/contracts/client/data/model/contracts.model.ts'
