/**
 * EditAccountModal (TELA 1) — view burra: "Editar conta bancária" (PATCH /cedente-accounts/:id). Form
 * PRÉ-PREENCHIDO pelo `EditAccountBinding` com o subconjunto editável (banco, tipo+identificação, agência,
 * conta-DV, apelido). CNPJ e saldo de abertura são IMUTÁVEIS → não aparecem (nota no rodapé). Reaproveita a
 * chrome/labels do "Nova conta". Só aparece quando `binding.target !== null`; sem data-hooks.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { WalletIcon } from '#shared/ui/icons/index.ts'

import { formatMask } from '#shared/ui/index.ts'
import { CONVENIO_MAX_DIGITS, AGENCY_TOTAL_DIGITS } from '../reconciliation-accounts.view-model.ts'
import * as s from '../page/reconciliation-accounts.css.ts'
import {
  FREQUENT_BANK_OPTIONS,
  BANK_OPTIONS,
  OTHER_BANK_CODE,
  OTHER_BANK_NAME,
  type AccountType,
} from '../reconciliation-accounts.view-model.ts'
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
                {/* Dois grupos: os 12 de sempre no topo (o operador não rola 471 linhas para achar
                    o Bradesco) e a tabela FEBRABAN completa embaixo. O rótulo é o MESMO nos dois, então
                    escolher por um ou por outro não muda o que o campo mostra depois. */}
                <optgroup label={t('financial.recon.add.bankFrequent')}>
                  {FREQUENT_BANK_OPTIONS.map((b) => (
                    <option key={`freq-${b.code}`} value={b.code}>
                      {`${b.code} · ${b.name}`}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={t('financial.recon.add.bankAll')}>
                  {BANK_OPTIONS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {`${b.code} · ${b.name}`}
                    </option>
                  ))}
                </optgroup>
                {/* #206: "Outro" sem prefixo de código (não é um banco com código real) e FORA dos
                    grupos — é a ausência de instituição, não mais uma da lista. */}
                <option value={OTHER_BANK_CODE}>{OTHER_BANK_NAME}</option>
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
                {/* Mesma régua do cadastro (specs/107) — sem ela a edição seria a porta dos fundos por
                    onde uma conta volta a ficar sem DV. Conta ANTIGA abre já cobrando o dígito: é assim
                    que o cadastro velho se completa. */}
                <input
                  id="edit-branch"
                  className={`${s.input} ${s.inputMono}`}
                  inputMode="numeric"
                  maxLength={AGENCY_TOTAL_DIGITS + 1}
                  placeholder={t('financial.recon.add.placeholder.branch')}
                  value={formatMask('agency', binding.agency)}
                  aria-invalid={binding.agencyIncomplete}
                  onChange={(e) => {
                    binding.setAgency(e.target.value)
                  }}
                />
                {binding.agencyIncomplete ? (
                  <span className={s.errorText}>{t('financial.recon.add.error.branchDigit')}</span>
                ) : (
                  <span className={s.fieldHint}>{t('financial.recon.add.hint.branch')}</span>
                )}
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
            {/* #722: convênio. Preenchível UMA vez — já preenchido, o campo fica somente-leitura e diz
                por quê. O core-api recusa a troca (`cedente-convenio-already-set`) porque o convênio
                viaja no nome de toda remessa já transmitida; deixar o input editável convidaria a um
                409 que chegaria como "falha ao salvar a conta", escondendo que nada estava errado.
                Barrado PARECE barrado: readOnly + hint com o motivo. */}
            <div className={s.formField}>
              <label className={s.fieldLabel} htmlFor="edit-convenio">
                {t('financial.recon.add.field.convenio')}
              </label>
              <input
                id="edit-convenio"
                className={`${binding.convenioLocked ? s.inputReadOnly : s.input} ${s.inputMono}`}
                inputMode="numeric"
                // Trava também no DOM, não só no setter: colar 12 dígitos não deve encher o campo
                // para depois "sumir" caracteres — o campo do header CNAB tem 6 posições.
                maxLength={CONVENIO_MAX_DIGITS}
                readOnly={binding.convenioLocked}
                placeholder={t('financial.recon.add.placeholder.convenio')}
                value={binding.convenio}
                onChange={(e) => {
                  binding.setConvenio(e.target.value)
                }}
              />
              <span className={s.fieldHint}>
                {t(
                  binding.convenioLocked
                    ? 'financial.recon.edit.hint.convenioLocked'
                    : 'financial.recon.add.hint.convenio',
                )}
              </span>
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
