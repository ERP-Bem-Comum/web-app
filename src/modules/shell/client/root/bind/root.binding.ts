/**
 * useRootBinding — ADAPTER React (ADR-0009/0012): liga o `rootViewModel` agnóstico às primitivas do
 * framework. Aplica o reducer da VM (`useReducer`), lê a rota (`useRouterState`), navega no logout, e
 * deriva o que a page precisa. Recebe o `user` (userId+permissions) por ARGUMENTO — vem do route context
 * (server fn de auth `/auth/me`, que NÃO traz o nome). O **nome de exibição** vem do perfil autosserviço
 * (GET /api/v1/me, query ['users','me'], compartilhada com "Minha Conta"): assim o topbar mostra o nome e
 * reflete edições automaticamente (a mutation de Minha Conta invalida ['users']). DOM em `useEffect` (SSR-safe).
 */
import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { isOk } from '#shared/primitives/result.ts'
import { logoutUseCase } from '#modules/auth/public-api/index.ts'
import { myAccountQueryOptions } from '#modules/users/public-api/index.ts'
import { MENU, type MenuSection } from '#modules/shell/client/data/menu/shell-menu.config.ts'
import {
  rootInitialUiState,
  rootUiReducer,
  rootViewModel,
} from '#modules/shell/client/root/viewModel/root.view-model.ts'

export type RootUser = Readonly<{ userId: string; name?: string; permissions: readonly string[] }>

export type RootView = Readonly<{
  user: RootUser
  collapsed: boolean
  sidebarWidth: number
  pageTitle: string
  showPageHeader: boolean
  fullBleed: boolean
  visibleMenu: readonly MenuSection[]
  isItemActive: (to: string) => boolean
  toggleSidebar: () => void
  logout: () => void
}>

export function useRootBinding(user: RootUser): RootView {
  const [state, dispatch] = useReducer(rootUiReducer, rootInitialUiState)
  const path = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()

  // Nome de exibição: do perfil autosserviço (/api/v1/me), reativo. Enquanto carrega, o topbar usa o
  // fallback do userId. Compartilha a queryKey ['users','me'] com "Minha Conta" → editar lá reflete aqui.
  const profileQuery = useQuery(myAccountQueryOptions)
  const profileName =
    profileQuery.data !== undefined && isOk(profileQuery.data) ? profileQuery.data.value.name : undefined
  const resolvedUser: RootUser =
    profileName !== undefined && profileName.trim().length > 0 ? { ...user, name: profileName } : user

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
    user: resolvedUser,
    collapsed: state.collapsed,
    sidebarWidth,
    pageTitle,
    showPageHeader: rootViewModel.showPageHeader(path),
    fullBleed: rootViewModel.fullBleedContent(path),
    visibleMenu: rootViewModel.visibleMenu(MENU, user.permissions),
    isItemActive: (to) => rootViewModel.isItemActive(path, to),
    toggleSidebar: () => {
      dispatch({ type: 'toggleSidebar' })
    },
    logout,
  }
}
