import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { contractsServer } from '../contracts.composition.ts'
import { CreateContractInputSchema } from '#modules/contracts/server/adapters/contracts.schemas.ts'
import type { Contract } from '#modules/contracts/server/domain/contracts.types.ts'
import type { ContractsError } from '#modules/contracts/server/adapters/contracts-shared.types.ts'

export type CreateContractFnResult =
  | Readonly<{ ok: true; data: Contract }>
  | Readonly<{ ok: false; error: ContractsError }>

export const createContractFn = createServerFn({ method: 'POST' })
  .inputValidator(CreateContractInputSchema)
  .handler(async ({ data }): Promise<CreateContractFnResult> => {
    try {
      const user = await getCurrentUserFn()
      const accessToken = await resolveAccessTokenFn()

      if (user === null || accessToken === null) {
        return { ok: false, error: 'unauthorized' }
      }

      const r = await contractsServer().createContract(data, accessToken)
      if (isErr(r)) return { ok: false, error: r.error }
      return { ok: true, data: r.value }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      console.error('[create-contract] erro inesperado:', message, 'input:', JSON.stringify(data))
      return { ok: false, error: 'server' }
    }
  })
