import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { formatMask, unmask } from '#shared/ui/index.ts'
import { ChevronLeftIcon, UsersIcon } from '#shared/ui/icons/index.ts'
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
  input,
  controlError,
  fieldError,
  hint,
  actionbar,
  actionbarInner,
  btnPrimary,
  btnGhost,
} from '#shared/ui/brand/brand-form.css.ts'

import type { UserFormController } from './user-form.controller.ts'
import { errorBanner, photoZone, checkboxRow } from './user-form.css.ts'

const t = createTranslator(ptBR)

export type UserFormProps = Readonly<{
  controller: UserFormController
  running: boolean
  errorTag: string | null
  onCancel: () => void
  onBack: () => void
}>

/**
 * Formulário de inclusão de Usuário — SHELL "brand" (`brand-form.css.ts`), espelhando o Novo Colaborador.
 * Campos funcionais: Nome, CPF, E-mail, Telefone (→ POST /users). "Foto de Perfil" segue gated (upload é
 * PUT pós-criação). "Aprovador em Massa" é SETTÁVEL (o core-api aceita `massApprovalPermission`) — concede
 * o role etl:mass-approver; enviado só quando marcado. Setar exige `user:assign-role` no ator (senão 403).
 */
export function UserForm(props: UserFormProps): ReactNode {
  const { controller: c } = props
  const isInvalid = (key: string): boolean => c.errors[key] === true
  const invalidMsg = (key: string): string | null => (c.errors[key] === true ? t('users.form.invalid') : null)

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
            <h1 className={headTitle}>{t('users.create.title')}</h1>
          </div>

          {props.errorTag !== null ? (
            <div className={errorBanner} role="alert">
              {t(props.errorTag)}
            </div>
          ) : null}

          {/* Seção 1 — Dados */}
          <section className={sectionCard}>
            <div className={sectionHeader}>
              <span className={sectionIcon}>
                <UsersIcon size={17} />
              </span>
              <h2 className={sectionH2}>{t('users.form.section.data')}</h2>
            </div>
            <div className={sectionBody}>
              <div className={grid}>
                <div className={`${field} ${colSpan2}`}>
                  <label htmlFor="user-name" className={fieldLabel}>
                    {t('users.form.name')}
                  </label>
                  <input
                    id="user-name"
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
                  <label htmlFor="user-cpf" className={fieldLabel}>
                    {t('users.form.cpf')}
                  </label>
                  <input
                    id="user-cpf"
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

                <div className={`${field} ${colSpan2}`}>
                  <label htmlFor="user-email" className={fieldLabel}>
                    {t('users.form.email')}
                  </label>
                  <input
                    id="user-email"
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
                  <label htmlFor="user-telephone" className={fieldLabel}>
                    {t('users.form.telephone')}
                  </label>
                  <input
                    id="user-telephone"
                    inputMode="numeric"
                    className={`${input} ${isInvalid('telephone') ? controlError : ''}`}
                    value={formatMask('phone', c.state.telephone)}
                    onChange={(e) => {
                      c.setField('telephone', unmask(e.target.value, 'phone'))
                    }}
                  />
                  {invalidMsg('telephone') !== null ? (
                    <span className={fieldError}>{invalidMsg('telephone')}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {/* Seção 2 — Foto de Perfil (gated: upload é PUT pós-criação; follow-up). */}
          <section className={sectionCard}>
            <div className={sectionHeader}>
              <span className={sectionIcon}>
                <UsersIcon size={17} />
              </span>
              <h2 className={sectionH2}>{t('users.form.photo')}</h2>
            </div>
            <div className={sectionBody}>
              <div className={photoZone} aria-disabled="true">
                <span>{t('users.form.photo.hint')}</span>
              </div>
              <p className={hint}>{t('users.form.photo.gated')}</p>
            </div>
          </section>

          {/* Seção 3 — Aprovador em Massa (settável; concede etl:mass-approver). */}
          <section className={sectionCard}>
            <div className={sectionHeader}>
              <span className={sectionIcon}>
                <UsersIcon size={17} />
              </span>
              <h2 className={sectionH2}>{t('users.form.massApproval')}</h2>
            </div>
            <div className={sectionBody}>
              <div className={checkboxRow}>
                <input
                  id="user-mass-approval"
                  type="checkbox"
                  checked={c.state.massApprovalPermission}
                  onChange={(e) => {
                    c.setField('massApprovalPermission', e.target.checked)
                  }}
                />
                <label htmlFor="user-mass-approval" className={fieldLabel}>
                  {t('users.form.massApproval')}
                </label>
              </div>
              <p className={hint}>{t('users.form.massApproval.note')}</p>
            </div>
          </section>
        </div>
      </div>

      {/* Barra de ações fixa */}
      <div className={actionbar}>
        <div className={actionbarInner}>
          <button type="button" className={btnGhost} onClick={props.onCancel}>
            {t('users.form.cancel')}
          </button>
          <button type="submit" className={btnPrimary} disabled={props.running}>
            {props.running ? t('users.form.saving') : t('users.form.save')}
          </button>
        </div>
      </div>
    </form>
  )
}
