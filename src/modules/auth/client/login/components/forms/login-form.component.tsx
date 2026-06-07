/**
 * LoginForm — componente BURRO (§XI, ADR-0009): a "view" do formulário de login.
 * Réplica fiel da tela de login da v1 (referência visual 2026-06-03).
 * Só props (strings + callbacks) → JSX. Zero fetch/estado de negócio.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'

import { Button, Field, Logo, InputWithIcon, MailIcon, EyeIcon, EyeOffIcon } from '#shared/ui/index.ts'
import {
  content,
  header,
  title,
  titleUnderline,
  form,
  forgotLink,
  buttonWrap,
  errorText,
} from './login-form.css.ts'

export type LoginFormProps = Readonly<{
  title: string
  emailLabel: string
  passwordLabel: string
  emailPlaceholder: string
  passwordPlaceholder: string
  submitLabel: string
  loadingLabel: string
  email: string
  password: string
  submitting: boolean
  errorText: string | null
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: () => void
}>

export function LoginForm(props: LoginFormProps): ReactNode {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={content}>
      <div className={header}>
        <Logo src="/images/logo-bem-comum.png" alt="Bem Comum" size={72} />
        <h1 className={title}>{props.title}</h1>
        <span className={titleUnderline} aria-hidden="true" />
      </div>

      <form
        className={form}
        onSubmit={(e) => {
          e.preventDefault()
          props.onSubmit()
        }}
      >
        <Field htmlFor="login-email" label={props.emailLabel}>
          <InputWithIcon
            id="login-email"
            type="email"
            value={props.email}
            placeholder={props.emailPlaceholder}
            autoComplete="email"
            onChange={props.onEmailChange}
            icon={<MailIcon size={18} />}
          />
        </Field>

        <Field htmlFor="login-password" label={props.passwordLabel}>
          <InputWithIcon
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={props.password}
            placeholder={props.passwordPlaceholder}
            autoComplete="current-password"
            onChange={props.onPasswordChange}
            icon={showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            iconOrange
            iconAction={() => {
              setShowPassword((prev) => !prev)
            }}
          />
        </Field>

        <a className={forgotLink} href="#">
          Esqueci Minha Senha
        </a>

        {props.errorText !== null ? (
          <p role="alert" className={errorText}>
            {props.errorText}
          </p>
        ) : null}

        <div className={buttonWrap}>
          <Button
            type="submit"
            loading={props.submitting}
            loadingLabel={props.loadingLabel}
          >
            {props.submitLabel}
          </Button>
        </div>
      </form>
    </div>
  )
}
