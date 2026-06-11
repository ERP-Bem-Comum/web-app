/**
 * Schema dos search params da rota /programas (type-safe). Tolerante: valores inválidos da URL caem no
 * default. O grid (print) tem só busca + paginação; `status`/`order` ficam disponíveis mas sem UI.
 */
import * as z from 'zod'

export const ProgramsListFiltersSchema = z.object({
  search: z.string().trim().min(1).optional(),
  status: z.enum(['ATIVO', 'INATIVO']).optional(),
  order: z.enum(['ASC', 'DESC']).default('ASC'),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  limit: z
    .union([z.literal(5), z.literal(10), z.literal(25)])
    .catch(5)
    .default(5),
})

export type ProgramsListFilters = z.infer<typeof ProgramsListFiltersSchema>
