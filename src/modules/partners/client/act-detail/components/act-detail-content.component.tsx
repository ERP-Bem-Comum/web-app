import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Badge, Field, Input } from '#shared/ui/index.ts'
import {
  OCCUPATION_AREAS,
  EMPLOYMENT_RELATIONSHIPS,
  type ActFormController,
  type ActFormState,
} from '#modules/partners/client/act-create/components/act-form.controller.ts'
import type { ActivationStatus } from '#modules/partners/client/domain/act.types.ts'

import { stack, section, sectionTitle, statusRow, fieldGrid, select } from './act-detail-content.css.ts'

const t = createTranslator(ptBR)

export type ActDetailContentProps = Readonly<{
  controller: ActFormController
  editing: boolean
  activation: ActivationStatus
}>

export function ActDetailContent(props: ActDetailContentProps): ReactNode {
  const { controller: c, editing } = props
  const invalid = (key: string): string | undefined =>
    c.errors[key] === true ? t('partners.acts.form.invalid') : undefined

  const txt = (key: keyof ActFormState, label: string, type?: 'text' | 'email' | 'date', mask?: 'cpf' | 'cnpj' | 'phone'): ReactNode => (
    <Field htmlFor={`ad-${key}`} label={label} error={invalid(key)}>
      <Input id={`ad-${key}`} type={type} mask={mask} value={c.state[key]} disabled={!editing} onChange={(v) => { c.setField(key, v); }} />
    </Field>
  )

  return (
    <div className={stack}>
      <section className={section}>
        <h2 className={sectionTitle}>{t('partners.acts.form.section.basic')}</h2>
        <div className={statusRow}>
          <Badge variant={props.activation === 'active' ? 'active' : 'outro'}>
            {t(`partners.acts.status.${props.activation}`)}
          </Badge>
        </div>
        <div className={fieldGrid}>
          {txt('name', t('partners.acts.form.name'))}
          {txt('email', t('partners.acts.form.email'), 'email')}
          {txt('cpf', t('partners.acts.form.cpf'), undefined, 'cpf')}
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
          {txt('role', t('partners.acts.form.role'))}
          {txt('startOfContract', t('partners.acts.form.startOfContract'), 'date')}
          <Field htmlFor="ad-employmentRelationship" label={t('partners.acts.form.employmentRelationship')} error={invalid('employmentRelationship')}>
            <select
              id="ad-employmentRelationship"
              className={select}
              value={c.state.employmentRelationship}
              disabled={!editing}
              onChange={(e) => { c.setField('employmentRelationship', e.target.value); }}
            >
              <option value="">{t('partners.acts.form.select')}</option>
              {EMPLOYMENT_RELATIONSHIPS.map((v) => (
                <option key={v} value={v}>{t(`partners.acts.employment.${v}`)}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>
    </div>
  )
}
