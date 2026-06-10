import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Button, Field, Input } from '#shared/ui/index.ts'

import type { UserFormController } from './user-form.controller.ts'
import {
  cancelButton,
  checkboxRow,
  errorBanner,
  footer,
  form,
  gatedField,
  gatedHint,
  grid,
  photoZone,
  saveWrap,
  section,
  sectionTitle,
} from './user-form.css.ts'

const t = createTranslator(ptBR)

export type UserFormProps = Readonly<{
  controller: UserFormController
  running: boolean
  errorTag: string | null
  onCancel: () => void
}>

/**
 * Formulário de inclusão de Usuário (estilo espelhado do ACT). Campos funcionais: Nome, CPF, E-mail,
 * Telefone (→ POST /users). "Foto de Perfil" e "Aprovador em Massa" aparecem para paridade com o legado
 * mas estão DESABILITADOS: a foto é um PUT separado (pós-criação) e o "Aprovador em Massa" é derivado dos
 * perfis de acesso (read-only no backend). Ver gaps/ticket.
 */
export function UserForm(props: UserFormProps): ReactNode {
  const { controller: c } = props
  const invalid = (key: string): string | undefined =>
    c.errors[key] === true ? t('users.form.invalid') : undefined

  return (
    <form
      className={form}
      onSubmit={(e) => {
        e.preventDefault()
        c.submit()
      }}
    >
      {props.errorTag !== null ? (
        <div className={errorBanner} role="alert">{t(props.errorTag)}</div>
      ) : null}

      <section className={section}>
        <h2 className={sectionTitle}>{t('users.form.section.data')}</h2>
        <div className={grid}>
          <Field htmlFor="user-name" label={t('users.form.name')} error={invalid('name')}>
            <Input id="user-name" value={c.state.name} onChange={(v) => { c.setField('name', v); }} />
          </Field>
          <Field htmlFor="user-cpf" label={t('users.form.cpf')} error={invalid('cpf')}>
            <Input id="user-cpf" mask="cpf" value={c.state.cpf} onChange={(v) => { c.setField('cpf', v); }} />
          </Field>
          <Field htmlFor="user-email" label={t('users.form.email')} error={invalid('email')}>
            <Input id="user-email" type="email" value={c.state.email} onChange={(v) => { c.setField('email', v); }} />
          </Field>
          <Field htmlFor="user-telephone" label={t('users.form.telephone')} error={invalid('telephone')}>
            <Input id="user-telephone" mask="phone" value={c.state.telephone} onChange={(v) => { c.setField('telephone', v); }} />
          </Field>
        </div>

        {/* Foto de Perfil — gated (upload é PUT pós-criação; follow-up). */}
        <div className={gatedField}>
          <Field htmlFor="user-photo" label={t('users.form.photo')}>
            <div className={photoZone} aria-disabled="true">
              <span>{t('users.form.photo.hint')}</span>
            </div>
          </Field>
          <p className={gatedHint}>{t('users.form.photo.gated')}</p>
        </div>

        {/* Aprovador em Massa — gated (derivado dos perfis de acesso, read-only no backend). */}
        <div className={gatedField}>
          <label className={checkboxRow}>
            <input type="checkbox" checked={false} disabled aria-label={t('users.form.massApproval')} onChange={() => { /* gated */ }} />
            <span>{t('users.form.massApproval')}</span>
          </label>
          <p className={gatedHint}>{t('users.form.massApproval.gated')}</p>
        </div>
      </section>

      <div className={footer}>
        <button type="button" className={cancelButton} onClick={props.onCancel}>
          {t('users.form.cancel')}
        </button>
        <div className={saveWrap}>
          <Button type="submit" loading={props.running} loadingLabel={t('users.form.saving')}>
            {t('users.form.save')}
          </Button>
        </div>
      </div>
    </form>
  )
}
