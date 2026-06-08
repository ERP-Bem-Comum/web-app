/**
 * ContractsRepository — porta do client para o BFF (server functions).
 * Converte Result do RPC para Result do client.
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type {
  ListContractsInput,
  ListContractsResponse,
  Contract,
  CreateContractInput,
  UpdateContractInput,
  CreateAmendmentInput,
  Amendment,
  AttachSignedDocumentInput,
} from '#modules/contracts/client/data/model/contracts.model.ts'
/** Erro de contratos propagado pelo BFF — definido localmente para evitar cross-layer import. */
export type ContractsError =
  | 'invalid-code'
  | 'invalid-value'
  | 'invalid-period'
  | 'missing-contractor'
  | 'contract-not-found'
  | 'amendment-not-found'
  | 'invalid-amendment-type'
  | 'connectivity'
  | 'server'
  | 'unauthorized'
  | 'not-implemented'
  | 'invalid-pdf'
  | 'file-too-large'
  | 'invalid-signed-at'
  | 'no-signed-document'
  | 'document-conflict'
  | 'storage-unavailable'

import type { ContractHistoryEvent } from '#modules/contracts/server/adapters/contracts-shared.types.ts'

type ListContractsFn = (opts: { data: ListContractsInput }) => Promise<
  | Readonly<{ ok: true; data: ListContractsResponse }>
  | Readonly<{ ok: false; error: ContractsError }>
>
type GetContractFn = (opts: { data: { id: string } }) => Promise<
  | Readonly<{ ok: true; data: Contract }>
  | Readonly<{ ok: false; error: ContractsError }>
>
type CreateContractFn = (opts: { data: CreateContractInput }) => Promise<
  | Readonly<{ ok: true; data: Contract }>
  | Readonly<{ ok: false; error: ContractsError }>
>
type UpdateContractFn = (opts: { data: UpdateContractInput }) => Promise<
  | Readonly<{ ok: true; data: Contract }>
  | Readonly<{ ok: false; error: ContractsError }>
>
type CreateAmendmentFn = (opts: { data: { contractId: string } & CreateAmendmentInput }) => Promise<
  | Readonly<{ ok: true; data: Amendment }>
  | Readonly<{ ok: false; error: ContractsError }>
>
type GetHistoryFn = (opts: { data: { id: string } }) => Promise<
  | Readonly<{ ok: true; data: readonly ContractHistoryEvent[] }>
  | Readonly<{ ok: false; error: ContractsError }>
>
type AttachSignedDocumentFn = (opts: { data: AttachSignedDocumentInput }) => Promise<
  | Readonly<{ ok: true; data: Contract }>
  | Readonly<{ ok: false; error: ContractsError }>
>

export type ContractsRepository = Readonly<{
  list: (input: ListContractsInput) => Promise<Result<ListContractsResponse, ContractsError>>
  getById: (id: string) => Promise<Result<Contract, ContractsError>>
  create: (input: CreateContractInput) => Promise<Result<Contract, ContractsError>>
  update: (input: UpdateContractInput) => Promise<Result<Contract, ContractsError>>
  createAmendment: (contractId: string, input: CreateAmendmentInput) => Promise<Result<Amendment, ContractsError>>
  getHistory: (id: string) => Promise<Result<readonly ContractHistoryEvent[], ContractsError>>
  attachSignedDocument: (input: AttachSignedDocumentInput) => Promise<Result<Contract, ContractsError>>
}>

export const createContractsRepository = (deps: Readonly<{
  listContractsFn: ListContractsFn
  getContractFn: GetContractFn
  createContractFn: CreateContractFn
  updateContractFn: UpdateContractFn
  createAmendmentFn: CreateAmendmentFn
  getContractHistoryFn: GetHistoryFn
  attachSignedDocumentFn: AttachSignedDocumentFn
}>): ContractsRepository => ({
  list: async (input) => {
    const res = await deps.listContractsFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getById: async (id) => {
    const res = await deps.getContractFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  create: async (input) => {
    const res = await deps.createContractFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  update: async (input) => {
    const res = await deps.updateContractFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  createAmendment: async (contractId, input) => {
    const res = await deps.createAmendmentFn({ data: { contractId, ...input } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getHistory: async (id) => {
    const res = await deps.getContractHistoryFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  attachSignedDocument: async (input) => {
    const res = await deps.attachSignedDocumentFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
})
