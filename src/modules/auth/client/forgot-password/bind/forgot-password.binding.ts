/**
 * useForgotPasswordBinding — ADAPTER React (ADR-0009): liga o `forgotPasswordViewModel` agnóstico às
 * primitivas reativas do framework (TanStack `useMutation` + router) e expõe o `forgotPasswordCommand`.
 * É o ÚNICO ponto que toca o framework.
 *
 * Anti-enumeração (CRÍTICO): `succeeded` é `true` sempre que a chamada COMPLETA (Result.ok, 202),
 * NUNCA revelando se o e-mail existe. Só `errorTag` (rede/5xx) leva à mensagem de erro genérica.
 */
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { isErr, isOk } from '#shared/primitives/result.ts'
import type { ForgotPasswordInput } from '#modules/auth/client/data/model/auth.model.ts'
import { forgotPasswordViewModel } from '../viewModel/forgot-password.view-model.ts'

export type ForgotPasswordCommand = Readonly<{
  running: boolean
  succeeded: boolean
  errorTag: string | null
  errorReference: string | null
  execute: (input: ForgotPasswordInput) => void
  resetError: () => void
  backToLogin: () => void
}>

export const useForgotPasswordBinding = (): Readonly<{
  forgotPasswordCommand: ForgotPasswordCommand
}> => {
  const navigate = useNavigate()
  const mutation = useMutation(forgotPasswordViewModel.mutation)

  const data = mutation.data
  // Sucesso uniforme: 202 (Result.ok) SEMPRE abre o modal, sem diferenciar se o e-mail existe.
  const succeeded = data !== undefined && isOk(data)
  // Erro de auth ESPERADO chega como Result.err (só transporte/servidor). Erro LANÇADO → mutation.error.
  const errorTag =
    data !== undefined && isErr(data)
      ? forgotPasswordViewModel.toErrorTag(data.error.code)
      : mutation.isError
        ? forgotPasswordViewModel.unexpectedErrorTag
        : null
  const errorReference = data !== undefined && isErr(data) ? (data.error.reference ?? null) : null

  return {
    forgotPasswordCommand: {
      running: mutation.isPending,
      succeeded,
      errorTag,
      errorReference,
      execute: (input) => {
        mutation.mutate(input)
      },
      resetError: () => {
        mutation.reset()
      },
      backToLogin: () => {
        void navigate({ to: '/login' })
      },
    },
  }
}
