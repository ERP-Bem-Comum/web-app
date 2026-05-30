/**
 * Rota /login (pública) — composition root / framework glue (fora da matriz de camadas).
 * beforeLoad: se já logado, redireciona p/ '/'. Renderiza a LoginPage (módulo auth).
 * (US2 acrescenta o search `?redirect` validado; no MVP o pós-login vai p/ '/'.)
 */
import { createFileRoute, redirect } from '@tanstack/react-router'

import { getCurrentUserFn } from '../modules/auth/server/adapters/get-current-user.server-fn.ts'
import { LoginPage } from '../modules/auth/client/ui/login.page.tsx'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    if (user !== null) throw redirect({ to: '/' })
  },
  component: LoginPage,
})
