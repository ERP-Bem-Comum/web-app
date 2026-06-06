/**
 * Server function: listar contratos. Fronteira RPC.
 * Extrai access token da sessão (via auth guard), chama use-case.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { contractsServer } from '../contracts.composition.ts'
import { ListContractsInputSchema, type ListContractsResponse } from '#modules/contracts/server/domain/contracts.types.ts'
import type { ContractsError } from '#modules/contracts/server/adapters/contracts-shared.types.ts'

export type ListContractsFnResult =
  | Readonly<{ ok: true; data: ListContractsResponse }>
  | Readonly<{ ok: false; error: ContractsError }>

export const listContractsFn = createServerFn({ method: 'GET' })
  .inputValidator(ListContractsInputSchema)
  .handler(async ({ data }): Promise<ListContractsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await contractsServer().listContracts(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
