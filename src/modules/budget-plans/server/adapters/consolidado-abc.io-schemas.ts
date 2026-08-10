/**
 * Schema Zod da BORDA (§IX) das server fns do Consolidado ABC (leitura + export CSV). O input do client NUNCA
 * é confiável: `year` inteiro (obrigatório) + `programRef` (uuid, opcional) — espelha o filtro da tela
 * (Ano Base × Programa). `z.uuid` é RFC-strict.
 */
import * as z from 'zod'

export const ConsolidadoAbcQuerySchema = z.object({
  year: z.int(),
  programRef: z.uuid().optional(),
})

export type ConsolidadoAbcQueryInput = z.infer<typeof ConsolidadoAbcQuerySchema>
