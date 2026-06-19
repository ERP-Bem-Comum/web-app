/**
 * AddAccountModal (TELA 1) — view burra: cadastro de conta bancária. Estrutura fiel ao mock (banco, tipo
 * segmentado, agência, conta-DV, apelido, saldo de abertura). CHROME honesto até core-api#168: campos e
 * "Salvar" desabilitados/anunciados (sem fabricar persistência). Recebe `open`/`onClose` por props.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import * as s from '../page/reconciliation-accounts.css.ts'

const t = createTranslator(ptBR)
const CLOSE_GLYPH = '✕'

export type AddAccountModalProps = Readonly<{ open: boolean; onClose: () => void }>

export function AddAccountModal({ open, onClose }: AddAccountModalProps) {
  if (!open) return null
  return (
    <div className={s.overlay} role="dialog" aria-modal="true" aria-label={t('financial.recon.add.title')}>
      <div className={s.modal}>
        <header className={s.modalHead}>
          <div>
            <div className={s.modalTitle}>{t('financial.recon.add.title')}</div>
            <div className={s.modalSub}>{t('financial.recon.add.sub')}</div>
          </div>
          <button
            type="button"
            className={s.modalClose}
            aria-label={t('financial.recon.add.close')}
            onClick={onClose}
          >
            {CLOSE_GLYPH}
          </button>
        </header>

        <div className={s.modalBody}>
          <span className={s.noticeChrome}>{t('financial.recon.add.sub')}</span>

          <section className={s.formSection}>
            <span className={s.sectionTitle}>{t('financial.recon.add.section.bank')}</span>
            <div className={s.formField}>
              <span className={s.fieldLabel}>{t('financial.recon.add.field.bank')}</span>
              <input className={s.input} disabled aria-disabled="true" />
            </div>
            <div className={s.formField}>
              <span className={s.fieldLabel}>{t('financial.recon.add.field.type')}</span>
              <div className={s.segmented}>
                <button type="button" className={s.segBtn.on} disabled>
                  {t('financial.recon.add.type.corrente')}
                </button>
                <button type="button" className={s.segBtn.off} disabled>
                  {t('financial.recon.add.type.poupanca')}
                </button>
                <button type="button" className={s.segBtn.off} disabled>
                  {t('financial.recon.add.type.investimento')}
                </button>
              </div>
            </div>
          </section>

          <section className={s.formSection}>
            <span className={s.sectionTitle}>{t('financial.recon.add.section.account')}</span>
            <div className={s.formRow}>
              <div className={s.formField}>
                <span className={s.fieldLabel}>{t('financial.recon.add.field.branch')}</span>
                <input className={s.input} disabled aria-disabled="true" />
              </div>
              <div className={s.formField}>
                <span className={s.fieldLabel}>{t('financial.recon.add.field.account')}</span>
                <input className={s.input} disabled aria-disabled="true" />
              </div>
            </div>
            <div className={s.formField}>
              <span className={s.fieldLabel}>{t('financial.recon.add.field.alias')}</span>
              <input className={s.input} disabled aria-disabled="true" />
            </div>
          </section>

          <section className={s.formSection}>
            <span className={s.sectionTitle}>{t('financial.recon.add.section.balance')}</span>
            <div className={s.formRow}>
              <div className={s.formField}>
                <span className={s.fieldLabel}>{t('financial.recon.add.field.openingBalance')}</span>
                <input className={s.input} disabled aria-disabled="true" />
              </div>
              <div className={s.formField}>
                <span className={s.fieldLabel}>{t('financial.recon.add.field.balanceDate')}</span>
                <input className={s.input} disabled aria-disabled="true" />
              </div>
            </div>
          </section>
        </div>

        <footer className={s.modalFoot}>
          <button type="button" className={s.btnSecondary} onClick={onClose}>
            {t('financial.recon.add.cancel')}
          </button>
          <span className={s.spacer} />
          <button type="button" className={s.btnPrimary} disabled aria-disabled="true">
            {t('financial.recon.add.save')}
          </button>
        </footer>
      </div>
    </div>
  )
}
