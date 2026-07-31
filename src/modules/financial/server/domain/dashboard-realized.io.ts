/**
 * I/O do BFF para o gráfico "Realizado × Previsto" do Dashboard (specs/096 · P3). O BFF orquestra DOIS
 * endpoints do core-api: o realized dos relatórios (série de 12 meses de UM plano, por `budgetPlanId` +
 * ano) e a lista de planos aprovados vigentes do ano. Entrega ao client a série pronta (`DashboardChart`,
 * mesma forma que a `LineChart` já consome) + as opções do dropdown.
 *
 * "Todos (somados)" = fan-out (1 realized por plano) somando as 12 posições, no BFF (§III: o client não
 * compõe). Números em CENTAVOS no core-api → REAIS na composição (escala do eixo Y). Erros como valores.
 */
import type { DashboardChart } from './dashboard.io.ts'

/** Opção do dropdown = um plano aprovado vigente (o "Todos (somados)" é sintetizado no client). */
export type DashboardPlanOption = Readonly<{
  /** UUID do plano (vira `budgetPlanId` na chamada realized). */
  id: string
  /** Rótulo já pronto p/ apresentação (ex.: "ABC · v1.0"). */
  label: string
}>

/** Seleção do gráfico: todos os aprovados somados (padrão) ou um plano específico. */
export type RealizedSelection = Readonly<{ kind: 'all' }> | Readonly<{ kind: 'plan'; budgetPlanId: string }>

/** Entrada do use-case: ano comparado + seleção. */
export type DashboardRealizedInput = Readonly<{
  year: number
  selection: RealizedSelection
}>

/** Série CRUA de 1 plano (o que o `/reports/dashboard/realized` entrega — centavos). Ordem = meses 0..11. */
export type RealizedPoint = Readonly<{ month: number; expectedCents: number; realizedCents: number }>

/** Resposta do BFF ao client: opções do dropdown + a série pronta + flag de vazio (sem plano aprovado). */
export type DashboardRealizedResult = Readonly<{
  options: readonly DashboardPlanOption[]
  chart: DashboardChart
  /** `true` quando não há plano aprovado vigente no ano (chart zerado, estado vazio na View). */
  empty: boolean
}>
