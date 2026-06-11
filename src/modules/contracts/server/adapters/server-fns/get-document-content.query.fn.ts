import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { contractsServer } from '../contracts.composition.ts'
import type { ContractsError } from '#modules/contracts/server/adapters/contracts-shared.types.ts'

const GetDocumentContentInputSchema = z.object({
  contractId: z.uuid(),
  documentId: z.uuid(),
})

// Os bytes viajam como base64 no envelope RPC (JSON) — o binding decodifica para Blob no browser.
export type GetDocumentContentFnResult =
  | Readonly<{ ok: true; data: Readonly<{ base64: string; fileName: string; contentType: string }> }>
  | Readonly<{ ok: false; error: ContractsError }>

export const getDocumentContentFn = createServerFn({ method: 'GET' })
  .inputValidator(GetDocumentContentInputSchema)
  .handler(async ({ data }): Promise<GetDocumentContentFnResult> => {
    // Borda de infra: qualquer exceção inesperada vira Result (ADR-0002, errors-as-values).
    try {
      const user = await getCurrentUserFn()
      if (user === null) return { ok: false, error: 'unauthorized' }

      const accessToken = await resolveAccessTokenFn()
      if (accessToken === null) return { ok: false, error: 'unauthorized' }

      const r = await contractsServer().getDocumentContent(data.contractId, data.documentId, accessToken)
      if (isErr(r)) return { ok: false, error: r.error }

      return {
        ok: true,
        data: {
          base64: Buffer.from(r.value.bytes).toString('base64'),
          fileName: r.value.fileName,
          contentType: r.value.contentType,
        },
      }
    } catch {
      return { ok: false, error: 'server' }
    }
  })
