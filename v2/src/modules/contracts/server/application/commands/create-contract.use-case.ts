import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { CreateContractInput, Contract } from '#modules/contracts/server/domain/contracts.types.ts'

type Deps = Readonly<{
  client: Readonly<{
    create: (input: CreateContractInput, token: string) => Promise<Result<unknown, ContractsError>>
  }>
}>

export const createCreateContract = (deps: Deps) =>
  async (input: CreateContractInput, token: string): Promise<Result<Contract, ContractsError>> => {
    const r = await deps.client.create(input, token)
    if (isErr(r)) return err(r.error)
    return ok(r.value as Contract)
  }
