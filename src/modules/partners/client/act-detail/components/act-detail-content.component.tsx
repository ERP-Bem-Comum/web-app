import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Badge, Checkbox, Field, Input } from '#shared/ui/index.ts'
import { FileTextIcon, HeartHandshakeIcon, WalletIcon } from '#shared/ui/icons/index.ts'
import {
  OCCUPATION_AREAS,
  PIX_KEY_TYPES,
  isPixKeyType,
  type ActFormController,
  type ActFormState,
} from '#modules/partners/client/act-create/components/act-form.controller.ts'

import { stack, section, sectionTitle, statusRow, fieldGrid, select } from './act-detail-content.css.ts'

const t = createTranslator(ptBR)

export type ActDetailContentProps = Readonly<{
  controller: ActFormController
  editing: boolean
  active: boolean
}>

export function ActDetailContent(props: ActDetailContentProps): ReactNode {
  const { controller: c, editing } = props
  const invalid = (key: string): string | undefined =>
    c.errors[key] === true ? t('partners.acts.form.invalid') : undefined

  // Só campos string do estado (exclui o boolean `hasFinancialTransfer` e o enum `pixKeyType`).
  type TextKey = {
    [K in keyof ActFormState]: ActFormState[K] extends string ? K : never
  }[keyof ActFormState]
  const txt = (
    key: Exclude<TextKey, 'pixKeyType'>,
    label: string,
    errKey: string,
    opts?: Readonly<{ type?: 'text' | 'email' | 'date'; mask?: 'cpf' | 'cnpj' | 'phone' }>,
  ): ReactNode => (
    <Field htmlFor={`ad-${key}`} label={label} error={invalid(errKey)}>
      <Input
        id={`ad-${key}`}
        type={opts?.type}
        mask={opts?.mask}
        value={c.state[key]}
        disabled={!editing}
        onChange={(v) => { c.setField(key, v); }}
      />
    </Field>
  )

  return (
    <div className={stack}>
      <section className={section}>
        <h2 className={sectionTitle}><FileTextIcon size={18} />{t('partners.acts.form.section.instrument')}</h2>
        <div className={statusRow}>
          <Badge variant={props.active ? 'active' : 'outro'}>
            {t(`partners.acts.status.${props.active ? 'active' : 'inactive'}`)}
          </Badge>
        </div>
        <div className={fieldGrid}>
          {txt('actNumber', t('partners.acts.form.actNumber'), 'actNumber')}
          {txt('name', t('partners.acts.form.name'), 'name')}
          <Field htmlFor="ad-occupationArea" label={t('partners.acts.form.occupationArea')} error={invalid('occupationArea')}>
            <select
              id="ad-occupationArea"
              className={select}
              value={c.state.occupationArea}
              disabled={!editing}
              onChange={(e) => { c.setField('occupationArea', e.target.value); }}
            >
              <option value="">{t('partners.acts.form.select')}</option>
              {OCCUPATION_AREAS.map((a) => (
                <option key={a} value={a}>{t(`partners.acts.area.${a}`)}</option>
              ))}
            </select>
          </Field>
          {txt('startDate', t('partners.acts.form.startDate'), 'startDate', { type: 'date' })}
          {txt('endDate', t('partners.acts.form.endDate'), 'endDate', { type: 'date' })}
        </div>
      </section>

      <section className={section}>
        <h2 className={sectionTitle}><HeartHandshakeIcon size={18} />{t('partners.acts.form.section.institution')}</h2>
        <div className={fieldGrid}>
          {txt('cnpj', t('partners.acts.form.cnpj'), 'cnpj', { mask: 'cnpj' })}
          {txt('corporateName', t('partners.acts.form.corporateName'), 'corporateName')}
          {txt('fantasyName', t('partners.acts.form.fantasyName'), 'fantasyName')}
          {txt('legalRepresentative', t('partners.acts.form.legalRepresentative'), 'legalRepresentative')}
          {txt('email', t('partners.acts.form.email'), 'email', { type: 'email' })}
        </div>
      </section>

      <section className={section}>
        <h2 className={sectionTitle}><WalletIcon size={18} />{t('partners.acts.form.section.payment')}</h2>
        <div className={fieldGrid}>
          <Field htmlFor="ad-transfer" label={t('partners.acts.form.hasFinancialTransfer')} error={invalid('hasFinancialTransfer')}>
            <Checkbox id="ad-transfer" checked={c.state.hasFinancialTransfer} disabled={!editing} onChange={(v) => { c.setField('hasFinancialTransfer', v); }} />
          </Field>
        </div>
        {c.state.hasFinancialTransfer ? (
          <div className={fieldGrid}>
            {txt('bank', t('partners.acts.form.bank'), 'bankAccount.bank')}
            {txt('agency', t('partners.acts.form.agency'), 'bankAccount.agency')}
            {txt('accountNumber', t('partners.acts.form.accountNumber'), 'bankAccount.accountNumber')}
            {txt('checkDigit', t('partners.acts.form.checkDigit'), 'bankAccount.checkDigit')}
            <Field htmlFor="ad-pix-type" label={t('partners.acts.form.pixType')} error={invalid('pixKey.keyType')}>
              <select
                id="ad-pix-type"
                className={select}
                value={c.state.pixKeyType}
                disabled={!editing}
                onChange={(e) => { if (isPixKeyType(e.target.value)) c.setField('pixKeyType', e.target.value) }}
              >
                {PIX_KEY_TYPES.map((pt) => (
                  <option key={pt} value={pt}>{t(`partners.acts.pix.${pt}`)}</option>
                ))}
              </select>
            </Field>
            {txt('pixKey', t('partners.acts.form.pixKey'), 'pixKey.key')}
          </div>
        ) : null}
      </section>
    </div>
  )
}
