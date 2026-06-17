/**
 * Zod dos responses do core-api `/api/v1/financiers/*` (boundary §VI). Shape alinhado ao contrato REAL
 * (`financier-schemas.ts`): list = detail; `active` boolean. `.strip()` descarta extras (legacyId/datas).
 */
import * as z from 'zod'

export const CoreApiFinancierItemSchema = z.object({
  id: z.string().trim(),
  name: z.string().trim(),
  corporateName: z.string().trim(),
  legalRepresentative: z.string().trim(),
  cnpj: z.string().trim(),
  telephone: z.string().trim(),
  address: z.string().trim(),
  active: z.boolean(),
  // Contratos ativos do parceiro (#46). `.catch(0)` tolera resposta sem o campo (fallback → 0).
  contractCount: z.int().nonnegative().catch(0),
})
export type CoreApiFinancierItem = z.infer<typeof CoreApiFinancierItemSchema>

export const CoreApiFinancierPaginationMetaSchema = z.object({
  itemCount: z.int(),
  totalItems: z.int(),
  itemsPerPage: z.int(),
  totalPages: z.int(),
  currentPage: z.int(),
})

export const CoreApiFinancierListSchema = z.object({
  items: z.array(CoreApiFinancierItemSchema),
  meta: CoreApiFinancierPaginationMetaSchema,
})

export const CoreApiFinancierDetailSchema = CoreApiFinancierItemSchema
export type CoreApiFinancierDetail = z.infer<typeof CoreApiFinancierDetailSchema>
