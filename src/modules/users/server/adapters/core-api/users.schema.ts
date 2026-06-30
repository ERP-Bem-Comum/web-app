/**
 * Zod dos responses do core-api `/api/v1/users` (boundary §VI). Valida o que entra do backend antes de
 * virar Model. Shape alinhado ao contrato REAL (`users-schemas.ts` do core-api): item
 * `{ id, name|null, email, status: active|disabled }` + meta de paginação harmonizada (igual partners).
 */
import * as z from 'zod'

export const CoreApiUserItemSchema = z.object({
  id: z.string().trim(),
  name: z.string().trim().nullable(),
  email: z.string().trim(),
  status: z.enum(['active', 'disabled']),
})
export type CoreApiUserItem = z.infer<typeof CoreApiUserItemSchema>

export const CoreApiUserPaginationMetaSchema = z.object({
  currentPage: z.int(),
  itemsPerPage: z.int(),
  itemCount: z.int(),
  totalItems: z.int(),
  totalPages: z.int(),
})

export const CoreApiUserListSchema = z.object({
  items: z.array(CoreApiUserItemSchema),
  meta: CoreApiUserPaginationMetaSchema,
})

// Response 201 do POST /api/v1/users — { id }.
export const CoreApiCreatedUserSchema = z.object({ id: z.string().trim() })

// Response 200 do GET /api/v1/users/:id (detalhe) — também devolvido por PUT e PATCH activate/deactivate.
export const CoreApiUserDetailSchema = z.object({
  id: z.string().trim(),
  name: z.string().trim().nullable(),
  email: z.string().trim(),
  cpf: z.string().trim().nullable(),
  telephone: z.string().trim().nullable(),
  imageUrl: z.string().trim().nullable(),
  active: z.boolean(),
  massApprovalPermission: z.boolean(),
  collaboratorId: z.string().trim().nullable(),
})
export type CoreApiUserDetail = z.infer<typeof CoreApiUserDetailSchema>
