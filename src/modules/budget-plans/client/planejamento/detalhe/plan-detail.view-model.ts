/**
 * ViewModel PURO (§XI) do Detalhe do plano — visões "Consolidado por Mês" (semestre Jan–Jun/Jul–Dez) e
 * "Por Rede" ("Consolidado dos parceiros": colunas = estados/municípios) — HANDBOOK §1.4.
 * Ambas transformam a árvore Centro→Categoria→Subcategoria numa matriz de linhas expansíveis + linha TOTAL,
 * no MESMO shape (`MatrixView`), então a view burra é uma só. Sem React/TanStack — testável por `node:test`.
 */
import type {
  NetworkKind,
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
  type BudgetPlanStatus,
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
 * Opções do filtro por Rede — derivadas das REDES DO PLANO (§1.4), não de uma lista fixa.
 *
 * A regra é do legado e a P.O. a confirmou pela coluna PARCEIROS da lista ("1 estados" × "1 municípios"): a
 * natureza da rede é do PLANO. Plano de ESTADO → só o filtro de Estado. Plano de MUNICÍPIO → Estado (que
 * agrupa) + Município (que é a rede). Por isso o `uf` viaja junto da rede: a `ref` de um município é o código
 * IBGE, que não diz de que estado ele é.
 *
 * Até 2026-07-15 isto era um mapa fixo (CE/SP/AC + 3 municípios de mentira) — o placeholder front-first do
 * #113. Resultado em tela: o usuário escolhia "Ceará" num plano que não tinha rede nenhuma, e a Edição
 * respondia "não foi possível carregar". A grade já era real; a PORTA continuava fake.
 */

/** Natureza das redes do plano. `null` = plano sem rede — não há o que filtrar (nem o que editar). */
export const planNetworkKind = (detail: PlanDetail): NetworkKind | null => detail.networks[0]?.kind ?? null

const byValue = (a: RegionOption, b: RegionOption): number => a.label.localeCompare(b.label, 'pt-BR')

/** Dedup por `value` preservando o rótulo — dois municípios do mesmo estado geram uma opção de Estado só. */
const distinct = (options: readonly RegionOption[]): readonly RegionOption[] =>
  [...new Map(options.map((o) => [o.value, o])).values()].sort(byValue)

/**
 * Estados do filtro. Plano de ESTADO: as próprias redes (o estado É a rede). Plano de MUNICÍPIO: as UFs
 * distintas das redes — o Estado aqui só ESTREITA a lista de municípios, não é a rede.
 */
export const estadoOptionsFor = (detail: PlanDetail): readonly RegionOption[] => {
  const kind = planNetworkKind(detail)
  if (kind === null) return []
  if (kind === 'state') return distinct(detail.networks.map((n) => ({ value: n.ref, label: n.name })))
  // Município: a UF vem do catálogo; sem ela não dá pra agrupar (e a opção seria um rótulo vazio).
  return distinct(detail.networks.filter((n) => n.uf !== '').map((n) => ({ value: n.uf, label: n.uf })))
}

/** Municípios-rede de um estado. Vazio p/ plano de estado (lá o município não existe) ou UF não escolhida. */
export const municipioOptionsFor = (detail: PlanDetail, uf: string): readonly RegionOption[] => {
  if (planNetworkKind(detail) !== 'municipality' || uf === '') return []
  return distinct(detail.networks.filter((n) => n.uf === uf).map((n) => ({ value: n.ref, label: n.name })))
}

// ── Modal "Adicionar Orçamento" — opções vêm do CATÁLOGO (/budget-plans/options: estados + municípios
// ATIVOS em "Estados e Municípios"), NÃO das redes do plano. Legado (V1): um orçamento é de um estado OU de
// um município, e o município pertence a um estado (via `uf`). Por isso o modal tem Estado + Município: o
// município aparece filtrado pelo estado escolhido; sem município, o orçamento é do estado.
export type CatalogNetwork = Readonly<{ ref: string; name: string; kind: NetworkKind; uf: string }>

/** Estados p/ o modal: uma opção por UF distinta (nome do estado quando há estado-rede; senão a sigla). */
export const addBudgetEstadoOptions = (redes: readonly CatalogNetwork[]): readonly RegionOption[] => {
  const byUf = new Map<string, string>()
  for (const r of redes) {
    const uf = r.uf !== '' ? r.uf : r.ref
    if (r.kind === 'state') byUf.set(uf, r.name)
    else if (!byUf.has(uf)) byUf.set(uf, uf) // município sem estado-rede ativo → rótulo = sigla
  }
  return distinct(Array.from(byUf, ([uf, label]) => ({ value: uf, label })))
}

/** Municípios (do catálogo) da UF escolhida — vazio se nenhuma UF escolhida. */
export const addBudgetMunicipioOptions = (
  redes: readonly CatalogNetwork[],
  estadoUf: string,
): readonly RegionOption[] => {
  if (estadoUf === '') return []
  return distinct(
    redes
      .filter((r) => r.kind === 'municipality' && r.uf === estadoUf)
      .map((r) => ({ value: r.ref, label: r.name })),
  )
}

/** Rede efetiva (chave natural p/ o create): município escolhido vence; senão a estado-rede da UF (ou null). */
export const addBudgetRefFor = (
  redes: readonly CatalogNetwork[],
  estadoUf: string,
  municipio: string,
): string | null => {
  if (municipio !== '') return municipio
  if (estadoUf === '') return null
  const state = redes.find((r) => r.kind === 'state' && (r.uf === estadoUf || r.ref === estadoUf))
  return state?.ref ?? null
}

/**
 * A REDE escolhida (o que a Edição precisa) — `null` enquanto a escolha não fecha uma rede real. É o `ref`
 * que endereça a tela: UF no plano de estado, código IBGE no de município.
 */
export const selectedNetworkRef = (detail: PlanDetail, estado: string, municipio: string): string | null => {
  const kind = planNetworkKind(detail)
  if (kind === null) return null
  const ref = kind === 'state' ? estado : municipio
  if (ref === '') return null
  return detail.networks.some((n) => n.ref === ref) ? ref : null
}

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
  /** Natureza do centro de custo ("A PAGAR"/"A RECEBER") — renderizada como badge ao lado do nome (mock). */
  tag?: string
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

/** Centro de custo: nome + a natureza ("A PAGAR"/"A RECEBER") como `tag` (badge âmbar ao lado, como o mock). */
export const costCenterToRow = (cc: CostCenterConsolidated, cells: CellsOf): MatrixRow => ({
  id: cc.id,
  name: cc.name,
  tag: cc.type,
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
  // #394: o total por rede é o ORÇAMENTO da rede (plano-level, real). As células por centro de custo
  // (`networkInCents`) só acendem na fatia de cálculo (C2) — até lá ficam 0.
  return {
    kind: 'network',
    semester: 0,
    columnHeaders: detail.networks.map((n) => n.name.toLocaleUpperCase('pt-BR')),
    rows: detail.costCenters.map((cc) => costCenterToRow(cc, cells)),
    total: {
      totalLabel: formatCentsBRL(detail.totalInCents),
      cellLabels: detail.networks.map((n) => formatCentsBRL(n.totalInCents)),
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
  /** Status CRU (§XI) — a page usa p/ gatear as ações do menu por status (create-scenery/start-calibration). */
  rawStatus: BudgetPlanStatus
  totalLabel: string
}>

/** Cabeçalho do Detalhe: "{ano} {abrev} {versão}", badge de status e "Total Plano". */
export const derivePlanDetailHeader = (detail: PlanDetail): PlanDetailHeader => ({
  title: `${String(detail.year)} ${detail.programAbbreviation ?? detail.programName} ${detail.version.toFixed(1)}`,
  status: deriveStatusView(detail.status),
  rawStatus: detail.status,
  totalLabel: formatCentsBRL(detail.totalInCents),
})
