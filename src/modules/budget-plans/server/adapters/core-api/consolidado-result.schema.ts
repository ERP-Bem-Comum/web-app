/**
 * Zod da BORDA (§IX) para a resposta do core-api `GET /budget-plans/consolidated-result`. O anti-corrupção
 * mora aqui: valida o DTO cru e o mapeia para `ConsolidatedAbc` (o `totalCents` do core vira `totalInCents`
 * no domínio). Valores em centavos (§IV). `version` é tolerante (z.number()) — o core pode entregar um
 * inteiro ou um decimal de cenário sem quebrar a leitura.
 */
import * as z from 'zod'

import type { ConsolidatedAbc } from '#modules/budget-plans/server/domain/consolidado-abc.io.ts'

const PlanSchema = z.object({
  id: z.uuid(),
  programName: z.string().trim(),
  programAbbreviation: z.string().trim(),
  version: z.number(),
  totalCents: z.int(),
})

export const ConsolidatedResultSchema = z.object({
  year: z.int(),
  totalCents: z.int(),
  plans: z.array(PlanSchema),
})

/** Parseia (borda) um payload desconhecido no `ConsolidatedAbc`. Falha → `null` (o caller mapeia p/ erro-valor). */
export const parseConsolidatedResult = (raw: unknown): ConsolidatedAbc | null => {
  const parsed = ConsolidatedResultSchema.safeParse(raw)
  if (!parsed.success) return null
  return {
    year: parsed.data.year,
    totalInCents: parsed.data.totalCents,
    plans: parsed.data.plans.map((p) => ({
      id: p.id,
      programName: p.programName,
      programAbbreviation: p.programAbbreviation,
      version: p.version,
      totalInCents: p.totalCents,
    })),
  }
}
