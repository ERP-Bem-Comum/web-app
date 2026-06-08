import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { contractsServer } from '../contracts.composition.ts'
import { validateSignedDocument } from '../attach-signed-document.validation.ts'
import { AttachSignedDocumentInputSchema } from '#modules/contracts/server/adapters/contracts.schemas.ts'
import type { Contract } from '#modules/contracts/server/domain/contracts.types.ts'
import type { ContractsError } from '#modules/contracts/server/adapters/contracts-shared.types.ts'

export type AttachSignedDocumentFnResult =
  | Readonly<{ ok: true; data: Contract }>
  | Readonly<{ ok: false; error: ContractsError }>

export const attachSignedDocumentFn = createServerFn({ method: 'POST' })
  .inputValidator(AttachSignedDocumentInputSchema)
  .handler(async ({ data }): Promise<AttachSignedDocumentFnResult> => {
    try {
      const user = await getCurrentUserFn()
      const accessToken = await resolveAccessTokenFn()

      if (user === null || accessToken === null) {
        return { ok: false, error: 'unauthorized' }
      }

      // Validação de borda (decodifica base64; magic bytes %PDF; ≤20 MiB; data válida e não-futura).
      const validated = validateSignedDocument(
        { fileBase64: data.fileBase64, fileName: data.fileName, signedAt: data.signedAt },
        new Date(),
      )
      if (isErr(validated)) return { ok: false, error: validated.error }

      const r = await contractsServer().attachSignedDocument(
        {
          contractId: data.contractId,
          bytes: validated.value.bytes,
          fileName: validated.value.fileName,
          signedAt: validated.value.signedAt,
        },
        accessToken,
      )
      if (isErr(r)) return { ok: false, error: r.error }
      return { ok: true, data: r.value }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      console.error('[attach-signed-document] erro inesperado:', message)
      return { ok: false, error: 'server' }
    }
  })
