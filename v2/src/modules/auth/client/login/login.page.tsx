/**
 * LoginPage — template (§XI): compõe ViewModel + Controller + a view burra. Resolve as tags i18n →
 * texto (a P.O. refina os textos). Sem fetch/lógica de negócio — só liga as peças.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { useLoginViewModel } from '#modules/auth/client/login/login.binding.ts'
import { useLoginFormController } from './components/forms/login-form.controller.ts'
import { LoginForm } from './components/forms/login-form.component.tsx'

const t = createTranslator(ptBR)

export function LoginPage(): ReactNode {
  const vm = useLoginViewModel()
  const form = useLoginFormController(vm.submit)

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
      submitting={vm.status === 'submitting'}
      errorText={vm.errorTag === null ? null : t(vm.errorTag)}
      onEmailChange={form.setEmail}
      onPasswordChange={form.setPassword}
      onRememberChange={form.setRememberDevice}
      onSubmit={form.submit}
    />
  )
}
