import { Fragment, useState, type ReactNode } from 'react'

import {
  Badge,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  ZapIcon,
  FileTextIcon,
  CalendarDaysIcon,
  FolderIcon,
  type BadgeProps,
} from '#shared/ui/index.ts'
import type { IconComponent } from '#shared/ui/icons/index.ts'
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
  connector,
  connectorDot,
  planIcon,
  chevronButton,
  nameText,
  planNameLink,
  planNameLinkChild,
  versionLabel,
  statusCell,
  statusBadgeContent,
  auditCell,
  auditWho,
  auditWhen,
  totalCell,
  totalCellChild,
  stateCell,
  sortIcon,
  footerRow,
  footerLabel,
  footerLabelContent,
  footerIcon,
  footerTotal,
} from './plan-tree-table.css.ts'

/** Badge tem variantes semânticas próprias; mapeamos o TOM do status → variante da badge (cinza/azul/verde). */
const BADGE_VARIANT: Readonly<Record<StatusTone, BadgeProps['variant']>> = {
  neutral: 'outro',
  info: 'finished',
  success: 'active',
}

// Ícone por status (leitura rápida): Rascunho=documento · Em Calibração=raio · Aprovado=check.
const STATUS_ICON: Readonly<Record<StatusTone, IconComponent>> = {
  neutral: FileTextIcon,
  info: ZapIcon,
  success: CheckCircleIcon,
}

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
    const isChild = depth > 0
    // Pai permanece BRANCO (mesmo expandido); só a versão-filha fica azul (mock base).
    const StatusIcon = STATUS_ICON[r.status.tone]
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
            <div className={nameCell}>
              {isChild ? (
                <>
                  <span className={indent} aria-hidden="true" />
                  <span className={connector} aria-hidden="true">
                    <span className={connectorDot} />
                  </span>
                </>
              ) : null}
              {hasChildren ? (
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
                  {isOpen ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
                </button>
              ) : !isChild ? (
                <span className={indent} aria-hidden="true" />
              ) : null}
              <span className={planIcon} aria-hidden="true">
                <CalendarDaysIcon size={16} />
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
          <td className={td}>
            <span className={isChild ? totalCellChild : totalCell}>{r.totalLabel}</span>
          </td>
          <td className={td}>{r.partnersLabel}</td>
          <td className={td}>
            <span className={statusCell}>
              <Badge variant={BADGE_VARIANT[r.status.tone]} size="sm" uppercase>
                <span className={statusBadgeContent}>
                  <StatusIcon size={12} />
                  {r.status.label}
                </span>
              </Badge>
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
            <th className={th}>
              {props.labels.total}
              <span className={sortIcon} aria-hidden="true">
                ↕
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
            props.rows.map((r) => renderRow(r, 0))
          )}
        </tbody>
        {props.rows.length > 0 ? (
          <tfoot>
            <tr className={footerRow}>
              <td className={footerLabel}>
                <span className={footerLabelContent}>
                  <span className={footerIcon} aria-hidden="true">
                    <FolderIcon size={16} />
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
