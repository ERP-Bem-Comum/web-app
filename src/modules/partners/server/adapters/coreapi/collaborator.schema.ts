/**
 * Zod dos responses do core-api `/api/v1/collaborators/*` (boundary §VI).
 * ⚠️ Pasta `coreapi/` (não `core-api/`) por um contorno temporário: a regra de permissão
 * `Write(./core-api/**)` do settings.json casa o segmento `core-api/` em qualquer profundidade e
 * bloqueia a subpasta idiomática `adapters/core-api/`. Renomear para `core-api/` quando o glob for
 * ancorado na raiz. Shape modelado a partir do contrato conhecido; confirmar contra `GET /docs/json`.
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
