/**
 * Zod da BORDA (§IX) para a resposta FUTURA do core-api `GET /budget-plans/consolidated-result`. Enquanto o
 * endpoint não existe, o schema serve para (a) validar a FONTE placeholder contra o contrato e (b) parsear a
 * resposta real quando ela chegar — troca-se só a origem, o serializador permanece. Valores em centavos (§IV).
 */
import * as z from 'zod'

import type { ConsolidatedAbc } from '#modules/budget-plans/server/domain/consolidado-abc.io.ts'

const MonthlyCentsSchema = z.array(z.int()).length(12)

const SubCategorySchema = z.object({
  name: z.string().trim(),
  totalInCents: z.int(),
  monthlyInCents: MonthlyCentsSchema,
})

const CategorySchema = z.object({
  name: z.string().trim(),
  totalInCents: z.int(),
  monthlyInCents: MonthlyCentsSchema,
  subCategories: z.array(SubCategorySchema),
})

const CostCenterSchema = z.object({
  name: z.string().trim(),
  totalInCents: z.int(),
  monthlyInCents: MonthlyCentsSchema,
  categories: z.array(CategorySchema),
})

export const ConsolidatedResultSchema: z.ZodType<ConsolidatedAbc> = z.object({
  year: z.int(),
  totalInCents: z.int(),
  subtotalsByProgram: z.array(z.object({ program: z.string().trim(), totalInCents: z.int() })),
  costCenters: z.array(CostCenterSchema),
})

/** Parseia (borda) um payload desconhecido no `ConsolidatedAbc`. Falha → `null` (o caller mapeia p/ erro-valor). */
export const parseConsolidatedResult = (raw: unknown): ConsolidatedAbc | null => {
  const parsed = ConsolidatedResultSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}
