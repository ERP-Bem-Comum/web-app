/**
 * LoginPage — template/composição (§XI, ADR-0009): liga o binding (useLoginBinding → loginCommand) +
 * o Controller de form + a View burra (LoginForm). Aplica o layout da tela (login.css), resolve as
 * tags i18n → texto e mapeia o `loginCommand` para as props da LoginForm. Sem fetch/lógica.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { useLoginBinding } from '#modules/auth/client/login/login.binding.ts'
import { useLoginFormController } from './components/forms/login-form.controller.ts'
import { LoginForm } from './components/forms/login-form.component.tsx'
import { screen } from './login.css.ts'

const t = createTranslator(ptBR)

export function LoginPage(): ReactNode {
  const { loginCommand } = useLoginBinding()
  const form = useLoginFormController(loginCommand.execute)

  return (
    <div className={screen}>
      <LoginForm
        title={t('auth.login.title')}
        subtitle={t('auth.login.subtitle')}
        emailLabel={t('auth.login.email')}
        passwordLabel={t('auth.login.password')}
        emailPlaceholder={t('auth.login.email-placeholder')}
        passwordPlaceholder={t('auth.login.password-placeholder')}
        rememberLabel={t('auth.login.remember-device')}
        submitLabel={t('auth.login.submit')}
        loadingLabel={t('common.loading')}
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
    </div>
  )
}
