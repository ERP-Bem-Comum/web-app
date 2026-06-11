/**
 * cancelContract — cancelamento (soft) de contrato Pendente (§1.7, #32, CTR-HTTP-CANCEL-PENDING):
 * DELETE /contracts/:id → status Cancelled. SEPARADO do distrato (endContract / POST /:id/end, D5):
 * semânticas e endpoints distintos. Thin sobre a borda (client injetado); Result em tudo (§II).
 */
import type { Result } from '#shared/primitives/result.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { Contract } from '#modules/contracts/server/domain/contracts.types.ts'

type Deps = Readonly<{
  client: Readonly<{
    cancelContract: (contractId: string, token: string) => Promise<Result<Contract, ContractsError>>
  }>
}>

export const createCancelContract = (deps: Deps) =>
  (contractId: string, token: string): Promise<Result<Contract, ContractsError>> =>
    deps.client.cancelContract(contractId, token)
