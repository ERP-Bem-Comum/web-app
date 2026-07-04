import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { formatMask, unmask, type InputMask } from '#shared/ui/index.ts'
import {
  UsersIcon,
  FileTextIcon,
  WalletIcon,
  HeartHandshakeIcon,
  HeartPulseIcon,
  MapPinIcon,
  ChevronDownIcon,
} from '#shared/ui/icons/index.ts'
import {
  sectionCard,
  sectionHeader,
  sectionIcon,
  sectionH2,
  sectionBody,
  grid,
  colSpanFull,
  field,
  fieldLabel,
  control,
  input,
  select,
  chevron,
  textarea,
} from '#shared/ui/brand/brand-form.css.ts'

import {
  OCCUPATION_AREAS,
  EMPLOYMENT_RELATIONSHIPS,
  RACES,
  EDUCATION_LEVELS,
  FOOD_CATEGORIES,
  MARITAL_STATUSES,
  PIX_KEY_TYPES,
  type CollaboratorDetailFormController,
  type CollaboratorDetailFormState,
} from './collaborator-detail-form.controller.ts'

const t = createTranslator(ptBR)

export type CollaboratorDetailContentProps = Readonly<{
  controller: CollaboratorDetailFormController
  editing: boolean
  showComplete: boolean
  preTitle: string
}>

// Wrapper de <select> "brand": appearance:none + chevron desenhado (o mock remove a seta nativa).
function SelectControl({
  id,
  value,
  ariaLabel,
  disabled,
  onChange,
  children,
}: {
  id: string
  value: string
  ariaLabel?: string
  disabled: boolean
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: ReactNode
}): ReactNode {
  return (
    <div className={control}>
      <select
        id={id}
        className={select}
        value={value}
        aria-label={ariaLabel}
        disabled={disabled}
        onChange={onChange}
      >
        {children}
      </select>
      <span className={chevron}>
        <ChevronDownIcon size={16} />
      </span>
    </div>
  )
}

export function CollaboratorDetailContent({
  controller: c,
  editing,
  showComplete,
  preTitle,
}: CollaboratorDetailContentProps): ReactNode {
  // Campo de texto. `readOnly` força desabilitado (território/banco são create-only); senão segue `editing`.
  const txt = (
    key: keyof CollaboratorDetailFormState,
    label: string,
    opts?: { type?: 'text' | 'email' | 'date'; mask?: InputMask; placeholder?: string; readOnly?: boolean },
  ): ReactNode => {
    const disabled = opts?.readOnly === true ? true : !editing
    const display = opts?.mask !== undefined ? formatMask(opts.mask, c.state[key]) : c.state[key]
    return (
      <div className={field}>
        <label htmlFor={`cd-${key}`} className={fieldLabel}>
          {label}
        </label>
        <input
          id={`cd-${key}`}
          type={opts?.type ?? 'text'}
          className={input}
          placeholder={opts?.placeholder}
          value={display}
          disabled={disabled}
          inputMode={opts?.mask !== undefined ? 'numeric' : undefined}
          onChange={(e) => {
            c.setField(key, opts?.mask !== undefined ? unmask(e.target.value, opts.mask) : e.target.value)
          }}
        />
      </div>
    )
  }

  const sel = (
    key: keyof CollaboratorDetailFormState,
    label: string,
    options: readonly Readonly<{ value: string; label: string }>[],
    opts?: { readOnly?: boolean },
  ): ReactNode => {
    const disabled = opts?.readOnly === true ? true : !editing
    return (
      <div className={field}>
        <label htmlFor={`cd-${key}`} className={fieldLabel}>
          {label}
        </label>
        <SelectControl
          id={`cd-${key}`}
          value={c.state[key]}
          ariaLabel={label}
          disabled={disabled}
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
        </SelectControl>
      </div>
    )
  }

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
  const maritalOptions = MARITAL_STATUSES.map((v) => ({
    value: v,
    label: t(`partners.collaborators.detail.marital.${v}`),
  }))

  return (
    <>
      <section className={sectionCard}>
        <div className={sectionHeader}>
          <span className={sectionIcon}>
            <UsersIcon size={17} />
          </span>
          <h2 className={sectionH2}>{preTitle}</h2>
        </div>
        <div className={sectionBody}>
          <div className={grid}>
            {txt('name', t('partners.collaborators.form.name'))}
            {txt('email', t('partners.collaborators.form.email'), { type: 'email' })}
            {sel('occupationArea', t('partners.collaborators.form.occupationArea'), areaOptions)}
            {txt('role', t('partners.collaborators.form.role'))}
            {txt('startOfContract', t('partners.collaborators.form.startOfContract'), { type: 'date' })}
            {sel(
              'employmentRelationship',
              t('partners.collaborators.form.employmentRelationship'),
              vinculoOptions,
            )}
            {txt('cpf', t('partners.collaborators.form.cpf'), { mask: 'cpf' })}
          </div>
        </div>
      </section>

      {/* Território (#42) — somente leitura: definido no cadastro; o PUT não altera território. */}
      <section className={sectionCard}>
        <div className={sectionHeader}>
          <span className={sectionIcon}>
            <MapPinIcon size={17} />
          </span>
          <h2 className={sectionH2}>{t('partners.collaborators.form.section.territory')}</h2>
        </div>
        <div className={sectionBody}>
          <div className={grid}>
            {txt('uf', t('partners.collaborators.form.uf'), { readOnly: true })}
            {txt('municipality', t('partners.collaborators.form.municipality'), { readOnly: true })}
          </div>
        </div>
      </section>

      {/* Dados Bancários + PIX (#40) — create-only: definidos no cadastro; o PUT não os altera.
          Exibidos SOMENTE LEITURA (vazios quando o colaborador não tem payment-target). */}
      <section className={sectionCard}>
        <div className={sectionHeader}>
          <span className={sectionIcon}>
            <WalletIcon size={17} />
          </span>
          <h2 className={sectionH2}>{t('partners.collaborators.form.section.bank')}</h2>
        </div>
        <div className={sectionBody}>
          <div className={grid}>
            {txt('bank', t('partners.collaborators.form.bank'), { readOnly: true })}
            {txt('agency', t('partners.collaborators.form.agency'), { readOnly: true })}
            {txt('accountNumber', t('partners.collaborators.form.accountNumber'), { readOnly: true })}
            {txt('checkDigit', t('partners.collaborators.form.checkDigit'), { readOnly: true })}
            <div className={field}>
              <label htmlFor="cd-pix-type" className={fieldLabel}>
                {t('partners.collaborators.form.pixKeyType')}
              </label>
              <SelectControl
                id="cd-pix-type"
                value={c.state.pixKeyType}
                ariaLabel={t('partners.collaborators.form.pixKeyType')}
                disabled
              >
                {PIX_KEY_TYPES.map((k) => (
                  <option key={k} value={k}>
                    {t(`partners.collaborators.pix.${k}`)}
                  </option>
                ))}
              </SelectControl>
            </div>
            {txt('pixKey', t('partners.collaborators.form.pixKey'), { readOnly: true })}
          </div>
        </div>
      </section>

      {showComplete ? (
        <>
          {/* Bloco 1 — Dados Pessoais. Sexo/Estado Civil/Experiência(duração) = GATED (ticket PROFILE-FIELDS). */}
          <section className={sectionCard}>
            <div className={sectionHeader}>
              <span className={sectionIcon}>
                <UsersIcon size={17} />
              </span>
              <h2 className={sectionH2}>{t('partners.collaborators.detail.section.personal')}</h2>
            </div>
            <div className={sectionBody}>
              <div className={grid}>
                {sel('sex', t('partners.collaborators.detail.field.sex'), sexOptions)}
                {sel('race', t('partners.collaborators.detail.field.race'), raceOptions)}
                {sel('maritalStatus', t('partners.collaborators.detail.field.maritalStatus'), maritalOptions)}
                {txt('rg', t('partners.collaborators.detail.field.rg'))}
                {txt('completeAddress', t('partners.collaborators.detail.field.completeAddress'))}
                {txt('dateOfBirth', t('partners.collaborators.detail.field.dateOfBirth'), { type: 'date' })}
                {txt('telephone', t('partners.collaborators.detail.field.telephone'), { mask: 'phone' })}
                {sel('education', t('partners.collaborators.detail.field.education'), educationOptions)}
                {sel(
                  'experienceInThePublicSector',
                  t('partners.collaborators.detail.field.experience'),
                  simNao,
                )}
                {txt(
                  'publicSectorExperienceDuration',
                  t('partners.collaborators.detail.field.experienceDuration'),
                )}
              </div>
            </div>
          </section>

          {/* Bloco 2 — Informações Familiares. */}
          <section className={sectionCard}>
            <div className={sectionHeader}>
              <span className={sectionIcon}>
                <HeartHandshakeIcon size={17} />
              </span>
              <h2 className={sectionH2}>{t('partners.collaborators.detail.section.family')}</h2>
            </div>
            <div className={sectionBody}>
              <div className={grid}>
                {sel('hasChildren', t('partners.collaborators.detail.field.hasChildren'), simNao)}
                {txt('childrenCount', t('partners.collaborators.detail.field.childrenCount'))}
                {txt('childrenAges', t('partners.collaborators.detail.field.childrenAges'), {
                  placeholder: t('partners.collaborators.detail.field.childrenAgesPlaceholder'),
                })}
              </div>
            </div>
          </section>

          {/* Bloco 3 — Saúde e Acessibilidade. PCD = GATED. */}
          <section className={sectionCard}>
            <div className={sectionHeader}>
              <span className={sectionIcon}>
                <HeartPulseIcon size={17} />
              </span>
              <h2 className={sectionH2}>{t('partners.collaborators.detail.section.health')}</h2>
            </div>
            <div className={sectionBody}>
              <div className={grid}>
                {txt('allergies', t('partners.collaborators.detail.field.allergies'))}
                {sel('foodCategory', t('partners.collaborators.detail.field.foodCategory'), foodOptions)}
                {txt(
                  'foodCategoryDescription',
                  t('partners.collaborators.detail.field.foodCategoryDescription'),
                )}
                {sel('isPwd', t('partners.collaborators.detail.field.isPwd'), simNao)}
                {txt('pwdDescription', t('partners.collaborators.detail.field.pwdDescription'))}
              </div>
            </div>
          </section>

          {/* Bloco 4 — Informações Contratuais. */}
          <section className={sectionCard}>
            <div className={sectionHeader}>
              <span className={sectionIcon}>
                <FileTextIcon size={17} />
              </span>
              <h2 className={sectionH2}>{t('partners.collaborators.detail.section.contractual')}</h2>
            </div>
            <div className={sectionBody}>
              <div className={grid}>
                {sel('isOnLeave', t('partners.collaborators.detail.field.isOnLeave'), simNao)}
                {txt('leaveDuration', t('partners.collaborators.detail.field.leaveDuration'))}
                {sel('leaveRenewable', t('partners.collaborators.detail.field.leaveRenewable'), simNao)}
                {txt('leaveRenewalDuration', t('partners.collaborators.detail.field.leaveRenewalDuration'))}
              </div>
            </div>
          </section>

          {/* Fim — Biografia + Contato de emergência. */}
          <section className={sectionCard}>
            <div className={sectionHeader}>
              <span className={sectionIcon}>
                <UsersIcon size={17} />
              </span>
              <h2 className={sectionH2}>{t('partners.collaborators.detail.section.closing')}</h2>
            </div>
            <div className={sectionBody}>
              <div className={grid}>
                {txt('emergencyContactName', t('partners.collaborators.detail.field.emergencyContactName'))}
                {txt(
                  'emergencyContactTelephone',
                  t('partners.collaborators.detail.field.emergencyContactTelephone'),
                  { mask: 'phone' },
                )}
                <div className={colSpanFull}>
                  <div className={field}>
                    <label htmlFor="cd-biography" className={fieldLabel}>
                      {t('partners.collaborators.detail.field.biography')}
                    </label>
                    <textarea
                      id="cd-biography"
                      className={textarea}
                      value={c.state.biography}
                      disabled={!editing}
                      maxLength={500}
                      rows={3}
                      onChange={(e) => {
                        c.setField('biography', e.target.value)
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </>
  )
}
