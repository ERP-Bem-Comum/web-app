/**
 * useRootBinding — ADAPTER React (ADR-0009/0012): liga o `rootViewModel` agnóstico às primitivas do
 * framework. Aplica o reducer da VM (`useReducer`), lê a rota (`useRouterState`), navega no logout, e
 * deriva o que a page precisa. Recebe o `user` (com `permissions`) por ARGUMENTO — vem do route context
 * via prop (NUNCA `useCurrentUser` aqui → evitaria double-fetch). Efeitos de DOM em `useEffect` (SSR-safe).
 */
import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'

import { logoutUseCase } from '#modules/auth/public-api/index.ts'
import { MENU, type MenuSection } from '#modules/shell/client/data/menu/shell-menu.config.ts'
import { rootInitialUiState, rootUiReducer, rootViewModel } from '#modules/shell/client/root/viewModel/root.view-model.ts'

export type RootUser = Readonly<{ userId: string; name?: string; permissions: readonly string[] }>

export type RootView = Readonly<{
  user: RootUser
  collapsed: boolean
  sidebarWidth: number
  pageTitle: string
  showPageHeader: boolean
  visibleMenu: readonly MenuSection[]
  isItemActive: (to: string) => boolean
  toggleSidebar: () => void
  logout: () => void
}>

export function useRootBinding(user: RootUser): RootView {
  const [state, dispatch] = useReducer(rootUiReducer, rootInitialUiState)
  const path = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()

  const pageTitle = rootViewModel.resolvePageTitle(path)
  const sidebarWidth = rootViewModel.sidebarWidth(state.collapsed)

  // Recolhe a sidebar ao navegar entre rotas (transição pura na VM, disparada aqui).
  const prevPath = useRef(path)
  useEffect(() => {
    if (path !== prevPath.current) {
      prevPath.current = path
      dispatch({ type: 'navigated' })
    }
  }, [path])

  // Efeitos de DOM (só client, pós-hidratação): título + CSS var de largura.
  useEffect(() => {
    document.title = `${pageTitle} · ERP Bem Comum`
    document.documentElement.style.setProperty('--sidebar-width', `${String(sidebarWidth)}px`)
  }, [pageTitle, sidebarWidth])

  const logout = useCallback((): void => {
    void (async () => {
      await logoutUseCase()
      await navigate({ to: '/login' })
    })()
  }, [navigate])

  return {
    user,
    collapsed: state.collapsed,
    sidebarWidth,
    pageTitle,
    showPageHeader: rootViewModel.showPageHeader(path),
    visibleMenu: rootViewModel.visibleMenu(MENU, user.permissions),
    isItemActive: (to) => rootViewModel.isItemActive(path, to),
    toggleSidebar: () => {
      dispatch({ type: 'toggleSidebar' })
    },
    logout,
  }
}
