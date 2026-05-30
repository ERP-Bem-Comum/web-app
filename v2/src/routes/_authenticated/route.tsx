/**
 * Layout protegido (`_authenticated`) — guard de rota (FR-004). beforeLoad chama a server fn de sessão
 * (public-api da Auth); sem sessão → redireciona ao /login preservando o destino (`?redirect`).
 * Composition root / framework glue. Rotas protegidas vivem como filhas deste layout.
 */
import { createFileRoute, redirect } from '@tanstack/react-router'

import { getCurrentUserFn } from '#modules/auth/public-api/index.ts'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUserFn()
    if (user === null) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    return { user }
  },
})
