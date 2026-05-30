/**
 * LoginView (Vitest/jsdom) — unitário: componente burro renderiza props; erro e submitting refletem props.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { LoginView, type LoginViewProps } from '../../../../../src/modules/auth/client/ui/login-view.component.tsx'

afterEach(() => {
  cleanup()
})

const baseProps = (over: Partial<LoginViewProps> = {}): LoginViewProps => ({
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

describe('LoginView', () => {
  it('renderiza título e campos', () => {
    render(<LoginView {...baseProps()} />)
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy()
  })

  it('mostra o erro quando errorText presente', () => {
    render(<LoginView {...baseProps({ errorText: 'E-mail ou senha inválidos.' })} />)
    expect(screen.getByRole('alert').textContent).toBe('E-mail ou senha inválidos.')
  })

  it('desabilita o botão quando submitting', () => {
    render(<LoginView {...baseProps({ submitting: true })} />)
    expect(screen.getByRole('button', { name: 'Entrar' }).hasAttribute('disabled')).toBe(true)
  })
})
