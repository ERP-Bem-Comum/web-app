import { type Result } from '#shared/primitives/result.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { Contract } from '#modules/contracts/server/domain/contracts.types.ts'

type Deps = Readonly<{
  client: Readonly<{
    endContract: (contractId: string, token: string) => Promise<Result<Contract, ContractsError>>
  }>
}>

// Distrato (encerramento antecipado) — transição de ciclo de vida via POST /contracts/:id/end (Terminate).
export const createEndContract = (deps: Deps) =>
  (contractId: string, token: string): Promise<Result<Contract, ContractsError>> =>
    deps.client.endContract(contractId, token)
