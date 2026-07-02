/**
 * Schema Zod dos search params do Consolidado ABC (HANDBOOK §2): Ano Base + Programa(s). Validação na
 * fronteira da rota (§IX), no mesmo padrão da lista de Planejamento. `programs` é multi-seleção (o legado
 * permite filtrar por vários programas) — serializado como CSV de abreviações.
 */
import * as z from 'zod'

/** Anos oferecidos no filtro (HANDBOOK §2: dropdown 2019–2026). */
export const CONSOLIDADO_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026] as const

export const ConsolidadoAbcFiltersSchema = z.object({
  year: z.coerce.number().int().min(2019).max(2026).catch(2026).default(2026),
  // CSV de programas (ex.: "ETI,PARC"). Mantido como STRING nos search params (o binding faz o split para
  // array) — evita conflito no tipo global de search do router quando um `transform` muda input≠output.
  programs: z.string().trim().max(120).optional(),
})
export type ConsolidadoAbcFilters = z.infer<typeof ConsolidadoAbcFiltersSchema>

/** CSV de programas → array de abreviações não-vazias (usado pelo binding/view-model, não pelo router). */
export const parseProgramsCsv = (csv: string | undefined): readonly string[] =>
  csv === undefined || csv.trim() === ''
    ? []
    : csv
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p !== '')
