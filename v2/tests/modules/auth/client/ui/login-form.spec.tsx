/**
 * LoginForm (Vitest/jsdom) — unitário: componente burro renderiza props; erro e submitting refletem props.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { LoginForm, type LoginFormProps } from '#modules/auth/client/login/components/forms/login-form.component.tsx'

afterEach(() => {
  cleanup()
})

const baseProps = (over: Partial<LoginFormProps> = {}): LoginFormProps => ({
  title: 'Entrar',
  emailLabel: 'E-mail',
  passwordLabel: 'Senha',
  rememberLabel: 'Lembrar',
  submitLabel: 'Entrar',
  email: '',
  password: '',
  rememberDevice: false,
  submitting: false,
  errorText: null,
  onEmailChange: vi.fn(),
  onPasswordChange: vi.fn(),
  onRememberChange: vi.fn(),
  onSubmit: vi.fn(),
  ...over,
})

describe('LoginForm', () => {
  it('renderiza título e campos', () => {
    render(<LoginForm {...baseProps()} />)
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy()
  })

  it('mostra o erro quando errorText presente', () => {
    render(<LoginForm {...baseProps({ errorText: 'E-mail ou senha inválidos.' })} />)
    expect(screen.getByRole('alert').textContent).toBe('E-mail ou senha inválidos.')
  })

  it('desabilita o botão quando submitting', () => {
    render(<LoginForm {...baseProps({ submitting: true })} />)
    expect(screen.getByRole('button', { name: 'Entrar' }).hasAttribute('disabled')).toBe(true)
  })
})
