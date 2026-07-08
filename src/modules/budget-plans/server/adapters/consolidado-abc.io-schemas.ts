/**
 * Schemas Zod da BORDA (§IX) da server fn de export do Consolidado ABC. O input do client NUNCA é confiável:
 * `year` inteiro + `programs` (0..N abreviações). Espelha o filtro da tela (Ano Base × Programa).
 */
import * as z from 'zod'

export const ExportConsolidadoAbcInputSchema = z.object({
  year: z.int(),
  programs: z.array(z.string().trim()).default([]),
})

export type ExportConsolidadoAbcInput = z.infer<typeof ExportConsolidadoAbcInputSchema>
