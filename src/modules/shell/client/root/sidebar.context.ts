/**
 * SidebarContext — expõe a largura/estado do side-bar às rotas filhas (ex.: footers fixos que alinham
 * pelo `--sidebar-width`). Provido pelo DynamicContainer; consumido via `useSidebarContext()`.
 */
import { createContext, useContext } from 'react'

import { SIDEBAR_WIDTH_EXPANDED } from '#modules/shell/client/root/viewModel/root.view-model.ts'

export interface SidebarContextValue {
  readonly sidebarWidth: number
  readonly collapsed: boolean
}

const SidebarContext = createContext<SidebarContextValue>({
  sidebarWidth: SIDEBAR_WIDTH_EXPANDED,
  collapsed: false,
})

export const SidebarProvider = SidebarContext.Provider

export function useSidebarContext(): SidebarContextValue {
  return useContext(SidebarContext)
}
