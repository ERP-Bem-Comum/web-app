/**
 * Schemas Zod do CLIENT — filtros da listagem de ACTs (search params da rota). Validação na fronteira
 * (§IX). O schema do FORMULÁRIO vive em `data/model`. Filtros do Acordo: busca, situação (ativo/inativo),
 * repasse financeiro (com/sem) e área de atuação.
 */
import * as z from 'zod'

import { OCCUPATION_AREAS } from '#modules/partners/client/data/model/act.model.ts'

export const ActListFiltersSchema = z.object({
  search: z.string().trim().max(120).optional(),
  active: z.boolean().or(z.enum(['true', 'false']).transform((v) => v === 'true')).optional(),
  hasFinancialTransfer: z
    .boolean()
    .or(z.enum(['true', 'false']).transform((v) => v === 'true'))
    .optional(),
  occupationArea: z.enum(OCCUPATION_AREAS).optional(),
  order: z.enum(['ASC', 'DESC']).default('ASC'),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).catch(5).default(5),
})
export type ActListFilters = z.infer<typeof ActListFiltersSchema>
