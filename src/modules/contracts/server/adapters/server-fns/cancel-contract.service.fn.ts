import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { contractsServer } from '../contracts.composition.ts'
import { CancelContractInputSchema } from '#modules/contracts/server/adapters/contracts.schemas.ts'
import type { Contract } from '#modules/contracts/server/domain/contracts.types.ts'
import type { ContractsError } from '#modules/contracts/server/adapters/contracts-shared.types.ts'

export type CancelContractFnResult =
  | Readonly<{ ok: true; data: Contract }>
  | Readonly<{ ok: false; error: ContractsError }>

// Cancelamento (§1.7, #32, CTR-HTTP-CANCEL-PENDING) — DELETE /contracts/:id: cancela (soft) um contrato
// Pendente → Cancelled. Não-Pendente → 409 ContractNotPending (→ 'contract-not-pending'). SEPARADO do
// distrato (end-contract). A server fn é a única fronteira: auth + token + delega ao use-case.
export const cancelContractFn = createServerFn({ method: 'POST' })
  .inputValidator(CancelContractInputSchema)
  .handler(async ({ data }): Promise<CancelContractFnResult> => {
    // Borda de infra: qualquer exceção inesperada vira Result — a UI nunca recebe throw cru (ADR-0002).
    try {
      const user = await getCurrentUserFn()
      if (user === null) return { ok: false, error: 'unauthorized' }

      const accessToken = await resolveAccessTokenFn()
      if (accessToken === null) return { ok: false, error: 'unauthorized' }

      const r = await contractsServer().cancelContract(data.contractId, accessToken)
      if (isErr(r)) return { ok: false, error: r.error }
      return { ok: true, data: r.value }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      console.error('[cancel-contract] erro inesperado:', message)
      return { ok: false, error: 'server' }
    }
  })
