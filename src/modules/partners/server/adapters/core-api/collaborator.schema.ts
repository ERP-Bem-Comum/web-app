/**
 * Zod dos responses do core-api `/api/v1/collaborators/*` (boundary §VI). Valida o que entra do backend
 * antes de virar Model. Shapes alinhados ao contrato REAL (schemas.ts do core-api): `occupationArea` é
 * string (valores legados possíveis), paginação é a meta legada nestjs-typeorm-paginate. `.strip()` (default
 * Zod) descarta extras — não usar `.loose()` (vazaria PII não validada).
 */
import * as z from 'zod'

export const CoreApiCollaboratorItemSchema = z.object({
  id: z.string().trim(),
  name: z.string().trim(),
  email: z.email(),
  occupationArea: z.string().trim(),
  role: z.string().trim(),
  status: z.enum(['PreRegistration', 'Complete']),
  active: z.boolean(),
})
export type CoreApiCollaboratorItem = z.infer<typeof CoreApiCollaboratorItemSchema>

// Paginação legada do core-api (nestjs-typeorm-paginate) — mapeada p/ { page, limit, total } no Model.
export const CoreApiPaginationMetaSchema = z.object({
  itemCount: z.int(),
  totalItems: z.int(),
  itemsPerPage: z.int(),
  totalPages: z.int(),
  currentPage: z.int(),
})

export const CoreApiCollaboratorListSchema = z.object({
  items: z.array(CoreApiCollaboratorItemSchema),
  meta: CoreApiPaginationMetaSchema,
})

// Detalhe: campos básicos validados; extras descartados (strip). Os ~27 campos completos serão adicionados
// explicitamente quando a UI de detalhe os consumir (sem abrir o objeto inteiro).
export const CoreApiCollaboratorDetailSchema = CoreApiCollaboratorItemSchema.extend({
  cpf: z.string().trim(),
  startOfContract: z.string().trim(),
  employmentRelationship: z.enum(['CLT', 'PJ']),
})
export type CoreApiCollaboratorDetail = z.infer<typeof CoreApiCollaboratorDetailSchema>

// Resposta do import em lote: relatório parcial (sempre 200).
export const CoreApiImportResultSchema = z.object({
  created: z.int(),
  failed: z.array(z.object({ line: z.int(), error: z.string().trim() })),
})
