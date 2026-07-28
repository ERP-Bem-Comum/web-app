/**
 * Fluxo de Caixa — model do client (GET /reports/cashflow + /cashflow/chart, #590). Espelha os tipos do server
 * (`reports.io.ts`): as SAÍDAS (payables) agregadas por Categoria × Subcategoria em 2 medidas (realizado/
 * previsto) em CENTAVOS (number, §IV); `chart` é a mesma agregação com o eixo de mês (`dueMonth` = `YYYY-MM`).
 * `receivables` é SEMPRE `[]` (financial é payables-centric). SEM eixo de Centro de Custo (CC é filtro, não
 * dimensão de saída). Arquivo NEUTRO de `client/data` (boundary §I).
 */
export type CashflowRow = Readonly<{
  categoryRef: string | null
  categoryName: string | null
  subcategoryRef: string | null
  subcategoryName: string | null
  realizedCents: number
  expectedCents: number
}>

export type CashflowChartRow = CashflowRow & Readonly<{ dueMonth: string }>

export type CashflowReport = Readonly<{
  payables: readonly CashflowRow[]
  receivables: readonly CashflowRow[]
  chart: readonly CashflowChartRow[]
}>

/**
 * Filtros de consulta do Fluxo de Caixa (#590). TODOS opcionais, combinados por AND no servidor. `dueFrom`/
 * `dueTo` = janela HALF-OPEN [dueFrom, dueTo) em `YYYY-MM-DD`. `costCenterId` restringe a população (não é eixo).
 */
export type CashflowFilter = Readonly<{
  programId?: string
  budgetPlanId?: string
  dueFrom?: string
  dueTo?: string
  accountId?: string
  costCenterId?: string
  categoryId?: string
  subCategoryId?: string
  entityId?: string
  status?: string
}>
