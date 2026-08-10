import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Badge, formatMask, unmask, type InputMask } from '#shared/ui/index.ts'
import { FileTextIcon, WalletIcon, ChevronDownIcon } from '#shared/ui/icons/index.ts'
import {
  type FinancierFormController,
  type FinancierFormState,
  PIX_KEY_TYPES,
  isPixKeyType,
} from '#modules/partners/client/financier-create/components/financier-form.controller.ts'
import type { ActivationStatus } from '#modules/partners/client/domain/financier.types.ts'
import {
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
} from '#shared/ui/brand/brand-form.css.ts'

const t = createTranslator(ptBR)

export type FinancierDetailContentProps = Readonly<{
  controller: FinancierFormController
  editing: boolean
  activation: ActivationStatus
}>

// Wrapper de <select> "brand": appearance:none + chevron desenhado (o mock remove a seta nativa).
function SelectControl({
  id,
  value,
  ariaLabel,
  disabled,
  onChange,
  children,
}: {
  id: string
  value: string
  ariaLabel?: string
  disabled: boolean
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: ReactNode
}): ReactNode {
  return (
    <div className={control}>
      <select
        id={id}
        className={select}
        value={value}
        aria-label={ariaLabel}
        disabled={disabled}
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

export function FinancierDetailContent(props: FinancierDetailContentProps): ReactNode {
  const { controller: c, editing } = props
  const isInvalid = (key: string): boolean => c.errors[key] === true
  const invalidMsg = (key: string): string | null =>
    c.errors[key] === true ? t('partners.financiers.form.invalid') : null

  const txt = (key: keyof FinancierFormState, label: string, mask?: InputMask): ReactNode => {
    const display = mask !== undefined ? formatMask(mask, c.state[key]) : c.state[key]
    return (
      <div className={field}>
        <label htmlFor={`fd-${key}`} className={fieldLabel}>
          {label}
        </label>
        <input
          id={`fd-${key}`}
          className={`${input} ${isInvalid(key) ? controlError : ''}`}
          value={display}
          disabled={!editing}
          inputMode={mask !== undefined ? 'numeric' : undefined}
          onChange={(e) => {
            c.setField(key, mask !== undefined ? unmask(e.target.value, mask) : e.target.value)
          }}
        />
        {invalidMsg(key) !== null ? <span className={fieldError}>{invalidMsg(key)}</span> : null}
      </div>
    )
  }

  return (
    <>
      <section className={sectionCard}>
        <div className={sectionHeader}>
          <span className={sectionIcon}>
            <FileTextIcon size={17} />
          </span>
          <h2 className={sectionH2}>{t('partners.financiers.form.section.basic')}</h2>
        </div>
        <div className={sectionBody}>
          <div style={{ marginBottom: '0.75rem' }}>
            <Badge variant={props.activation === 'active' ? 'active' : 'terminated'} uppercase size="sm">
              {t(`partners.financiers.status.${props.activation}`)}
            </Badge>
          </div>
          <div className={grid}>
            {txt('name', t('partners.financiers.form.name'))}
            {txt('corporateName', t('partners.financiers.form.corporateName'))}
            {txt('legalRepresentative', t('partners.financiers.form.legalRepresentative'))}
            {txt('cnpj', t('partners.financiers.form.cnpj'), 'cnpj')}
            {txt('telephone', t('partners.financiers.form.telephone'), 'phone')}
            {txt('address', t('partners.financiers.form.address'))}
          </div>
        </div>
      </section>

      {/* Dados bancários + PIX (#40) — exibe/edita; vazios quando o financiador não tem payment-target. */}
      <section className={sectionCard}>
        <div className={sectionHeader}>
          <span className={sectionIcon}>
            <WalletIcon size={17} />
          </span>
          <h2 className={sectionH2}>{t('partners.financiers.form.section.bank')}</h2>
        </div>
        <div className={sectionBody}>
          <div className={grid}>
            {txt('bank', t('partners.financiers.form.bank'))}
            {txt('agency', t('partners.financiers.form.agency'), 'agency')}
            {txt('accountNumber', t('partners.financiers.form.accountNumber'))}
            {txt('checkDigit', t('partners.financiers.form.checkDigit'))}
            <div className={field}>
              <label htmlFor="fd-pixKeyType" className={fieldLabel}>
                {t('partners.financiers.form.pixKeyType')}
              </label>
              <SelectControl
                id="fd-pixKeyType"
                value={c.state.pixKeyType}
                ariaLabel={t('partners.financiers.form.pixKeyType')}
                disabled={!editing}
                onChange={(e) => {
                  if (isPixKeyType(e.target.value)) c.setField('pixKeyType', e.target.value)
                }}
              >
                {PIX_KEY_TYPES.map((k) => (
                  <option key={k} value={k}>
                    {t(`partners.financiers.pix.${k}`)}
                  </option>
                ))}
              </SelectControl>
            </div>
            {txt('pixKey', t('partners.financiers.form.pixKey'))}
          </div>
        </div>
      </section>
    </>
  )
}
