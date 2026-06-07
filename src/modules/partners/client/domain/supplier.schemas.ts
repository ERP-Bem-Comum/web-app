/**
 * Schemas Zod do CLIENT — filtros da listagem (search params da rota). Validação na fronteira (§IX).
 * O schema do FORMULÁRIO vive em `data/model` (consumido pelo controller, que não pode importar domain).
 */
import * as z from 'zod'

export const SupplierListFiltersSchema = z.object({
  search: z.string().trim().max(120).optional(),
  active: z.coerce.boolean().optional(),
  categories: z.array(z.string().trim().max(80)).optional(),
  order: z.enum(['ASC', 'DESC']).default('ASC'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(5),
})
export type SupplierListFilters = z.infer<typeof SupplierListFiltersSchema>
