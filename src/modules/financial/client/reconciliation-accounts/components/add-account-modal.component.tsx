/**
 * AddAccountModal (TELA 1) — view burra: "Nova Conta Bancária". Estrutura fiel ao mock (cabeçalho com
 * ícone, banco, tipo segmentado, agência, conta-DV, apelido + dica, saldo de abertura opcional + aviso).
 * CHROME honesto até core-api#168: o "Adicionar conta" fica desabilitado/anunciado (sem persistência
 * fabricada). Recebe `open`/`onClose` por props.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { CheckCircleIcon, WalletIcon } from '#shared/ui/icons/index.ts'

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
          <span className={s.mhIc} aria-hidden="true">
            <WalletIcon />
          </span>
          <div className={s.mhText}>
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
          <section className={s.formSection}>
            <span className={s.sectionTitle}>{t('financial.recon.add.section.bank')}</span>
            <div className={s.formField}>
              <label className={s.fieldLabel} htmlFor="add-bank">
                {t('financial.recon.add.field.bank')}
              </label>
              <select id="add-bank" className={s.selectField} defaultValue="">
                <option value="" disabled>
                  {t('financial.recon.add.placeholder.bank')}
                </option>
              </select>
            </div>
            <div className={s.formField}>
              <span className={s.fieldLabel}>{t('financial.recon.add.field.type')}</span>
              <div className={s.segmented}>
                <button type="button" className={s.segBtn.on}>
                  {t('financial.recon.add.type.corrente')}
                </button>
                <button type="button" className={s.segBtn.off}>
                  {t('financial.recon.add.type.poupanca')}
                </button>
                <button type="button" className={s.segBtn.off}>
                  {t('financial.recon.add.type.investimento')}
                </button>
              </div>
            </div>
          </section>

          <section className={s.formSection}>
            <span className={s.sectionTitle}>{t('financial.recon.add.section.account')}</span>
            <div className={s.formRow}>
              <div className={s.formField}>
                <label className={s.fieldLabel} htmlFor="add-branch">
                  {t('financial.recon.add.field.branch')}
                </label>
                <input
                  id="add-branch"
                  className={`${s.input} ${s.inputMono}`}
                  placeholder={t('financial.recon.add.placeholder.branch')}
                />
              </div>
              <div className={s.formField}>
                <label className={s.fieldLabel} htmlFor="add-account">
                  {t('financial.recon.add.field.account')}
                </label>
                <input
                  id="add-account"
                  className={`${s.input} ${s.inputMono}`}
                  placeholder={t('financial.recon.add.placeholder.account')}
                />
              </div>
            </div>
            <div className={s.formField}>
              <label className={s.fieldLabel} htmlFor="add-alias">
                {t('financial.recon.add.field.alias')}
              </label>
              <input
                id="add-alias"
                className={s.input}
                placeholder={t('financial.recon.add.placeholder.alias')}
              />
              <span className={s.aliasHint}>{t('financial.recon.add.aliasHint')}</span>
            </div>
          </section>

          <section className={s.formSection}>
            <span className={s.sectionTitleRow}>
              <span className={s.sectionTitle}>{t('financial.recon.add.section.balance')}</span>
              <span className={s.optionalTag}>{t('financial.recon.add.optional')}</span>
            </span>
            <div className={s.formRow}>
              <div className={s.formField}>
                <label className={s.fieldLabel} htmlFor="add-balance">
                  {t('financial.recon.add.field.openingBalance')}
                </label>
                <input
                  id="add-balance"
                  className={`${s.input} ${s.inputMono}`}
                  placeholder={t('financial.recon.add.placeholder.openingBalance')}
                />
              </div>
              <div className={s.formField}>
                <label className={s.fieldLabel} htmlFor="add-balance-date">
                  {t('financial.recon.add.field.balanceDate')}
                </label>
                <input
                  id="add-balance-date"
                  className={`${s.input} ${s.inputMono}`}
                  placeholder={t('financial.recon.add.placeholder.balanceDate')}
                />
              </div>
            </div>
            <div className={s.infoNotice}>
              <span className={s.infoNoticeIcon} aria-hidden="true">
                <CheckCircleIcon />
              </span>
              <span className={s.infoNoticeText}>{t('financial.recon.add.notice')}</span>
            </div>
          </section>
        </div>

        <footer className={s.modalFoot}>
          <button type="button" className={s.btnSecondary} onClick={onClose}>
            {t('financial.recon.add.cancel')}
          </button>
          <span className={s.pendingHint}>{t('financial.recon.add.pendingHint')}</span>
          <button type="button" className={s.btnPrimary} disabled aria-disabled="true">
            {t('financial.recon.add.save')}
          </button>
        </footer>
      </div>
    </div>
  )
}
