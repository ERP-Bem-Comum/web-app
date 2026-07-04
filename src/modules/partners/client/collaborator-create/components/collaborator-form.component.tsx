import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { formatMask, unmask } from '#shared/ui/index.ts'
import {
  ChevronLeftIcon,
  ChevronDownIcon,
  MapPinIcon,
  UsersIcon,
  WalletIcon,
} from '#shared/ui/icons/index.ts'
import { derivePixKey } from '#modules/partners/client/domain/derive-pix-key.ts'
import {
  page,
  scrollArea,
  content,
  head,
  backBtn,
  headTitle,
  sectionCard,
  sectionHeader,
  sectionIcon,
  sectionH2,
  sectionBody,
  grid,
  colSpan2,
  field,
  fieldLabel,
  control,
  input,
  select,
  chevron,
  controlError,
  fieldError,
  actionbar,
  actionbarInner,
  btnPrimary,
  btnGhost,
} from '#shared/ui/brand/brand-form.css.ts'

import {
  OCCUPATION_AREAS,
  EMPLOYMENT_RELATIONSHIPS,
  BR_UF,
  PIX_KEY_TYPES,
  isPixKeyType,
  type CollaboratorFormController,
} from './collaborator-form.controller.ts'
import { errorBanner } from './collaborator-form.css.ts'

const t = createTranslator(ptBR)

export type CollaboratorFormProps = Readonly<{
  controller: CollaboratorFormController
  running: boolean
  errorTag: string | null
  onCancel: () => void
  onBack: () => void
}>

// Wrapper de <select> "brand": appearance:none + chevron desenhado (o mock remove a seta nativa).
function SelectControl({
  id,
  value,
  ariaLabel,
  invalid = false,
  onChange,
  children,
}: {
  id: string
  value: string
  ariaLabel?: string
  invalid?: boolean
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: ReactNode
}): ReactNode {
  return (
    <div className={control}>
      <select
        id={id}
        className={`${select} ${invalid ? controlError : ''}`}
        value={value}
        aria-label={ariaLabel}
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

export function CollaboratorForm(props: CollaboratorFormProps): ReactNode {
  const { controller: c } = props
  const isInvalid = (key: string): boolean => c.errors[key] === true
  const invalidMsg = (key: string): string | null =>
    c.errors[key] === true ? t('partners.collaborators.form.invalid') : null

  return (
    <form
      className={page}
      onSubmit={(e) => {
        e.preventDefault()
        c.submit()
      }}
    >
      <div className={scrollArea}>
        <div className={content}>
          {/* Cabeçalho: voltar + título */}
          <div className={head}>
            <button type="button" className={backBtn} onClick={props.onBack} aria-label={t('common.back')}>
              <ChevronLeftIcon size={18} />
            </button>
            <h1 className={headTitle}>{t('partners.collaborators.create.title')}</h1>
          </div>

          {props.errorTag !== null ? (
            <div className={errorBanner} role="alert">
              {t(props.errorTag)}
            </div>
          ) : null}

          {/* Pré-cadastro de colaborador(a) */}
          <section className={sectionCard}>
            <div className={sectionHeader}>
              <span className={sectionIcon}>
                <UsersIcon size={17} />
              </span>
              <h2 className={sectionH2}>{t('partners.collaborators.form.section.basic')}</h2>
            </div>
            <div className={sectionBody}>
              <div className={grid}>
                {/* Ordem espelhando o print: Nome · Email · Área · Função · Início · Vínculo · CPF */}
                <div className={`${field} ${colSpan2}`}>
                  <label htmlFor="collab-name" className={fieldLabel}>
                    {t('partners.collaborators.form.name')}
                  </label>
                  <input
                    id="collab-name"
                    className={`${input} ${isInvalid('name') ? controlError : ''}`}
                    value={c.state.name}
                    onChange={(e) => {
                      c.setField('name', e.target.value)
                    }}
                  />
                  {invalidMsg('name') !== null ? (
                    <span className={fieldError}>{invalidMsg('name')}</span>
                  ) : null}
                </div>

                <div className={`${field} ${colSpan2}`}>
                  <label htmlFor="collab-email" className={fieldLabel}>
                    {t('partners.collaborators.form.email')}
                  </label>
                  <input
                    id="collab-email"
                    type="email"
                    className={`${input} ${isInvalid('email') ? controlError : ''}`}
                    value={c.state.email}
                    onChange={(e) => {
                      c.setField('email', e.target.value)
                    }}
                  />
                  {invalidMsg('email') !== null ? (
                    <span className={fieldError}>{invalidMsg('email')}</span>
                  ) : null}
                </div>

                <div className={`${field} ${colSpan2}`}>
                  <label htmlFor="collab-area" className={fieldLabel}>
                    {t('partners.collaborators.form.occupationArea')}
                  </label>
                  <SelectControl
                    id="collab-area"
                    value={c.state.occupationArea}
                    invalid={isInvalid('occupationArea')}
                    onChange={(e) => {
                      c.setField('occupationArea', e.target.value)
                    }}
                  >
                    <option value="">{t('partners.collaborators.form.select')}</option>
                    {OCCUPATION_AREAS.map((a) => (
                      <option key={a} value={a}>
                        {t(`partners.collaborators.area.${a}`)}
                      </option>
                    ))}
                  </SelectControl>
                  {invalidMsg('occupationArea') !== null ? (
                    <span className={fieldError}>{invalidMsg('occupationArea')}</span>
                  ) : null}
                </div>

                <div className={`${field} ${colSpan2}`}>
                  <label htmlFor="collab-role" className={fieldLabel}>
                    {t('partners.collaborators.form.role')}
                  </label>
                  <input
                    id="collab-role"
                    className={`${input} ${isInvalid('role') ? controlError : ''}`}
                    value={c.state.role}
                    onChange={(e) => {
                      c.setField('role', e.target.value)
                    }}
                  />
                  {invalidMsg('role') !== null ? (
                    <span className={fieldError}>{invalidMsg('role')}</span>
                  ) : null}
                </div>

                <div className={`${field} ${colSpan2}`}>
                  <label htmlFor="collab-start" className={fieldLabel}>
                    {t('partners.collaborators.form.startOfContract')}
                  </label>
                  <input
                    id="collab-start"
                    type="date"
                    className={`${input} ${isInvalid('startOfContract') ? controlError : ''}`}
                    value={c.state.startOfContract}
                    onChange={(e) => {
                      c.setField('startOfContract', e.target.value)
                    }}
                  />
                  {invalidMsg('startOfContract') !== null ? (
                    <span className={fieldError}>{invalidMsg('startOfContract')}</span>
                  ) : null}
                </div>

                <div className={`${field} ${colSpan2}`}>
                  <label htmlFor="collab-vinc" className={fieldLabel}>
                    {t('partners.collaborators.form.employmentRelationship')}
                  </label>
                  <SelectControl
                    id="collab-vinc"
                    value={c.state.employmentRelationship}
                    invalid={isInvalid('employmentRelationship')}
                    onChange={(e) => {
                      c.setField('employmentRelationship', e.target.value)
                    }}
                  >
                    <option value="">{t('partners.collaborators.form.select')}</option>
                    {EMPLOYMENT_RELATIONSHIPS.map((v) => (
                      <option key={v} value={v}>
                        {t(`partners.collaborators.employment.${v}`)}
                      </option>
                    ))}
                  </SelectControl>
                  {invalidMsg('employmentRelationship') !== null ? (
                    <span className={fieldError}>{invalidMsg('employmentRelationship')}</span>
                  ) : null}
                </div>

                <div className={`${field} ${colSpan2}`}>
                  <label htmlFor="collab-cpf" className={fieldLabel}>
                    {t('partners.collaborators.form.cpf')}
                  </label>
                  <input
                    id="collab-cpf"
                    inputMode="numeric"
                    className={`${input} ${isInvalid('cpf') ? controlError : ''}`}
                    value={formatMask('cpf', c.state.cpf)}
                    onChange={(e) => {
                      c.setField('cpf', unmask(e.target.value, 'cpf'))
                    }}
                  />
                  {invalidMsg('cpf') !== null ? (
                    <span className={fieldError}>{invalidMsg('cpf')}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {/* Território (#42) — UF (27 siglas) + município (texto livre). Opcionais. Entra no create. */}
          <section className={sectionCard}>
            <div className={sectionHeader}>
              <span className={sectionIcon}>
                <MapPinIcon size={17} />
              </span>
              <h2 className={sectionH2}>{t('partners.collaborators.form.section.territory')}</h2>
            </div>
            <div className={sectionBody}>
              <div className={grid}>
                <div className={`${field} ${colSpan2}`}>
                  <label htmlFor="collab-uf" className={fieldLabel}>
                    {t('partners.collaborators.form.uf')}
                  </label>
                  <SelectControl
                    id="collab-uf"
                    value={c.state.uf}
                    ariaLabel={t('partners.collaborators.form.uf')}
                    onChange={(e) => {
                      c.setField('uf', e.target.value)
                    }}
                  >
                    <option value="">{t('partners.collaborators.form.select')}</option>
                    {BR_UF.map((u) => (
                      <option key={u.sigla} value={u.sigla}>
                        {u.sigla} — {u.nome}
                      </option>
                    ))}
                  </SelectControl>
                </div>
                <div className={`${field} ${colSpan2}`}>
                  <label htmlFor="collab-municipality" className={fieldLabel}>
                    {t('partners.collaborators.form.municipality')}
                  </label>
                  <input
                    id="collab-municipality"
                    className={input}
                    value={c.state.municipality}
                    onChange={(e) => {
                      c.setField('municipality', e.target.value)
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Dados bancários + PIX (#40) — opcionais. Presença inferida do preenchimento (sem checkbox);
              banco parcial é bloqueado pelo schema. Espelha o Fornecedor. Create-only (o PUT omite). */}
          <section className={sectionCard}>
            <div className={sectionHeader}>
              <span className={sectionIcon}>
                <WalletIcon size={17} />
              </span>
              <h2 className={sectionH2}>{t('partners.collaborators.form.section.bank')}</h2>
            </div>
            <div className={sectionBody}>
              <div className={grid}>
                <div className={field}>
                  <label htmlFor="collab-bank" className={fieldLabel}>
                    {t('partners.collaborators.form.bank')}
                  </label>
                  <input
                    id="collab-bank"
                    className={`${input} ${isInvalid('bankAccount.bank') ? controlError : ''}`}
                    value={c.state.bank}
                    onChange={(e) => {
                      c.setField('bank', e.target.value)
                    }}
                  />
                  {invalidMsg('bankAccount.bank') !== null ? (
                    <span className={fieldError}>{invalidMsg('bankAccount.bank')}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="collab-agency" className={fieldLabel}>
                    {t('partners.collaborators.form.agency')}
                  </label>
                  <input
                    id="collab-agency"
                    inputMode="numeric"
                    className={`${input} ${isInvalid('bankAccount.agency') ? controlError : ''}`}
                    value={formatMask('agency', c.state.agency)}
                    onChange={(e) => {
                      c.setField('agency', unmask(e.target.value, 'agency'))
                    }}
                  />
                  {invalidMsg('bankAccount.agency') !== null ? (
                    <span className={fieldError}>{invalidMsg('bankAccount.agency')}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="collab-account" className={fieldLabel}>
                    {t('partners.collaborators.form.accountNumber')}
                  </label>
                  <input
                    id="collab-account"
                    className={`${input} ${isInvalid('bankAccount.accountNumber') ? controlError : ''}`}
                    value={c.state.accountNumber}
                    onChange={(e) => {
                      c.setField('accountNumber', e.target.value)
                    }}
                  />
                  {invalidMsg('bankAccount.accountNumber') !== null ? (
                    <span className={fieldError}>{invalidMsg('bankAccount.accountNumber')}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="collab-dv" className={fieldLabel}>
                    {t('partners.collaborators.form.checkDigit')}
                  </label>
                  <input
                    id="collab-dv"
                    className={`${input} ${isInvalid('bankAccount.checkDigit') ? controlError : ''}`}
                    value={c.state.checkDigit}
                    onChange={(e) => {
                      c.setField('checkDigit', e.target.value)
                    }}
                  />
                  {invalidMsg('bankAccount.checkDigit') !== null ? (
                    <span className={fieldError}>{invalidMsg('bankAccount.checkDigit')}</span>
                  ) : null}
                </div>

                <div className={`${field} ${colSpan2}`}>
                  <label htmlFor="collab-pix-type" className={fieldLabel}>
                    {t('partners.collaborators.form.pixKeyType')}
                  </label>
                  <SelectControl
                    id="collab-pix-type"
                    value={c.state.pixKeyType}
                    ariaLabel={t('partners.collaborators.form.pixKeyType')}
                    onChange={(e) => {
                      if (isPixKeyType(e.target.value)) {
                        c.setField('pixKeyType', e.target.value)
                        // Auto-preenche a chave com o dado correspondente do form (editável).
                        c.setField(
                          'pixKey',
                          derivePixKey(e.target.value, { document: c.state.cpf, email: c.state.email }),
                        )
                      }
                    }}
                  >
                    {PIX_KEY_TYPES.map((k) => (
                      <option key={k} value={k}>
                        {t(`partners.collaborators.pix.${k}`)}
                      </option>
                    ))}
                  </SelectControl>
                </div>

                <div className={`${field} ${colSpan2}`}>
                  <label htmlFor="collab-pix-key" className={fieldLabel}>
                    {t('partners.collaborators.form.pixKey')}
                  </label>
                  <input
                    id="collab-pix-key"
                    className={`${input} ${isInvalid('pixKey.key') ? controlError : ''}`}
                    value={c.state.pixKey}
                    onChange={(e) => {
                      c.setField('pixKey', e.target.value)
                    }}
                  />
                  {invalidMsg('pixKey.key') !== null ? (
                    <span className={fieldError}>{invalidMsg('pixKey.key')}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Barra de ações fixa */}
      <div className={actionbar}>
        <div className={actionbarInner}>
          <button type="button" className={btnGhost} onClick={props.onCancel}>
            {t('partners.collaborators.form.cancel')}
          </button>
          <button type="submit" className={btnPrimary} disabled={props.running}>
            {props.running ? t('partners.collaborators.form.saving') : t('partners.collaborators.form.save')}
          </button>
        </div>
      </div>
    </form>
  )
}
