/**
 * ViewModel do login (§XI) — a verdade reativa da tela. Liga server-state (TanStack mutation) e expõe
 * `{ status, errorTag, submit }` à view (dados, nunca JSX). Sucesso → navega (redirect simples '/' no MVP;
 * a feature/US2 trata `?redirect`). Erro → tag i18n (a page resolve). Wira o use-case + o navigate aqui.
 */
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { isOk } from '../../../../shared/primitives/result.ts'
import type { LoginInput } from '../data/auth.model.ts'
import { loginUseCase } from '../usecase/login.composition.ts'
import { deriveLoginView, type LoginView } from './login-view.ts'

export type LoginViewModel = LoginView & Readonly<{ submit: (input: LoginInput) => void }>

export const useLoginViewModel = (): LoginViewModel => {
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: loginUseCase,
    onSuccess: (result) => {
      if (isOk(result)) void navigate({ to: '/' })
    },
  })

  return {
    ...deriveLoginView({ isPending: mutation.isPending, data: mutation.data }),
    submit: (input) => {
      mutation.mutate(input)
    },
  }
}
