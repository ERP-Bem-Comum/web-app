import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Field, Input } from '#shared/ui/index.ts'
import {
  UsersIcon,
  FileTextIcon,
  WalletIcon,
  HeartHandshakeIcon,
  HeartPulseIcon,
  MapPinIcon,
} from '#shared/ui/icons/index.ts'

import {
  OCCUPATION_AREAS,
  EMPLOYMENT_RELATIONSHIPS,
  RACES,
  EDUCATION_LEVELS,
  FOOD_CATEGORIES,
  type CollaboratorDetailFormController,
  type CollaboratorDetailFormState,
} from './collaborator-detail-form.controller.ts'
import {
  grid,
  gridFull,
  gatedNote,
  section,
  sectionTitle,
  select,
  textarea,
} from './collaborator-detail-content.css.ts'

const t = createTranslator(ptBR)

const PIX_KEY_TYPES = ['cpf', 'cnpj', 'email', 'phone', 'random-key'] as const
// Campos pedidos pelo cliente ainda SEM suporte no backend (ticket PAR-COLLABORATOR-PROFILE-FIELDS):
// renderizados VISÍVEIS porém DESABILITADOS ("gated"), como a seção bancária. Ao liberar o backend,
// habilitar + ligar no controller/mapeador. NÃO são enviados (buildComplete não os inclui).
const MARITAL = ['single', 'married', 'divorced', 'widowed', 'stable_union'] as const

export type CollaboratorDetailContentProps = Readonly<{
  controller: CollaboratorDetailFormController
  editing: boolean
  showComplete: boolean
  preTitle: string
}>

export function CollaboratorDetailContent({
  controller: c,
  editing,
  showComplete,
  preTitle,
}: CollaboratorDetailContentProps): ReactNode {
  const hint = t('partners.collaborators.detail.gatedHint')

  const txt = (
    key: keyof CollaboratorDetailFormState,
    label: string,
    type?: 'text' | 'email' | 'date',
    mask?: 'cpf' | 'cnpj' | 'phone',
  ): ReactNode => (
    <Field htmlFor={`cd-${key}`} label={label}>
      <Input
        id={`cd-${key}`}
        type={type}
        mask={mask}
        value={c.state[key]}
        disabled={!editing}
        onChange={(v) => {
          c.setField(key, v)
        }}
      />
    </Field>
  )

  const sel = (
    key: keyof CollaboratorDetailFormState,
    label: string,
    options: readonly Readonly<{ value: string; label: string }>[],
  ): ReactNode => (
    <Field htmlFor={`cd-${key}`} label={label}>
      <select
        id={`cd-${key}`}
        className={select}
        value={c.state[key]}
        disabled={!editing}
        onChange={(e) => {
          c.setField(key, e.target.value)
        }}
      >
        <option value="">{t('partners.collaborators.form.select')}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  )

  // Campos GATED (aguardando backend) — desabilitados, sem estado/envio.
  const gatedTxt = (id: string, label: string, placeholder?: string): ReactNode => (
    <Field htmlFor={`cd-${id}`} label={label}>
      <Input
        id={`cd-${id}`}
        value=""
        placeholder={placeholder}
        disabled
        onChange={() => {
          /* gated */
        }}
      />
    </Field>
  )
  const gatedSel = (
    id: string,
    label: string,
    options: readonly Readonly<{ value: string; label: string }>[],
  ): ReactNode => (
    <Field htmlFor={`cd-${id}`} label={label}>
      <select id={`cd-${id}`} className={select} disabled defaultValue="" title={hint} aria-label={label}>
        <option value="">{t('partners.collaborators.form.select')}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  )

  const areaOptions = OCCUPATION_AREAS.map((a) => ({
    value: a,
    label: t(`partners.collaborators.area.${a}`),
  }))
  const vinculoOptions = EMPLOYMENT_RELATIONSHIPS.map((v) => ({
    value: v,
    label: t(`partners.collaborators.employment.${v}`),
  }))
  const simNao = [
    { value: 'sim', label: t('partners.collaborators.detail.experience.yes') },
    { value: 'nao', label: t('partners.collaborators.detail.experience.no') },
  ]
  // Raça: só as 5 categorias do IBGE (trim de PREFIRO_NAO_RESPONDER) — front-only, enum não muda.
  const raceOptions = RACES.filter((v) => v !== 'PREFIRO_NAO_RESPONDER').map((v) => ({
    value: v,
    label: t(`partners.collaborators.race.${v}`),
  }))
  const educationOptions = EDUCATION_LEVELS.map((v) => ({
    value: v,
    label: t(`partners.collaborators.education.${v}`),
  }))
  const foodOptions = FOOD_CATEGORIES.map((v) => ({ value: v, label: t(`partners.collaborators.food.${v}`) }))
  const sexOptions = [
    { value: 'F', label: t('partners.collaborators.detail.sex.F') },
    { value: 'M', label: t('partners.collaborators.detail.sex.M') },
  ]
  const maritalOptions = MARITAL.map((v) => ({
    value: v,
    label: t(`partners.collaborators.detail.marital.${v}`),
  }))

  return (
    <>
      <section className={section}>
        <h2 className={sectionTitle}>
          <UsersIcon size={18} />
          {preTitle}
        </h2>
        <div className={grid}>
          {txt('name', t('partners.collaborators.form.name'))}
          {txt('email', t('partners.collaborators.form.email'), 'email')}
          {sel('occupationArea', t('partners.collaborators.form.occupationArea'), areaOptions)}
          {txt('role', t('partners.collaborators.form.role'))}
          {txt('startOfContract', t('partners.collaborators.form.startOfContract'), 'date')}
          {sel(
            'employmentRelationship',
            t('partners.collaborators.form.employmentRelationship'),
            vinculoOptions,
          )}
          {txt('cpf', t('partners.collaborators.form.cpf'), undefined, 'cpf')}
        </div>
      </section>

      {/* Território (#42) — somente leitura: definido no cadastro; o PUT não altera território. */}
      <section className={section}>
        <h2 className={sectionTitle}>
          <MapPinIcon size={18} />
          {t('partners.collaborators.form.section.territory')}
        </h2>
        <div className={grid}>
          <Field htmlFor="cd-uf" label={t('partners.collaborators.form.uf')}>
            <Input
              id="cd-uf"
              value={c.state.uf}
              disabled
              onChange={() => {
                /* read-only (#42) */
              }}
            />
          </Field>
          <Field htmlFor="cd-municipality" label={t('partners.collaborators.form.municipality')}>
            <Input
              id="cd-municipality"
              value={c.state.municipality}
              disabled
              onChange={() => {
                /* read-only (#42) */
              }}
            />
          </Field>
        </div>
      </section>

      {/* Dados Bancários — GATED (espelha o form): core-api ainda não captura conta bancária de
          colaborador (ticket PAR-FINANCIER-COLLAB-BANK). */}
      <section className={section}>
        <h2 className={sectionTitle}>
          <WalletIcon size={18} />
          {t('partners.collaborators.form.section.bank')}
        </h2>
        <p className={gatedNote}>{t('partners.collaborators.form.bankGatedHint')}</p>
        <div className={grid}>
          {gatedTxt('bank', t('partners.collaborators.form.bank'))}
          {gatedTxt('agency', t('partners.collaborators.form.agency'))}
          {gatedTxt('account', t('partners.collaborators.form.accountNumber'))}
          {gatedTxt('dv', t('partners.collaborators.form.checkDigit'))}
          <Field htmlFor="cd-pix-type" label={t('partners.collaborators.form.pixKeyType')}>
            <select
              id="cd-pix-type"
              className={select}
              disabled
              defaultValue=""
              aria-label={t('partners.collaborators.form.pixKeyType')}
            >
              <option value="">{t('partners.collaborators.form.select')}</option>
              {PIX_KEY_TYPES.map((k) => (
                <option key={k} value={k}>
                  {t(`partners.collaborators.pix.${k}`)}
                </option>
              ))}
            </select>
          </Field>
          {gatedTxt('pix-key', t('partners.collaborators.form.pixKey'))}
        </div>
      </section>

      {showComplete ? (
        <>
          {/* Bloco 1 — Dados Pessoais. Sexo/Estado Civil/Experiência(duração) = GATED (ticket PROFILE-FIELDS). */}
          <section className={section}>
            <h2 className={sectionTitle}>
              <UsersIcon size={18} />
              {t('partners.collaborators.detail.section.personal')}
            </h2>
            <div className={grid}>
              {gatedSel('sex', t('partners.collaborators.detail.field.sex'), sexOptions)}
              {sel('race', t('partners.collaborators.detail.field.race'), raceOptions)}
              {gatedSel(
                'maritalStatus',
                t('partners.collaborators.detail.field.maritalStatus'),
                maritalOptions,
              )}
              {txt('rg', t('partners.collaborators.detail.field.rg'))}
              {txt('completeAddress', t('partners.collaborators.detail.field.completeAddress'))}
              {txt('dateOfBirth', t('partners.collaborators.detail.field.dateOfBirth'), 'date')}
              {txt('telephone', t('partners.collaborators.detail.field.telephone'), undefined, 'phone')}
              {sel('education', t('partners.collaborators.detail.field.education'), educationOptions)}
              {sel(
                'experienceInThePublicSector',
                t('partners.collaborators.detail.field.experience'),
                simNao,
              )}
              {gatedTxt('exp-duration', t('partners.collaborators.detail.field.experienceDuration'))}
            </div>
          </section>

          {/* Bloco 2 — Informações Familiares (GATED). */}
          <section className={section}>
            <h2 className={sectionTitle}>
              <HeartHandshakeIcon size={18} />
              {t('partners.collaborators.detail.section.family')}
            </h2>
            <p className={gatedNote}>{t('partners.collaborators.detail.gatedHint')}</p>
            <div className={grid}>
              {gatedSel('has-children', t('partners.collaborators.detail.field.hasChildren'), simNao)}
              {gatedTxt('children-count', t('partners.collaborators.detail.field.childrenCount'))}
              {gatedTxt(
                'children-ages',
                t('partners.collaborators.detail.field.childrenAges'),
                t('partners.collaborators.detail.field.childrenAgesPlaceholder'),
              )}
            </div>
          </section>

          {/* Bloco 3 — Saúde e Acessibilidade. PCD = GATED. */}
          <section className={section}>
            <h2 className={sectionTitle}>
              <HeartPulseIcon size={18} />
              {t('partners.collaborators.detail.section.health')}
            </h2>
            <div className={grid}>
              {txt('allergies', t('partners.collaborators.detail.field.allergies'))}
              {sel('foodCategory', t('partners.collaborators.detail.field.foodCategory'), foodOptions)}
              {txt(
                'foodCategoryDescription',
                t('partners.collaborators.detail.field.foodCategoryDescription'),
              )}
              {gatedSel('is-pwd', t('partners.collaborators.detail.field.isPwd'), simNao)}
              {gatedTxt('pwd-description', t('partners.collaborators.detail.field.pwdDescription'))}
            </div>
          </section>

          {/* Bloco 4 — Informações Contratuais (GATED). */}
          <section className={section}>
            <h2 className={sectionTitle}>
              <FileTextIcon size={18} />
              {t('partners.collaborators.detail.section.contractual')}
            </h2>
            <p className={gatedNote}>{t('partners.collaborators.detail.gatedHint')}</p>
            <div className={grid}>
              {gatedSel('is-on-leave', t('partners.collaborators.detail.field.isOnLeave'), simNao)}
              {gatedTxt('leave-duration', t('partners.collaborators.detail.field.leaveDuration'))}
              {gatedSel('leave-renewable', t('partners.collaborators.detail.field.leaveRenewable'), simNao)}
              {gatedTxt(
                'leave-renewal-duration',
                t('partners.collaborators.detail.field.leaveRenewalDuration'),
              )}
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
                <Field htmlFor="cd-biography" label={t('partners.collaborators.detail.field.biography')}>
                  <textarea
                    id="cd-biography"
                    className={textarea}
                    value={c.state.biography}
                    disabled={!editing}
                    maxLength={500}
                    onChange={(e) => {
                      c.setField('biography', e.target.value)
                    }}
                  />
                </Field>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </>
  )
}
