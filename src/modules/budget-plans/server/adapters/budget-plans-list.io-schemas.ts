/**
 * Schema Zod da BORDA (§IX) do input da server fn da lista de Planejamento. O input do client NUNCA é
 * confiável: page/limit + filtros que o core-api da Fatia 1 suporta (year/status). `program`/busca textual
 * entram quando o filtro passar a mandar `programRef` / o core expuser busca (fatia de options).
 */
import * as z from 'zod'

const statusSchema = z.enum(['RASCUNHO', 'EM_CALIBRACAO', 'APROVADO'])

export const ListBudgetPlansInputSchema = z.object({
  page: z.int().positive().default(1),
  limit: z.int().positive().max(100).default(5),
  year: z.int().optional(),
  status: statusSchema.optional(),
})

export type ListBudgetPlansInput = z.infer<typeof ListBudgetPlansInputSchema>
