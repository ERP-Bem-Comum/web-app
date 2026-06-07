/**
 * useLoginBinding — ADAPTER React (ADR-0009): liga o `loginViewModel` agnóstico às primitivas reativas
 * do framework (TanStack `useMutation` + router) e expõe o `loginCommand` ({ running, errorTag, result,
 * execute }). É o ÚNICO ponto que toca o framework — trocar p/ Solid reescreve só este arquivo.
 */
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'

import { isErr, isOk } from '#shared/primitives/result.ts'
import type { AuthenticatedUser, LoginInput } from '#modules/auth/client/data/model/auth.model.ts'
import { safeRedirect } from '#modules/auth/client/data/helpers/safe-redirect.ts'
import { authBus } from '#modules/auth/client/data/events/auth.bus.ts'
import { loginViewModel } from '../viewModel/login.view-model.ts'

export type LoginCommand = Readonly<{
  running: boolean
  errorTag: string | null
  result: AuthenticatedUser | null
  execute: (input: LoginInput) => void
  resetError: () => void
}>

export const useLoginBinding = (): Readonly<{ loginCommand: LoginCommand }> => {
  const navigate = useNavigate()
  // lê `?redirect` (qualquer rota) e saneia (anti open-redirect) — sucesso volta ao destino pretendido.
  const search = useSearch({ strict: false })

  const mutation = useMutation({
    ...loginViewModel.mutation,
    onSuccess: (result) => {
      loginViewModel.onSuccess(result, {
        emit: (event) => {
          authBus.emit(event)
        },
      })
      if (isOk(result)) {
        const target = safeRedirect(typeof search.redirect === 'string' ? search.redirect : undefined)
        void navigate({ to: target })
      }
    },
  })

  const data = mutation.data
  // Erro de auth ESPERADO chega como Result.err (valor, HTTP 200). Erro INESPERADO/LANÇADO (rede, env,
  // server, RPC) não vira valor — vai para mutation.error; sem este ramo a UI ficaria SILENCIOSA.
  const errorTag =
    data !== undefined && isErr(data)
      ? loginViewModel.toErrorTag(data.error)
      : mutation.isError
        ? loginViewModel.unexpectedErrorTag
        : null
  return {
    loginCommand: {
      running: mutation.isPending,
      errorTag,
      result: data !== undefined && isOk(data) ? data.value : null,
      execute: (input) => {
        mutation.mutate(input)
      },
      resetError: () => {
        mutation.reset()
      },
    },
  }
}
