/**
 * Zod da resposta CRUA de agregações do Dashboard (boundary §IX). É a forma que o **core-api#112**
 * (SUM/GROUP-BY/TOP-N) entregará — hoje valida o literal da fonte placeholder. Ao ligar o #112, o mesmo
 * schema valida a resposta real do backend antes de virar `DashboardAggregations` (a composição não muda).
 * O `output` é assinável a `DashboardAggregations` (domínio) — a fonte faz o `parse` na borda.
 */
import * as z from 'zod'

const RawMetricSchema = z.object({
  value: z.string().trim(),
  trendPercent: z.string().trim(),
})

export const DashboardAggregationsSchema = z.object({
  metrics: z.object({
    expenses: RawMetricSchema,
    revenue: RawMetricSchema,
    topFinancier: RawMetricSchema,
    topCostCenter: RawMetricSchema,
  }),
  monthlyForecast: z.array(z.number()),
  monthlyRealized: z.array(z.number()),
  costCenters: z.array(
    z.object({
      id: z.string().trim(),
      labelKey: z.string().trim(),
      valueCents: z.int().min(0),
    }),
  ),
  suppliersWithoutContract: z.array(
    z.object({
      id: z.string().trim(),
      name: z.string().trim(),
      valorTotalCents: z.int().min(0),
    }),
  ),
})

export type CoreApiDashboardAggregations = z.infer<typeof DashboardAggregationsSchema>

// ── Resposta REAL de /financial/dashboard/cost-centers (#241 + motor #237) ──────────────────────
// Boundary tolerante (§IX): NÃO usa `.strict()` — campo novo do backend não deve quebrar o consumo.
// `percentage` da variação é a união discriminada do domínio (variation.ts), serializada como está.
const CostCenterVariationPercentSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('value'), percent: z.number() }),
  z.object({ kind: z.literal('no-change') }),
  z.object({ kind: z.literal('new') }),
])

export const DashboardCostCentersResponseSchema = z.object({
  totalExpenses: z.number(),
  variation: z.object({
    absoluteCents: z.number(),
    percentage: CostCenterVariationPercentSchema,
  }),
  topCostCenter: z
    .object({
      ref: z.string().trim().nullable(),
      name: z.string().trim().nullable(),
      totalCents: z.number(),
    })
    .nullable(),
  distribution: z.array(
    z.object({
      ref: z.string().trim().nullable(),
      name: z.string().trim().nullable(),
      totalCents: z.number(),
      percentage: z.number(),
    }),
  ),
})

export type CoreApiDashboardCostCenters = z.infer<typeof DashboardCostCentersResponseSchema>

// ── Resposta REAL de /financial/dashboard/no-contract-suppliers (#242) ──────────────────────────
// Top-5 fornecedores sem contrato por total pago (rank do backend). Boundary tolerante (sem .strict).
export const DashboardNoContractSuppliersResponseSchema = z.object({
  suppliers: z.array(
    z.object({
      supplierRef: z.string().trim(),
      name: z.string().trim().nullable(),
      totalCents: z.number(),
    }),
  ),
})

export type CoreApiDashboardNoContractSuppliers = z.infer<typeof DashboardNoContractSuppliersResponseSchema>
