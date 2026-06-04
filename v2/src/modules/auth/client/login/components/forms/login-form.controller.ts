/**
 * Controller (§XI) — estado TRANSIENTE do form de login (valores antes do submit). Por exceção (form é
 * o caso canônico). Valida localmente com Zod (client/data) e só então entrega ao ViewModel via `onSubmit`.
 * NÃO faz fetch / não orquestra servidor — só interação de form.
 */
import { useState } from 'react'

import { LoginInputSchema, type LoginInput } from '#modules/auth/client/data/model/auth.model.ts'

export const useLoginFormController = (
  onSubmit: (input: LoginInput) => void,
  onResetError: (() => void) | undefined,
) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const setEmailAndReset = (value: string): void => {
    setEmail(value)
    onResetError?.()
  }

  const setPasswordAndReset = (value: string): void => {
    setPassword(value)
    onResetError?.()
  }

  const submit = (): void => {
    const parsed = LoginInputSchema.safeParse({ email, password, rememberDevice: false })
    if (parsed.success) onSubmit(parsed.data)
  }

  return { email, setEmail: setEmailAndReset, password, setPassword: setPasswordAndReset, submit }
}
