import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Button, Field, Input } from '#shared/ui/index.ts'
import { initialsFromName, type UpdateMeInput, type UserDetail } from '../my-account.view-model.ts'
import {
  avatar,
  avatarCol,
  body as bodyClass,
  cancelButton,
  closeButton,
  dialog,
  errorBanner,
  fieldsCol,
  footer,
  gatedButton,
  gatedHint,
  header,
  saveWrap,
  title as titleClass,
} from './edit-profile-modal.css.ts'

const t = createTranslator(ptBR)

// Checagem leve de formato de e-mail (UX): habilita/desabilita "Salvar". O FORMATO canônico e a
// duplicidade são do core-api (422 email-invalid-format / 409 email-already-registered).
const isLikelyEmail = (raw: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim())

export type EditProfileModalProps = Readonly<{
  open: boolean
  me: UserDetail
  running: boolean
  errorTag: string | null
  onSave: (input: UpdateMeInput) => void
  onClose: () => void
}>

export function EditProfileModal(props: EditProfileModalProps): ReactNode {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [name, setName] = useState(props.me.name)
  const [email, setEmail] = useState(props.me.email)
  const [telephone, setTelephone] = useState(props.me.telephone)

  useEffect(() => {
    const el = ref.current
    if (el === null) return
    if (props.open && !el.open) {
      setName(props.me.name)
      setEmail(props.me.email)
      setTelephone(props.me.telephone)
      el.showModal()
    } else if (!props.open && el.open) {
      el.close()
    }
  }, [props.open, props.me.name, props.me.email, props.me.telephone])

  const canSave = name.trim() !== '' && isLikelyEmail(email) && telephone.trim() !== '' && !props.running

  return (
    <dialog
      ref={ref}
      className={dialog}
      aria-labelledby={titleId}
      onCancel={(e) => { e.preventDefault(); props.onClose() }}
      onClick={(e) => { if (e.target === ref.current) props.onClose() }}
    >
      <div className={header}>
        <h2 id={titleId} className={titleClass}>{t('users.account.edit.title')}</h2>
        <button type="button" className={closeButton} onClick={props.onClose} aria-label={t('users.form.cancel')}>×</button>
      </div>

      {props.errorTag !== null ? <div className={errorBanner} role="alert">{t(props.errorTag)}</div> : null}

      <div className={bodyClass}>
        <div className={avatarCol}>
          <div className={avatar}>{initialsFromName(name)}</div>
          {/* Foto: sem endpoint de autosserviço (/me/photo) → gated. Ver gaps/ticket. */}
          <button type="button" className={gatedButton} disabled title={t('users.account.edit.photo.gated')}>
            {t('users.account.edit.photo')}
          </button>
          <span className={gatedHint}>{t('users.account.edit.photo.gated')}</span>
        </div>

        <div className={fieldsCol}>
          <Field htmlFor="me-name" label={t('users.form.name')}>
            <Input id="me-name" value={name} onChange={setName} />
          </Field>
          {/* CPF é imutável no autosserviço; e-mail é editável (PUT /me — USR-ME-PROFILE-FIELDS). */}
          <Field htmlFor="me-cpf" label={t('users.form.cpf')}>
            <Input id="me-cpf" mask="cpf" value={props.me.cpf} disabled onChange={() => { /* read-only */ }} />
          </Field>
          <Field htmlFor="me-email" label={t('users.form.email')}>
            <Input id="me-email" type="email" value={email} onChange={setEmail} />
          </Field>
          <Field htmlFor="me-telephone" label={t('users.form.telephone')}>
            <Input id="me-telephone" mask="phone" value={telephone} onChange={setTelephone} />
          </Field>
        </div>
      </div>

      <div className={footer}>
        <button type="button" className={cancelButton} onClick={props.onClose}>{t('users.form.cancel')}</button>
        <div className={saveWrap}>
          <Button
            onClick={() => { props.onSave({ name: name.trim(), email: email.trim(), telephone }) }}
            disabled={!canSave}
            loading={props.running}
            loadingLabel={t('users.detail.saving')}
          >
            {t('users.detail.save')}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
