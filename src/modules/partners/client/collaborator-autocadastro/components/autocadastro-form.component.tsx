/**
 * AutocadastroForm — componente BURRO (§XI, ADR-0009): a "view" do formulário do Autocadastro (#040).
 * Espelha as seções do detail (Dados Pessoais / Familiares / Saúde / Contratuais / Biografia+Emergência)
 * — DUPLICADO de propósito (não refatorar o detail). Só props (controller + strings + callbacks) → JSX;
 * zero fetch/derivação de negócio. Inclui o cabeçalho "Olá, {name}!" + CPF mascarado, o campo "Confirme
 * os primeiros dígitos do seu CPF" e o botão "Concluir cadastro" desabilitado até `canSubmit`.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Button, Field, Input } from '#shared/ui/index.ts'
import { UsersIcon, FileTextIcon, HeartHandshakeIcon, HeartPulseIcon } from '#shared/ui/icons/index.ts'
// Enums dos selects vêm RE-EXPORTADOS pelo controller (boundary §XI: a view burra não importa `data/`).
import {
  RACES,
  EDUCATION_LEVELS,
  FOOD_CATEGORIES,
  SEXES,
  MARITAL_STATUSES,
  type AutocadastroFormController,
} from './autocadastro-form.controller.ts'
import type { CollaboratorCompleteFieldsState } from '#modules/partners/client/collaborator-detail/components/collaborator-complete-fields.ts'
import {
  greeting,
  greetingTitle,
  greetingSubtitle,
  cpfMasked as cpfMaskedClass,
  section,
  sectionTitle,
  grid,
  gridFull,
  select,
  textarea,
  errorText,
  footer,
  submitWrap,
} from './autocadastro-form.css.ts'

const t = createTranslator(ptBR)

export type AutocadastroFormProps = Readonly<{
  controller: AutocadastroFormController
  /** Nome do colaborador (do preview) → "Olá, {name}!". */
  name: string
  /** CPF mascarado (do preview) → prova de que é a pessoa certa. */
  cpfMasked: string
  canSubmit: boolean
  submitting: boolean
  /** Mensagem de erro do submit (400 cpf-mismatch / rede) ou null. */
  errorMessage: string | null
  onSubmit: () => void
}>

export function AutocadastroForm({
  controller: c,
  name,
  cpfMasked,
  canSubmit,
  submitting,
  errorMessage,
  onSubmit,
}: AutocadastroFormProps): ReactNode {
  const txt = (
    key: keyof CollaboratorCompleteFieldsState,
    label: string,
    type?: 'text' | 'date',
    mask?: 'phone',
    placeholder?: string,
  ): ReactNode => (
    <Field htmlFor={`ac-${key}`} label={label}>
      <Input
        id={`ac-${key}`}
        type={type}
        mask={mask}
        placeholder={placeholder}
        value={c.state[key]}
        onChange={(v) => {
          c.setField(key, v)
        }}
      />
    </Field>
  )

  const sel = (
    key: keyof CollaboratorCompleteFieldsState,
    label: string,
    options: readonly Readonly<{ value: string; label: string }>[],
  ): ReactNode => (
    <Field htmlFor={`ac-${key}`} label={label}>
      <select
        id={`ac-${key}`}
        className={select}
        value={c.state[key]}
        onChange={(e) => {
          c.setField(key, e.target.value)
        }}
      >
        <option value="">{t('partners.autocadastro.form.select')}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  )

  const simNao = [
    { value: 'sim', label: t('partners.autocadastro.yes') },
    { value: 'nao', label: t('partners.autocadastro.no') },
  ]
  const raceOptions = RACES.filter((v) => v !== 'PREFIRO_NAO_RESPONDER').map((v) => ({
    value: v,
    label: t(`partners.collaborators.race.${v}`),
  }))
  const educationOptions = EDUCATION_LEVELS.map((v) => ({
    value: v,
    label: t(`partners.collaborators.education.${v}`),
  }))
  const foodOptions = FOOD_CATEGORIES.map((v) => ({ value: v, label: t(`partners.collaborators.food.${v}`) }))
  const sexOptions = SEXES.map((v) => ({ value: v, label: t(`partners.collaborators.detail.sex.${v}`) }))
  const maritalOptions = MARITAL_STATUSES.map((v) => ({
    value: v,
    label: t(`partners.collaborators.detail.marital.${v}`),
  }))

  return (
    <>
      <div className={greeting}>
        <h1 className={greetingTitle}>{t('partners.autocadastro.greeting').replace('{{name}}', name)}</h1>
        <p className={greetingSubtitle}>
          {t('partners.autocadastro.subtitle')} <span className={cpfMaskedClass}>{cpfMasked}</span>
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
        style={{ display: 'contents' }}
      >
        {/* Prova de posse leve — confirmação dos primeiros dígitos do CPF. */}
        <section className={section}>
          <h2 className={sectionTitle}>
            <UsersIcon size={18} />
            {t('partners.autocadastro.section.identity')}
          </h2>
          <div className={grid}>
            <Field htmlFor="ac-cpfPrefix" label={t('partners.autocadastro.field.cpfPrefix')}>
              <Input
                id="ac-cpfPrefix"
                value={c.cpfPrefix}
                placeholder={t('partners.autocadastro.field.cpfPrefixPlaceholder')}
                onChange={(v) => {
                  c.setCpfPrefix(v)
                }}
              />
            </Field>
          </div>
        </section>

        {/* Bloco 1 — Dados Pessoais. */}
        <section className={section}>
          <h2 className={sectionTitle}>
            <UsersIcon size={18} />
            {t('partners.collaborators.detail.section.personal')}
          </h2>
          <div className={grid}>
            {sel('sex', t('partners.collaborators.detail.field.sex'), sexOptions)}
            {sel('race', t('partners.collaborators.detail.field.race'), raceOptions)}
            {sel('maritalStatus', t('partners.collaborators.detail.field.maritalStatus'), maritalOptions)}
            {txt('rg', t('partners.collaborators.detail.field.rg'))}
            {txt('completeAddress', t('partners.collaborators.detail.field.completeAddress'))}
            {txt('dateOfBirth', t('partners.collaborators.detail.field.dateOfBirth'), 'date')}
            {txt('telephone', t('partners.collaborators.detail.field.telephone'), undefined, 'phone')}
            {sel('education', t('partners.collaborators.detail.field.education'), educationOptions)}
            {sel('experienceInThePublicSector', t('partners.collaborators.detail.field.experience'), simNao)}
            {txt(
              'publicSectorExperienceDuration',
              t('partners.collaborators.detail.field.experienceDuration'),
            )}
          </div>
        </section>

        {/* Bloco 2 — Informações Familiares. */}
        <section className={section}>
          <h2 className={sectionTitle}>
            <HeartHandshakeIcon size={18} />
            {t('partners.collaborators.detail.section.family')}
          </h2>
          <div className={grid}>
            {sel('hasChildren', t('partners.collaborators.detail.field.hasChildren'), simNao)}
            {txt('childrenCount', t('partners.collaborators.detail.field.childrenCount'))}
            {txt(
              'childrenAges',
              t('partners.collaborators.detail.field.childrenAges'),
              undefined,
              undefined,
              t('partners.collaborators.detail.field.childrenAgesPlaceholder'),
            )}
          </div>
        </section>

        {/* Bloco 3 — Saúde e Acessibilidade. */}
        <section className={section}>
          <h2 className={sectionTitle}>
            <HeartPulseIcon size={18} />
            {t('partners.collaborators.detail.section.health')}
          </h2>
          <div className={grid}>
            {txt('allergies', t('partners.collaborators.detail.field.allergies'))}
            {sel('foodCategory', t('partners.collaborators.detail.field.foodCategory'), foodOptions)}
            {txt('foodCategoryDescription', t('partners.collaborators.detail.field.foodCategoryDescription'))}
            {sel('isPwd', t('partners.collaborators.detail.field.isPwd'), simNao)}
            {txt('pwdDescription', t('partners.collaborators.detail.field.pwdDescription'))}
          </div>
        </section>

        {/* Bloco 4 — Informações Contratuais. */}
        <section className={section}>
          <h2 className={sectionTitle}>
            <FileTextIcon size={18} />
            {t('partners.collaborators.detail.section.contractual')}
          </h2>
          <div className={grid}>
            {sel('isOnLeave', t('partners.collaborators.detail.field.isOnLeave'), simNao)}
            {txt('leaveDuration', t('partners.collaborators.detail.field.leaveDuration'))}
            {sel('leaveRenewable', t('partners.collaborators.detail.field.leaveRenewable'), simNao)}
            {txt('leaveRenewalDuration', t('partners.collaborators.detail.field.leaveRenewalDuration'))}
          </div>
        </section>

        {/* Fim — Biografia + Contato de emergência. */}
        <section className={section}>
          <h2 className={sectionTitle}>
            <UsersIcon size={18} />
            {t('partners.collaborators.detail.section.closing')}
          </h2>
          <div className={grid}>
            {txt('emergencyContactName', t('partners.collaborators.detail.field.emergencyContactName'))}
            {txt(
              'emergencyContactTelephone',
              t('partners.collaborators.detail.field.emergencyContactTelephone'),
              undefined,
              'phone',
            )}
            <div className={gridFull}>
              <Field htmlFor="ac-biography" label={t('partners.collaborators.detail.field.biography')}>
                <textarea
                  id="ac-biography"
                  className={textarea}
                  value={c.state.biography}
                  maxLength={500}
                  onChange={(e) => {
                    c.setField('biography', e.target.value)
                  }}
                />
              </Field>
            </div>
          </div>
        </section>

        {errorMessage !== null ? (
          <p role="alert" className={errorText}>
            {errorMessage}
          </p>
        ) : null}

        <div className={footer}>
          <div className={submitWrap}>
            <Button
              type="submit"
              disabled={!canSubmit}
              loading={submitting}
              loadingLabel={t('common.loading')}
            >
              {t('partners.autocadastro.submit')}
            </Button>
          </div>
        </div>
      </form>
    </>
  )
}
