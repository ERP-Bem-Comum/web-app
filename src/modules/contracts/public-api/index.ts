/**
 * Public API do módulo Contracts — ÚNICO ponto de import externo.
 * Expõe server functions (para rotas), bindings (para outras features) e tipos.
 */
export { listContractsFn } from '#modules/contracts/server/adapters/server-fns/list-contracts.query.fn.ts'
export { getContractFn } from '#modules/contracts/server/adapters/server-fns/get-contract.query.fn.ts'
export { createContractFn } from '#modules/contracts/server/adapters/server-fns/create-contract.service.fn.ts'
export { updateContractFn } from '#modules/contracts/server/adapters/server-fns/update-contract.service.fn.ts'
export { createAmendmentFn } from '#modules/contracts/server/adapters/server-fns/create-amendment.service.fn.ts'
export { getContractHistoryFn } from '#modules/contracts/server/adapters/server-fns/get-contract-history.query.fn.ts'
export { attachSignedDocumentFn } from '#modules/contracts/server/adapters/server-fns/attach-signed-document.service.fn.ts'
export { attachAmendmentDocumentFn } from '#modules/contracts/server/adapters/server-fns/attach-amendment-document.service.fn.ts'
export { endContractFn } from '#modules/contracts/server/adapters/server-fns/end-contract.service.fn.ts'
export { getDocumentContentFn } from '#modules/contracts/server/adapters/server-fns/get-document-content.query.fn.ts'

export { useContractListBinding } from '#modules/contracts/client/contract-list/contract-list.binding.ts'
export { useAttachSignedDocumentBinding } from '#modules/contracts/client/contract-attach-document/attach-signed-document.binding.ts'
export { useContractCreateBinding } from '#modules/contracts/client/contract-create/contract-create.binding.ts'
export { useContractDetailBinding } from '#modules/contracts/client/contract-detail/contract-detail.binding.ts'
export { useContractEditBinding } from '#modules/contracts/client/contract-edit/contract-edit.binding.ts'
export { useAmendmentCreateBinding } from '#modules/contracts/client/amendment-create/amendment-create.binding.ts'
export { useAttachAmendmentDocumentBinding } from '#modules/contracts/client/amendment-create/attach-amendment-document.binding.ts'
export { useEndContractBinding } from '#modules/contracts/client/contract-terminate/end-contract.binding.ts'
export { useDocumentContentBinding } from '#modules/contracts/client/contract-detail/document-content.binding.ts'

export type { Contract, Amendment, ContractStatus, AmendmentStatus, ContractType } from '#modules/contracts/client/data/model/contracts.model.ts'
