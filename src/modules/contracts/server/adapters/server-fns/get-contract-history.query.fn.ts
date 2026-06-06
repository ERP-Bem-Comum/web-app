import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { contractsServer } from '../contracts.composition.ts'
import type { ContractsError } from '#modules/contracts/server/adapters/contracts-shared.types.ts'
import type { ContractHistoryEvent } from '#modules/contracts/server/adapters/contracts-shared.types.ts'

const GetHistoryInputSchema = z.object({ id: z.uuid() })

export type GetContractHistoryFnResult =
  | Readonly<{ ok: true; data: readonly ContractHistoryEvent[] }>
  | Readonly<{ ok: false; error: ContractsError }>

export const getContractHistoryFn = createServerFn({ method: 'GET' })
  .inputValidator(GetHistoryInputSchema)
  .handler(async ({ data }): Promise<GetContractHistoryFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await contractsServer().getContractHistory(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
