/**
 * Search-create-pane (US3) — view burra: conciliação N:1 / parcial. Multi-seleção de títulos Pago, soma
 * vs valor do extrato e classificação da diferença. O botão Conciliar é bloqueado enquanto não balancear
 * (gating vem do binding, regra pura). Recebe binding + dados por props; sem data-hooks.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { LinkIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import {
  centsToBRL,
  type DifferenceTreatment,
  type PaidPayable,
} from '../reconciliation-workspace.view-model.ts'
import type { SearchCreateBinding } from '../search-create.binding.ts'

const t = createTranslator(ptBR)

const TREATMENTS: readonly DifferenceTreatment[] = ['Interest', 'Penalty', 'Discount', 'Fee', 'Partial']

export type SearchCreatePaneProps = Readonly<{
  binding: SearchCreateBinding
  payables: readonly PaidPayable[]
  extratoValueCents: string
}>

export function SearchCreatePane({ binding, payables, extratoValueCents }: SearchCreatePaneProps) {
  const showTreatment = binding.residualCents !== 0
  return (
    <div className={s.assocCol}>
      <div className={s.multiSummary}>
        <div className={s.summaryItem}>
          <span className={s.summaryLbl}>{t('financial.recon.multi.extratoValue')}</span>
          <span className={s.summaryVal}>{centsToBRL(extratoValueCents)}</span>
        </div>
        <div className={s.summaryItem}>
          <span className={s.summaryLbl}>
            {t('financial.recon.multi.sum')} · {String(binding.selectedIds.size)}
          </span>
          <span className={s.summaryVal}>{centsToBRL(binding.selectedSumCents)}</span>
        </div>
        <div className={binding.residualCents === 0 ? s.diffPill.zero : s.diffPill.open}>
          <span className={s.summaryLbl}>{t('financial.recon.multi.diff')}</span>
          <span className={s.summaryVal}>{centsToBRL(binding.residualCents)}</span>
        </div>
      </div>

      {payables.length === 0 ? (
        <p className={s.emptyState}>{t('financial.recon.multi.empty')}</p>
      ) : (
        <div className={s.payGrid}>
          {payables.map((p) => {
            const checked = binding.selectedIds.has(p.id)
            return (
              <button
                key={p.id}
                type="button"
                className={checked ? `${s.payRow} ${s.payRowSelected}` : s.payRow}
                aria-pressed={checked}
                onClick={() => {
                  binding.toggle(p.id)
                }}
              >
                <span className={checked ? s.checkbox.on : s.checkbox.off} aria-hidden="true" />
                <span className={s.summaryItem}>
                  <span className={s.payName}>{p.documentNumber ?? p.documentId}</span>
                  <span className={s.payMeta}>{p.dueDate}</span>
                </span>
                <span className={s.payAmt}>{centsToBRL(p.valueCents)}</span>
              </button>
            )
          })}
        </div>
      )}

      {showTreatment ? (
        <div className={s.formField}>
          <span className={s.fieldLabel}>{t('financial.recon.multi.classifyDiff')}</span>
          <div className={s.treatmentRow}>
            {TREATMENTS.map((tr) => (
              <button
                key={tr}
                type="button"
                className={binding.treatment === tr ? s.treatmentCard.on : s.treatmentCard.off}
                aria-pressed={binding.treatment === tr}
                onClick={() => {
                  binding.setTreatment(tr)
                }}
              >
                {t(`financial.recon.treatment.${tr}`)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {binding.errorTag !== null ? <p className={s.errorText}>{t(binding.errorTag)}</p> : null}

      <div className={s.matchActions}>
        <button
          type="button"
          className={s.btnSecondary}
          onClick={() => {
            binding.clear()
          }}
        >
          {t('financial.recon.multi.clear')}
        </button>
        <span className={s.spacer} />
        <button
          type="button"
          className={s.btnConfirm}
          disabled={!binding.canReconcile || binding.submitting}
          onClick={() => {
            binding.submit()
          }}
        >
          <LinkIcon />
          {t('financial.recon.multi.confirm')}
        </button>
      </div>
    </div>
  )
}
