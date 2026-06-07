/**
 * Layout protegido (`_authenticated`) — guard de rota (FR-004). `beforeLoad` chama a server fn de sessão
 * (public-api da Auth); sem sessão → redireciona ao /login preservando o destino (`?redirect`).
 * Composition root: monta a TELA-raiz (`RootPage`) e injeta o `<Outlet/>` por children (ADR-0012).
 */
import type { ReactNode } from 'react'
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'

import { getCurrentUserFn } from '#modules/auth/public-api/index.ts'
import { RootPage } from '#modules/shell/public-api/index.ts'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUserFn()
    if (user === null) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    return { user }
  },
  component: RouteComponent,
})

function RouteComponent(): ReactNode {
  const { user } = Route.useRouteContext()
  return (
    <RootPage user={user}>
      <Outlet />
    </RootPage>
  )
}
