/**
 * ViewModel (PURO, agnóstico de framework — §XI) da lista de Planejamento. Deriva o que a view burra
 * apresenta: rótulo do plano, status (label + tom), parceiros, total formatado e as AÇÕES disponíveis no
 * menu "…". As regras de menu espelham HANDBOOK §1.3 (sensível a raiz/filho + status + irmão aprovado).
 * Sem React, sem TanStack: só derivação testável por `node:test`.
 */
import type {
  BudgetPlanNode,
  NetworkKind,
} from '#modules/budget-plans/client/data/model/budget-plan.model.ts'
import type { BudgetPlanStatus } from '#modules/budget-plans/client/data/model/enums.ts'
import { deriveEditable, formatCentsBRL } from '#modules/budget-plans/client/domain/calc/derive.ts'

// A view (client-ui) consome o tipo de status POR AQUI (o boundary §XI não a deixa tocar `data/`).
export type { BudgetPlanStatus } from '#modules/budget-plans/client/data/model/enums.ts'

export type StatusTone = 'neutral' | 'info' | 'success'
export type StatusView = Readonly<{ label: string; tone: StatusTone }>

/** Badge de status: label PT + tom (cinza/azul/verde). */
export const deriveStatusView = (status: BudgetPlanStatus): StatusView => {
  switch (status) {
    case 'RASCUNHO':
      return { label: 'Rascunho', tone: 'neutral' }
    case 'EM_CALIBRACAO':
      return { label: 'Em Calibração', tone: 'info' }
    case 'APROVADO':
      return { label: 'Aprovado', tone: 'success' }
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}

/** "N estados" | "N municípios" conforme a granularidade do programa. */
export const derivePartnersLabel = (count: number, kind: NetworkKind): string =>
  `${String(count)} ${kind === 'ESTADO' ? 'estados' : 'municípios'}`

/** Nome de exibição: "{ano} {abrev|programa} {versão}" (ex.: "2026 PARC 1.0"). */
export const derivePlanDisplayName = (node: BudgetPlanNode): string =>
  `${String(node.year)} ${node.programAbbreviation ?? node.programName} ${node.version.toFixed(1)}`

/** Rótulo/subtítulo da versão-filha: nome do cenário ou "Inicial". */
export const deriveVersionLabel = (node: BudgetPlanNode): string | null =>
  node.scenarioName ?? (node.version % 1 !== 0 ? 'Inicial' : null)

/**
 * Trilha de auditoria "{usuário} alteração {dd/mm/aaaa hh:mm}" (HANDBOOK §1.1). PURA: recebe o ISO e
 * formata em pt-BR sem depender do fuso do runtime (usa os componentes UTC do timestamp).
 */
export const deriveAuditLabel = (updatedByName: string, updatedAtIso: string): string => {
  const d = new Date(updatedAtIso)
  if (Number.isNaN(d.getTime())) return updatedByName
  const p2 = (n: number): string => String(n).padStart(2, '0')
  const date = `${p2(d.getUTCDate())}/${p2(d.getUTCMonth() + 1)}/${String(d.getUTCFullYear())}`
  const time = `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`
  return `${updatedByName} alteração ${date} ${time}`
}

/**
 * Auditoria em 2 PARTES (coluna "Última alteração" — mock base): `who` = "{usuário} alteração" e
 * `when` = "dd/mm/aaaa hh:mm". PURA, formata em UTC (independe do fuso do runtime).
 */
export const deriveAuditParts = (
  updatedByName: string,
  updatedAtIso: string,
): { readonly who: string; readonly when: string } => {
  const d = new Date(updatedAtIso)
  if (Number.isNaN(d.getTime())) return { who: updatedByName, when: '' }
  const p2 = (n: number): string => String(n).padStart(2, '0')
  const date = `${p2(d.getUTCDate())}/${p2(d.getUTCMonth() + 1)}/${String(d.getUTCFullYear())}`
  const time = `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`
  return { who: `${updatedByName} alteração`, when: `${date} ${time}` }
}

export const PLAN_ACTIONS = [
  'share',
  'planned-vs-actual',
  'start-calibration',
  'approve',
  'create-scenery',
  'export-csv',
  'delete',
] as const
export type PlanAction = (typeof PLAN_ACTIONS)[number]

/**
 * Ações do menu "…" conforme o papel do nó (HANDBOOK §1.3):
 * - raiz: todas (inclui Calibração e Cenário);
 * - versão aprovável (filho sem irmão aprovado): sem Calibração/Cenário, mas com Aprovar;
 * - versão não-aprovável (filho com irmão aprovado): também sem Aprovar.
 */
export const derivePlanActions = (args: {
  isRoot: boolean
  status: BudgetPlanStatus
  hasApprovedSibling: boolean
}): readonly PlanAction[] => {
  const base: PlanAction[] = ['share', 'planned-vs-actual']
  if (args.isRoot) {
    return [...base, 'start-calibration', 'approve', 'create-scenery', 'export-csv', 'delete']
  }
  const canApprove = !args.hasApprovedSibling && args.status !== 'APROVADO'
  return [...base, ...(canApprove ? (['approve'] as const) : []), 'export-csv', 'delete']
}

export type PlanRow = Readonly<{
  id: number
  displayName: string
  versionLabel: string | null
  totalLabel: string
  partnersLabel: string
  status: StatusView
  auditWho: string
  auditWhen: string
  editable: boolean
  actions: readonly PlanAction[]
  children: readonly PlanRow[]
}>

/**
 * Monta a linha (recursiva) pronta para a view burra. `hasApprovedSibling` é calculado ao descer para os
 * filhos (olha o conjunto de IRMÃOS, não os próprios filhos) — por isso é passado de cima.
 */
export const toPlanRow = (node: BudgetPlanNode, isRoot = true, hasApprovedSibling = false): PlanRow => {
  const childrenHaveApproved = node.children.some((c) => c.status === 'APROVADO')
  return {
    id: node.id,
    displayName: derivePlanDisplayName(node),
    versionLabel: isRoot ? null : deriveVersionLabel(node),
    totalLabel: formatCentsBRL(node.totalInCents),
    partnersLabel: derivePartnersLabel(node.partnersCount, node.networkKind),
    status: deriveStatusView(node.status),
    auditWho: deriveAuditParts(node.updatedByName, node.updatedAt).who,
    auditWhen: deriveAuditParts(node.updatedByName, node.updatedAt).when,
    editable: deriveEditable(node.status),
    actions: derivePlanActions({ isRoot, status: node.status, hasApprovedSibling }),
    children: node.children.map((c) => toPlanRow(c, false, childrenHaveApproved)),
  }
}

/** Filtro (funil §1.1): Ano/Programa/Status + busca textual. Aplicado só às RAÍZES (as filhas seguem o pai). */
export type PlanFilter = Readonly<{
  search?: string
  year?: number
  program?: string
  status?: BudgetPlanStatus
}>

const matchesSearch = (node: BudgetPlanNode, term: string): boolean => {
  const haystack = [
    String(node.year),
    node.programAbbreviation ?? '',
    node.programName,
    node.scenarioName ?? '',
    node.version.toFixed(1),
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(term.toLowerCase())
}

/** Filtra as raízes (mantém a árvore-filha intacta). `program` casa contra abreviação OU nome (case-insensitive). */
export const filterPlans = (
  roots: readonly BudgetPlanNode[],
  filter: PlanFilter,
): readonly BudgetPlanNode[] =>
  roots.filter((node) => {
    if (filter.year !== undefined && node.year !== filter.year) return false
    if (filter.status !== undefined && node.status !== filter.status) return false
    if (filter.program !== undefined && filter.program !== '') {
      const p = filter.program.toLowerCase()
      const abbr = (node.programAbbreviation ?? '').toLowerCase()
      const name = node.programName.toLowerCase()
      if (abbr !== p && name !== p) return false
    }
    if (
      filter.search !== undefined &&
      filter.search.trim() !== '' &&
      !matchesSearch(node, filter.search.trim())
    ) {
      return false
    }
    return true
  })

export type Paginated<T> = Readonly<{
  items: readonly T[]
  page: number
  totalPages: number
  total: number
}>

/** Paginação client-side sobre as raízes filtradas (o backend paginará de verdade quando existir). */
export const paginatePlans = <T>(items: readonly T[], page: number, limit: number): Paginated<T> => {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * limit
  return { items: items.slice(start, start + limit), page: safePage, totalPages, total }
}
