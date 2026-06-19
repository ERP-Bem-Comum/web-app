/**
 * RootPage — a TELA-raiz (ADR-0012): view burra que compõe TopBar + SideBar + DynamicContainer.
 * Recebe `user` (com permissions) por prop (do route context) e o `children` (o `<Outlet/>`). Toda a
 * lógica vem do `useRootBinding`. Zero data-hook direto, zero estado de página aqui.
 */
import type { ReactNode } from 'react'

import { useRootBinding, type RootUser } from '#modules/shell/client/root/bind/root.binding.ts'
import { TopBar } from '#modules/shell/client/root/components/top-bar/top-bar.component.tsx'
import { SideBar } from '#modules/shell/client/root/components/side-bar/side-bar.component.tsx'
import { DynamicContainer } from '#modules/shell/client/root/components/dynamic-container/dynamic-container.component.tsx'
import * as s from './root.css.ts'

export interface RootPageProps {
  readonly user: RootUser
  readonly children: ReactNode
}

export function RootPage({ user, children }: RootPageProps): ReactNode {
  const v = useRootBinding(user)
  return (
    <div className={s.shell}>
      <TopBar user={v.user} onLogout={v.logout} />

      <div className={s.body}>
        <div className={s.sidebarSticky}>
          <SideBar
            collapsed={v.collapsed}
            onToggle={v.toggleSidebar}
            menuItems={v.visibleMenu}
            isItemActive={v.isItemActive}
          />
        </div>

        <DynamicContainer
          pageTitle={v.pageTitle}
          showPageHeader={v.showPageHeader}
          fullBleed={v.fullBleed}
          sidebarWidth={v.sidebarWidth}
          collapsed={v.collapsed}
        >
          {children}
        </DynamicContainer>
      </div>
    </div>
  )
}
