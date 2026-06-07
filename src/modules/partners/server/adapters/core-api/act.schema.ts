/**
 * Zod dos responses do core-api `/api/v1/acts/*` (boundary §VI). Valida o que entra do backend antes de
 * virar Model. Shape alinhado ao contrato REAL (`act-schemas.ts` do core-api): o list já traz o DETALHE
 * completo de cada item; `registrationStatus` é o status cadastral, `active` é o soft-delete.
 * `.strip()` (default Zod) descarta extras (`legacyId`, `createdAt`, `updatedAt`).
 */
import * as z from 'zod'

export const CoreApiActItemSchema = z.object({
  id: z.string().trim(),
  name: z.string().trim(),
  email: z.string().trim(), // core-api: z.string() (não z.email) — tolerante na borda
  cpf: z.string().trim(),
  occupationArea: z.string().trim(),
  role: z.string().trim(),
  startOfContract: z.string().trim(),
  employmentRelationship: z.string().trim(), // tolerante; normalizado p/ 'CLT'|'PJ' no mapper
  registrationStatus: z.enum(['PreRegistration', 'Complete']),
  active: z.boolean(),
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
