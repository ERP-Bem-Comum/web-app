import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { BankSelect, isUnknownBank } from '#shared/ui/brand/bank-select.component.tsx'
import { BANK_LABELS, BANK_UNKNOWN_HINT } from '#modules/partners/client/shared/bank-select-labels.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { formatMask, unmask } from '#shared/ui/index.ts'
import { ChevronLeftIcon, ChevronDownIcon, FileTextIcon, WalletIcon } from '#shared/ui/icons/index.ts'
import { derivePixKey } from '#modules/partners/client/domain/derive-pix-key.ts'
import {
  page,
  scrollArea,
  content,
  head,
  backBtn,
  headTitle,
  sectionCard,
  sectionHeader,
  sectionIcon,
  sectionH2,
  sectionBody,
  grid,
  field,
  fieldLabel,
  control,
  select,
  chevron,
  input,
  controlError,
  fieldError,
  actionbar,
  actionbarInner,
  btnPrimary,
  btnGhost,
} from '#shared/ui/brand/brand-form.css.ts'

import type { FinancierFormController } from './financier-form.controller.ts'
import { PIX_KEY_TYPES, isPixKeyType } from './financier-form.controller.ts'
import { errorBanner } from './financier-form.css.ts'
import { formErrorTag } from '#modules/partners/client/shared/form-error-labels.ts'

const t = createTranslator(ptBR)

export type FinancierFormProps = Readonly<{
  controller: FinancierFormController
  running: boolean
  errorTag: string | null
  onCancel: () => void
  onBack: () => void
  /** Título do cabeçalho; default = "Novo Financiador". A edição passa "Editar Financiador". */
  title?: string
}>

// Wrapper de <select> "brand": appearance:none + chevron desenhado (o mock remove a seta nativa).
function SelectControl({
  id,
  value,
  ariaLabel,
  invalid = false,
  onChange,
  children,
}: {
  id: string
  value: string
  ariaLabel?: string
  invalid?: boolean
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: ReactNode
}): ReactNode {
  return (
    <div className={control}>
      <select
        id={id}
        className={`${select} ${invalid ? controlError : ''}`}
        value={value}
        aria-label={ariaLabel}
        onChange={onChange}
      >
        {children}
      </select>
      <span className={chevron}>
        <ChevronDownIcon size={16} />
      </span>
    </div>
  )
}

export function FinancierForm(props: FinancierFormProps): ReactNode {
  const { controller: c } = props
  const isInvalid = (key: string): boolean => c.errors[key] !== undefined
  const invalidMsg = (key: string): string | null => {
    // O slug do schema vira frase pelo mapa compartilhado; regra ainda não nomeada cai na genérica.
    const tag = formErrorTag(c.errors[key], 'partners.financiers.form.invalid')
    return tag === null ? null : t(tag)
  }

  return (
    <form
      className={page}
      onSubmit={(e) => {
        e.preventDefault()
        c.submit()
      }}
    >
      <div className={scrollArea}>
        <div className={content}>
          {/* Cabeçalho: voltar + título */}
          <div className={head}>
            <button type="button" className={backBtn} onClick={props.onBack} aria-label={t('common.back')}>
              <ChevronLeftIcon size={18} />
            </button>
            <h1 className={headTitle}>{props.title ?? t('partners.financiers.create.title')}</h1>
          </div>

          {props.errorTag !== null ? (
            <div className={errorBanner} role="alert">
              {t(props.errorTag)}
            </div>
          ) : null}

          {/* Dados do financiador */}
          <section className={sectionCard}>
            <div className={sectionHeader}>
              <span className={sectionIcon}>
                <FileTextIcon size={17} />
              </span>
              <h2 className={sectionH2}>{t('partners.financiers.form.section.basic')}</h2>
            </div>
            <div className={sectionBody}>
              <div className={grid}>
                <div className={field}>
                  <label htmlFor="fin-name" className={fieldLabel}>
                    {t('partners.financiers.form.name')}
                  </label>
                  <input
                    id="fin-name"
                    className={`${input} ${isInvalid('name') ? controlError : ''}`}
                    value={c.state.name}
                    onChange={(e) => {
                      c.setField('name', e.target.value)
                    }}
                  />
                  {invalidMsg('name') !== null ? (
                    <span className={fieldError}>{invalidMsg('name')}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="fin-corp" className={fieldLabel}>
                    {t('partners.financiers.form.corporateName')}
                  </label>
                  <input
                    id="fin-corp"
                    className={`${input} ${isInvalid('corporateName') ? controlError : ''}`}
                    value={c.state.corporateName}
                    onChange={(e) => {
                      c.setField('corporateName', e.target.value)
                    }}
                  />
                  {invalidMsg('corporateName') !== null ? (
                    <span className={fieldError}>{invalidMsg('corporateName')}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="fin-rep" className={fieldLabel}>
                    {t('partners.financiers.form.legalRepresentative')}
                  </label>
                  <input
                    id="fin-rep"
                    className={`${input} ${isInvalid('legalRepresentative') ? controlError : ''}`}
                    value={c.state.legalRepresentative}
                    onChange={(e) => {
                      c.setField('legalRepresentative', e.target.value)
                    }}
                  />
                  {invalidMsg('legalRepresentative') !== null ? (
                    <span className={fieldError}>{invalidMsg('legalRepresentative')}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="fin-cnpj" className={fieldLabel}>
                    {t('partners.financiers.form.cnpj')}
                  </label>
                  <input
                    id="fin-cnpj"
                    className={`${input} ${isInvalid('cnpj') ? controlError : ''}`}
                    value={formatMask('cnpj', c.state.cnpj)}
                    onChange={(e) => {
                      c.setField('cnpj', unmask(e.target.value, 'cnpj'))
                    }}
                  />
                  {invalidMsg('cnpj') !== null ? (
                    <span className={fieldError}>{invalidMsg('cnpj')}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="fin-tel" className={fieldLabel}>
                    {t('partners.financiers.form.telephone')}
                  </label>
                  <input
                    id="fin-tel"
                    inputMode="numeric"
                    className={`${input} ${isInvalid('telephone') ? controlError : ''}`}
                    value={formatMask('phone', c.state.telephone)}
                    onChange={(e) => {
                      c.setField('telephone', unmask(e.target.value, 'phone'))
                    }}
                  />
                  {invalidMsg('telephone') !== null ? (
                    <span className={fieldError}>{invalidMsg('telephone')}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="fin-addr" className={fieldLabel}>
                    {t('partners.financiers.form.address')}
                  </label>
                  <input
                    id="fin-addr"
                    className={`${input} ${isInvalid('address') ? controlError : ''}`}
                    value={c.state.address}
                    onChange={(e) => {
                      c.setField('address', e.target.value)
                    }}
                  />
                  {invalidMsg('address') !== null ? (
                    <span className={fieldError}>{invalidMsg('address')}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {/* Dados bancários + PIX (#40) — opcionais. Presença inferida do preenchimento (sem checkbox);
              banco parcial é bloqueado pelo schema. Espelha o Fornecedor. */}
          <section className={sectionCard}>
            <div className={sectionHeader}>
              <span className={sectionIcon}>
                <WalletIcon size={17} />
              </span>
              <h2 className={sectionH2}>{t('partners.financiers.form.section.bank')}</h2>
            </div>
            <div className={sectionBody}>
              <div className={grid}>
                <div className={field}>
                  <label htmlFor="fin-bank" className={fieldLabel}>
                    {t('partners.financiers.form.bank')}
                  </label>
                  <BankSelect
                    id="fin-bank"
                    value={c.state.bank}
                    labels={BANK_LABELS}
                    invalid={isInvalid('bankAccount.bank')}
                    ariaLabel={t('partners.financiers.form.bank')}
                    onChange={(code) => {
                      c.setField('bank', code)
                    }}
                  />
                  {invalidMsg('bankAccount.bank') !== null ? (
                    <span className={fieldError}>{invalidMsg('bankAccount.bank')}</span>
                  ) : isUnknownBank(c.state.bank) ? (
                    <span className={fieldError}>{BANK_UNKNOWN_HINT}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="fin-agency" className={fieldLabel}>
                    {t('partners.financiers.form.agency')}
                  </label>
                  <input
                    id="fin-agency"
                    inputMode="numeric"
                    className={`${input} ${isInvalid('bankAccount.agency') ? controlError : ''}`}
                    value={formatMask('agency', c.state.agency)}
                    onChange={(e) => {
                      c.setField('agency', unmask(e.target.value, 'agency'))
                    }}
                  />
                  {invalidMsg('bankAccount.agency') !== null ? (
                    <span className={fieldError}>{invalidMsg('bankAccount.agency')}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="fin-account" className={fieldLabel}>
                    {t('partners.financiers.form.accountNumber')}
                  </label>
                  <input
                    id="fin-account"
                    className={`${input} ${isInvalid('bankAccount.accountNumber') ? controlError : ''}`}
                    value={c.state.accountNumber}
                    onChange={(e) => {
                      c.setField('accountNumber', e.target.value)
                    }}
                  />
                  {invalidMsg('bankAccount.accountNumber') !== null ? (
                    <span className={fieldError}>{invalidMsg('bankAccount.accountNumber')}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="fin-dv" className={fieldLabel}>
                    {t('partners.financiers.form.checkDigit')}
                  </label>
                  <input
                    id="fin-dv"
                    className={`${input} ${isInvalid('bankAccount.checkDigit') ? controlError : ''}`}
                    value={c.state.checkDigit}
                    onChange={(e) => {
                      c.setField('checkDigit', e.target.value)
                    }}
                  />
                  {invalidMsg('bankAccount.checkDigit') !== null ? (
                    <span className={fieldError}>{invalidMsg('bankAccount.checkDigit')}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="fin-pix-type" className={fieldLabel}>
                    {t('partners.financiers.form.pixKeyType')}
                  </label>
                  <SelectControl
                    id="fin-pix-type"
                    value={c.state.pixKeyType}
                    ariaLabel={t('partners.financiers.form.pixKeyType')}
                    onChange={(e) => {
                      if (isPixKeyType(e.target.value)) {
                        c.setField('pixKeyType', e.target.value)
                        // Auto-preenche a chave com o dado correspondente do form (editável).
                        c.setField(
                          'pixKey',
                          derivePixKey(e.target.value, {
                            document: c.state.cnpj,
                            telephone: c.state.telephone,
                          }),
                        )
                      }
                    }}
                  >
                    {PIX_KEY_TYPES.map((k) => (
                      <option key={k} value={k}>
                        {t(`partners.financiers.pix.${k}`)}
                      </option>
                    ))}
                  </SelectControl>
                </div>

                <div className={field}>
                  <label htmlFor="fin-pix-key" className={fieldLabel}>
                    {t('partners.financiers.form.pixKey')}
                  </label>
                  <input
                    id="fin-pix-key"
                    className={`${input} ${isInvalid('pixKey.key') ? controlError : ''}`}
                    value={c.state.pixKey}
                    onChange={(e) => {
                      c.setField('pixKey', e.target.value)
                    }}
                  />
                  {invalidMsg('pixKey.key') !== null ? (
                    <span className={fieldError}>{invalidMsg('pixKey.key')}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Barra de ações fixa */}
      <div className={actionbar}>
        <div className={actionbarInner}>
          <button type="button" className={btnGhost} onClick={props.onCancel}>
            {t('partners.financiers.form.cancel')}
          </button>
          <button type="submit" className={btnPrimary} disabled={props.running}>
            {props.running ? t('partners.financiers.form.saving') : t('partners.financiers.form.save')}
          </button>
        </div>
      </div>
    </form>
  )
}
