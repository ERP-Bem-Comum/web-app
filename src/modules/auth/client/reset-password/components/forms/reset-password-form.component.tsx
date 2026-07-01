/**
 * ResetPasswordForm — componente BURRO (§XI, ADR-0009): a "view" do formulário "Redefinir Senha" (#038).
 * Espelha o shell do login (logo + título + underline) e o checklist de policy do reset-password-modal.
 * Só props (strings + estado derivado + callbacks) → JSX. Zero fetch/estado de negócio/derivação.
 */
import type { ReactNode } from 'react'

import { Button, Field, Logo } from '#shared/ui/index.ts'
import type { PasswordRuleKey } from '#modules/users/public-api/index.ts'

import {
  content,
  header,
  title,
  titleUnderline,
  subtitle,
  form,
  fieldRow,
  passwordInput,
  eyeButton,
  mismatch,
  rulesTitle,
  rulesList,
  rule,
  ruleIconOk,
  ruleIconFail,
  buttonWrap,
  cancelLink,
  errorText,
} from './reset-password-form.css.ts'

function EyeIcon(): ReactNode {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export type ResetPasswordRule = Readonly<{ key: PasswordRuleKey; label: string; ok: boolean }>

export type ResetPasswordFormProps = Readonly<{
  title: string
  subtitle: string
  newLabel: string
  confirmLabel: string
  submitLabel: string
  backLabel: string
  loadingLabel: string
  requirementsLabel: string
  mismatchLabel: string
  // aria-label do botão de olho (mostrar/ocultar). Distinto do label do campo para não colidir na a11y.
  toggleVisibilityLabel: string
  next: string
  confirm: string
  showNext: boolean
  showConfirm: boolean
  rules: readonly ResetPasswordRule[]
  showMismatch: boolean
  canSubmit: boolean
  submitting: boolean
  errorText: string | null
  errorReference: string | null
  onNextChange: (value: string) => void
  onConfirmChange: (value: string) => void
  onToggleNext: () => void
  onToggleConfirm: () => void
  onSubmit: () => void
  onBack: () => void
}>

export function ResetPasswordForm(props: ResetPasswordFormProps): ReactNode {
  return (
    <div className={content}>
      <div className={header}>
        <Logo src="/images/logo-bem-comum.png" alt="Bem Comum" size={56} />
        <h1 className={title}>{props.title}</h1>
        <span className={titleUnderline} aria-hidden="true" />
        <p className={subtitle}>{props.subtitle}</p>
      </div>

      <form
        className={form}
        onSubmit={(e) => {
          e.preventDefault()
          props.onSubmit()
        }}
      >
        <Field htmlFor="reset-new" label={props.newLabel}>
          <div className={fieldRow}>
            <input
              id="reset-new"
              className={passwordInput}
              type={props.showNext ? 'text' : 'password'}
              value={props.next}
              autoComplete="new-password"
              onChange={(e) => {
                props.onNextChange(e.target.value)
              }}
            />
            <button
              type="button"
              className={eyeButton}
              onClick={props.onToggleNext}
              aria-label={props.toggleVisibilityLabel}
            >
              <EyeIcon />
            </button>
          </div>
        </Field>

        <Field htmlFor="reset-confirm" label={props.confirmLabel}>
          <div className={fieldRow}>
            <input
              id="reset-confirm"
              className={passwordInput}
              type={props.showConfirm ? 'text' : 'password'}
              value={props.confirm}
              autoComplete="new-password"
              onChange={(e) => {
                props.onConfirmChange(e.target.value)
              }}
            />
            <button
              type="button"
              className={eyeButton}
              onClick={props.onToggleConfirm}
              aria-label={props.toggleVisibilityLabel}
            >
              <EyeIcon />
            </button>
          </div>
        </Field>

        {props.showMismatch ? <span className={mismatch}>{props.mismatchLabel}</span> : null}

        <div>
          <p className={rulesTitle}>{props.requirementsLabel}</p>
          <ul className={rulesList}>
            {props.rules.map((r) => (
              <li key={r.key} className={rule}>
                <span className={r.ok ? ruleIconOk : ruleIconFail} aria-hidden="true">
                  {r.ok ? '✓' : '✕'}
                </span>
                {r.label}
              </li>
            ))}
          </ul>
        </div>

        {props.errorText !== null ? (
          <p role="alert" className={errorText}>
            {props.errorText}
            {props.errorReference !== null ? (
              <>
                <br />
                <small>{props.errorReference}</small>
              </>
            ) : null}
          </p>
        ) : null}

        <div className={buttonWrap}>
          <Button
            type="submit"
            disabled={!props.canSubmit}
            loading={props.submitting}
            loadingLabel={props.loadingLabel}
          >
            {props.submitLabel}
          </Button>
        </div>

        <button type="button" className={cancelLink} onClick={props.onBack}>
          {props.backLabel}
        </button>
      </form>
    </div>
  )
}
