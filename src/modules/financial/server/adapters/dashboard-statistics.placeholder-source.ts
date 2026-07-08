/**
 * ★ FONTE INTERINA das agregações CRUAS do Dashboard (core-api#112 ABERTO). Este é o ÚNICO ponto a trocar
 * quando o #112 entregar as agregações reais (SUM/GROUP-BY/TOP-N): substitui-se o literal abaixo por
 * `await client.getDashboardAggregations(token)` — a composição (`dashboard.composition.ts`) e o DTO NÃO mudam.
 *
 * Os valores placeholder foram MOVIDOS do client (antes hardcoded em `dashboard-summary.view-model.ts`):
 * as 4 métricas zeradas, as 2 séries mensais (escala REAIS), a distribuição por centro de custo e os
 * fornecedores sem contrato (mix over/at/within). Validados pelo schema Zod na BORDA (§IX) — mesmo schema
 * que validará a resposta do backend. Erro de parse trafega como VALOR (`server`), sem `throw` p/ fora (§II).
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type { DashboardAggregations } from '#modules/financial/server/domain/dashboard.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'
import { DashboardAggregationsSchema } from './core-api/dashboard.schema.ts'

// Agregação crua INTERINA (o formato do #112). Valores idênticos aos que o client montava — a UI não muda.
const PLACEHOLDER_AGGREGATIONS = {
  metrics: {
    // INTERINO: enquanto zerado, o valor já vem formatado; com o #112 virão cents/percent e a composição formata.
    expenses: { value: 'R$ 0,00', trendPercent: '0%' },
    revenue: { value: 'R$ 0,00', trendPercent: '0%' },
    topFinancier: { value: '0%', trendPercent: '0%' },
    topCostCenter: { value: 'R$ 0,00', trendPercent: '0%' },
  },
  // Séries mensais (valores em REAIS, escala de milhões — fiel ao eixo R$M do legado).
  monthlyForecast: [
    6_000_000, 9_000_000, 13_500_000, 9_500_000, 8_900_000, 16_500_000, 7_000_000, 9_500_000, 8_500_000,
    7_500_000, 9_500_000, 7_500_000,
  ],
  monthlyRealized: [
    4_200_000, 6_800_000, 10_900_000, 7_600_000, 6_900_000, 12_800_000, 5_400_000, 7_700_000, 6_600_000,
    5_900_000, 7_500_000, 6_000_000,
  ],
  // Distribuição por centro de custo (group-by), já rankeada; `valueCents` inteiro.
  costCenters: [
    { id: 'strategic', labelKey: 'dashboard.cost-center.slice.strategic', valueCents: 4_500_000 },
    { id: 'logistics', labelKey: 'dashboard.cost-center.slice.logistics', valueCents: 3_200_000 },
    { id: 'admin', labelKey: 'dashboard.cost-center.slice.admin', valueCents: 2_800_000 },
    { id: 'events', labelKey: 'dashboard.cost-center.slice.events', valueCents: 1_500_000 },
  ],
  // Fornecedores sem contrato (mix over/at/within perante o limite de R$ 10.000,00).
  suppliersWithoutContract: [
    { id: 'wee-travel', name: 'WEE TRAVEL', valorTotalCents: 1_298_185 },
    { id: 'a3-turismo', name: 'A3 TURISMO', valorTotalCents: 1_142_000 },
    { id: 'ana-sicilia', name: 'ANA SICILIA', valorTotalCents: 1_000_000 },
    { id: 'polo-moveis', name: 'POLO MOVEIS', valorTotalCents: 742_000 },
    { id: 'tecnovetti', name: 'TECNOVETTI', valorTotalCents: 435_000 },
    { id: 'associacao-bem-comum', name: 'Associação Bem Comum', valorTotalCents: 128_000 },
  ],
} as const

/**
 * Devolve as agregações cruas do Dashboard. INTERINO: lê o literal placeholder. Ao ligar o #112, trocar por
 * `client.getDashboardAggregations(token)`. Valida na borda (§IX); parse inválido → `server` (valor, §II).
 * `token` já preparado p/ o RBAC do backend real (hoje não usado).
 */
export const getDashboardAggregationsPlaceholder = (
  _token: string,
): Promise<Result<DashboardAggregations, FinancialError>> => {
  const parsed = DashboardAggregationsSchema.safeParse(PLACEHOLDER_AGGREGATIONS)
  return Promise.resolve(parsed.success ? ok(parsed.data) : err('server'))
}
