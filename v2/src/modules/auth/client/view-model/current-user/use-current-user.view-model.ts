/**
 * ViewModel do usuário atual (§XI) — query TanStack do `me` + assina o Event Bus p/ invalidar quando
 * o usuário autentica/sai (§XII). Expõe { user, isAuthenticated } (derivação pura em current-user-view).
 */
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchCurrentUser } from '#modules/auth/client/data/gateways/current-user.gateway.ts'
import { authBus } from '#modules/auth/client/data/events/auth.bus.ts'
import { deriveCurrentUser, type CurrentUserView } from './current-user-view.ts'

const CURRENT_USER_KEY = ['auth', 'me'] as const

export const useCurrentUser = (): CurrentUserView => {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: CURRENT_USER_KEY, queryFn: fetchCurrentUser })

  useEffect(() => {
    const invalidate = (): void => {
      void queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY })
    }
    const offIn = authBus.on('UsuarioAutenticado', invalidate)
    const offOut = authBus.on('SessaoEncerrada', invalidate)
    return () => {
      offIn()
      offOut()
    }
  }, [queryClient])

  return deriveCurrentUser(query.data)
}
