/**
 * Server function: listar contratos. Fronteira RPC.
 * Extrai access token da sessão (via auth guard), chama use-case.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn } from '#modules/auth/public-api/index.ts'
import { contractsServer } from '../contracts.composition.ts'
import { ListContractsInputSchema, type ListContractsResponse } from '#modules/contracts/client/data/model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'

export type ListContractsFnResult =
  | Readonly<{ ok: true; data: ListContractsResponse }>
  | Readonly<{ ok: false; error: ContractsError }>

export const listContractsFn = createServerFn({ method: 'GET' })
  .inputValidator(ListContractsInputSchema)
  .handler(async ({ data }): Promise<ListContractsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    // TODO: obter access token da sessão (depende do session guard da auth)
    const accessToken = '' // placeholder — integrar com session guard

    const r = await contractsServer().listContracts(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
