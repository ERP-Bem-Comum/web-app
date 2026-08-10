/**
 * EditAccountModal (TELA 1) — view burra: "Editar conta bancária" (PATCH /cedente-accounts/:id). Form
 * PRÉ-PREENCHIDO pelo `EditAccountBinding` com o subconjunto editável (banco, tipo+identificação, agência,
 * conta-DV, apelido). CNPJ e saldo de abertura são IMUTÁVEIS → não aparecem (nota no rodapé). Reaproveita a
 * chrome/labels do "Nova conta". Só aparece quando `binding.target !== null`; sem data-hooks.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { WalletIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-accounts.css.ts'
import { BANKS, OTHER_BANK_CODE, type AccountType } from '../reconciliation-accounts.view-model.ts'
import type { EditAccountBinding } from '../edit-account.binding.ts'

const t = createTranslator(ptBR)
const CLOSE_GLYPH = '✕'

const TYPES: readonly { value: AccountType; tag: string }[] = [
  { value: 'Corrente', tag: 'financial.recon.add.type.corrente' },
  { value: 'Poupanca', tag: 'financial.recon.add.type.poupanca' },
  { value: 'Investimento', tag: 'financial.recon.add.type.investimento' },
  { value: 'Cartao', tag: 'financial.recon.add.type.cartao' },
  { value: 'Outro', tag: 'financial.recon.add.type.outro' },
]

export type EditAccountModalProps = Readonly<{ binding: EditAccountBinding }>

export function EditAccountModal({ binding }: EditAccountModalProps) {
  if (binding.target === null) return null
  return (
    <div className={s.overlay} role="dialog" aria-modal="true" aria-label={t('financial.recon.edit.title')}>
      <div className={s.modal}>
        <header className={s.modalHead}>
          <span className={s.mhIc} aria-hidden="true">
            <WalletIcon />
          </span>
          <div className={s.mhText}>
            <div className={s.modalTitle}>{t('financial.recon.edit.title')}</div>
            <div className={s.modalSub}>{t('financial.recon.edit.sub')}</div>
          </div>
          <button
            type="button"
            className={s.modalClose}
            aria-label={t('financial.recon.add.cancel')}
            onClick={binding.cancel}
          >
            {CLOSE_GLYPH}
          </button>
        </header>

        <div className={s.modalBody}>
          <section className={s.formSection}>
            <span className={s.sectionTitle}>{t('financial.recon.add.section.bank')}</span>
            <div className={s.formField}>
              <label className={s.fieldLabel} htmlFor="edit-bank">
                {t('financial.recon.add.field.bank')}
              </label>
              <select
                id="edit-bank"
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
                    {b.code === OTHER_BANK_CODE ? b.name : `${b.code} · ${b.name}`}
                  </option>
                ))}
              </select>
            </div>
            {binding.needsBankName ? (
              <div className={s.formField}>
                <label className={s.fieldLabel} htmlFor="edit-bank-name">
                  {t('financial.recon.add.field.bankName')}
                </label>
                <input
                  id="edit-bank-name"
                  className={s.input}
                  placeholder={t('financial.recon.add.placeholder.bankName')}
                  value={binding.customBankName}
                  onChange={(e) => {
                    binding.setCustomBankName(e.target.value)
                  }}
                />
              </div>
            ) : null}
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
                  <label className={s.fieldLabel} htmlFor="edit-type-label">
                    {t('financial.recon.add.field.typeLabel')}
                  </label>
                  <input
                    id="edit-type-label"
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
                <label className={s.fieldLabel} htmlFor="edit-branch">
                  {t('financial.recon.add.field.branch')}
                </label>
                <input
                  id="edit-branch"
                  className={`${s.input} ${s.inputMono}`}
                  placeholder={t('financial.recon.add.placeholder.branch')}
                  value={binding.agency}
                  onChange={(e) => {
                    binding.setAgency(e.target.value)
                  }}
                />
              </div>
              <div className={s.formField}>
                <label className={s.fieldLabel} htmlFor="edit-account">
                  {t('financial.recon.add.field.account')}
                </label>
                <input
                  id="edit-account"
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
              <label className={s.fieldLabel} htmlFor="edit-alias">
                {t('financial.recon.add.field.alias')}
              </label>
              <input
                id="edit-alias"
                className={s.input}
                placeholder={t('financial.recon.add.placeholder.alias')}
                value={binding.nickname}
                onChange={(e) => {
                  binding.setNickname(e.target.value)
                }}
              />
            </div>
          </section>

          {/* CNPJ e saldo de abertura são imutáveis (não editáveis após o cadastro). */}
          <p className={s.confirmText}>{t('financial.recon.edit.immutableNote')}</p>
          {binding.errorTag !== null ? <p className={s.errorText}>{t(binding.errorTag)}</p> : null}
        </div>

        <footer className={s.modalFoot}>
          <button type="button" className={s.btnSecondary} onClick={binding.cancel} disabled={binding.saving}>
            {t('financial.recon.add.cancel')}
          </button>
          <span className={s.spacer} />
          <button
            type="button"
            className={s.btnPrimary}
            disabled={!binding.canSubmit || binding.saving}
            aria-disabled={!binding.canSubmit || binding.saving}
            onClick={() => {
              binding.submit()
            }}
          >
            {binding.saving ? t('common.loading') : t('financial.recon.edit.save')}
          </button>
        </footer>
      </div>
    </div>
  )
}
