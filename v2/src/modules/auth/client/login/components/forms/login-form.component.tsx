/**
 * LoginForm — componente BURRO (§XI, ADR-0009): a "view" do formulário de login, vestida com o design
 * system (Card/Logo/Field/Input/Checkbox/Button). Só props (strings + callbacks) → JSX. Zero fetch/estado.
 * Quem liga o binding/ViewModel é a LoginPage; os textos já chegam resolvidos (i18n na page).
 */
import type { ReactNode } from 'react'

import { Button, Card, Checkbox, Field, Input, Logo } from '#shared/ui/index.ts'
import {
  cardShell,
  content,
  header,
  title,
  subtitle,
  form,
  rememberRow,
  rememberLabel,
  errorText,
} from './login-form.css.ts'

export type LoginFormProps = Readonly<{
  title: string
  subtitle: string
  emailLabel: string
  passwordLabel: string
  emailPlaceholder: string
  passwordPlaceholder: string
  rememberLabel: string
  submitLabel: string
  loadingLabel: string
  email: string
  password: string
  rememberDevice: boolean
  submitting: boolean
  errorText: string | null
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onRememberChange: (value: boolean) => void
  onSubmit: () => void
}>

export function LoginForm(props: LoginFormProps): ReactNode {
  return (
    <div className={cardShell}>
      <Card as="section">
        <div className={content}>
          <div className={header}>
            <Logo src="/images/logo-bem-comum.png" alt="Bem Comum" size={48} />
            <h1 className={title}>{props.title}</h1>
            <p className={subtitle}>{props.subtitle}</p>
          </div>

          <form
            className={form}
            onSubmit={(e) => {
              e.preventDefault()
              props.onSubmit()
            }}
          >
            <Field htmlFor="login-email" label={props.emailLabel}>
              <Input
                id="login-email"
                type="email"
                value={props.email}
                placeholder={props.emailPlaceholder}
                autoComplete="email"
                onChange={props.onEmailChange}
              />
            </Field>

            <Field htmlFor="login-password" label={props.passwordLabel}>
              <Input
                id="login-password"
                type="password"
                value={props.password}
                placeholder={props.passwordPlaceholder}
                autoComplete="current-password"
                onChange={props.onPasswordChange}
              />
            </Field>

            <div className={rememberRow}>
              <Checkbox
                id="login-remember"
                checked={props.rememberDevice}
                onChange={props.onRememberChange}
              />
              <label htmlFor="login-remember" className={rememberLabel}>
                {props.rememberLabel}
              </label>
            </div>

            {props.errorText !== null ? (
              <p role="alert" className={errorText}>
                {props.errorText}
              </p>
            ) : null}

            <Button type="submit" loading={props.submitting} loadingLabel={props.loadingLabel}>
              {props.submitLabel}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
