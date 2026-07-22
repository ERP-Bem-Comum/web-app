/**
 * Realizado × Planejado — models do client (GET /reports/realized, #114). Espelham os tipos do server
 * (`reports.io.ts`), mas são LOCAIS da camada `client/data` (boundary §I — o client nunca importa
 * `server/domain`). O BFF entrega LINHAS ACHATADAS (uma por subcategoria folha); a ViewModel re-agrega.
 * Todos os valores em centavos inteiros (number); `month` já vem 0..11 (janeiro=0).
 */

/** Filtros de consulta do Realizado × Planejado. `year` obrigatório; os demais recortam a árvore. */
export type RealizedReportQuery = Readonly<{
  year: number
  programId?: string
  budgetPlanId?: string
  partnerStateId?: string
  partnerMunicipalityId?: string
}>

/** Célula mensal (janeiro=0). Valores em centavos inteiros. */
export type RealizedMonthCell = Readonly<{
  month: number
  planejadoCents: number
  realizadoCents: number
  provisionadoCents: number
}>

/**
 * Linha achatada — uma por subcategoria folha. Categoria sem subcategorias vem com `subcategoria: ''`.
 * `months` traz sempre as 12 células.
 */
export type RealizedBudgetRow = Readonly<{
  centroCusto: string
  categoria: string
  subcategoria: string
  months: readonly RealizedMonthCell[]
}>
