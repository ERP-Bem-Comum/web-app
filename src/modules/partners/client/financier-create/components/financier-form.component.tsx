import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Button, Field, Input } from '#shared/ui/index.ts'

import type { FinancierFormController } from './financier-form.controller.ts'
import {
  cancelButton,
  errorBanner,
  footer,
  form,
  grid,
  saveWrap,
  section,
  sectionTitle,
} from './financier-form.css.ts'

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
        <h2 className={sectionTitle}>{t('partners.financiers.form.section.basic')}</h2>
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
            <Input id="fin-cnpj" value={c.state.cnpj} onChange={(v) => { c.setField('cnpj', v); }} />
          </Field>
          <Field htmlFor="fin-tel" label={t('partners.financiers.form.telephone')} error={invalid('telephone')}>
            <Input id="fin-tel" value={c.state.telephone} onChange={(v) => { c.setField('telephone', v); }} />
          </Field>
          <Field htmlFor="fin-addr" label={t('partners.financiers.form.address')} error={invalid('address')}>
            <Input id="fin-addr" value={c.state.address} onChange={(v) => { c.setField('address', v); }} />
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
