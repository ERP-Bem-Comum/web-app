/**
 * Server function: export CSV de parceiros (suppliers/collaborators/financiers/acts). Fronteira RPC.
 * Autentica na borda e repassa o `text/csv` do core-api; o client cria o Blob e dispara o download.
 * O RBAC (`{resource}:read`) é checado pelo core-api (403 → forbidden).
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { exportPartner } from '../partners-export.composition.ts'
import type { PartnerExportFile } from '#modules/partners/server/adapters/core-api/core-api-partners-export.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

const ExportPartnersInputSchema = z.object({
  resource: z.enum(['collaborators', 'suppliers', 'financiers', 'acts']),
  search: z.string().trim().max(120).optional(),
  active: z.boolean().optional(),
  categories: z.array(z.string().trim().max(80)).optional(), // só suppliers
})

export type ExportPartnersFnResult =
  | Readonly<{ ok: true; data: PartnerExportFile }>
  | Readonly<{ ok: false; error: PartnersError }>

export const exportPartnersFn = createServerFn({ method: 'GET' })
  .inputValidator(ExportPartnersInputSchema)
  .handler(async ({ data }): Promise<ExportPartnersFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const { resource, ...query } = data
    const r = await exportPartner(resource, query, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
