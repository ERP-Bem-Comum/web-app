/**
 * Schema Zod do CLIENT — filtros da listagem de Usuários (search params da rota). Validação na
 * fronteira (§IX). Espelha o `ActListFiltersSchema`. pageSize ∈ {5,10,25}; status active|inactive|all.
 */
import * as z from 'zod'

export const UsersListFiltersSchema = z.object({
  search: z.string().trim().max(128).optional(),
  status: z.enum(['active', 'inactive', 'all']).catch('all').default('all'),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .transform((v): 5 | 10 | 25 => (v === 10 ? 10 : v === 25 ? 25 : 5))
    .catch(5)
    .default(5),
})
export type UsersListFilters = z.infer<typeof UsersListFiltersSchema>
