/**
 * New-transaction-pane (US4) — view burra: lançamento manual de uma movimentação sem título. Cards de
 * tipo; Transferência/Aplicação/Resgate exigem conta de destino + confirmação consciente (gating do
 * binding). Recebe o binding por props; sem data-hooks.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { CheckCircleIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import type { ManualEntryType } from '../reconciliation-workspace.view-model.ts'
import type { ManualEntryBinding } from '../manual-entry.binding.ts'

const t = createTranslator(ptBR)

const TYPES: readonly ManualEntryType[] = [
  'Payment',
  'Receipt',
  'Transfer',
  'FeePenaltyInterest',
  'Investment',
  'Redemption',
]

export type NewTransactionPaneProps = Readonly<{ binding: ManualEntryBinding }>

export function NewTransactionPane({ binding }: NewTransactionPaneProps) {
  return (
    <div className={s.assocCol}>
      <div className={s.formField}>
        <span className={s.fieldLabel}>{t('financial.recon.manual.classify')}</span>
        <div className={s.typeGrid}>
          {TYPES.map((tp) => (
            <button
              key={tp}
              type="button"
              className={binding.type === tp ? s.typeCard.on : s.typeCard.off}
              aria-pressed={binding.type === tp}
              onClick={() => {
                binding.setType(tp)
              }}
            >
              {t(`financial.recon.manualType.${tp}`)}
            </button>
          ))}
        </div>
      </div>

      {binding.needsDestination ? (
        <>
          <div className={s.warnBox}>{t('financial.recon.manual.warning')}</div>
          <div className={s.formField}>
            <label className={s.fieldLabel} htmlFor="recon-destination">
              {t('financial.recon.manual.destination')}
            </label>
            <input
              id="recon-destination"
              className={s.input}
              value={binding.destinationAccount}
              onChange={(e) => {
                binding.setDestinationAccount(e.target.value)
              }}
            />
          </div>
          <label className={s.confirmRow}>
            <input
              type="checkbox"
              checked={binding.consciousConfirm}
              onChange={(e) => {
                binding.setConsciousConfirm(e.target.checked)
              }}
            />
            {t('financial.recon.manual.confirm')}
          </label>
        </>
      ) : null}

      <div className={s.formField}>
        <label className={s.fieldLabel} htmlFor="recon-description">
          {t('financial.recon.manual.description')}
        </label>
        <input
          id="recon-description"
          className={s.input}
          value={binding.description}
          onChange={(e) => {
            binding.setDescription(e.target.value)
          }}
        />
      </div>

      {binding.errorTag !== null ? <p className={s.errorText}>{t(binding.errorTag)}</p> : null}

      <div className={s.matchActions}>
        <span className={s.spacer} />
        <button
          type="button"
          className={s.btnConfirm}
          disabled={!binding.canSubmit || binding.submitting}
          onClick={() => {
            binding.submit()
          }}
        >
          <CheckCircleIcon />
          {t('financial.recon.manual.submit')}
        </button>
      </div>
    </div>
  )
}
