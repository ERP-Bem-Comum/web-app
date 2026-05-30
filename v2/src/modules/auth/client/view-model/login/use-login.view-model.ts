/**
 * ViewModel do login (§XI) — a verdade reativa da tela. Liga server-state (TanStack mutation) e expõe
 * `{ status, errorTag, submit }` à view (dados, nunca JSX). Sucesso → navega (redirect simples '/' no MVP;
 * a feature/US2 trata `?redirect`). Erro → tag i18n (a page resolve). Wira o use-case + o navigate aqui.
 */
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'

import { isOk } from '#shared/primitives/result.ts'
import type { LoginInput } from '#modules/auth/client/data/model/auth.model.ts'
import { safeRedirect } from '#modules/auth/client/data/helpers/safe-redirect.ts'
import { loginUseCase } from '#modules/auth/client/usecase/login/login.composition.ts'
import { deriveLoginView, type LoginView } from './login-view.ts'

export type LoginViewModel = LoginView & Readonly<{ submit: (input: LoginInput) => void }>

export const useLoginViewModel = (): LoginViewModel => {
  const navigate = useNavigate()
  // lê `?redirect` (qualquer rota) e saneia (anti open-redirect) — sucesso volta ao destino pretendido.
  const search = useSearch({ strict: false })
  const mutation = useMutation({
    mutationFn: loginUseCase,
    onSuccess: (result) => {
      if (isOk(result)) {
        const target = safeRedirect(typeof search.redirect === 'string' ? search.redirect : undefined)
        void navigate({ to: target })
      }
    },
  })

  return {
    ...deriveLoginView({ isPending: mutation.isPending, data: mutation.data }),
    submit: (input) => {
      mutation.mutate(input)
    },
  }
}
