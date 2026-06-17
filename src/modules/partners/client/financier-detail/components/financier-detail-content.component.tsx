import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Badge, Field, Input } from '#shared/ui/index.ts'
import { FileTextIcon, WalletIcon } from '#shared/ui/icons/index.ts'
import {
  type FinancierFormController,
  type FinancierFormState,
  PIX_KEY_TYPES,
  isPixKeyType,
} from '#modules/partners/client/financier-create/components/financier-form.controller.ts'
import type { ActivationStatus } from '#modules/partners/client/domain/financier.types.ts'

import { select } from '#modules/partners/client/financier-create/components/financier-form.css.ts'
import { stack, section, sectionTitle, statusRow, fieldGrid } from './financier-detail-content.css.ts'

const t = createTranslator(ptBR)

export type FinancierDetailContentProps = Readonly<{
  controller: FinancierFormController
  editing: boolean
  activation: ActivationStatus
}>

export function FinancierDetailContent(props: FinancierDetailContentProps): ReactNode {
  const { controller: c, editing } = props
  const invalid = (key: string): string | undefined =>
    c.errors[key] === true ? t('partners.financiers.form.invalid') : undefined

  const txt = (
    key: keyof FinancierFormState,
    label: string,
    mask?: 'cpf' | 'cnpj' | 'phone' | 'agency',
  ): ReactNode => (
    <Field htmlFor={`fd-${key}`} label={label} error={invalid(key)}>
      <Input
        id={`fd-${key}`}
        mask={mask}
        value={c.state[key]}
        disabled={!editing}
        onChange={(v) => {
          c.setField(key, v)
        }}
      />
    </Field>
  )

  return (
    <div className={stack}>
      <section className={section}>
        <h2 className={sectionTitle}>
          <FileTextIcon size={18} />
          {t('partners.financiers.form.section.basic')}
        </h2>
        <div className={statusRow}>
          <Badge variant={props.activation === 'active' ? 'active' : 'terminated'} uppercase size="sm">
            {t(`partners.financiers.status.${props.activation}`)}
          </Badge>
        </div>
        <div className={fieldGrid}>
          {txt('name', t('partners.financiers.form.name'))}
          {txt('corporateName', t('partners.financiers.form.corporateName'))}
          {txt('legalRepresentative', t('partners.financiers.form.legalRepresentative'))}
          {txt('cnpj', t('partners.financiers.form.cnpj'), 'cnpj')}
          {txt('telephone', t('partners.financiers.form.telephone'), 'phone')}
          {txt('address', t('partners.financiers.form.address'))}
        </div>
      </section>

      {/* Dados bancários + PIX (#40) — exibe/edita; vazios quando o financiador não tem payment-target. */}
      <section className={section}>
        <h2 className={sectionTitle}>
          <WalletIcon size={18} />
          {t('partners.financiers.form.section.bank')}
        </h2>
        <div className={fieldGrid}>
          {txt('bank', t('partners.financiers.form.bank'))}
          {txt('agency', t('partners.financiers.form.agency'), 'agency')}
          {txt('accountNumber', t('partners.financiers.form.accountNumber'))}
          {txt('checkDigit', t('partners.financiers.form.checkDigit'))}
          <Field htmlFor="fd-pixKeyType" label={t('partners.financiers.form.pixKeyType')}>
            <select
              id="fd-pixKeyType"
              className={select}
              value={c.state.pixKeyType}
              disabled={!editing}
              aria-label={t('partners.financiers.form.pixKeyType')}
              onChange={(e) => {
                if (isPixKeyType(e.target.value)) c.setField('pixKeyType', e.target.value)
              }}
            >
              {PIX_KEY_TYPES.map((k) => (
                <option key={k} value={k}>
                  {t(`partners.financiers.pix.${k}`)}
                </option>
              ))}
            </select>
          </Field>
          {txt('pixKey', t('partners.financiers.form.pixKey'))}
        </div>
      </section>
    </div>
  )
}
