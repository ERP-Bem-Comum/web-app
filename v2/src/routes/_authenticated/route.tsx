/**
 * Layout protegido (`_authenticated`) — guard de rota (FR-004). beforeLoad chama a server fn de sessão
 * (public-api da Auth); sem sessão → redireciona ao /login preservando o destino (`?redirect`).
 * Composition root / framework glue. Rotas protegidas vivem como filhas deste layout.
 */
import { useEffect, useState, createContext, useContext, useRef } from 'react'
import type { ReactNode } from 'react'
import { createFileRoute, redirect, Outlet, useRouterState } from '@tanstack/react-router'

import { vars } from '#shared/ui/tokens/index.ts'
import { getCurrentUserFn } from '#modules/auth/public-api/index.ts'
import { Sidebar } from './-sidebar.component.tsx'
import { TopBar } from './-topbar.component.tsx'

/* ─── Contexto do sidebar (compartilhado com rotas filhas) ─── */

export interface SidebarContextValue {
  readonly sidebarWidth: number
  readonly collapsed: boolean
}

const SidebarContext = createContext<SidebarContextValue>({
  sidebarWidth: 260,
  collapsed: false,
})

export function useSidebarContext(): SidebarContextValue {
  return useContext(SidebarContext)
}

/* ─── Título por rota ─── */

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/contratos': 'Contratos',
  '/login': 'Login',
}

function usePageTitle(): string {
  const { location } = useRouterState()
  const path = location.pathname

  // Match mais específico primeiro
  for (const [route, title] of Object.entries(PAGE_TITLES)) {
    if (path === route || path.startsWith(route + '/')) {
      return title
    }
  }

  return 'ERP Bem Comum'
}

function PageHeader({ title }: { readonly title: string }): ReactNode {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexShrink: 0,
      }}
    >
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#1a1a2e',
          fontFamily: vars.font.family.heading,
          margin: 0,
        }}
      >
        {title}
      </h1>
    </header>
  )
}

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUserFn()
    if (user === null) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    return { user }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout(): ReactNode {
  const [collapsed, setCollapsed] = useState(false)
  const title = usePageTitle()
  const { location } = useRouterState()
  const sidebarWidth = collapsed ? 64 : 260
  const { user } = Route.useRouteContext()

  useEffect(() => {
    document.title = `${title} · ERP Bem Comum`
    document.documentElement.style.setProperty('--sidebar-width', `${String(sidebarWidth)}px`)
  }, [title, sidebarWidth])

  /* Recolhe sidebar automaticamente ao navegar entre rotas */
  const prevPath = useRef(location.pathname)
  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname
      setCollapsed(true)
    }
  }, [location.pathname])

  return (
    <div style={{ height: '100dvh', overflow: 'hidden', paddingTop: '56px' }}>
      <TopBar user={user} />

      <div style={{ display: 'flex', height: 'calc(100dvh - 56px)', overflow: 'hidden' }}>
        {/* Sidebar — sticky para acompanhar a viewport */}
        <div style={{ position: 'sticky', top: 0, height: '100%', zIndex: 200, flexShrink: 0 }}>
          <Sidebar collapsed={collapsed} onToggle={() => { setCollapsed((p) => !p) }} onCollapse={() => { setCollapsed(true) }} />
        </div>

        {/* Conteúdo principal */}
        <main
          style={{
            flex: 1,
            padding: '32px',
            background: '#ffffff',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {location.pathname !== '/contratos/criar' && <PageHeader title={title} />}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <SidebarContext.Provider value={{ sidebarWidth, collapsed }}>
              <Outlet />
            </SidebarContext.Provider>
          </div>
        </main>
      </div>
    </div>
  )
}
