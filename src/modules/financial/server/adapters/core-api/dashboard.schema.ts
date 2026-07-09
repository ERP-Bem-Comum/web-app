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
