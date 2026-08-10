/**
 * Controller (§XI) — estado TRANSIENTE do form "Esqueci Minha Senha" (o e-mail antes do submit).
 * Valida localmente com Zod (client/data) e só então entrega ao ViewModel via `onSubmit`.
 * NÃO faz fetch / não orquestra servidor — só interação de form.
 */
import { useState } from 'react'

import {
  ForgotPasswordInputSchema,
  type ForgotPasswordInput,
} from '#modules/auth/client/data/model/auth.model.ts'

export const useForgotPasswordFormController = (
  onSubmit: (input: ForgotPasswordInput) => void,
  onResetError: (() => void) | undefined,
) => {
  const [email, setEmail] = useState('')

  const setEmailAndReset = (value: string): void => {
    setEmail(value)
    onResetError?.()
  }

  const submit = (): void => {
    const parsed = ForgotPasswordInputSchema.safeParse({ email })
    if (parsed.success) onSubmit(parsed.data)
  }

  return { email, setEmail: setEmailAndReset, submit }
}
