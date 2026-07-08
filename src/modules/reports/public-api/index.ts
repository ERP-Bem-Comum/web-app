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

// ── Relatório "Equipe ABC" (front-first; core-api#114/#112). Dados SINTÉTICOS/anonimizados (LGPD). ──
export { EquipePage } from '#modules/reports/client/page/equipe.page.tsx'

export {
  loadTeam,
  total as equipeTotal,
  byGenero,
  byRacaCor,
  byFaixaEtaria,
  byAnoContrato,
  byFuncao,
  buildCsv as buildEquipeCsv,
  formatSharePercent,
  CSV_HEADER as EQUIPE_CSV_HEADER,
  GENERO_ORDER,
  RACA_ORDER,
  FAIXA_ETARIA_LABELS,
  ANOS,
} from '#modules/reports/client/equipe.view-model.ts'
export type { TeamMemberRow, CategoryCount, YearCount } from '#modules/reports/client/equipe.view-model.ts'

// ── Relatório "Posição de Pagamentos" (front-first; core-api#114). Engine de "Posição" REUTILIZÁVEL:
//    quando o Contas a Receber subir, `loadPosicao('r')` renderiza "Posição de Recebíveis" com a mesma
//    tabela/agregação (só a fonte + rótulos de nível mudam). Dados SINTÉTICOS até o endpoint nascer. ──
export { PosicaoPagamentosPage } from '#modules/reports/client/page/posicao-pagamentos.page.tsx'
// "Posição de Recebimentos": ESPELHO da de Pagamentos (mesmo engine/tela; fonte 'r' + rótulos Financiador/
// Recebido/A receber). Empty-state-ready: quando o Contas a Receber subir, some o placeholder e cai no vazio.
export { PosicaoRecebimentosPage } from '#modules/reports/client/page/posicao-recebimentos.page.tsx'

export {
  aggregatePosicao,
  loadPosicao,
  buildCsv as buildPosicaoCsv,
  formatBRL as formatPosicaoBRL,
  CSV_HEADER as POSICAO_CSV_HEADER,
  CSV_HEADER_RECEBIMENTOS as POSICAO_RECEBIMENTOS_CSV_HEADER,
} from '#modules/reports/client/posicao.view-model.ts'
export type {
  PosicaoLevel,
  PosicaoMeasures,
  PosicaoNode,
  PosicaoReport,
  PosicaoType,
} from '#modules/reports/client/posicao.view-model.ts'

// ── Relatório "Análise de Pagamentos" (front-first; core-api#114/consolidated). Matriz TEMPO-orçamentária:
//    árvore Plano Orçamentário → Centro de Custo × série MENSAL de valores. Engine plugável: quando o Contas a
//    Receber subir, `loadAnalise('r')` renderiza a "Análise de Recebimentos" (espelho vazio → empty state). ──
export { AnalisePagamentosPage } from '#modules/reports/client/page/analise-pagamentos.page.tsx'

export {
  aggregateAnalise,
  monthsInRange,
  formatMonthLabel,
  totalByCostCenter,
  totalByMonth,
  loadAnalise,
  buildCsv as buildAnaliseCsv,
  buildCsvHeader as buildAnaliseCsvHeader,
  formatBRL as formatAnaliseBRL,
  formatBRLShort as formatAnaliseBRLShort,
  formatPercent as formatAnalisePercent,
  sharePercent as analiseSharePercent,
  CSV_HEADER_BASE as ANALISE_CSV_HEADER_BASE,
  MONTH_ABBR_PT,
} from '#modules/reports/client/analise.view-model.ts'
export type {
  AnaliseLevel,
  AnaliseNode,
  AnaliseReport,
  AnaliseType,
  CostCenterTotal,
  MonthTotal,
} from '#modules/reports/client/analise.view-model.ts'
