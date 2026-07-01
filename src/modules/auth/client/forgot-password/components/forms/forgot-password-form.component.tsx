/**
 * ForgotPasswordForm — componente BURRO (§XI, ADR-0009): a "view" do formulário "Recuperar Senha".
 * Espelha o layout do login (logo + título + underline). Só props (strings + callbacks) → JSX.
 * Zero fetch/estado de negócio.
 */
import type { ReactNode } from 'react'

import { Button, Field, Logo, InputWithIcon, MailIcon } from '#shared/ui/index.ts'
import {
  content,
  header,
  title,
  titleUnderline,
  subtitle,
  form,
  buttonWrap,
  cancelLink,
  errorText,
} from './forgot-password-form.css.ts'

export type ForgotPasswordFormProps = Readonly<{
  title: string
  subtitle: string
  emailLabel: string
  emailPlaceholder: string
  submitLabel: string
  cancelLabel: string
  loadingLabel: string
  email: string
  submitting: boolean
  errorText: string | null
  errorReference: string | null
  onEmailChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
}>

export function ForgotPasswordForm(props: ForgotPasswordFormProps): ReactNode {
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
        <Field htmlFor="forgot-email" label={props.emailLabel}>
          <InputWithIcon
            id="forgot-email"
            type="email"
            value={props.email}
            placeholder={props.emailPlaceholder}
            autoComplete="email"
            onChange={props.onEmailChange}
            icon={<MailIcon size={18} />}
          />
        </Field>

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
          <Button type="submit" loading={props.submitting} loadingLabel={props.loadingLabel}>
            {props.submitLabel}
          </Button>
        </div>

        <button type="button" className={cancelLink} onClick={props.onCancel}>
          {props.cancelLabel}
        </button>
      </form>
    </div>
  )
}
