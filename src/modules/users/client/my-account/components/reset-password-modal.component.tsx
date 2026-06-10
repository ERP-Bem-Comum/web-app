import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Button } from '#shared/ui/index.ts'
import type { ChangePasswordInput } from '../my-account.view-model.ts'
import {
  evaluatePassword,
  passwordMeetsPolicy,
  PASSWORD_RULE_KEYS,
  type PasswordRuleKey,
} from '#modules/users/client/domain/password-policy.ts'

import {
  closeButton,
  dialog,
  errorBanner,
  eyeButton,
  field,
  fieldRow,
  header,
  input as inputClass,
  mismatch,
  rule,
  ruleIconFail,
  ruleIconOk,
  rulesList,
  rulesTitle,
  saveButtonWrap,
  cancelButton,
  title as titleClass,
} from './reset-password-modal.css.ts'

const t = createTranslator(ptBR)

export type ResetPasswordModalProps = Readonly<{
  open: boolean
  running: boolean
  errorTag: string | null
  onSave: (input: ChangePasswordInput) => void
  onClose: () => void
}>

function EyeIcon(): ReactNode {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
}

export function ResetPasswordModal(props: ResetPasswordModalProps): ReactNode {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState<Readonly<{ current: boolean; next: boolean; confirm: boolean }>>({
    current: false,
    next: false,
    confirm: false,
  })

  useEffect(() => {
    const el = ref.current
    if (el === null) return
    if (props.open && !el.open) {
      setCurrent(''); setNext(''); setConfirm('')
      setShow({ current: false, next: false, confirm: false })
      el.showModal()
    } else if (!props.open && el.open) {
      el.close()
    }
  }, [props.open])

  const checks = evaluatePassword(next)
  const confirmMismatch = confirm !== '' && confirm !== next
  const canSave =
    current !== '' && passwordMeetsPolicy(next) && next === confirm && !props.running

  const ruleLabel: Readonly<Record<PasswordRuleKey, string>> = {
    length: t('users.account.password.rule.length'),
    upper: t('users.account.password.rule.upper'),
    lower: t('users.account.password.rule.lower'),
    number: t('users.account.password.rule.number'),
    special: t('users.account.password.rule.special'),
  }

  const passwordField = (
    id: string,
    placeholder: string,
    value: string,
    onChange: (v: string) => void,
    shown: boolean,
    toggle: () => void,
  ): ReactNode => (
    <div className={fieldRow}>
      <input
        id={id}
        className={inputClass}
        type={shown ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onChange={(e) => { onChange(e.target.value) }}
      />
      <button type="button" className={eyeButton} onClick={toggle} aria-label={placeholder}>
        <EyeIcon />
      </button>
    </div>
  )

  return (
    <dialog
      ref={ref}
      className={dialog}
      aria-labelledby={titleId}
      onCancel={(e) => { e.preventDefault(); props.onClose() }}
      onClick={(e) => { if (e.target === ref.current) props.onClose() }}
    >
      <div className={header}>
        <h2 id={titleId} className={titleClass}>{t('users.account.password.title')}</h2>
        <button type="button" className={closeButton} onClick={props.onClose} aria-label={t('users.form.cancel')}>×</button>
      </div>

      {props.errorTag !== null ? <div className={errorBanner} role="alert">{t(props.errorTag)}</div> : null}

      <div className={field}>
        {passwordField('pw-current', t('users.account.password.current'), current, setCurrent, show.current, () => { setShow((s) => ({ ...s, current: !s.current })) })}
        {passwordField('pw-new', t('users.account.password.new'), next, setNext, show.next, () => { setShow((s) => ({ ...s, next: !s.next })) })}
        {passwordField('pw-confirm', t('users.account.password.confirm'), confirm, setConfirm, show.confirm, () => { setShow((s) => ({ ...s, confirm: !s.confirm })) })}
        {confirmMismatch ? <span className={mismatch}>{t('users.account.password.mismatch')}</span> : null}
      </div>

      <div>
        <p className={rulesTitle}>{t('users.account.password.requirements')}</p>
        <ul className={rulesList}>
          {PASSWORD_RULE_KEYS.map((k) => (
            <li key={k} className={rule}>
              <span className={checks[k] ? ruleIconOk : ruleIconFail} aria-hidden="true">{checks[k] ? '✓' : '✕'}</span>
              {ruleLabel[k]}
            </li>
          ))}
        </ul>
      </div>

      <div className={saveButtonWrap}>
        <Button
          onClick={() => { props.onSave({ currentPassword: current, newPassword: next }) }}
          disabled={!canSave}
          loading={props.running}
          loadingLabel={t('users.account.password.saving')}
        >
          {t('users.account.password.save')}
        </Button>
      </div>
      <button type="button" className={cancelButton} onClick={props.onClose}>{t('users.form.cancel')}</button>
    </dialog>
  )
}
