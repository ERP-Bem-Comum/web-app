import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn } from '#modules/auth/public-api/index.ts'
import { contractsServer } from '../contracts.composition.ts'
import { CreateAmendmentInputSchema, type Amendment } from '#modules/contracts/server/domain/contracts.types.ts'
import type { ContractsError } from '#modules/contracts/server/adapters/contracts-shared.types.ts'

const CreateAmendmentFnInputSchema = z.object({
  contractId: z.uuid(),
  ...CreateAmendmentInputSchema.shape,
})

export type CreateAmendmentFnResult =
  | Readonly<{ ok: true; data: Amendment }>
  | Readonly<{ ok: false; error: ContractsError }>

export const createAmendmentFn = createServerFn({ method: 'POST' })
  .inputValidator(CreateAmendmentFnInputSchema)
  .handler(async ({ data }): Promise<CreateAmendmentFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = '' // TODO: integrar com session guard
    const { contractId, ...input } = data
    const r = await contractsServer().createAmendment(contractId, input, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
