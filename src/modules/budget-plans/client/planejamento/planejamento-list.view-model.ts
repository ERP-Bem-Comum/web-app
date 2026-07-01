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
    editable: deriveEditable(node.status),
    actions: derivePlanActions({ isRoot, status: node.status, hasApprovedSibling }),
    children: node.children.map((c) => toPlanRow(c, false, childrenHaveApproved)),
  }
}
