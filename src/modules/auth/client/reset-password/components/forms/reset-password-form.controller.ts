/**
 * Controller (§XI) — estado TRANSIENTE do form "Redefinir Senha" (#038): nova senha + confirmação +
 * visibilidade dos campos, antes do submit. Compõe o input com o `token` (vindo da rota) e só entrega
 * ao ViewModel via `onSubmit` quando o gate puro (policy + confirmação) permite. NÃO faz fetch.
 */
import { useState } from 'react'

import type { ResetPasswordInput } from '#modules/auth/client/data/model/auth.model.ts'

export const useResetPasswordFormController = (
  token: string,
  onSubmit: (input: ResetPasswordInput) => void,
  onResetError: (() => void) | undefined,
) => {
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showNext, setShowNext] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const setNextAndReset = (value: string): void => {
    setNext(value)
    onResetError?.()
  }
  const setConfirmAndReset = (value: string): void => {
    setConfirm(value)
    onResetError?.()
  }

  const submit = (): void => {
    onSubmit({ token, newPassword: next })
  }

  return {
    next,
    confirm,
    showNext,
    showConfirm,
    setNext: setNextAndReset,
    setConfirm: setConfirmAndReset,
    toggleShowNext: (): void => {
      setShowNext((s) => !s)
    },
    toggleShowConfirm: (): void => {
      setShowConfirm((s) => !s)
    },
    submit,
  }
}
