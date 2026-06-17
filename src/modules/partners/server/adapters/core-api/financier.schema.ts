/**
 * Zod dos responses do core-api `/api/v1/financiers/*` (boundary §VI). Shape alinhado ao contrato REAL
 * (`financier-schemas.ts`): list = detail; `active` boolean. `.strip()` descarta extras (legacyId/datas).
 */
import * as z from 'zod'

// Payment-target (banco/PIX) no detalhe do Financiador (#40) — mesmo shape do Fornecedor.
const BankAccountDtoSchema = z.object({
  bank: z.string().trim(),
  agency: z.string().trim(),
  accountNumber: z.string().trim(),
  checkDigit: z.string().trim(),
})
const PixKeyDtoSchema = z.object({
  keyType: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random-key']),
  key: z.string().trim(),
})

export const CoreApiFinancierItemSchema = z.object({
  id: z.string().trim(),
  name: z.string().trim(),
  corporateName: z.string().trim(),
  legalRepresentative: z.string().trim(),
  cnpj: z.string().trim(),
  telephone: z.string().trim(),
  address: z.string().trim(),
  active: z.boolean(),
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

// Detalhe enriquece o item com banco/PIX (#40). `.catch(null)` tolera ausência (consistência/legado).
export const CoreApiFinancierDetailSchema = CoreApiFinancierItemSchema.extend({
  bankAccount: BankAccountDtoSchema.nullable().catch(null),
  pixKey: PixKeyDtoSchema.nullable().catch(null),
})
export type CoreApiFinancierDetail = z.infer<typeof CoreApiFinancierDetailSchema>
