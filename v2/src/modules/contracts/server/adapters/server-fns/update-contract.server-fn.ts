import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn } from '#modules/auth/public-api/index.ts'
import { contractsServer } from '../contracts.composition.ts'
import { UpdateContractInputSchema, type Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'

export type UpdateContractFnResult =
  | Readonly<{ ok: true; data: Contract }>
  | Readonly<{ ok: false; error: ContractsError }>

export const updateContractFn = createServerFn({ method: 'POST' })
  .inputValidator(UpdateContractInputSchema)
  .handler(async ({ data }): Promise<UpdateContractFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = '' // TODO: integrar com session guard
    const r = await contractsServer().updateContract(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
