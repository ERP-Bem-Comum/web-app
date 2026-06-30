/**
 * Schemas Zod do CLIENT — filtros da listagem de Colaboradores (search params da rota). Validação na
 * fronteira (§IX). O schema do FORMULÁRIO vive em `data/model`. Espelha `act.schemas.ts`.
 * Nota: o input do servidor de colaboradores NÃO tem `order`; `limit` é restrito a 5|10|25.
 */
import * as z from 'zod'

export const CollaboratorListFiltersSchema = z.object({
  search: z.string().trim().max(120).optional(),
  active: z
    .boolean()
    .or(z.enum(['true', 'false']).transform((v) => v === 'true'))
    .optional(),
  status: z.enum(['pre-registration', 'complete']).optional(),
  // Filtros do painel (legado) suportados pelo backend — singulares na URL, mapeados p/ arrays na query.
  area: z.enum(['PARC', 'DDI', 'DCE', 'EPV']).optional(),
  employment: z.enum(['CLT', 'PJ']).optional(),
  role: z.string().trim().max(120).optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .catch(5)
    .default(5)
    .transform((n): 5 | 10 | 25 => (n === 10 ? 10 : n === 25 ? 25 : 5)),
})
export type CollaboratorListFilters = z.infer<typeof CollaboratorListFiltersSchema>
