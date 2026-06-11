import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { contractsServer } from '../contracts.composition.ts'
import { validateSignedDocument } from '../attach-signed-document.validation.ts'
import { EndContractInputSchema } from '#modules/contracts/server/adapters/contracts.schemas.ts'
import type { Contract } from '#modules/contracts/server/domain/contracts.types.ts'
import type { ContractsError } from '#modules/contracts/server/adapters/contracts-shared.types.ts'

export type EndContractFnResult =
  | Readonly<{ ok: true; data: Contract }>
  | Readonly<{ ok: false; error: ContractsError }>

// Distrato (#32, CTR-HTTP-DISTRATO-DOCUMENTO) — encerra o contrato (status Terminated/Distrato):
// valida o PDF + a data efetiva (não-futura) na borda e delega ao use-case (upload signed_termination → end).
export const endContractFn = createServerFn({ method: 'POST' })
  .inputValidator(EndContractInputSchema)
  .handler(async ({ data }): Promise<EndContractFnResult> => {
    // Borda de infra: qualquer exceção inesperada (rede, bug de composição) vira Result — a UI
    // nunca recebe throw cru e a cadeia de erro segue como valor (ADR-0002).
    try {
      const user = await getCurrentUserFn()
      if (user === null) return { ok: false, error: 'unauthorized' }

      const accessToken = await resolveAccessTokenFn()
      if (accessToken === null) return { ok: false, error: 'unauthorized' }

      // Reuso da validação de documento assinado: PDF (magic bytes, ≤20 MiB) + data não-futura.
      // A data validada aqui é a `terminatedAt` (data efetiva do distrato) — espelha a RN do domínio.
      const validated = validateSignedDocument(
        { fileBase64: data.fileBase64, fileName: data.fileName, signedAt: data.terminatedAt },
        new Date(),
      )
      if (isErr(validated)) {
        // Data efetiva inválida/futura → erro específico do distrato (mensagem amigável dedicada).
        return { ok: false, error: validated.error === 'invalid-signed-at' ? 'terminate-invalid-date' : validated.error }
      }

      const r = await contractsServer().endContract(
        {
          contractId: data.contractId,
          bytes: validated.value.bytes,
          fileName: validated.value.fileName,
          terminatedAt: data.terminatedAt,
          reason: data.reason,
        },
        accessToken,
      )
      if (isErr(r)) return { ok: false, error: r.error }
      return { ok: true, data: r.value }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      console.error('[end-contract] erro inesperado:', message)
      return { ok: false, error: 'server' }
    }
  })
