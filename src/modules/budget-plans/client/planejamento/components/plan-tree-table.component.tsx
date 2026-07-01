import { Fragment, useState, type ReactNode } from 'react'

import { Badge, ChevronDownIcon, ChevronUpIcon, type BadgeProps } from '#shared/ui/index.ts'
import type {
  PlanRow,
  PlanAction,
  StatusTone,
} from '#modules/budget-plans/client/planejamento/planejamento-list.view-model.ts'

import { PlanActionsMenu } from './plan-actions-menu.component.tsx'
import {
  container,
  table,
  th,
  thActions,
  row,
  childRow,
  td,
  tdActions,
  nameCell,
  indent,
  chevronButton,
  nameText,
  planNameLink,
  versionLabel,
  statusCell,
  auditTrail,
  totalCell,
  stateCell,
} from './plan-tree-table.css.ts'

/** Badge tem variantes semânticas próprias; mapeamos o TOM do status → variante da badge (cinza/azul/verde). */
const BADGE_VARIANT: Readonly<Record<StatusTone, BadgeProps['variant']>> = {
  neutral: 'outro',
  info: 'finished',
  success: 'active',
}

export type PlanTreeTableColumnLabels = Readonly<{
  plan: string
  total: string
  partners: string
  status: string
  actionsHeader: string
  actionsTrigger: string
  expand: string
  collapse: string
}>

export type PlanTreeTableProps = Readonly<{
  rows: readonly PlanRow[]
  labels: PlanTreeTableColumnLabels
  /** Estado da tabela (empty é tratado com o rótulo apropriado pela page). */
  emptyLabel: string
  /** Rótulo i18n de cada ação do menu "…". */
  actionLabelFor: (action: PlanAction) => string
  /** Navega ao detalhe do plano (clique no nome). No-op/TODO permitido nesta fatia. */
  onOpenPlan: (id: number) => void
  /** Executa a ação do menu "…" (no-op/TODO nesta fatia). */
  onAction: (id: number, action: PlanAction) => void
}>

/**
 * Tabela em árvore de Planejamento (view BURRA). Linha-pai com chevron que expande as versões-filhas;
 * badge de status + trilha de auditoria; menu "…" por linha. Expansão = UI-state local (não server-state).
 */
export function PlanTreeTable(props: PlanTreeTableProps): ReactNode {
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(new Set())

  const toggle = (id: number): void => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const renderRow = (r: PlanRow, depth: number): ReactNode => {
    const hasChildren = r.children.length > 0
    const isOpen = expanded.has(r.id)
    return (
      <Fragment key={r.id}>
        <tr className={depth === 0 ? row : childRow}>
          <td className={td}>
            <div className={nameCell}>
              {depth > 0 ? <span className={indent} aria-hidden="true" /> : null}
              {hasChildren ? (
                <button
                  type="button"
                  className={chevronButton}
                  aria-expanded={isOpen}
                  aria-label={isOpen ? props.labels.collapse : props.labels.expand}
                  onClick={() => {
                    toggle(r.id)
                  }}
                >
                  {isOpen ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
                </button>
              ) : (
                <span className={indent} aria-hidden="true" />
              )}
              <span className={nameText}>
                <button
                  type="button"
                  className={planNameLink}
                  onClick={() => {
                    props.onOpenPlan(r.id)
                  }}
                >
                  {r.displayName}
                </button>
                {r.versionLabel !== null ? <span className={versionLabel}>{r.versionLabel}</span> : null}
              </span>
            </div>
          </td>
          <td className={td}>
            <span className={totalCell}>{r.totalLabel}</span>
          </td>
          <td className={td}>{r.partnersLabel}</td>
          <td className={td}>
            <span className={statusCell}>
              <Badge variant={BADGE_VARIANT[r.status.tone]} size="sm" uppercase>
                {r.status.label}
              </Badge>
              <span className={auditTrail}>{r.auditLabel}</span>
            </span>
          </td>
          <td className={tdActions}>
            <PlanActionsMenu
              actions={r.actions}
              labelFor={props.actionLabelFor}
              triggerLabel={props.labels.actionsTrigger}
              onAction={(action) => {
                props.onAction(r.id, action)
              }}
            />
          </td>
        </tr>
        {hasChildren && isOpen ? r.children.map((child) => renderRow(child, depth + 1)) : null}
      </Fragment>
    )
  }

  return (
    <div className={container}>
      <table className={table}>
        <thead>
          <tr>
            <th className={th}>{props.labels.plan}</th>
            <th className={th}>{props.labels.total}</th>
            <th className={th}>{props.labels.partners}</th>
            <th className={th}>{props.labels.status}</th>
            <th className={thActions} aria-label={props.labels.actionsHeader} />
          </tr>
        </thead>
        <tbody>
          {props.rows.length === 0 ? (
            <tr>
              <td className={stateCell} colSpan={5}>
                {props.emptyLabel}
              </td>
            </tr>
          ) : (
            props.rows.map((r) => renderRow(r, 0))
          )}
        </tbody>
      </table>
    </div>
  )
}
