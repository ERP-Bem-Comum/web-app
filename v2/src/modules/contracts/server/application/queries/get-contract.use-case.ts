import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'

type Deps = Readonly<{
  client: Readonly<{
    getById: (id: string, token: string) => Promise<Result<unknown, ContractsError>>
  }>
}>

export const createGetContract = (deps: Deps) =>
  async (id: string, token: string): Promise<Result<Contract, ContractsError>> => {
    const r = await deps.client.getById(id, token)
    if (isErr(r)) return err(r.error)
    return ok(r.value as Contract)
  }
