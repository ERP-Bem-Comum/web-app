/**
 * Public API do módulo Relatórios — ÚNICO ponto pelo qual as rotas/outros módulos consomem (ADR-0004).
 * Fatia atual (relatório "Fornecedores sem Contrato", front-first): a página + a ViewModel pura (agregação,
 * matemática do limite, formatação, CSV). Server functions entram quando o endpoint do core-api (#114) nascer.
 */
export { SuppliersWithoutContractPage } from '#modules/reports/client/page/suppliers-without-contract.page.tsx'

export {
  aggregateSuppliers,
  formatBRL,
  formatPercent,
  buildCsv,
  parseLimiteToCents,
  formatLimiteInput,
  LIMITE_DEFAULT_CENTS,
} from '#modules/reports/client/suppliers-without-contract.view-model.ts'
export type {
  SupplierRow,
  BudgetPlanRow,
} from '#modules/reports/client/suppliers-without-contract.view-model.ts'

// ── Relatório "Realizado × Planejado" (front-first; core-api#114) ──
export { RealizadoXPlanejadoPage } from '#modules/reports/client/page/realizado-x-planejado.page.tsx'

export {
  aggregateBudgetTree,
  grandTotal,
  computeAvPct,
  planejadoByCentroCusto,
  topCentroCustoByPlanejado,
  planejadoByMonth,
  realizadoVsPrevisto,
  buildCsv as buildRealizadoCsv,
  formatBRL as formatRealizadoBRL,
  formatBRLShort,
  formatPercent as formatRealizadoPercent,
  sharePercent,
  loadBudgetTree,
  MONTH_NAMES_PT,
} from '#modules/reports/client/realizado-x-planejado.view-model.ts'
export type {
  BudgetTreeRow,
  BudgetDepth,
  Measures,
  MonthMeasures,
  GrandTotal,
  ChartSlice,
  MonthBar,
} from '#modules/reports/client/realizado-x-planejado.view-model.ts'
