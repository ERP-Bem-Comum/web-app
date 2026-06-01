/**
 * LoginPage — template/composição (§XI, ADR-0009): liga o binding (useLoginBinding → loginCommand) +
 * o Controller de form + a View burra (LoginForm). Resolve as tags i18n → texto e mapeia o
 * `loginCommand` para as props da LoginForm. Sem fetch/lógica — só liga as peças.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { useLoginBinding } from '#modules/auth/client/login/login.binding.ts'
import { useLoginFormController } from './components/forms/login-form.controller.ts'
import { LoginForm } from './components/forms/login-form.component.tsx'

const t = createTranslator(ptBR)

export function LoginPage(): ReactNode {
  const { loginCommand } = useLoginBinding()
  const form = useLoginFormController(loginCommand.execute)

  return (
    <LoginForm
      title={t('auth.login.title')}
      emailLabel={t('auth.login.email')}
      passwordLabel={t('auth.login.password')}
      rememberLabel={t('auth.login.remember-device')}
      submitLabel={t('auth.login.submit')}
      email={form.email}
      password={form.password}
      rememberDevice={form.rememberDevice}
      submitting={loginCommand.running}
      errorText={loginCommand.errorTag === null ? null : t(loginCommand.errorTag)}
      onEmailChange={form.setEmail}
      onPasswordChange={form.setPassword}
      onRememberChange={form.setRememberDevice}
      onSubmit={form.submit}
    />
  )
}
