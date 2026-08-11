/**
 * Server function: relatório de Fornecedores sem Contrato. GET /api/v2/reports/suppliers-without-contract
 * → { suppliers: [...] }. Fronteira RPC (§III). Input validado por Zod na borda (§IX): 7 filtros OPCIONAIS
 * (#694) — refs UUID e janela de vencimento [dueFrom, dueTo). Auth no HANDLER. Erro como valor (§V).
 *
 * A resposta traz UMA linha por fornecedor×Plano Orçamentário (#694), com o `supplierRef` repetido — o
 * client agrega o fornecedor a partir delas, então o Limite continua sendo por FORNECEDOR.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reportsServer } from '../reports.composition.ts'
import type { SupplierWithoutContract } from '#modules/reports/server/domain/reports.io.ts'
import type { ReportsError } from '#modules/reports/server/domain/errors/reports.errors.ts'

// `YYYY-MM-DD` — a page manda a data crua; o backend trata o `dueTo` como EXCLUSIVO (janela half-open).
const IsoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)

const GetSuppliersWithoutContractInputSchema = z.object({
  programId: z.string().trim().min(1).optional(),
  budgetPlanId: z.string().trim().min(1).optional(),
  costCenterId: z.string().trim().min(1).optional(),
  categoryId: z.string().trim().min(1).optional(),
  subCategoryId: z.string().trim().min(1).optional(),
  dueFrom: IsoDateSchema.optional(),
  dueTo: IsoDateSchema.optional(),
})

export type GetSuppliersWithoutContractFnResult =
  | Readonly<{ ok: true; data: readonly SupplierWithoutContract[] }>
  | Readonly<{ ok: false; error: ReportsError }>

export const getSuppliersWithoutContractFn = createServerFn({ method: 'GET' })
  .inputValidator(GetSuppliersWithoutContractInputSchema)
  .handler(async ({ data }): Promise<GetSuppliersWithoutContractFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reportsServer().getSuppliersWithoutContract(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
