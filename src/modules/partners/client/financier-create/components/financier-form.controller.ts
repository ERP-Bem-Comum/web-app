/**
 * useFinancierFormController — estado transiente do formulário de financiador (criar/editar) +
 * validação na borda do cliente (§IX) com `FinancierFormSchema`. Hook de estado (client-controller).
 * Reusado por criar e editar (este último passa `initial`). PJ-only, 6 campos — sem banco/PIX/categoria.
 */
import { useCallback, useState } from 'react'

import { FinancierFormSchema, type FinancierFormValues } from '#modules/partners/client/data/model/financier.model.ts'

export type { FinancierFormValues } from '#modules/partners/client/data/model/financier.model.ts'

export type FinancierFormState = Readonly<{
  name: string
  corporateName: string
  legalRepresentative: string
  cnpj: string
  telephone: string
  address: string
}>

export type FinancierFormErrors = Readonly<Record<string, boolean>>

const EMPTY: FinancierFormState = {
  name: '',
  corporateName: '',
  legalRepresentative: '',
  cnpj: '',
  telephone: '',
  address: '',
}

function stateFromValues(v: FinancierFormValues | undefined): FinancierFormState {
  if (v === undefined) return EMPTY
  return {
    name: v.name,
    corporateName: v.corporateName,
    legalRepresentative: v.legalRepresentative,
    cnpj: v.cnpj,
    telephone: v.telephone,
    address: v.address,
  }
}

export type FinancierFormController = Readonly<{
  state: FinancierFormState
  errors: FinancierFormErrors
  setField: <K extends keyof FinancierFormState>(key: K, value: FinancierFormState[K]) => void
  reset: (values?: FinancierFormValues) => void
  submit: () => void
}>

export function useFinancierFormController(
  opts: Readonly<{ initial?: FinancierFormValues; onSubmit: (values: FinancierFormValues) => void }>,
): FinancierFormController {
  const [state, setState] = useState<FinancierFormState>(() => stateFromValues(opts.initial))
  const [errors, setErrors] = useState<FinancierFormErrors>({})

  const setField = useCallback<FinancierFormController['setField']>((key, value) => {
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  const reset = useCallback((values?: FinancierFormValues) => {
    setState(stateFromValues(values))
    setErrors({})
  }, [])

  const submit = useCallback(() => {
    const parsed = FinancierFormSchema.safeParse({ ...state })
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
