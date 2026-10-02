/**
 * Zod dos responses do core-api `/api/v1/suppliers/*` (boundary §VI). Shape alinhado ao contrato REAL
 * (`supplier-schemas.ts`): list = detail completo; documento CPF ou CNPJ (#1022); `active` boolean (derivado de status); bankAccount/pixKey
 * objeto ou null; `pixKey.keyType` enum com `random-key`. `.strip()` descarta extras (legacyId/createdAt/updatedAt).
 */
import * as z from 'zod'

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

export const CoreApiSupplierItemSchema = z.object({
  id: z.string().trim(),
  name: z.string().trim(),
  email: z.string().trim(),
  // Fornecedor PF (#1022): `document` (CPF ou CNPJ) + `personType` derivado pelo core-api. `cnpj` é o
  // alias DEPRECATED que some em um ciclo — os três são lidos de forma TOLERANTE e resolvidos no mapper
  // (`document ?? cnpj`; sem `personType`, deriva do tamanho), para não depender da ordem dos deploys.
  document: z.string().trim().optional(),
  personType: z.enum(['PF', 'PJ']).optional(),
  cnpj: z.string().trim().optional(),
  // `null` na PF: o campo não existe para pessoa física.
  corporateName: z.string().trim().nullable(),
  fantasyName: z.string().trim().nullable(),
  serviceCategory: z.string().trim(),
  bankAccount: BankAccountDtoSchema.nullable(),
  pixKey: PixKeyDtoSchema.nullable(),
  active: z.boolean(),
  // Avaliação de serviço (§1.6) — leitura TOLERANTE: string livre nullable (mapeada p/ ServiceRating |
  // null no front; desconhecido → null) + `.nullish()` p/ dados legados sem o campo. Comentário idem.
  serviceRating: z.string().trim().nullish(),
  ratingComment: z.string().trim().nullish(),
  // Contratos ativos do parceiro (#46). `.catch(0)` tolera resposta sem o campo (fallback → 0).
  contractCount: z.int().nonnegative().catch(0),
})
export type CoreApiSupplierItem = z.infer<typeof CoreApiSupplierItemSchema>

export const CoreApiSupplierPaginationMetaSchema = z.object({
  itemCount: z.int(),
  totalItems: z.int(),
  itemsPerPage: z.int(),
  totalPages: z.int(),
  currentPage: z.int(),
})

export const CoreApiSupplierListSchema = z.object({
  items: z.array(CoreApiSupplierItemSchema),
  meta: CoreApiSupplierPaginationMetaSchema,
})

export const CoreApiSupplierDetailSchema = CoreApiSupplierItemSchema
export type CoreApiSupplierDetail = z.infer<typeof CoreApiSupplierDetailSchema>

// GET /suppliers/service-categories → string[] (39 códigos legados crus).
export const CoreApiServiceCategoriesSchema = z.array(z.string().trim())
