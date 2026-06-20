/**
 * Server function: exportar a conciliação de um período (GET /api/v2/financial/reconciliation-periods/:id/
 * export?format=ofx|csv, #173). Fronteira RPC (§III). RBAC `reconciliation:read` no core-api. Devolve o
 * TEXTO cru (OFX/CSV) p/ o client disparar o download (Blob + anchor). PDF fica fora (#145).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { ExportReconciliationInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { ReconciliationExport } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type ExportReconciliationFnResult =
  | Readonly<{ ok: true; data: ReconciliationExport }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const exportReconciliationFn = createServerFn({ method: 'GET' })
  .inputValidator(ExportReconciliationInputSchema)
  .handler(async ({ data }): Promise<ExportReconciliationFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().exportReconciliation(
      { periodId: data.periodId, format: data.format },
      accessToken,
    )
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
