/**
 * Zod dos responses do core-api `/api/v1/collaborators/*` (boundary §VI). Valida o que entra do backend
 * antes de virar Model. Shape modelado a partir do contrato conhecido; confirmar contra `GET /docs/json`.
 * `.loose()` no detalhe tolera os ~27 campos completos (mapeados conforme expandir).
 */
import * as z from 'zod'

export const CoreApiCollaboratorItemSchema = z.object({
  id: z.string().trim(),
  name: z.string().trim(),
  email: z.string().trim(),
  occupationArea: z.enum(['PARC', 'DDI', 'DCE', 'EPV']),
  role: z.string().trim(),
  status: z.enum(['PreRegistration', 'Complete']),
  active: z.boolean(),
})
export type CoreApiCollaboratorItem = z.infer<typeof CoreApiCollaboratorItemSchema>

export const CoreApiCollaboratorListSchema = z.object({
  items: z.array(CoreApiCollaboratorItemSchema),
  meta: z.object({ page: z.int(), limit: z.int(), total: z.int() }),
})

export const CoreApiCollaboratorDetailSchema = CoreApiCollaboratorItemSchema.extend({
  cpf: z.string().trim(),
  startOfContract: z.string().trim(),
  employmentRelationship: z.enum(['CLT', 'PJ']),
}).loose()
export type CoreApiCollaboratorDetail = z.infer<typeof CoreApiCollaboratorDetailSchema>

// Resposta do import em lote: relatório parcial (sempre 200).
export const CoreApiImportResultSchema = z.object({
  created: z.int(),
  failed: z.array(z.object({ line: z.int(), error: z.string().trim() })),
})
