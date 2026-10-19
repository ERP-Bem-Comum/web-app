/**
 * StatusActions ("Mudar Status") — view BURRA (§XI). Dropdown de ação em massa sobre a seleção.
 *
 * Layout (refino da spec 119): grupos NOMEADOS na ordem do ciclo do título — Aprovação (Aprovar · Voltar
 * para edição) · Pagamento (Marcar como pago) · Correção (Desfazer baixa · Desfazer transmissão) — e a ação
 * destrutiva (Excluir) isolada no fim, no tom de erro. Item desativado mostra o motivo no `title`.
 */
import type { MouseEvent, ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { CalendarCheckIcon } from '#shared/ui/icons/index.ts'

import { wrapper, trigger } from './export-dropdown.css.ts'
import {
  statusMenu,
  statusGroup,
  statusGroupLabel,
  statusItem,
  statusItemLabel,
  statusItemLabelDanger,
  statusItemHint,
} from './status-actions.css.ts'

const t = createTranslator(ptBR)

const closeDetails = (e: MouseEvent<HTMLButtonElement>): void => {
  const d = e.currentTarget.closest('details')
  if (d) d.open = false
}

export type StatusActionsProps = Readonly<{
  // Aprovar (Aberto→Aprovado) e Voltar p/ edição (Aprovado→Aberto) — habilitados conforme a seleção.
  canApprove: boolean
  canReopen: boolean
  // Excluir — Aberto (hard-delete) OU Rascunho (descarte), core-api#166. Abre o modal de confirmação.
  canDelete: boolean
  // Marcar como pago (baixa manual, #224) — títulos Aprovados ou Transmitidos (ADR-0065 §6 do core-api).
  canPay: boolean
  // Spec 119 / core-api#61 — desfazimentos por título; cada um abre o modal de motivo ANTES de agir.
  canUndoPayment: boolean
  canUndoTransmission: boolean
  running: boolean
  onApprove: () => void
  onReopen: () => void
  onDelete: () => void
  onPay: () => void
  onUndoPayment: () => void
  onUndoTransmission: () => void
}>

type ItemProps = Readonly<{
  enabled: boolean
  running: boolean
  labelTag: string
  hintTag: string
  disabledTitleTag: string
  danger?: boolean
  onClick: () => void
}>

function Item(props: ItemProps): ReactNode {
  const active = props.enabled && !props.running
  return (
    <button
      type="button"
      className={statusItem}
      disabled={!active}
      title={props.enabled ? undefined : t(props.disabledTitleTag)}
      onClick={(e) => {
        props.onClick()
        closeDetails(e)
      }}
    >
      <span
        className={`${statusItemLabel}${props.danger === true && active ? ` ${statusItemLabelDanger}` : ''}`}
      >
        {t(props.labelTag)}
      </span>
      <span className={statusItemHint}>{t(props.hintTag)}</span>
    </button>
  )
}

export function StatusActions(props: StatusActionsProps): ReactNode {
  const { running } = props
  return (
    <details className={wrapper}>
      <summary
        style={{ listStyle: 'none', cursor: 'pointer' }}
        aria-label={t('financial.list.status.change')}
      >
        <span className={trigger}>
          <CalendarCheckIcon />
          {t('financial.list.status.change')}
        </span>
      </summary>

      <div className={statusMenu}>
        <div className={statusGroup} role="group" aria-label={t('financial.list.status.group.approval')}>
          <span className={statusGroupLabel}>{t('financial.list.status.group.approval')}</span>
          <Item
            enabled={props.canApprove}
            running={running}
            labelTag="financial.list.status.approve"
            hintTag="financial.list.status.approveHint"
            disabledTitleTag="financial.list.status.needOpen"
            onClick={props.onApprove}
          />
          <Item
            enabled={props.canReopen}
            running={running}
            labelTag="financial.list.status.reopen"
            hintTag="financial.list.status.reopenHint"
            disabledTitleTag="financial.list.status.needApproved"
            onClick={props.onReopen}
          />
        </div>

        <div className={statusGroup} role="group" aria-label={t('financial.list.status.group.payment')}>
          <span className={statusGroupLabel}>{t('financial.list.status.group.payment')}</span>
          <Item
            enabled={props.canPay}
            running={running}
            labelTag="financial.list.status.pay"
            hintTag="financial.list.status.payHint"
            disabledTitleTag="financial.list.status.needApprovedToPay"
            onClick={props.onPay}
          />
        </div>

        <div className={statusGroup} role="group" aria-label={t('financial.list.status.group.correction')}>
          <span className={statusGroupLabel}>{t('financial.list.status.group.correction')}</span>
          <Item
            enabled={props.canUndoPayment}
            running={running}
            labelTag="financial.list.undo.payment.action"
            hintTag="financial.list.undo.payment.actionHint"
            disabledTitleTag="financial.list.undo.payment.needPaid"
            onClick={props.onUndoPayment}
          />
          <Item
            enabled={props.canUndoTransmission}
            running={running}
            labelTag="financial.list.undo.transmission.action"
            hintTag="financial.list.undo.transmission.actionHint"
            disabledTitleTag="financial.list.undo.transmission.needTransmitted"
            onClick={props.onUndoTransmission}
          />
        </div>

        <div className={statusGroup}>
          <Item
            enabled={props.canDelete}
            running={running}
            labelTag="financial.list.delete.action"
            hintTag="financial.list.delete.actionHint"
            disabledTitleTag="financial.list.delete.needOpen"
            danger
            onClick={props.onDelete}
          />
        </div>
      </div>
    </details>
  )
}
