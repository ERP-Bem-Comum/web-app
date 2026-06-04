import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { contractsServer } from '../contracts.composition.ts'
import type { Contract } from '#modules/contracts/server/domain/contracts.types.ts'
import type { ContractsError } from '#modules/contracts/server/adapters/contracts-shared.types.ts'
import { MOCK_CONTRACT } from './get-contract-mock.server-fn.ts'

const GetContractInputSchema = z.object({ id: z.uuid() })

export type GetContractFnResult =
  | Readonly<{ ok: true; data: Contract }>
  | Readonly<{ ok: false; error: ContractsError }>

export const getContractFn = createServerFn({ method: 'GET' })
  .inputValidator(GetContractInputSchema)
  .handler(async ({ data }): Promise<GetContractFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await contractsServer().getContract(data.id, accessToken)
    if (isErr(r)) {
      // Fallback mock para desenvolvimento/teste
      if (r.error === 'connectivity' || r.error === 'server') {
        return { ok: true, data: { ...MOCK_CONTRACT, id: data.id } }
      }
      return { ok: false, error: r.error }
    }
    return { ok: true, data: r.value }
  })
