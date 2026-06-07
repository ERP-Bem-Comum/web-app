import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Button, Field, Input } from '#shared/ui/index.ts'

import {
  OCCUPATION_AREAS,
  EMPLOYMENT_RELATIONSHIPS,
  type ActFormController,
} from './act-form.controller.ts'
import {
  cancelButton,
  errorBanner,
  footer,
  form,
  grid,
  saveWrap,
  section,
  sectionTitle,
  select,
} from './act-form.css.ts'

const t = createTranslator(ptBR)

export type ActFormProps = Readonly<{
  controller: ActFormController
  running: boolean
  errorTag: string | null
  onCancel: () => void
}>

export function ActForm(props: ActFormProps): ReactNode {
  const { controller: c } = props
  const invalid = (key: string): string | undefined =>
    c.errors[key] === true ? t('partners.acts.form.invalid') : undefined

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
        <h2 className={sectionTitle}>{t('partners.acts.form.section.basic')}</h2>
        <div className={grid}>
          <Field htmlFor="act-name" label={t('partners.acts.form.name')} error={invalid('name')}>
            <Input id="act-name" value={c.state.name} onChange={(v) => { c.setField('name', v); }} />
          </Field>
          <Field htmlFor="act-email" label={t('partners.acts.form.email')} error={invalid('email')}>
            <Input id="act-email" type="email" value={c.state.email} onChange={(v) => { c.setField('email', v); }} />
          </Field>
          <Field htmlFor="act-cpf" label={t('partners.acts.form.cpf')} error={invalid('cpf')}>
            <Input id="act-cpf" value={c.state.cpf} onChange={(v) => { c.setField('cpf', v); }} />
          </Field>
          <Field htmlFor="act-role" label={t('partners.acts.form.role')} error={invalid('role')}>
            <Input id="act-role" value={c.state.role} onChange={(v) => { c.setField('role', v); }} />
          </Field>
          <Field htmlFor="act-area" label={t('partners.acts.form.occupationArea')} error={invalid('occupationArea')}>
            <select
              id="act-area"
              className={select}
              value={c.state.occupationArea}
              onChange={(e) => { c.setField('occupationArea', e.target.value); }}
            >
              <option value="">{t('partners.acts.form.select')}</option>
              {OCCUPATION_AREAS.map((a) => (
                <option key={a} value={a}>
                  {t(`partners.acts.area.${a}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field htmlFor="act-vinc" label={t('partners.acts.form.employmentRelationship')} error={invalid('employmentRelationship')}>
            <select
              id="act-vinc"
              className={select}
              value={c.state.employmentRelationship}
              onChange={(e) => { c.setField('employmentRelationship', e.target.value); }}
            >
              <option value="">{t('partners.acts.form.select')}</option>
              {EMPLOYMENT_RELATIONSHIPS.map((v) => (
                <option key={v} value={v}>
                  {t(`partners.acts.employment.${v}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field htmlFor="act-start" label={t('partners.acts.form.startOfContract')} error={invalid('startOfContract')}>
            <Input id="act-start" type="date" value={c.state.startOfContract} onChange={(v) => { c.setField('startOfContract', v); }} />
          </Field>
        </div>
      </section>

      <div className={footer}>
        <button type="button" className={cancelButton} onClick={props.onCancel}>
          {t('partners.acts.form.cancel')}
        </button>
        <div className={saveWrap}>
          <Button type="submit" loading={props.running} loadingLabel={t('partners.acts.form.saving')}>
            {t('partners.acts.form.save')}
          </Button>
        </div>
      </div>
    </form>
  )
}
