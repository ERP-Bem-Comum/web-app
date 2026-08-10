/**
 * Schema Zod dos search params do Consolidado ABC (HANDBOOK §2): Ano Base + Programa. Validação na fronteira
 * da rota (§IX). O endpoint real filtra por UM programa (uuid opcional) — o filtro é single-select por `ref`.
 * `.catch` deixa a rota tolerante a valores inválidos na URL (cai no default sem quebrar a navegação).
 */
import * as z from 'zod'

/** Anos oferecidos no filtro (HANDBOOK §2: dropdown 2019–2026). */
export const CONSOLIDADO_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026] as const

export const ConsolidadoAbcFiltersSchema = z.object({
  year: z.coerce.number().int().min(2019).max(2026).catch(2026).default(2026),
  // Referência (uuid) do programa selecionado; ausente = Todos os programas.
  programRef: z.uuid().optional().catch(undefined),
})
export type ConsolidadoAbcFilters = z.infer<typeof ConsolidadoAbcFiltersSchema>
