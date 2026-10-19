/**
 * UndoModal — view BURRA (§XI): modal de DESFAZIMENTO (spec 119 / core-api#61), um só para os dois:
 * "Desfazer baixa" (Pago → status anterior) e "Desfazer transmissão" (Transmitido → Aprovado).
 *
 * É a confirmação E o lugar do motivo: abre ANTES de qualquer chamada, lista os títulos que vão voltar
 * e só habilita o botão com motivo preenchido (o core-api também o exige — vai ao Histórico). Sem
 * lembrete de refazer a baixa depois (decisão da P.O., 02/10). Estado mora na page; aplica via callback.
 */
import type { ChangeEvent, ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import type { UndoTarget } from '../contas-a-pagar.view-model.ts'
import {
  confirmOverlay,
  confirmDialog,
  confirmTitle,
  confirmText,
  confirmList,
  confirmTextarea,
  confirmActions,
  confirmCancelBtn,
  confirmPrimaryBtn,
} from '../page/contas-a-pagar.css.ts'

const t = createTranslator(ptBR)

export type UndoKind = 'payment' | 'transmission'

export type UndoModalProps = Readonly<{
  kind: UndoKind | null // null = fechado
  targets: readonly UndoTarget[]
  reason: string
  running: boolean
  onReasonChange: (value: string) => void
  onApply: () => void
  onCancel: () => void
}>

// "NF 0847 · Fornecedor X · pago em 10/09/2026" — a data só na baixa (transmitido nunca foi pago).
const describe = (kind: UndoKind, target: UndoTarget): string => {
  const base = `${target.documentNumber} · ${target.supplier}`
  return kind === 'payment' && target.pagamento !== '—'
    ? `${base} · ${t('financial.list.undo.paidOn')} ${target.pagamento}`
    : base
}

export function UndoModal(props: UndoModalProps): ReactNode {
  const { kind } = props
  if (kind === null) return null
  const onChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    props.onReasonChange(e.target.value)
  }
  const count = props.targets.length
  return (
    <div className={confirmOverlay} role="dialog" aria-modal="true" onClick={props.onCancel}>
      <div
        className={confirmDialog}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <h2 className={confirmTitle}>{t(`financial.list.undo.${kind}.modalTitle`)}</h2>
        <p className={confirmText}>
          {count === 1
            ? t(`financial.list.undo.${kind}.modalBodyOne`)
            : `${String(count)} ${t(`financial.list.undo.${kind}.modalBodyMany`)}`}
        </p>
        <ul className={confirmList}>
          {props.targets.map((target) => (
            <li key={target.payableId}>{describe(kind, target)}</li>
          ))}
        </ul>
        <textarea
          className={confirmTextarea}
          value={props.reason}
          maxLength={500}
          aria-label={t('financial.list.undo.reasonLabel')}
          placeholder={t('financial.list.undo.reasonPlaceholder')}
          onChange={onChange}
        />
        <div className={confirmActions}>
          <button type="button" className={confirmCancelBtn} onClick={props.onCancel}>
            {t('financial.list.undo.cancel')}
          </button>
          <button
            type="button"
            className={confirmPrimaryBtn}
            disabled={props.running || props.reason.trim() === '' || count === 0}
            onClick={props.onApply}
          >
            {props.running ? t('common.loading') : t(`financial.list.undo.${kind}.apply`)}
          </button>
        </div>
      </div>
    </div>
  )
}
