import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Button, Field, Input } from '#shared/ui/index.ts'
import { FileTextIcon, WalletIcon } from '#shared/ui/icons/index.ts'

import type { FinancierFormController } from './financier-form.controller.ts'
import {
  cancelButton,
  errorBanner,
  footer,
  form,
  gatedNote,
  grid,
  saveWrap,
  section,
  sectionTitle,
  select,
} from './financier-form.css.ts'

const PIX_KEY_TYPES = ['cpf', 'cnpj', 'email', 'phone', 'random-key'] as const

const t = createTranslator(ptBR)

export type FinancierFormProps = Readonly<{
  controller: FinancierFormController
  running: boolean
  errorTag: string | null
  onCancel: () => void
}>

export function FinancierForm(props: FinancierFormProps): ReactNode {
  const { controller: c } = props
  const invalid = (key: string): string | undefined =>
    c.errors[key] === true ? t('partners.financiers.form.invalid') : undefined

  return (
    <form
      className={form}
      onSubmit={(e) => {
        e.preventDefault()
        c.submit()
      }}
    >
      {props.errorTag !== null ? (
        <div className={errorBanner} role="alert">
          {t(props.errorTag)}
        </div>
      ) : null}

      <section className={section}>
        <h2 className={sectionTitle}><FileTextIcon size={18} />{t('partners.financiers.form.section.basic')}</h2>
        <div className={grid}>
          <Field htmlFor="fin-name" label={t('partners.financiers.form.name')} error={invalid('name')}>
            <Input id="fin-name" value={c.state.name} onChange={(v) => { c.setField('name', v); }} />
          </Field>
          <Field htmlFor="fin-corp" label={t('partners.financiers.form.corporateName')} error={invalid('corporateName')}>
            <Input id="fin-corp" value={c.state.corporateName} onChange={(v) => { c.setField('corporateName', v); }} />
          </Field>
          <Field htmlFor="fin-rep" label={t('partners.financiers.form.legalRepresentative')} error={invalid('legalRepresentative')}>
            <Input id="fin-rep" value={c.state.legalRepresentative} onChange={(v) => { c.setField('legalRepresentative', v); }} />
          </Field>
          <Field htmlFor="fin-cnpj" label={t('partners.financiers.form.cnpj')} error={invalid('cnpj')}>
            <Input id="fin-cnpj" mask="cnpj" value={c.state.cnpj} onChange={(v) => { c.setField('cnpj', v); }} />
          </Field>
          <Field htmlFor="fin-tel" label={t('partners.financiers.form.telephone')} error={invalid('telephone')}>
            <Input id="fin-tel" mask="phone" value={c.state.telephone} onChange={(v) => { c.setField('telephone', v); }} />
          </Field>
          <Field htmlFor="fin-addr" label={t('partners.financiers.form.address')} error={invalid('address')}>
            <Input id="fin-addr" value={c.state.address} onChange={(v) => { c.setField('address', v); }} />
          </Field>
        </div>
      </section>

      {/* Dados bancários — GATED: o backend ainda não aceita conta bancária p/ financiador
          (ver handbook/core-api/tickets/PAR-FINANCIER-COLLAB-BANK.md). Campos visíveis e
          desabilitados; ao liberar o backend, habilitar + ligar no controller/mapeador. */}
      <section className={section}>
        <h2 className={sectionTitle}><WalletIcon size={18} />{t('partners.financiers.form.section.bank')}</h2>
        <p className={gatedNote}>{t('partners.financiers.form.bankGatedHint')}</p>
        <div className={grid}>
          <Field htmlFor="fin-bank" label={t('partners.financiers.form.bank')}>
            <Input id="fin-bank" value="" disabled onChange={() => { /* gated */ }} />
          </Field>
          <Field htmlFor="fin-agency" label={t('partners.financiers.form.agency')}>
            <Input id="fin-agency" mask="agency" value="" disabled onChange={() => { /* gated */ }} />
          </Field>
          <Field htmlFor="fin-account" label={t('partners.financiers.form.accountNumber')}>
            <Input id="fin-account" value="" disabled onChange={() => { /* gated */ }} />
          </Field>
          <Field htmlFor="fin-dv" label={t('partners.financiers.form.checkDigit')}>
            <Input id="fin-dv" value="" disabled onChange={() => { /* gated */ }} />
          </Field>
          <Field htmlFor="fin-pix-type" label={t('partners.financiers.form.pixKeyType')}>
            <select id="fin-pix-type" className={select} disabled defaultValue="" aria-label={t('partners.financiers.form.pixKeyType')}>
              <option value="">{t('partners.financiers.form.select')}</option>
              {PIX_KEY_TYPES.map((k) => (
                <option key={k} value={k}>{t(`partners.financiers.pix.${k}`)}</option>
              ))}
            </select>
          </Field>
          <Field htmlFor="fin-pix-key" label={t('partners.financiers.form.pixKey')}>
            <Input id="fin-pix-key" value="" disabled onChange={() => { /* gated */ }} />
          </Field>
        </div>
      </section>

      <div className={footer}>
        <button type="button" className={cancelButton} onClick={props.onCancel}>
          {t('partners.financiers.form.cancel')}
        </button>
        <div className={saveWrap}>
          <Button type="submit" loading={props.running} loadingLabel={t('partners.financiers.form.saving')}>
            {t('partners.financiers.form.save')}
          </Button>
        </div>
      </div>
    </form>
  )
}
