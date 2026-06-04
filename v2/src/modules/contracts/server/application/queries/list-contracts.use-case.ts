import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { ListContractsInput, ListContractsResponse } from '#modules/contracts/server/domain/contracts.types.ts'

type Deps = Readonly<{
  client: Readonly<{
    list: (input: ListContractsInput, token: string) => Promise<Result<unknown, ContractsError>>
  }>
}>

export const createListContracts = (deps: Deps) =>
  async (input: ListContractsInput, token: string): Promise<Result<ListContractsResponse, ContractsError>> => {
    const r = await deps.client.list(input, token)
    if (isErr(r)) return err(r.error)
    return ok(r.value as ListContractsResponse)
  }
