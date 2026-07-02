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
  MatrixIconKind,
} from '#modules/budget-plans/client/data/model/plan-detail.model.ts'

/** Re-export p/ a view burra consumir o tipo do ícone SEM furar o boundary client-ui ↛ client-data. */
export type { MatrixIconKind } from '#modules/budget-plans/client/data/model/plan-detail.model.ts'
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

/** Opção de filtro (Estado/Município) da barra de Detalhe. */
export type RegionOption = Readonly<{ value: string; label: string }>

/**
 * Estados/Municípios do filtro por Rede — front-first placeholder. Quando o #113 existir, estas listas
 * virão dos PARCEIROS do plano (redes cadastradas), não de um mapa fixo.
 */
export const PLAN_FILTER_ESTADOS: readonly RegionOption[] = [
  { value: 'CE', label: 'Ceará' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'AC', label: 'Acre' },
]

const MUNICIPIOS_BY_ESTADO: Readonly<Record<string, readonly RegionOption[]>> = {
  CE: [
    { value: 'fortaleza', label: 'Fortaleza' },
    { value: 'caucaia', label: 'Caucaia' },
    { value: 'sobral', label: 'Sobral' },
  ],
  SP: [
    { value: 'sao-paulo', label: 'São Paulo' },
    { value: 'campinas', label: 'Campinas' },
  ],
  AC: [{ value: 'rio-branco', label: 'Rio Branco' }],
}

/** Municípios de um estado (vazio se estado não escolhido/desconhecido). */
export const municipiosForEstado = (estado: string): readonly RegionOption[] =>
  MUNICIPIOS_BY_ESTADO[estado] ?? []

/** Janela de índices de mês por semestre: 0 → Jan–Jun (0..5), 1 → Jul–Dez (6..11). */
const windowFor = (s: Semester): readonly number[] => (s === 0 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11])

export type MatrixRow = Readonly<{
  id: number
  name: string
  depth: 0 | 1 | 2
  totalLabel: string
  cellLabels: readonly string[]
  children: readonly MatrixRow[]
  /** Ícone semântico da linha (mock); ausente ⇒ a view usa o padrão por profundidade. */
  iconKind?: MatrixIconKind
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

export type CellsOf = (
  node: CostCenterConsolidated | CategoryConsolidated | SubCategoryConsolidated,
) => readonly number[]

/** Propaga a dica de ícone só quando presente (respeita `exactOptionalPropertyTypes`). */
const iconOf = (kind: MatrixIconKind | undefined): { iconKind?: MatrixIconKind } =>
  kind !== undefined ? { iconKind: kind } : {}

const subToRow = (sub: SubCategoryConsolidated, cells: CellsOf): MatrixRow => ({
  id: sub.id,
  name: sub.name,
  depth: 2,
  totalLabel: formatCentsBRL(sub.totalInCents),
  cellLabels: cells(sub).map(formatCentsBRL),
  children: [],
  ...iconOf(sub.iconKind),
})

const categoryToRow = (cat: CategoryConsolidated, cells: CellsOf): MatrixRow => ({
  id: cat.id,
  name: cat.name,
  depth: 1,
  totalLabel: formatCentsBRL(cat.totalInCents),
  cellLabels: cells(cat).map(formatCentsBRL),
  children: cat.subCategories.map((sub) => subToRow(sub, cells)),
  ...iconOf(cat.iconKind),
})

/** Centro de custo: rótulo inclui a natureza (ex.: "Consultoria - A PAGAR"), como no legado. */
export const costCenterToRow = (cc: CostCenterConsolidated, cells: CellsOf): MatrixRow => ({
  id: cc.id,
  name: `${cc.name} - ${cc.type}`,
  depth: 0,
  totalLabel: formatCentsBRL(cc.totalInCents),
  cellLabels: cells(cc).map(formatCentsBRL),
  children: cc.categories.map((cat) => categoryToRow(cat, cells)),
  ...iconOf(cc.iconKind),
})

/**
 * Núcleo compartilhado da matriz "Por Mês": recebe os centros de custo + total já consolidados e monta a
 * `MatrixView` para o semestre pedido. Reusável pelo Detalhe (1 plano) E pelo Consolidado ABC (multi-plano).
 */
export const buildMonthlyMatrixFrom = (
  costCenters: readonly CostCenterConsolidated[],
  totalInCents: number,
  semester: Semester,
): MatrixView => {
  const window = windowFor(semester)
  const start = semester === 0 ? 0 : 6
  const cells: CellsOf = (node) => window.map((i) => node.monthlyInCents[i] ?? 0)
  const totalPerMonth = window.map((i) =>
    costCenters.reduce((acc, cc) => acc + (cc.monthlyInCents[i] ?? 0), 0),
  )
  return {
    kind: 'month',
    semester,
    columnHeaders: MONTH_HEADERS.slice(start, start + 6),
    rows: costCenters.map((cc) => costCenterToRow(cc, cells)),
    total: {
      totalLabel: formatCentsBRL(totalInCents),
      cellLabels: totalPerMonth.map(formatCentsBRL),
    },
  }
}

/** Constrói a matriz "Consolidado por Mês" do Detalhe (1 plano) para o semestre pedido. */
export const buildMonthlyMatrix = (detail: PlanDetail, semester: Semester): MatrixView =>
  buildMonthlyMatrixFrom(detail.costCenters, detail.totalInCents, semester)

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

/**
 * Grid da EDIÇÃO de Orçamento (US2.4): escopo a UM centro de custo. As CATEGORIAS viram linhas raiz
 * (depth 0) e as subcategorias os filhos (depth 1). Colunas = meses do semestre; total = do centro.
 */
export const buildOrcamentoMatrix = (
  detail: PlanDetail,
  centroId: number,
  semester: Semester,
): MatrixView | null => {
  const cc = detail.costCenters.find((c) => c.id === centroId)
  if (cc === undefined) return null
  const window = windowFor(semester)
  const start = semester === 0 ? 0 : 6
  const cells: CellsOf = (node) => window.map((i) => node.monthlyInCents[i] ?? 0)
  const totalPerMonth = window.map((i) =>
    cc.categories.reduce((acc, cat) => acc + (cat.monthlyInCents[i] ?? 0), 0),
  )
  const catRow = (cat: CategoryConsolidated): MatrixRow => ({
    id: cat.id,
    name: cat.name,
    depth: 0,
    totalLabel: formatCentsBRL(cat.totalInCents),
    cellLabels: cells(cat).map(formatCentsBRL),
    children: cat.subCategories.map((sub) => ({
      id: sub.id,
      name: sub.name,
      depth: 1 as const,
      totalLabel: formatCentsBRL(sub.totalInCents),
      cellLabels: cells(sub).map(formatCentsBRL),
      children: [],
    })),
  })
  return {
    kind: 'month',
    semester,
    columnHeaders: MONTH_HEADERS.slice(start, start + 6),
    rows: cc.categories.map(catRow),
    total: {
      totalLabel: formatCentsBRL(cc.totalInCents),
      cellLabels: totalPerMonth.map(formatCentsBRL),
    },
  }
}

/** Opções do filtro "Centro de Custo" na edição de Orçamento (a partir dos centros do plano). */
export const orcamentoCentroOptions = (detail: PlanDetail): readonly RegionOption[] =>
  detail.costCenters.map((cc) => ({ value: String(cc.id), label: cc.name }))

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
