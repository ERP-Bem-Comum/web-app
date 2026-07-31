/**
 * Zod de borda (§IX) das respostas que alimentam o gráfico "Realizado × Previsto" (specs/096 · P3):
 *   - `GET /reports/dashboard/realized` → série de 12 meses de UM plano (centavos).
 *   - `GET /budget-plans?status=APROVADO&year=` → planos aprovados vigentes (só os campos do dropdown).
 * Boundary TOLERANTE (sem `.strict()`): campo novo do backend não quebra o consumo. Parse inválido vira
 * valor (`server`) nos mappers, nunca `throw` p/ fora.
 */
import * as z from 'zod'

// ── /reports/dashboard/realized ─────────────────────────────────────────────────
const RealizedPointSchema = z.object({
  month: z.int(),
  expectedCents: z.number(),
  realizedCents: z.number(),
})

export const RealizedResponseSchema = z.object({
  budgetPlanId: z.string().trim(),
  year: z.int(),
  chart: z.array(RealizedPointSchema),
})

export type CoreApiRealizedResponse = z.infer<typeof RealizedResponseSchema>

// ── /budget-plans?status=APROVADO&year= (subset p/ o dropdown) ──────────────────
const ApprovedPlanItemSchema = z.object({
  id: z.string().trim(),
  year: z.int(),
  status: z.string().trim(),
  version: z.string().trim(),
  programName: z.string().trim(),
  // `parentId` != null = CENÁRIO (versão-filha) — excluído da soma p/ não duplicar o plano-pai.
  parentId: z.string().trim().nullable().optional(),
})

export const ApprovedPlansResponseSchema = z.object({
  items: z.array(ApprovedPlanItemSchema),
  total: z.int().nonnegative(),
})

export type CoreApiApprovedPlansResponse = z.infer<typeof ApprovedPlansResponseSchema>
