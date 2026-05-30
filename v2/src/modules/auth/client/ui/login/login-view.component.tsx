/**
 * LoginView — componente BURRO (§XI): só props (strings + callbacks) → JSX. Zero fetch/estado de negócio.
 * Toda a verdade vem da ViewModel; os textos já chegam resolvidos (tags i18n resolvidas na page).
 */
import type { ReactNode } from 'react'

export type LoginViewProps = Readonly<{
  title: string
  emailLabel: string
  passwordLabel: string
  rememberLabel: string
  submitLabel: string
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

export function LoginView(props: LoginViewProps): ReactNode {
  return (
    <main>
      <h1>{props.title}</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          props.onSubmit()
        }}
      >
        <label>
          {props.emailLabel}
          <input
            type="email"
            value={props.email}
            onChange={(e) => {
              props.onEmailChange(e.target.value)
            }}
          />
        </label>
        <label>
          {props.passwordLabel}
          <input
            type="password"
            value={props.password}
            onChange={(e) => {
              props.onPasswordChange(e.target.value)
            }}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={props.rememberDevice}
            onChange={(e) => {
              props.onRememberChange(e.target.checked)
            }}
          />
          {props.rememberLabel}
        </label>
        {props.errorText !== null && <p role="alert">{props.errorText}</p>}
        <button type="submit" disabled={props.submitting}>
          {props.submitLabel}
        </button>
      </form>
    </main>
  )
}
