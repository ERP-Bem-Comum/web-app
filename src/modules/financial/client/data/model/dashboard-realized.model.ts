/**
 * Model do client p/ o gráfico "Realizado × Previsto" do Dashboard (specs/096 · P3). Espelha o
 * `DashboardRealizedResult` do server (`dashboard-realized.io.ts`): opções do dropdown (planos aprovados
 * vigentes) + a série pronta (`DashboardChart`, reusa o do summary) + flag de vazio. Arquivo NEUTRO da
 * camada `client/data` (boundary §I). A série já vem em REAIS; o BFF compõe (o client só consome).
 */
import type { DashboardChart } from './dashboard-statistics.model.ts'

export type DashboardPlanOption = Readonly<{ id: string; label: string }>

/** Seleção do gráfico: todos os aprovados somados (padrão) ou 1 plano específico. */
export type RealizedSelection = Readonly<{ kind: 'all' }> | Readonly<{ kind: 'plan'; budgetPlanId: string }>

/** Input da server fn (ano comparado + seleção). */
export type DashboardRealizedInput = Readonly<{
  year: number
  selection: RealizedSelection
}>

export type DashboardRealizedResult = Readonly<{
  options: readonly DashboardPlanOption[]
  chart: DashboardChart
  empty: boolean
}>
