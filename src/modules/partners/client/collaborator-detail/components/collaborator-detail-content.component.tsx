import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Field, Input } from '#shared/ui/index.ts'
import { UsersIcon, FileTextIcon, WalletIcon, HeartHandshakeIcon, HeartPulseIcon } from '#shared/ui/icons/index.ts'

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
  grid, gridFull, gatedNote, protoNote, section, sectionTitle, select, textarea,
  radioGroup, radioOption, radioInput,
} from './collaborator-detail-content.css.ts'

const t = createTranslator(ptBR)

const PIX_KEY_TYPES = ['cpf', 'cnpj', 'email', 'phone', 'random-key'] as const
// 2ª fase — campos pedidos pelo cliente, INTERATIVOS para validação mas NÃO PERSISTIDOS (o core-api
// ainda não os aceita; ver ticket PAR-COLLABORATOR-PROFILE-FIELDS, incl. RBAC). Não vão em buildComplete.
const GENDERS = ['MULHER_CIS', 'HOMEM_CIS', 'MULHER_TRANS', 'HOMEM_TRANS', 'NAO_BINARIO', 'OUTRO', 'PREFIRO_NAO_RESPONDER'] as const
const MARITAL = ['single', 'married', 'stable_union', 'divorced', 'separated', 'widowed'] as const
// "Selecionar o número" — quantidade de filhos (1–10) e idade dos filhos (0–18).
const CHILDREN_COUNT = Array.from({ length: 10 }, (_, i) => String(i + 1))
const CHILDREN_AGES = Array.from({ length: 19 }, (_, i) => String(i))

export type CollaboratorDetailContentProps = Readonly<{
  controller: CollaboratorDetailFormController
  editing: boolean
  showComplete: boolean
  preTitle: string
}>

export function CollaboratorDetailContent({ controller: c, editing, showComplete, preTitle }: CollaboratorDetailContentProps): ReactNode {
  const hint = t('partners.collaborators.detail.gatedHint')

  const txt = (key: keyof CollaboratorDetailFormState, label: string, type?: 'text' | 'email' | 'date', mask?: 'cpf' | 'cnpj' | 'phone'): ReactNode => (
    <Field htmlFor={`cd-${key}`} label={label}>
      <Input id={`cd-${key}`} type={type} mask={mask} value={c.state[key]} disabled={!editing} onChange={(v) => { c.setField(key, v); }} />
    </Field>
  )

  const sel = (key: keyof CollaboratorDetailFormState, label: string, options: readonly Readonly<{ value: string; label: string }>[]): ReactNode => (
    <Field htmlFor={`cd-${key}`} label={label}>
      <select id={`cd-${key}`} className={select} value={c.state[key]} disabled={!editing} onChange={(e) => { c.setField(key, e.target.value); }}>
        <option value="">{t('partners.collaborators.form.select')}</option>
        {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </Field>
  )

  // Radio (Sim/Não, CLT/PJ) — interativo, dentro de um Field para alinhar no grid.
  const radio = (key: keyof CollaboratorDetailFormState, label: string, options: readonly Readonly<{ value: string; label: string }>[]): ReactNode => (
    <Field htmlFor={`cd-${key}`} label={label}>
      <div className={radioGroup}>
        {options.map((o) => (
          <label key={o.value} className={radioOption}>
            <input className={radioInput} type="radio" name={`cd-${key}`} value={o.value} checked={c.state[key] === o.value} disabled={!editing} onChange={() => { c.setField(key, o.value); }} />
            {o.label}
          </label>
        ))}
      </div>
    </Field>
  )

  // Bank gated (espelha o form; aguardando backend PAR-FINANCIER-COLLAB-BANK).
  const gatedTxt = (id: string, label: string): ReactNode => (
    <Field htmlFor={`cd-${id}`} label={label}>
      <Input id={`cd-${id}`} value="" disabled onChange={() => { /* gated */ }} />
    </Field>
  )

  const areaOptions = OCCUPATION_AREAS.map((a) => ({ value: a, label: t(`partners.collaborators.area.${a}`) }))
  const vinculoOptions = EMPLOYMENT_RELATIONSHIPS.map((v) => ({ value: v, label: t(`partners.collaborators.employment.${v}`) }))
  const simNao = [
    { value: 'sim', label: t('partners.collaborators.detail.experience.yes') },
    { value: 'nao', label: t('partners.collaborators.detail.experience.no') },
  ]
  const raceOptions = RACES.filter((v) => v !== 'PREFIRO_NAO_RESPONDER').map((v) => ({ value: v, label: t(`partners.collaborators.race.${v}`) }))
  const educationOptions = EDUCATION_LEVELS.map((v) => ({ value: v, label: t(`partners.collaborators.education.${v}`) }))
  const foodOptions = FOOD_CATEGORIES.map((v) => ({ value: v, label: t(`partners.collaborators.food.${v}`) }))
  const genderOptions = GENDERS.map((v) => ({ value: v, label: t(`partners.collaborators.gender.${v}`) }))
  const maritalOptions = MARITAL.map((v) => ({ value: v, label: t(`partners.collaborators.detail.marital.${v}`) }))
  const childrenCountOptions = CHILDREN_COUNT.map((v) => ({ value: v, label: v }))
  const childrenAgesOptions = CHILDREN_AGES.map((v) => ({ value: v, label: v }))

  return (
    <>
      <section className={section}>
        <h2 className={sectionTitle}><UsersIcon size={18} />{preTitle}</h2>
        <div className={grid}>
          {/* CLT/PJ no topo (radio, reusa Vínculo Empregatício) — obrigatório. */}
          <div className={gridFull}>{radio('employmentRelationship', t('partners.collaborators.detail.field.employmentType'), vinculoOptions)}</div>
          {txt('name', t('partners.collaborators.form.name'))}
          {txt('email', t('partners.collaborators.form.email'), 'email')}
          {sel('occupationArea', t('partners.collaborators.form.occupationArea'), areaOptions)}
          {txt('role', t('partners.collaborators.form.role'))}
          {txt('startOfContract', t('partners.collaborators.form.startOfContract'), 'date')}
          {txt('cpf', t('partners.collaborators.form.cpf'), undefined, 'cpf')}
        </div>
      </section>

      {/* Dados Bancários — GATED (aguardando backend PAR-FINANCIER-COLLAB-BANK). */}
      <section className={section}>
        <h2 className={sectionTitle}><WalletIcon size={18} />{t('partners.collaborators.form.section.bank')}</h2>
        <p className={gatedNote}>{t('partners.collaborators.form.bankGatedHint')}</p>
        <div className={grid}>
          {gatedTxt('bank', t('partners.collaborators.form.bank'))}
          {gatedTxt('agency', t('partners.collaborators.form.agency'))}
          {gatedTxt('account', t('partners.collaborators.form.accountNumber'))}
          {gatedTxt('dv', t('partners.collaborators.form.checkDigit'))}
          <Field htmlFor="cd-pix-type" label={t('partners.collaborators.form.pixKeyType')}>
            <select id="cd-pix-type" className={select} disabled defaultValue="" aria-label={t('partners.collaborators.form.pixKeyType')} title={hint}>
              <option value="">{t('partners.collaborators.form.select')}</option>
              {PIX_KEY_TYPES.map((k) => (<option key={k} value={k}>{t(`partners.collaborators.pix.${k}`)}</option>))}
            </select>
          </Field>
          {gatedTxt('pix-key', t('partners.collaborators.form.pixKey'))}
        </div>
      </section>

      {showComplete ? (
        <>
          {/* Bloco 1 — Dados Pessoais. (2ª fase: interativo p/ validação, não persistido.) */}
          <section className={section}>
            <h2 className={sectionTitle}><UsersIcon size={18} />{t('partners.collaborators.detail.section.personal')}</h2>
            <p className={protoNote}>{t('partners.collaborators.detail.gatedHint')}</p>
            <div className={grid}>
              {sel('genderIdentity', t('partners.collaborators.detail.field.genderIdentity'), genderOptions)}
              {c.state.genderIdentity === 'OUTRO' ? txt('genderOther', t('partners.collaborators.detail.field.genderOther')) : null}
              {sel('race', t('partners.collaborators.detail.field.race'), raceOptions)}
              {sel('maritalStatus', t('partners.collaborators.detail.field.maritalStatus'), maritalOptions)}
              {txt('rg', t('partners.collaborators.detail.field.rg'))}
              {txt('completeAddress', t('partners.collaborators.detail.field.completeAddress'))}
              {txt('dateOfBirth', t('partners.collaborators.detail.field.dateOfBirth'), 'date')}
              {txt('telephone', t('partners.collaborators.detail.field.telephone'), undefined, 'phone')}
              {sel('education', t('partners.collaborators.detail.field.education'), educationOptions)}
            </div>
          </section>

          {/* Bloco 2 — Informações Familiares. */}
          <section className={section}>
            <h2 className={sectionTitle}><HeartHandshakeIcon size={18} />{t('partners.collaborators.detail.section.family')}</h2>
            <div className={grid}>
              {radio('hasChildren', t('partners.collaborators.detail.field.hasChildren'), simNao)}
              {c.state.hasChildren === 'sim' ? sel('childrenCount', t('partners.collaborators.detail.field.childrenCount'), childrenCountOptions) : null}
              {c.state.hasChildren === 'sim' ? sel('childrenAges', t('partners.collaborators.detail.field.childrenAges'), childrenAgesOptions) : null}
            </div>
          </section>

          {/* Bloco 3 — Saúde e Acessibilidade. */}
          <section className={section}>
            <h2 className={sectionTitle}><HeartPulseIcon size={18} />{t('partners.collaborators.detail.section.health')}</h2>
            <div className={grid}>
              {radio('hasAllergies', t('partners.collaborators.detail.field.hasAllergies'), simNao)}
              {c.state.hasAllergies === 'sim' ? txt('allergies', t('partners.collaborators.detail.field.which')) : null}
              {sel('foodCategory', t('partners.collaborators.detail.field.foodCategory'), foodOptions)}
              {txt('foodCategoryDescription', t('partners.collaborators.detail.field.foodCategoryDescription'))}
              {radio('isPwd', t('partners.collaborators.detail.field.isPwd'), simNao)}
              {c.state.isPwd === 'sim' ? txt('pwdDescription', t('partners.collaborators.detail.field.which')) : null}
            </div>
          </section>

          {/* Bloco 4 — Informações Contratuais. */}
          <section className={section}>
            <h2 className={sectionTitle}><FileTextIcon size={18} />{t('partners.collaborators.detail.section.contractual')}</h2>
            <div className={grid}>
              {radio('experienceInThePublicSector', t('partners.collaborators.detail.field.experience'), simNao)}
              {c.state.experienceInThePublicSector === 'sim' ? txt('publicSectorRole', t('partners.collaborators.detail.field.publicSectorRole')) : null}
              {radio('isOnLeave', t('partners.collaborators.detail.field.isOnLeave'), simNao)}
              {c.state.isOnLeave === 'sim' ? txt('leaveDuration', t('partners.collaborators.detail.field.leaveDuration')) : null}
              {c.state.isOnLeave === 'sim' ? radio('leaveRenewable', t('partners.collaborators.detail.field.leaveRenewable'), simNao) : null}
              {c.state.isOnLeave === 'sim' && c.state.leaveRenewable === 'sim' ? txt('leaveRenewalDuration', t('partners.collaborators.detail.field.leaveRenewalDuration')) : null}
            </div>
          </section>

          {/* Fim — Biografia + Contato de emergência. */}
          <section className={section}>
            <h2 className={sectionTitle}><UsersIcon size={18} />{t('partners.collaborators.detail.section.closing')}</h2>
            <div className={grid}>
              {txt('emergencyContactName', t('partners.collaborators.detail.field.emergencyContactName'))}
              {txt('emergencyContactTelephone', t('partners.collaborators.detail.field.emergencyContactTelephone'), undefined, 'phone')}
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
        </>
      ) : null}
    </>
  )
}
