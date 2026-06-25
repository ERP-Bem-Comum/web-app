/**
 * useUserFormController — estado transiente do formulário de inclusão de Usuário + validação na borda
 * (§IX) com `UserFormSchema`. Hook de estado (client-controller). Campos que vão ao POST: name, cpf,
 * email, telephone (CPF/telefone normalizados para dígitos). Espelha `act-form.controller.ts`.
 */
import { useCallback, useState } from 'react'

import { UserFormSchema, type UserFormValues } from '#modules/users/client/data/model/user.model.ts'

export type { UserFormValues } from '#modules/users/client/data/model/user.model.ts'

/** Estado cru do form — strings (CPF/telefone guardam só dígitos; a máscara é só de exibição). */
export type UserFormState = Readonly<{
  name: string
  cpf: string
  email: string
  telephone: string
  massApprovalPermission: boolean // checkbox "Aprovador em Massa"
}>

export type UserFormErrors = Readonly<Record<string, boolean>>

const EMPTY: UserFormState = { name: '', cpf: '', email: '', telephone: '', massApprovalPermission: false }

// massApprovalPermission não vem do `UserFormValues` (não é validado) — começa false; o usuário marca no form.
const stateFromValues = (v: UserFormValues | undefined): UserFormState =>
  v === undefined
    ? EMPTY
    : { name: v.name, cpf: v.cpf, email: v.email, telephone: v.telephone, massApprovalPermission: false }

export type UserFormController = Readonly<{
  state: UserFormState
  errors: UserFormErrors
  setField: <K extends keyof UserFormState>(key: K, value: UserFormState[K]) => void
  reset: (values?: UserFormValues) => void
  submit: () => void
}>

export function useUserFormController(
  opts: Readonly<{ initial?: UserFormValues; onSubmit: (values: UserFormValues) => void }>,
): UserFormController {
  const [state, setState] = useState<UserFormState>(() => stateFromValues(opts.initial))
  const [errors, setErrors] = useState<UserFormErrors>({})

  const setField = useCallback<UserFormController['setField']>((key, value) => {
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  const reset = useCallback((values?: UserFormValues) => {
    setState(stateFromValues(values))
    setErrors({})
  }, [])

  const submit = useCallback(() => {
    const parsed = UserFormSchema.safeParse({ ...state })
    if (!parsed.success) {
      const next: Record<string, boolean> = {}
      for (const issue of parsed.error.issues) next[issue.path.join('.')] = true
      setErrors(next)
      return
    }
    setErrors({})
    opts.onSubmit(parsed.data)
  }, [state, opts])

  return { state, errors, setField, reset, submit }
}
