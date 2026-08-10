/**
 * Schema Zod dos search params da lista de Planejamento (funil: Ano/Programa/Status + busca + paginação).
 * Validação na fronteira da rota (§IX). Espelha o padrão de `collaborator-list-filters.schema.ts`.
 * O `programId` é numérico (id do Programa); o `program` textual do funil resolve para id quando o
 * endpoint de programas existir — por ora o placeholder filtra por nome/abreviação.
 */
import * as z from 'zod'

import { BUDGET_PLAN_STATUS } from '#modules/budget-plans/client/data/model/enums.ts'

export const PlanejamentoListFiltersSchema = z.object({
  search: z.string().trim().max(120).optional(),
  year: z.coerce.number().int().min(2019).max(2026).optional(),
  program: z.string().trim().max(120).optional(),
  status: z.enum(BUDGET_PLAN_STATUS).optional(),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .catch(5)
    .default(5)
    .transform((n): 5 | 10 | 25 => (n === 10 ? 10 : n === 25 ? 25 : 5)),
})
export type PlanejamentoListFilters = z.infer<typeof PlanejamentoListFiltersSchema>

/** Anos oferecidos pelo funil (HANDBOOK §1.1: dropdown 2019–2026). */
export const FILTER_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026] as const
