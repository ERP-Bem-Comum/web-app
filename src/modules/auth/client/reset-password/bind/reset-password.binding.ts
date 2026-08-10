/**
 * useResetPasswordBinding — ADAPTER React (#038, ADR-0009): liga o `resetPasswordViewModel` agnóstico às
 * primitivas reativas do framework (TanStack `useMutation` + `useQuery` da policy + router) e expõe o
 * `resetPasswordCommand`. É o ÚNICO ponto que toca o framework.
 *
 * Estados: `succeeded` (2xx) abre o modal de sucesso → login; `errorTag` distingue 'reset-token-invalid'
 * (link inválido/expirado/usado, 400) de erro de rede/5xx (genérico). A policy (fonte única #32) vem por
 * query; fallback seguro {12,128} quando indisponível (D4).
 */
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { isErr, isOk } from '#shared/primitives/result.ts'
import { passwordPolicyQueryOptions } from '#modules/auth/public-api/index.ts'
import { DEFAULT_PASSWORD_LIMITS, type PasswordLimits } from '#modules/users/public-api/index.ts'
import type { ResetPasswordInput } from '#modules/auth/client/data/model/auth.model.ts'
import { resetPasswordViewModel } from '../viewModel/reset-password.view-model.ts'

export type ResetPasswordCommand = Readonly<{
  running: boolean
  succeeded: boolean
  errorTag: string | null
  errorReference: string | null
  execute: (input: ResetPasswordInput) => void
  resetError: () => void
  backToLogin: () => void
}>

export const useResetPasswordBinding = (): Readonly<{
  resetPasswordCommand: ResetPasswordCommand
  passwordLimits: PasswordLimits
}> => {
  const navigate = useNavigate()
  const mutation = useMutation(resetPasswordViewModel.mutation)

  // Política de senha da fonte única (#32); null/erro → fallback seguro {12,128} (D4).
  const policyQuery = useQuery(passwordPolicyQueryOptions)
  const passwordLimits: PasswordLimits = {
    minLength: policyQuery.data?.minLength ?? DEFAULT_PASSWORD_LIMITS.minLength,
    maxLength: policyQuery.data?.maxLength ?? DEFAULT_PASSWORD_LIMITS.maxLength,
  }

  const data = mutation.data
  const succeeded = data !== undefined && isOk(data)
  // Erro ESPERADO (400 → 'reset-token-invalid', ou rede/5xx) chega como Result.err. Lançado → mutation.error.
  const errorTag =
    data !== undefined && isErr(data)
      ? resetPasswordViewModel.toErrorTag(data.error.code)
      : mutation.isError
        ? resetPasswordViewModel.unexpectedErrorTag
        : null
  const errorReference = data !== undefined && isErr(data) ? (data.error.reference ?? null) : null

  return {
    resetPasswordCommand: {
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
    passwordLimits,
  }
}
