/**
 * AddAccountModal (TELA 1) — view burra: "Nova Conta Bancária". Form controlado pelo `AddAccountBinding`
 * (#138 — POST /cedente-accounts). Banco via lista estática (BANKS), tipo segmentado, agência, conta-DV,
 * CNPJ da organização (obrigatório no core-api), apelido + dica, saldo de abertura opcional. Recebe
 * `open`/`onClose`/`binding` por props; sem data-hooks.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { CheckCircleIcon, WalletIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-accounts.css.ts'
import { BANKS, type AccountType } from '../reconciliation-accounts.view-model.ts'
import type { AddAccountBinding } from '../add-account.binding.ts'

const t = createTranslator(ptBR)
const CLOSE_GLYPH = '✕'

// #206: todos os tipos REAIS — incl. cartão corporativo (tem movimentação a conciliar) e "outro".
// Cartao/Outro pedem um rótulo livre (typeLabel) p/ identificar a conta.
const TYPES: readonly { value: AccountType; tag: string }[] = [
  { value: 'Corrente', tag: 'financial.recon.add.type.corrente' },
  { value: 'Poupanca', tag: 'financial.recon.add.type.poupanca' },
  { value: 'Investimento', tag: 'financial.recon.add.type.investimento' },
  { value: 'Cartao', tag: 'financial.recon.add.type.cartao' },
  { value: 'Outro', tag: 'financial.recon.add.type.outro' },
]

export type AddAccountModalProps = Readonly<{
  open: boolean
  onClose: () => void
  binding: AddAccountBinding
}>

export function AddAccountModal({ open, onClose, binding }: AddAccountModalProps) {
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
              <select
                id="add-bank"
                className={s.selectField}
                value={binding.bankCode}
                onChange={(e) => {
                  binding.setBank(e.target.value)
                }}
              >
                <option value="" disabled>
                  {t('financial.recon.add.placeholder.bank')}
                </option>
                {BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {`${b.code} · ${b.name}`}
                  </option>
                ))}
              </select>
            </div>
            <div className={s.formField}>
              <span className={s.fieldLabel}>{t('financial.recon.add.field.type')}</span>
              <div className={s.segmented}>
                {TYPES.map((tp) => (
                  <button
                    key={tp.value}
                    type="button"
                    className={binding.type === tp.value ? s.segBtn.on : s.segBtn.off}
                    aria-pressed={binding.type === tp.value}
                    onClick={() => {
                      binding.setType(tp.value)
                    }}
                  >
                    {t(tp.tag)}
                  </button>
                ))}
              </div>
              {binding.needsTypeLabel ? (
                <div className={s.formField}>
                  <label className={s.fieldLabel} htmlFor="add-type-label">
                    {t('financial.recon.add.field.typeLabel')}
                  </label>
                  <input
                    id="add-type-label"
                    className={s.input}
                    placeholder={t('financial.recon.add.placeholder.typeLabel')}
                    value={binding.typeLabel}
                    onChange={(e) => {
                      binding.setTypeLabel(e.target.value)
                    }}
                  />
                </div>
              ) : null}
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
                  value={binding.agency}
                  onChange={(e) => {
                    binding.setAgency(e.target.value)
                  }}
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
                  value={binding.account}
                  onChange={(e) => {
                    binding.setAccount(e.target.value)
                  }}
                />
              </div>
            </div>
            <div className={s.formField}>
              <label className={s.fieldLabel} htmlFor="add-document">
                {t('financial.recon.add.field.document')}
              </label>
              <input
                id="add-document"
                className={`${s.input} ${s.inputMono}`}
                placeholder={t('financial.recon.add.placeholder.document')}
                value={binding.document}
                onChange={(e) => {
                  binding.setDocument(e.target.value)
                }}
              />
            </div>
            <div className={s.formField}>
              <label className={s.fieldLabel} htmlFor="add-alias">
                {t('financial.recon.add.field.alias')}
              </label>
              <input
                id="add-alias"
                className={s.input}
                placeholder={t('financial.recon.add.placeholder.alias')}
                value={binding.nickname}
                onChange={(e) => {
                  binding.setNickname(e.target.value)
                }}
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
                  value={binding.openingBalance}
                  onChange={(e) => {
                    binding.setOpeningBalance(e.target.value)
                  }}
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
                  value={binding.openingBalanceDate}
                  onChange={(e) => {
                    binding.setOpeningBalanceDate(e.target.value)
                  }}
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

          {binding.errorTag !== null ? <p className={s.errorText}>{t(binding.errorTag)}</p> : null}
        </div>

        <footer className={s.modalFoot}>
          <button type="button" className={s.btnSecondary} onClick={onClose}>
            {t('financial.recon.add.cancel')}
          </button>
          <span className={s.spacer} />
          <button
            type="button"
            className={s.btnPrimary}
            disabled={!binding.canSubmit || binding.submitting}
            aria-disabled={!binding.canSubmit || binding.submitting}
            onClick={() => {
              binding.submit()
            }}
          >
            {t('financial.recon.add.save')}
          </button>
        </footer>
      </div>
    </div>
  )
}
