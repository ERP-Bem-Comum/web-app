import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn } from '#modules/auth/public-api/index.ts'
import { contractsServer } from '../contracts.composition.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { ContractHistoryEvent } from '#modules/contracts/server/application/queries/get-contract-history.use-case.ts'

const GetHistoryInputSchema = z.object({ id: z.string().uuid() })

export type GetContractHistoryFnResult =
  | Readonly<{ ok: true; data: readonly ContractHistoryEvent[] }>
  | Readonly<{ ok: false; error: ContractsError }>

export const getContractHistoryFn = createServerFn({ method: 'GET' })
  .inputValidator(GetHistoryInputSchema)
  .handler(async ({ data }): Promise<GetContractHistoryFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = '' // TODO: integrar com session guard
    const r = await contractsServer().getContractHistory(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
