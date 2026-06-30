/**
 * DynamicContainer — o "container dinâmico" do shell: onde o conteúdo de cada rota (o `<Outlet/>`, passado
 * por `children`) renderiza. View burra. Provê o SidebarContext às rotas filhas (largura/estado).
 */
import type { ReactNode } from 'react'

import { SidebarProvider } from '#modules/shell/client/root/sidebar.context.ts'
import * as s from './dynamic-container.css.ts'

export interface DynamicContainerProps {
  readonly pageTitle: string
  readonly showPageHeader: boolean
  readonly fullBleed?: boolean
  readonly sidebarWidth: number
  readonly collapsed: boolean
  readonly children: ReactNode
}

export function DynamicContainer({
  pageTitle,
  showPageHeader,
  fullBleed = false,
  sidebarWidth,
  collapsed,
  children,
}: DynamicContainerProps): ReactNode {
  return (
    <main className={fullBleed ? `${s.main} ${s.mainFullBleed}` : s.main}>
      {showPageHeader && (
        <header className={s.pageHeader}>
          <h1 className={s.pageTitle}>{pageTitle}</h1>
        </header>
      )}
      <div className={s.content}>
        <SidebarProvider value={{ sidebarWidth, collapsed }}>{children}</SidebarProvider>
      </div>
    </main>
  )
}
