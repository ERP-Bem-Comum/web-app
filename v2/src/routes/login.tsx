/**
 * Rota /login (pública) — composition root / framework glue (fora da matriz de camadas).
 * validateSearch: aceita `?redirect=<rota>` (saneado por safeRedirect). beforeLoad: se já logado,
 * vai direto ao destino pretendido (ou '/'). Renderiza a LoginPage (consome a public-api da Auth).
 */
import { createFileRoute, redirect } from '@tanstack/react-router'
import * as z from 'zod'

import { getCurrentUserFn, safeRedirect } from '#modules/auth/public-api/index.ts'
import { LoginPage } from '#modules/auth/client/login/page/login.page.tsx'

const LoginSearchSchema = z.object({ redirect: z.string().trim().optional() })

export const Route = createFileRoute('/login')({
  validateSearch: LoginSearchSchema,
  beforeLoad: async ({ search }) => {
    const user = await getCurrentUserFn()
    if (user !== null) throw redirect({ to: safeRedirect(search.redirect) })
  },
  component: LoginPage,
})
