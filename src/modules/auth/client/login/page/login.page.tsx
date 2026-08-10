/**
 * LoginPage — template/composição (§XI, ADR-0009): liga o binding + Controller + View burra.
 * Layout fiel à referência visual da v1 (2026-06-03): fundo com formas, card com barra laranja.
 */
import type { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { useLoginBinding } from '#modules/auth/client/login/bind/login.binding.ts'
import { useLoginFormController } from '../components/forms/login-form.controller.ts'
import { LoginForm } from '../components/forms/login-form.component.tsx'
import { screen, shapeTopRight, shapeBottomLeft, cardWrapper, accentBar, cardContent } from './login.css.ts'

const t = createTranslator(ptBR)

export function LoginPage(): ReactNode {
  const navigate = useNavigate()
  const { loginCommand } = useLoginBinding()
  const form = useLoginFormController(loginCommand.execute, loginCommand.resetError)

  return (
    <div className={screen}>
      <div className={shapeTopRight} aria-hidden="true" />
      <div className={shapeBottomLeft} aria-hidden="true" />

      <div className={cardWrapper}>
        <div className={accentBar} aria-hidden="true" />
        <div className={cardContent}>
          <LoginForm
            title={t('auth.login.title')}
            emailLabel={t('auth.login.email')}
            passwordLabel={t('auth.login.password')}
            emailPlaceholder={t('auth.login.email-placeholder')}
            passwordPlaceholder={t('auth.login.password-placeholder')}
            submitLabel={t('auth.login.submit')}
            forgotLabel={t('auth.login.forgot-password')}
            loadingLabel={t('common.loading')}
            email={form.email}
            password={form.password}
            submitting={loginCommand.running}
            errorText={loginCommand.errorTag === null ? null : t(loginCommand.errorTag)}
            errorReference={
              loginCommand.errorReference === null
                ? null
                : `${t('auth.error.reference-label')} ${loginCommand.errorReference}`
            }
            onEmailChange={form.setEmail}
            onPasswordChange={form.setPassword}
            onSubmit={form.submit}
            onForgotPassword={() => {
              void navigate({ to: '/recuperar-senha' })
            }}
          />
        </div>
      </div>
    </div>
  )
}
