import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { contractsServer } from '../contracts.composition.ts'
import type { Contract } from '#modules/contracts/server/domain/contracts.types.ts'
import type { ContractsError } from '#modules/contracts/server/adapters/contracts-shared.types.ts'

const EndContractFnInputSchema = z.object({ contractId: z.uuid() })

export type EndContractFnResult =
  | Readonly<{ ok: true; data: Contract }>
  | Readonly<{ ok: false; error: ContractsError }>

// Distrato (encerramento antecipado) — POST /contracts/:id/end (Terminate). Religação básica:
// sem data efetiva/documento (gap em CTR-HTTP-DISTRATO-DOCUMENTO).
export const endContractFn = createServerFn({ method: 'POST' })
  .inputValidator(EndContractFnInputSchema)
  .handler(async ({ data }): Promise<EndContractFnResult> => {
    // Borda de infra: qualquer exceção inesperada (rede, bug de composição) vira Result — a UI
    // nunca recebe throw cru e a cadeia de erro segue como valor (ADR-0002, ver A7 do review).
    try {
      const user = await getCurrentUserFn()
      if (user === null) return { ok: false, error: 'unauthorized' }

      const accessToken = await resolveAccessTokenFn()
      if (accessToken === null) return { ok: false, error: 'unauthorized' }

      const r = await contractsServer().endContract(data.contractId, accessToken)
      if (isErr(r)) return { ok: false, error: r.error }
      return { ok: true, data: r.value }
    } catch {
      return { ok: false, error: 'server' }
    }
  })
