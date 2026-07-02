/**
 * ViewModel PURO (§XI) do Detalhe do plano — visões "Consolidado por Mês" (semestre Jan–Jun/Jul–Dez) e
 * "Por Rede" ("Consolidado dos parceiros": colunas = estados/municípios) — HANDBOOK §1.4.
 * Ambas transformam a árvore Centro→Categoria→Subcategoria numa matriz de linhas expansíveis + linha TOTAL,
 * no MESMO shape (`MatrixView`), então a view burra é uma só. Sem React/TanStack — testável por `node:test`.
 */
import type {
  PlanDetail,
  CostCenterConsolidated,
  CategoryConsolidated,
  SubCategoryConsolidated,
} from '#modules/budget-plans/client/data/model/plan-detail.model.ts'
import { formatCentsBRL } from '#modules/budget-plans/client/domain/calc/derive.ts'
import {
  deriveStatusView,
  type StatusView,
} from '#modules/budget-plans/client/planejamento/planejamento-list.view-model.ts'

/** Nomes dos 12 meses (cabeçalho da matriz), MAIÚSCULOS como no legado. */
export const MONTH_HEADERS = [
  'JANEIRO',
  'FEVEREIRO',
  'MARÇO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO',
] as const

export type Semester = 0 | 1

/** Janela de índices de mês por semestre: 0 → Jan–Jun (0..5), 1 → Jul–Dez (6..11). */
const windowFor = (s: Semester): readonly number[] => (s === 0 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11])

export type MatrixRow = Readonly<{
  id: number
  name: string
  depth: 0 | 1 | 2
  totalLabel: string
  cellLabels: readonly string[]
  children: readonly MatrixRow[]
}>

/**
 * Matriz consolidada pronta p/ a view. `kind` discrimina a visão:
 * - `month`: colunas = 6 meses do semestre (nav ‹ › habilitada);
 * - `network`: colunas = redes (sem nav).
 */
export type MatrixView = Readonly<{
  kind: 'month' | 'network'
  semester: Semester
  columnHeaders: readonly string[]
  rows: readonly MatrixRow[]
  total: Readonly<{ totalLabel: string; cellLabels: readonly string[] }>
}>

type CellsOf = (
  node: CostCenterConsolidated | CategoryConsolidated | SubCategoryConsolidated,
) => readonly number[]

const subToRow = (sub: SubCategoryConsolidated, cells: CellsOf): MatrixRow => ({
  id: sub.id,
  name: sub.name,
  depth: 2,
  totalLabel: formatCentsBRL(sub.totalInCents),
  cellLabels: cells(sub).map(formatCentsBRL),
  children: [],
})

const categoryToRow = (cat: CategoryConsolidated, cells: CellsOf): MatrixRow => ({
  id: cat.id,
  name: cat.name,
  depth: 1,
  totalLabel: formatCentsBRL(cat.totalInCents),
  cellLabels: cells(cat).map(formatCentsBRL),
  children: cat.subCategories.map((sub) => subToRow(sub, cells)),
})

/** Centro de custo: rótulo inclui a natureza (ex.: "Consultoria - A PAGAR"), como no legado. */
const costCenterToRow = (cc: CostCenterConsolidated, cells: CellsOf): MatrixRow => ({
  id: cc.id,
  name: `${cc.name} - ${cc.type}`,
  depth: 0,
  totalLabel: formatCentsBRL(cc.totalInCents),
  cellLabels: cells(cc).map(formatCentsBRL),
  children: cc.categories.map((cat) => categoryToRow(cat, cells)),
})

/** Constrói a matriz "Consolidado por Mês" para o semestre pedido. */
export const buildMonthlyMatrix = (detail: PlanDetail, semester: Semester): MatrixView => {
  const window = windowFor(semester)
  const start = semester === 0 ? 0 : 6
  const cells: CellsOf = (node) => window.map((i) => node.monthlyInCents[i] ?? 0)
  const totalPerMonth = window.map((i) =>
    detail.costCenters.reduce((acc, cc) => acc + (cc.monthlyInCents[i] ?? 0), 0),
  )
  return {
    kind: 'month',
    semester,
    columnHeaders: MONTH_HEADERS.slice(start, start + 6),
    rows: detail.costCenters.map((cc) => costCenterToRow(cc, cells)),
    total: {
      totalLabel: formatCentsBRL(detail.totalInCents),
      cellLabels: totalPerMonth.map(formatCentsBRL),
    },
  }
}

/** Constrói a matriz "Por Rede" (Consolidado dos parceiros): colunas = redes, MAIÚSCULAS como no legado. */
export const buildNetworkMatrix = (detail: PlanDetail): MatrixView => {
  const indices = detail.networks.map((_, i) => i)
  const cells: CellsOf = (node) => indices.map((i) => node.networkInCents[i] ?? 0)
  const totalPerNetwork = indices.map((i) =>
    detail.costCenters.reduce((acc, cc) => acc + (cc.networkInCents[i] ?? 0), 0),
  )
  return {
    kind: 'network',
    semester: 0,
    columnHeaders: detail.networks.map((n) => n.name.toLocaleUpperCase('pt-BR')),
    rows: detail.costCenters.map((cc) => costCenterToRow(cc, cells)),
    total: {
      totalLabel: formatCentsBRL(detail.totalInCents),
      cellLabels: totalPerNetwork.map(formatCentsBRL),
    },
  }
}

export type PlanDetailHeader = Readonly<{
  title: string
  status: StatusView
  totalLabel: string
}>

/** Cabeçalho do Detalhe: "{ano} {abrev} {versão}", badge de status e "Total Plano". */
export const derivePlanDetailHeader = (detail: PlanDetail): PlanDetailHeader => ({
  title: `${String(detail.year)} ${detail.programAbbreviation ?? detail.programName} ${detail.version.toFixed(1)}`,
  status: deriveStatusView(detail.status),
  totalLabel: formatCentsBRL(detail.totalInCents),
})
