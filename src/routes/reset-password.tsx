/**
 * Rota /reset-password (pública) — composition root / framework glue (fora da matriz de camadas).
 * Fluxo "Redefinir Senha" (#038): o link do e-mail aponta para `?token=<token>`. validateSearch aceita
 * o `token` opcional (ausente → a page mostra "link inválido"). beforeLoad: se já logado, vai ao
 * dashboard (não faz sentido redefinir senha autenticado). Passa o token à ResetPasswordPage por prop.
 */
import { createFileRoute, redirect } from '@tanstack/react-router'
import * as z from 'zod'

import { getCurrentUserFn } from '#modules/auth/public-api/index.ts'
import { ResetPasswordPage } from '#modules/auth/client/reset-password/page/reset-password.page.tsx'

const ResetPasswordSearchSchema = z.object({ token: z.string().trim().optional() })

export const Route = createFileRoute('/reset-password')({
  validateSearch: ResetPasswordSearchSchema,
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    if (user !== null) throw redirect({ to: '/dashboard' })
  },
  component: ResetPasswordRoute,
})

function ResetPasswordRoute() {
  const { token } = Route.useSearch()
  return <ResetPasswordPage token={token ?? null} />
}
