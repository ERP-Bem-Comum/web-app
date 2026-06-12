import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Button, Field, Input } from '#shared/ui/index.ts'
import { UsersIcon, WalletIcon } from '#shared/ui/icons/index.ts'

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
  gatedNote,
  grid,
  saveWrap,
  section,
  sectionBody,
  sectionHeader,
  sectionTitle,
  select,
} from './collaborator-form.css.ts'

const t = createTranslator(ptBR)

const PIX_KEY_TYPES = ['cpf', 'cnpj', 'email', 'phone', 'random-key'] as const

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
        <div className={sectionHeader}>
          <h2 className={sectionTitle}><UsersIcon size={18} />{t('partners.collaborators.form.section.basic')}</h2>
        </div>
        <div className={sectionBody}>
        <div className={grid}>
          {/* Ordem espelhando o print: linha 1 → Representante Legal · Email · Área de atuação · Função */}
          <Field htmlFor="collab-name" label={t('partners.collaborators.form.name')} error={invalid('name')}>
            <Input id="collab-name" value={c.state.name} onChange={(v) => { c.setField('name', v); }} />
          </Field>
          <Field htmlFor="collab-email" label={t('partners.collaborators.form.email')} error={invalid('email')}>
            <Input id="collab-email" type="email" value={c.state.email} onChange={(v) => { c.setField('email', v); }} />
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
          <Field htmlFor="collab-role" label={t('partners.collaborators.form.role')} error={invalid('role')}>
            <Input id="collab-role" value={c.state.role} onChange={(v) => { c.setField('role', v); }} />
          </Field>
          {/* linha 2 → Início de Contrato · Vínculo Empregatício · CPF */}
          <Field htmlFor="collab-start" label={t('partners.collaborators.form.startOfContract')} error={invalid('startOfContract')}>
            <Input id="collab-start" type="date" value={c.state.startOfContract} onChange={(v) => { c.setField('startOfContract', v); }} />
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
          <Field htmlFor="collab-cpf" label={t('partners.collaborators.form.cpf')} error={invalid('cpf')}>
            <Input id="collab-cpf" mask="cpf" value={c.state.cpf} onChange={(v) => { c.setField('cpf', v); }} />
          </Field>
        </div>
        </div>
      </section>

      {/* Dados bancários — GATED: o backend ainda não aceita conta bancária p/ colaborador
          (ver handbook/core-api/tickets/PAR-FINANCIER-COLLAB-BANK.md). Campos visíveis e
          desabilitados; ao liberar o backend, habilitar + ligar no controller/mapeador. */}
      <section className={section}>
        <div className={sectionHeader}>
          <h2 className={sectionTitle}><WalletIcon size={18} />{t('partners.collaborators.form.section.bank')}</h2>
        </div>
        <div className={sectionBody}>
          <p className={gatedNote}>{t('partners.collaborators.form.bankGatedHint')}</p>
          <div className={grid}>
            <Field htmlFor="collab-bank" label={t('partners.collaborators.form.bank')}>
              <Input id="collab-bank" value="" disabled onChange={() => { /* gated */ }} />
            </Field>
            <Field htmlFor="collab-agency" label={t('partners.collaborators.form.agency')}>
              <Input id="collab-agency" mask="agency" value="" disabled onChange={() => { /* gated */ }} />
            </Field>
            <Field htmlFor="collab-account" label={t('partners.collaborators.form.accountNumber')}>
              <Input id="collab-account" value="" disabled onChange={() => { /* gated */ }} />
            </Field>
            <Field htmlFor="collab-dv" label={t('partners.collaborators.form.checkDigit')}>
              <Input id="collab-dv" value="" disabled onChange={() => { /* gated */ }} />
            </Field>
            <Field htmlFor="collab-pix-type" label={t('partners.collaborators.form.pixKeyType')}>
              <select id="collab-pix-type" className={select} disabled defaultValue="" aria-label={t('partners.collaborators.form.pixKeyType')}>
                <option value="">{t('partners.collaborators.form.select')}</option>
                {PIX_KEY_TYPES.map((k) => (
                  <option key={k} value={k}>{t(`partners.collaborators.pix.${k}`)}</option>
                ))}
              </select>
            </Field>
            <Field htmlFor="collab-pix-key" label={t('partners.collaborators.form.pixKey')}>
              <Input id="collab-pix-key" value="" disabled onChange={() => { /* gated */ }} />
            </Field>
          </div>
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
