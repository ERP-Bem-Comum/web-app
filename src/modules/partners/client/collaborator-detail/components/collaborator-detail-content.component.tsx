import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Field, Input } from '#shared/ui/index.ts'

import {
  OCCUPATION_AREAS,
  EMPLOYMENT_RELATIONSHIPS,
  type CollaboratorDetailFormController,
  type CollaboratorDetailFormState,
} from './collaborator-detail-form.controller.ts'
import { grid, gridFull, section, sectionTitle, select, textarea } from './collaborator-detail-content.css.ts'

const t = createTranslator(ptBR)

export type CollaboratorDetailContentProps = Readonly<{
  controller: CollaboratorDetailFormController
  editing: boolean
  showComplete: boolean
  preTitle: string
}>

export function CollaboratorDetailContent({ controller: c, editing, showComplete, preTitle }: CollaboratorDetailContentProps): ReactNode {
  const txt = (key: keyof CollaboratorDetailFormState, label: string, type?: 'text' | 'email' | 'date'): ReactNode => (
    <Field htmlFor={`cd-${key}`} label={label}>
      <Input id={`cd-${key}`} type={type} value={c.state[key]} disabled={!editing} onChange={(v) => { c.setField(key, v); }} />
    </Field>
  )

  const sel = (key: keyof CollaboratorDetailFormState, label: string, options: readonly Readonly<{ value: string; label: string }>[], withEmpty = true): ReactNode => (
    <Field htmlFor={`cd-${key}`} label={label}>
      <select id={`cd-${key}`} className={select} value={c.state[key]} disabled={!editing} onChange={(e) => { c.setField(key, e.target.value); }}>
        {withEmpty ? <option value="">{t('partners.collaborators.form.select')}</option> : null}
        {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </Field>
  )

  const areaOptions = OCCUPATION_AREAS.map((a) => ({ value: a, label: t(`partners.collaborators.area.${a}`) }))
  const vinculoOptions = EMPLOYMENT_RELATIONSHIPS.map((v) => ({ value: v, label: t(`partners.collaborators.employment.${v}`) }))
  const simNao = [
    { value: 'sim', label: t('partners.collaborators.detail.experience.yes') },
    { value: 'nao', label: t('partners.collaborators.detail.experience.no') },
  ]

  return (
    <>
      <section className={section}>
        <h2 className={sectionTitle}>{preTitle}</h2>
        <div className={grid}>
          {txt('name', t('partners.collaborators.form.name'))}
          {txt('email', t('partners.collaborators.form.email'), 'email')}
          {sel('occupationArea', t('partners.collaborators.form.occupationArea'), areaOptions)}
          {txt('role', t('partners.collaborators.form.role'))}
          {txt('startOfContract', t('partners.collaborators.form.startOfContract'), 'date')}
          {sel('employmentRelationship', t('partners.collaborators.form.employmentRelationship'), vinculoOptions)}
          {txt('cpf', t('partners.collaborators.form.cpf'))}
        </div>
      </section>

      {showComplete ? (
        <section className={section}>
          <h2 className={sectionTitle}>{t('partners.collaborators.detail.section.complete')}</h2>
          <div className={grid}>
            {txt('rg', t('partners.collaborators.detail.field.rg'))}
            {txt('completeAddress', t('partners.collaborators.detail.field.completeAddress'))}
            {txt('dateOfBirth', t('partners.collaborators.detail.field.dateOfBirth'), 'date')}
            {txt('telephone', t('partners.collaborators.detail.field.telephone'))}
            {txt('emergencyContactName', t('partners.collaborators.detail.field.emergencyContactName'))}
            {txt('emergencyContactTelephone', t('partners.collaborators.detail.field.emergencyContactTelephone'))}
            {txt('genderIdentity', t('partners.collaborators.detail.field.genderIdentity'))}
            {txt('race', t('partners.collaborators.detail.field.race'))}
            {txt('allergies', t('partners.collaborators.detail.field.allergies'))}
            {txt('foodCategory', t('partners.collaborators.detail.field.foodCategory'))}
            {txt('foodCategoryDescription', t('partners.collaborators.detail.field.foodCategoryDescription'))}
            {txt('education', t('partners.collaborators.detail.field.education'))}
            {sel('experienceInThePublicSector', t('partners.collaborators.detail.field.experience'), simNao)}
            <div className={gridFull}>
              <Field htmlFor="cd-biography" label={t('partners.collaborators.detail.field.biography')}>
                <textarea
                  id="cd-biography"
                  className={textarea}
                  value={c.state.biography}
                  disabled={!editing}
                  maxLength={500}
                  onChange={(e) => { c.setField('biography', e.target.value); }}
                />
              </Field>
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}
