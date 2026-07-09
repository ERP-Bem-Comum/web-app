import { Fragment, useState, type ReactNode } from 'react'

import { ChevronDownIcon, CalendarDaysIcon, FolderIcon } from '#shared/ui/index.ts'
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
  thNum,
  thActions,
  row,
  childRow,
  td,
  tdNum,
  tdActions,
  nameCell,
  nameCellChild,
  indent,
  connector,
  connectorLast,
  connectorDot,
  planIcon,
  planIconChild,
  chevronButton,
  chevronIcon,
  chevronIconClosed,
  nameText,
  planNameLink,
  planNameLinkChild,
  versionLabel,
  auditCell,
  auditWho,
  auditWhen,
  totalCell,
  totalCellZero,
  totalCellChild,
  totalCellChildZero,
  partners,
  badge,
  badgeTone,
  badgeDot,
  badgeDotTone,
  sortIcon,
  sortIconGlyph,
  footerRow,
  footerLabel,
  footerLabelContent,
  footerIcon,
  footerTotal,
  stateCell,
} from './plan-tree-table.css.ts'

/** Zero em moeda BRL — "R$ 0,00" (o total-val fica em cinza quando zerado, como no mock). */
const isZeroTotal = (label: string): boolean => /^R\$\s*0,00$/.test(label.trim())

export type PlanTreeTableColumnLabels = Readonly<{
  plan: string
  total: string
  partners: string
  status: string
  audit: string
  actionsHeader: string
  actionsTrigger: string
  expand: string
  collapse: string
  /** Rótulo da linha de TOTAL geral (rodapé). */
  totalRow: string
}>

export type PlanTreeTableProps = Readonly<{
  rows: readonly PlanRow[]
  labels: PlanTreeTableColumnLabels
  /** Estado da tabela (empty é tratado com o rótulo apropriado pela page). */
  emptyLabel: string
  /** TOTAL geral (rodapé), já formatado (R$). */
  grandTotalLabel: string
  /** Rótulo i18n de cada ação do menu "…". */
  actionLabelFor: (action: PlanAction) => string
  /** Navega ao detalhe do plano (clique no nome). No-op/TODO permitido nesta fatia. */
  onOpenPlan: (id: string) => void
  /** Executa a ação do menu "…" (no-op/TODO nesta fatia). */
  onAction: (id: string, action: PlanAction) => void
}>

/**
 * Tabela em árvore de Planejamento (view BURRA). Linha-pai com chevron que expande as versões-filhas;
 * chip de calendário + badge de status + conector de árvore nas sub-linhas; menu "…" por linha. Expansão =
 * UI-state local (não server-state).
 */
export function PlanTreeTable(props: PlanTreeTableProps): ReactNode {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())

  const toggle = (id: string): void => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const renderRow = (r: PlanRow, depth: number, isLastChild: boolean): ReactNode => {
    const hasChildren = r.children.length > 0
    const isOpen = expanded.has(r.id)
    const isChild = depth > 0
    const tone: StatusTone = r.status.tone
    const trClass = isChild ? childRow : row
    return (
      <Fragment key={r.id}>
        <tr
          className={trClass}
          onClick={() => {
            props.onOpenPlan(r.id)
          }}
        >
          <td className={td}>
            <div className={isChild ? nameCellChild : nameCell}>
              {isChild ? (
                <span
                  className={isLastChild ? `${connector} ${connectorLast}` : connector}
                  aria-hidden="true"
                >
                  <span className={connectorDot} />
                </span>
              ) : hasChildren ? (
                <button
                  type="button"
                  className={chevronButton}
                  aria-expanded={isOpen}
                  aria-label={isOpen ? props.labels.collapse : props.labels.expand}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggle(r.id)
                  }}
                >
                  <span className={isOpen ? chevronIcon : `${chevronIcon} ${chevronIconClosed}`}>
                    <ChevronDownIcon size={16} />
                  </span>
                </button>
              ) : (
                <span className={indent} aria-hidden="true" />
              )}
              <span className={isChild ? planIconChild : planIcon} aria-hidden="true">
                <CalendarDaysIcon size={isChild ? 16 : 18} />
              </span>
              <span className={nameText}>
                <button
                  type="button"
                  className={isChild ? planNameLinkChild : planNameLink}
                  onClick={(e) => {
                    e.stopPropagation()
                    props.onOpenPlan(r.id)
                  }}
                >
                  {r.displayName}
                </button>
                {r.versionLabel !== null ? <span className={versionLabel}>{r.versionLabel}</span> : null}
              </span>
            </div>
          </td>
          <td className={tdNum}>
            <span
              className={
                isZeroTotal(r.totalLabel)
                  ? isChild
                    ? totalCellChildZero
                    : totalCellZero
                  : isChild
                    ? totalCellChild
                    : totalCell
              }
            >
              {r.totalLabel}
            </span>
          </td>
          <td className={td}>
            <span className={partners}>{r.partnersLabel}</span>
          </td>
          <td className={td}>
            <span className={`${badge} ${badgeTone[tone]}`}>
              <span className={`${badgeDot} ${badgeDotTone[tone]}`} />
              {r.status.label}
            </span>
          </td>
          <td className={td}>
            <span className={auditCell}>
              <span className={auditWho}>{r.auditWho}</span>
              <span className={auditWhen}>{r.auditWhen}</span>
            </span>
          </td>
          <td
            className={tdActions}
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
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
        {hasChildren && isOpen
          ? r.children.map((child, i) => renderRow(child, depth + 1, i === r.children.length - 1))
          : null}
      </Fragment>
    )
  }

  return (
    <div className={container}>
      <table className={table}>
        <thead>
          <tr>
            <th className={th}>{props.labels.plan}</th>
            <th className={thNum}>
              <span className={sortIcon}>
                {props.labels.total}
                <span className={sortIconGlyph} aria-hidden="true">
                  ↕
                </span>
              </span>
            </th>
            <th className={th}>{props.labels.partners}</th>
            <th className={th}>{props.labels.status}</th>
            <th className={th}>{props.labels.audit}</th>
            <th className={thActions} aria-label={props.labels.actionsHeader} />
          </tr>
        </thead>
        <tbody>
          {props.rows.length === 0 ? (
            <tr>
              <td className={stateCell} colSpan={6}>
                {props.emptyLabel}
              </td>
            </tr>
          ) : (
            props.rows.map((r) => renderRow(r, 0, false))
          )}
        </tbody>
        {props.rows.length > 0 ? (
          <tfoot>
            <tr className={footerRow}>
              <td className={footerLabel}>
                <span className={footerLabelContent}>
                  <span className={footerIcon} aria-hidden="true">
                    <FolderIcon size={18} />
                  </span>
                  {props.labels.totalRow}
                </span>
              </td>
              <td className={footerTotal}>{props.grandTotalLabel}</td>
              <td colSpan={4} />
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  )
}
