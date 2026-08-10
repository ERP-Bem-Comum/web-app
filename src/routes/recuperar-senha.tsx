/**
 * Rota /recuperar-senha (pública) — composition root / framework glue (fora da matriz de camadas).
 * Fluxo "Esqueci Minha Senha" (#037). beforeLoad: se já logado, vai ao dashboard (não faz sentido
 * recuperar senha autenticado). Renderiza a ForgotPasswordPage (consome a public-api da Auth).
 */
import { createFileRoute, redirect } from '@tanstack/react-router'

import { getCurrentUserFn } from '#modules/auth/public-api/index.ts'
import { ForgotPasswordPage } from '#modules/auth/client/forgot-password/page/forgot-password.page.tsx'

export const Route = createFileRoute('/recuperar-senha')({
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    if (user !== null) throw redirect({ to: '/dashboard' })
  },
  component: ForgotPasswordPage,
})
