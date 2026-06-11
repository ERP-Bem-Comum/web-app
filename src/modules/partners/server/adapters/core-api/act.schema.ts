/**
 * Zod dos responses do core-api `/api/v1/acts/*` (boundary §VI). Shape alinhado ao contrato REAL do #32
 * (`actDetailSchema`): Acordo de Cooperação Técnica institucional. `occupationArea` string TOLERANTE
 * (valor legado fora do enum não quebra o parse); `legacyId` number|null; `active` boolean; bankAccount/
 * pixKey objeto ou null. A lista já entrega o detalhe completo de cada item.
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

export const CoreApiActItemSchema = z.object({
  id: z.string().trim(),
  legacyId: z.number().nullable(),
  actNumber: z.string().trim(),
  name: z.string().trim(),
  email: z.string().trim(), // tolerante na borda (core-api usa z.string())
  cnpj: z.string().trim(),
  corporateName: z.string().trim(),
  fantasyName: z.string().trim(),
  occupationArea: z.string().trim(), // tolerante: valor legado fora do enum não quebra
  legalRepresentative: z.string().trim(),
  startDate: z.string().trim(),
  endDate: z.string().trim(),
  hasFinancialTransfer: z.boolean(),
  bankAccount: BankAccountDtoSchema.nullable(),
  pixKey: PixKeyDtoSchema.nullable(),
  active: z.boolean(),
  createdAt: z.string().trim(),
  updatedAt: z.string().trim(),
})
export type CoreApiActItem = z.infer<typeof CoreApiActItemSchema>

// Paginação legada do core-api (nestjs-typeorm-paginate) — mapeada p/ { page, limit, total } no Model.
export const CoreApiActPaginationMetaSchema = z.object({
  itemCount: z.int(),
  totalItems: z.int(),
  itemsPerPage: z.int(),
  totalPages: z.int(),
  currentPage: z.int(),
})

export const CoreApiActListSchema = z.object({
  items: z.array(CoreApiActItemSchema),
  meta: CoreApiActPaginationMetaSchema,
})

// O detalhe do Act tem o mesmo shape do item (a lista já entrega tudo).
export const CoreApiActDetailSchema = CoreApiActItemSchema
export type CoreApiActDetail = z.infer<typeof CoreApiActDetailSchema>
