/**
 * Schemas Zod do CLIENT — filtros da listagem de ACTs (search params da rota). Validação na fronteira
 * (§IX). O schema do FORMULÁRIO vive em `data/model`. Espelha o `FinancierListFiltersSchema`.
 */
import * as z from 'zod'

export const ActListFiltersSchema = z.object({
  search: z.string().trim().max(120).optional(),
  active: z.boolean().or(z.enum(['true', 'false']).transform((v) => v === 'true')).optional(),
  order: z.enum(['ASC', 'DESC']).default('ASC'),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).catch(5).default(5),
})
export type ActListFilters = z.infer<typeof ActListFiltersSchema>
