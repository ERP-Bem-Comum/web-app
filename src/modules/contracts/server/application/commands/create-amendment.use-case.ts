import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { CreateAmendmentInput, Amendment } from '#modules/contracts/server/domain/contracts.types.ts'

type Deps = Readonly<{
  client: Readonly<{
    createAmendment: (contractId: string, input: CreateAmendmentInput, token: string) => Promise<Result<unknown, ContractsError>>
  }>
}>

export const createCreateAmendment = (deps: Deps) =>
  async (contractId: string, input: CreateAmendmentInput, token: string): Promise<Result<Amendment, ContractsError>> => {
    const r = await deps.client.createAmendment(contractId, input, token)
    if (isErr(r)) return err(r.error)
    return ok(r.value as Amendment)
  }
