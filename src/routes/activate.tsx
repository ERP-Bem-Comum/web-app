/**
 * Rota /activate (pública) — composition root / framework glue (fora da matriz de camadas).
 * Fluxo "Ativação de Conta" (#039): o e-mail de convite ("Cadastro de Usuário" → "Criar senha") aponta
 * para `${activationBaseUrl}?token=<token>`. O token de ativação É um password-reset token; a tela é a
 * MESMA do reset (variant='activate'), submetendo ao MESMO `POST /auth/reset-password`. validateSearch
 * aceita `token` opcional (ausente → "convite inválido"). beforeLoad: se já logado, vai ao dashboard.
 */
import { createFileRoute, redirect } from '@tanstack/react-router'
import * as z from 'zod'

import { getCurrentUserFn } from '#modules/auth/public-api/index.ts'
import { ResetPasswordPage } from '#modules/auth/client/reset-password/page/reset-password.page.tsx'

const ActivateSearchSchema = z.object({ token: z.string().trim().optional() })

export const Route = createFileRoute('/activate')({
  validateSearch: ActivateSearchSchema,
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    if (user !== null) throw redirect({ to: '/dashboard' })
  },
  component: ActivateRoute,
})

function ActivateRoute() {
  const { token } = Route.useSearch()
  return <ResetPasswordPage token={token ?? null} variant="activate" />
}
