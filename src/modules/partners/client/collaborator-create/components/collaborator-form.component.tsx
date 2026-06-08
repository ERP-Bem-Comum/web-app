import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Button, Field, Input } from '#shared/ui/index.ts'

import {
  OCCUPATION_AREAS,
  EMPLOYMENT_RELATIONSHIPS,
  type CollaboratorFormController,
} from './collaborator-form.controller.ts'
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
} from './collaborator-form.css.ts'

const t = createTranslator(ptBR)

export type CollaboratorFormProps = Readonly<{
  controller: CollaboratorFormController
  running: boolean
  errorTag: string | null
  onCancel: () => void
}>

export function CollaboratorForm(props: CollaboratorFormProps): ReactNode {
  const { controller: c } = props
  const invalid = (key: string): string | undefined =>
    c.errors[key] === true ? t('partners.collaborators.form.invalid') : undefined

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
        <h2 className={sectionTitle}>{t('partners.collaborators.form.section.basic')}</h2>
        <div className={grid}>
          <Field htmlFor="collab-name" label={t('partners.collaborators.form.name')} error={invalid('name')}>
            <Input id="collab-name" value={c.state.name} onChange={(v) => { c.setField('name', v); }} />
          </Field>
          <Field htmlFor="collab-email" label={t('partners.collaborators.form.email')} error={invalid('email')}>
            <Input id="collab-email" type="email" value={c.state.email} onChange={(v) => { c.setField('email', v); }} />
          </Field>
          <Field htmlFor="collab-cpf" label={t('partners.collaborators.form.cpf')} error={invalid('cpf')}>
            <Input id="collab-cpf" value={c.state.cpf} onChange={(v) => { c.setField('cpf', v); }} />
          </Field>
          <Field htmlFor="collab-role" label={t('partners.collaborators.form.role')} error={invalid('role')}>
            <Input id="collab-role" value={c.state.role} onChange={(v) => { c.setField('role', v); }} />
          </Field>
          <Field htmlFor="collab-area" label={t('partners.collaborators.form.occupationArea')} error={invalid('occupationArea')}>
            <select
              id="collab-area"
              className={select}
              value={c.state.occupationArea}
              onChange={(e) => { c.setField('occupationArea', e.target.value); }}
            >
              <option value="">{t('partners.collaborators.form.select')}</option>
              {OCCUPATION_AREAS.map((a) => (
                <option key={a} value={a}>
                  {t(`partners.collaborators.area.${a}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field htmlFor="collab-vinc" label={t('partners.collaborators.form.employmentRelationship')} error={invalid('employmentRelationship')}>
            <select
              id="collab-vinc"
              className={select}
              value={c.state.employmentRelationship}
              onChange={(e) => { c.setField('employmentRelationship', e.target.value); }}
            >
              <option value="">{t('partners.collaborators.form.select')}</option>
              {EMPLOYMENT_RELATIONSHIPS.map((v) => (
                <option key={v} value={v}>
                  {t(`partners.collaborators.employment.${v}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field htmlFor="collab-start" label={t('partners.collaborators.form.startOfContract')} error={invalid('startOfContract')}>
            <Input id="collab-start" type="date" value={c.state.startOfContract} onChange={(v) => { c.setField('startOfContract', v); }} />
          </Field>
        </div>
      </section>

      <div className={footer}>
        <button type="button" className={cancelButton} onClick={props.onCancel}>
          {t('partners.collaborators.form.cancel')}
        </button>
        <div className={saveWrap}>
          <Button type="submit" loading={props.running} loadingLabel={t('partners.collaborators.form.saving')}>
            {t('partners.collaborators.form.save')}
          </Button>
        </div>
      </div>
    </form>
  )
}
