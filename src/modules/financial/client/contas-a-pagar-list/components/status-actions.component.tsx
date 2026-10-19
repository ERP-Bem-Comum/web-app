/**
 * StatusActions ("Mudar Status") — view BURRA (§XI). Dropdown de ação em massa sobre a seleção, fiel ao
 * mock (Aprovar / Voltar p/ edição / Enviar p/ aprovação / Marcar como pago).
 *
 * ⚠️ CHROME honesto por ora: `approve`/`undo-approval` já existem e o `version` agora vem na listagem
 * (012/#47) — ou seja, "Aprovar" e "Voltar p/ edição" em massa já são VIÁVEIS (falta só fiar a mutation
 * em lote + tratamento de 409); `submit` (Rascunho→Aberto) não tem rota (core-api#91); `pay`/`transmit`/
 * `reconcile` não existem (roadmap #58/#59/#60, epic #64). Itens desabilitados com tooltip por enquanto.
 */
import type { MouseEvent, ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { CalendarCheckIcon } from '#shared/ui/icons/index.ts'

import {
  wrapper,
  trigger,
  menu,
  menuItem,
  menuItemBorder,
  menuItemDisabled,
  itemCol,
  itemHint,
} from './export-dropdown.css.ts'

const t = createTranslator(ptBR)

const closeDetails = (e: MouseEvent<HTMLButtonElement>): void => {
  const d = e.currentTarget.closest('details')
  if (d) d.open = false
}

export type StatusActionsProps = Readonly<{
  // Aprovar (Aberto→Aprovado) e Voltar p/ edição (Aprovado→Aberto) — habilitados conforme a seleção.
  canApprove: boolean
  canReopen: boolean
  // Excluir — Aberto (hard-delete) OU Rascunho (descarte). O core-api trata os dois no mesmo DELETE
  // /documents/:id (cancelDocument → cancelDraft, #166). Abre o modal de confirmação.
  canDelete: boolean
  // Marcar como pago (baixa manual, #224) — títulos APROVADOS ou TRANSMITIDOS (ADR-0065 §6 do
  // core-api). Transmitido entra porque `Pago` continua manual: quem afirma que o dinheiro saiu é
  // quem conferiu o extrato, e é justamente o título que já foi ao banco que espera essa conferência.
  canPay: boolean
  // Spec 119 / core-api#61 — desfazimentos por título, cada um abre o modal de motivo ANTES de agir.
  // Desfazer baixa: só títulos Pago (conciliado desfaz a conciliação antes). Desfazer transmissão: só
  // títulos Transmitido (voltam a Aprovado, sem liberar nova remessa).
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

export function StatusActions(props: StatusActionsProps): ReactNode {
  const { canApprove, canReopen, canDelete, canPay, canUndoPayment, canUndoTransmission, running } = props
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

      <div className={menu}>
        {/* Aprovar — Aberto→Aprovado (em massa) */}
        <button
          type="button"
          className={`${menuItem}${canApprove && !running ? '' : ` ${menuItemDisabled}`}`}
          disabled={!canApprove || running}
          title={canApprove ? undefined : t('financial.list.status.needOpen')}
          onClick={(e) => {
            props.onApprove()
            closeDetails(e)
          }}
        >
          <span className={itemCol}>
            {t('financial.list.status.approve')}
            <span className={itemHint}>{t('financial.list.status.approveHint')}</span>
          </span>
        </button>

        {/* Voltar para edição — Aprovado→Aberto (undo) */}
        <button
          type="button"
          className={`${menuItem} ${menuItemBorder}${canReopen && !running ? '' : ` ${menuItemDisabled}`}`}
          disabled={!canReopen || running}
          title={canReopen ? undefined : t('financial.list.status.needApproved')}
          onClick={(e) => {
            props.onReopen()
            closeDetails(e)
          }}
        >
          <span className={itemCol}>
            {t('financial.list.status.reopen')}
            <span className={itemHint}>{t('financial.list.status.reopenHint')}</span>
          </span>
        </button>

        {/* "Marcar como pago" — baixa manual (#224): Aprovado→Pago por título. ("Enviar p/ aprovação"
            foi removido: a finalização do rascunho acontece reabrindo o documento na tela de Lançar, e a
            aprovação já é coberta por "Aprovar".) */}
        <button
          type="button"
          className={`${menuItem} ${menuItemBorder}${canPay && !running ? '' : ` ${menuItemDisabled}`}`}
          disabled={!canPay || running}
          title={canPay ? undefined : t('financial.list.status.needApprovedToPay')}
          onClick={(e) => {
            props.onPay()
            closeDetails(e)
          }}
        >
          <span className={itemCol}>
            {t('financial.list.status.pay')}
            <span className={itemHint}>{t('financial.list.status.payHint')}</span>
          </span>
        </button>

        {/* Desfazer baixa — Pago → status anterior à baixa (spec 119). Abre o modal de motivo. */}
        <button
          type="button"
          className={`${menuItem} ${menuItemBorder}${canUndoPayment && !running ? '' : ` ${menuItemDisabled}`}`}
          disabled={!canUndoPayment || running}
          title={canUndoPayment ? undefined : t('financial.list.undo.payment.needPaid')}
          onClick={(e) => {
            props.onUndoPayment()
            closeDetails(e)
          }}
        >
          <span className={itemCol}>
            {t('financial.list.undo.payment.action')}
            <span className={itemHint}>{t('financial.list.undo.payment.actionHint')}</span>
          </span>
        </button>

        {/* Desfazer transmissão — Transmitido → Aprovado (spec 119). Abre o modal de motivo. */}
        <button
          type="button"
          className={`${menuItem} ${menuItemBorder}${canUndoTransmission && !running ? '' : ` ${menuItemDisabled}`}`}
          disabled={!canUndoTransmission || running}
          title={canUndoTransmission ? undefined : t('financial.list.undo.transmission.needTransmitted')}
          onClick={(e) => {
            props.onUndoTransmission()
            closeDetails(e)
          }}
        >
          <span className={itemCol}>
            {t('financial.list.undo.transmission.action')}
            <span className={itemHint}>{t('financial.list.undo.transmission.actionHint')}</span>
          </span>
        </button>

        {/* Excluir — Aberto (hard-delete) ou Rascunho (descarte), core-api#166. Abre modal de confirmação. */}
        <button
          type="button"
          className={`${menuItem} ${menuItemBorder}${canDelete && !running ? '' : ` ${menuItemDisabled}`}`}
          disabled={!canDelete || running}
          title={canDelete ? undefined : t('financial.list.delete.needOpen')}
          onClick={(e) => {
            props.onDelete()
            closeDetails(e)
          }}
        >
          <span className={itemCol}>
            {t('financial.list.delete.action')}
            <span className={itemHint}>{t('financial.list.delete.actionHint')}</span>
          </span>
        </button>
      </div>
    </details>
  )
}
