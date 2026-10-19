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
import {
  CheckIcon,
  ChevronDownIcon,
  CreditCardIcon,
  EditIcon,
  InfoIcon,
  RefreshIcon,
  SendIcon,
  TrashIcon,
  UndoIcon,
} from '#shared/ui/icons/index.ts'

import { wrapper, trigger, triggerChevron } from './export-dropdown.css.ts'
import {
  statusMenu,
  statusGroup,
  statusGroupLabel,
  statusItem,
  statusItemLabel,
  statusItemLabelDanger,
  statusItemHint,
  statusHeader,
  statusHeaderTitle,
  statusHeaderSub,
  statusHeaderText,
  statusItemRow,
  statusItemIcon,
  statusItemText,
  statusItemNote,
} from './status-actions.css.ts'

const t = createTranslator(ptBR)

const closeDetails = (e: MouseEvent<HTMLButtonElement>): void => {
  const d = e.currentTarget.closest('details')
  if (d) d.open = false
}

export type StatusActionsProps = Readonly<{
  // Resumo da seleção no cabeçalho do menu ("1 documento • Transmitido") — texto pronto, vem da page.
  summary: string
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
  icon: ReactNode
  noteTag?: string // linha extra de aviso (ex.: "Não libera uma nova remessa")
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
      <span className={statusItemRow}>
        <span className={statusItemIcon}>{props.icon}</span>
        <span className={statusItemText}>
          <span
            className={`${statusItemLabel}${props.danger === true && active ? ` ${statusItemLabelDanger}` : ''}`}
          >
            {t(props.labelTag)}
          </span>
          <span className={statusItemHint}>{t(props.hintTag)}</span>
          {props.noteTag !== undefined ? (
            <span className={statusItemNote}>
              <InfoIcon size={12} />
              {t(props.noteTag)}
            </span>
          ) : null}
        </span>
      </span>
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
          <RefreshIcon />
          {t('financial.list.status.change')}
          <span className={triggerChevron}>
            <ChevronDownIcon size={14} />
          </span>
        </span>
      </summary>

      <div className={statusMenu}>
        <div className={statusHeader}>
          <RefreshIcon size={18} />
          <span className={statusHeaderText}>
            <span className={statusHeaderTitle}>{t('financial.list.status.change')}</span>
            <span className={statusHeaderSub}>{props.summary}</span>
          </span>
        </div>
        <div className={statusGroup} role="group" aria-label={t('financial.list.status.group.approval')}>
          <span className={statusGroupLabel}>{t('financial.list.status.group.approval')}</span>
          <Item
            enabled={props.canApprove}
            running={running}
            icon={<CheckIcon />}
            labelTag="financial.list.status.approve"
            hintTag="financial.list.status.approveHint"
            disabledTitleTag="financial.list.status.needOpen"
            onClick={props.onApprove}
          />
          <Item
            enabled={props.canReopen}
            running={running}
            icon={<EditIcon size={16} />}
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
            icon={<CreditCardIcon />}
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
            icon={<UndoIcon />}
            labelTag="financial.list.undo.payment.action"
            hintTag="financial.list.undo.payment.actionHint"
            disabledTitleTag="financial.list.undo.payment.needPaid"
            onClick={props.onUndoPayment}
          />
          <Item
            enabled={props.canUndoTransmission}
            running={running}
            icon={<SendIcon />}
            labelTag="financial.list.undo.transmission.action"
            hintTag="financial.list.undo.transmission.actionHint"
            disabledTitleTag="financial.list.undo.transmission.needTransmitted"
            noteTag="financial.list.undo.transmission.note"
            onClick={props.onUndoTransmission}
          />
        </div>

        <div className={statusGroup}>
          <Item
            enabled={props.canDelete}
            running={running}
            icon={<TrashIcon size={16} />}
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
