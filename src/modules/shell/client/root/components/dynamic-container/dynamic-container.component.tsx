/**
 * DynamicContainer — o "container dinâmico" do shell: onde o conteúdo de cada rota (o `<Outlet/>`, passado
 * por `children`) renderiza. View burra. Provê o SidebarContext às rotas filhas (largura/estado).
 */
import type { ReactNode } from 'react'

import { headText, headTitle } from '#shared/ui/brand/brand-page.css.ts'
import { SidebarProvider } from '#modules/shell/client/root/sidebar.context.ts'
import * as s from './dynamic-container.css.ts'

export interface DynamicContainerProps {
  readonly pageTitle: string
  readonly pageSubtitle?: string | undefined
  readonly showPageHeader: boolean
  readonly fullBleed?: boolean
  readonly sidebarWidth: number
  readonly collapsed: boolean
  readonly children: ReactNode
}

export function DynamicContainer({
  pageTitle,
  pageSubtitle,
  showPageHeader,
  fullBleed = false,
  sidebarWidth,
  collapsed,
  children,
}: DynamicContainerProps): ReactNode {
  return (
    <main className={fullBleed ? `${s.main} ${s.mainFullBleed}` : s.main}>
      {showPageHeader && (
        // Título + legenda no padrão do grid de Colaboradores (brand: Inter 22px + subtítulo 13.5px).
        <header className={s.pageHeader}>
          <div className={headText}>
            <h1 className={headTitle}>{pageTitle}</h1>
            {pageSubtitle !== undefined ? <p className={s.pageSubtitleBeige}>{pageSubtitle}</p> : null}
          </div>
        </header>
      )}
      <div className={s.content}>
        <SidebarProvider value={{ sidebarWidth, collapsed }}>{children}</SidebarProvider>
      </div>
    </main>
  )
}
