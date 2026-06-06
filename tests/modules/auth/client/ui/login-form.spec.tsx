/**
 * LoginForm (Vitest/jsdom) — view burra VESTIDA (spec 006): renderiza Card/Logo/Field/Input/Button +
 * placeholders; encaminha callbacks; erro com role=alert. Comportamento via props.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import { LoginForm, type LoginFormProps } from '#modules/auth/client/login/components/forms/login-form.component.tsx'

afterEach(() => {
  cleanup()
})

const baseProps = (over: Partial<LoginFormProps> = {}): LoginFormProps => ({
  title: 'Entrar',
  emailLabel: 'E-mail',
  passwordLabel: 'Senha',
  emailPlaceholder: 'seu@email.com',
  passwordPlaceholder: '••••••••',
  submitLabel: 'Entrar',
  loadingLabel: 'Carregando…',
  email: '',
  password: '',
  submitting: false,
  errorText: null,
  onEmailChange: vi.fn(),
  onPasswordChange: vi.fn(),
  onSubmit: vi.fn(),
  ...over,
})

describe('LoginForm (vestida)', () => {
  it('renderiza logo, título e botão', () => {
    render(<LoginForm {...baseProps()} />)
    expect(screen.getByRole('img')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeTruthy()
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('campos Email/Senha com label associado e placeholder', () => {
    render(<LoginForm {...baseProps()} />)
    expect(screen.getByLabelText('E-mail')).toBeTruthy()
    expect(screen.getByLabelText('Senha')).toBeTruthy()
    expect(screen.getByPlaceholderText('seu@email.com')).toBeTruthy()
    expect(screen.getByPlaceholderText('••••••••')).toBeTruthy()
  })

  it('encaminha onEmailChange (valor digitado) e onSubmit (envio)', () => {
    const onEmailChange = vi.fn()
    const onSubmit = vi.fn()
    render(<LoginForm {...baseProps({ onEmailChange, onSubmit })} />)
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'a@b.com' } })
    expect(onEmailChange).toHaveBeenCalledWith('a@b.com')
    fireEvent.click(screen.getByRole('button'))
    expect(onSubmit).toHaveBeenCalled()
  })

  it('mostra o erro com role="alert"', () => {
    render(<LoginForm {...baseProps({ errorText: 'E-mail ou senha inválidos.' })} />)
    expect(screen.getByRole('alert').textContent).toBe('E-mail ou senha inválidos.')
  })

  it('submitting: botão desabilitado + aria-busy (loading)', () => {
    render(<LoginForm {...baseProps({ submitting: true })} />)
    const btn = screen.getByRole('button')
    expect(btn.hasAttribute('disabled')).toBe(true)
    expect(btn.getAttribute('aria-busy')).toBe('true')
  })
})
