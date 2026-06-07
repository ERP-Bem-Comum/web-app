/**
 * useActFormController — estado transiente do formulário de ACT (criar/editar) + validação na borda
 * (§IX) com `ActFormSchema`. Hook de estado (client-controller). 7 campos: 2 enums (área/vínculo),
 * data de início, CPF (normalizado p/ 11 dígitos). Reusado por criar e editar (passa `initial`).
 */
import { useCallback, useState } from 'react'

import { ActFormSchema, type ActFormValues } from '#modules/partners/client/data/model/act.model.ts'

export type { ActFormValues } from '#modules/partners/client/data/model/act.model.ts'
// A view (client-ui) consome as listas de enum POR AQUI — o boundary §XI não a deixa tocar `data/`.
export {
  OCCUPATION_AREAS,
  EMPLOYMENT_RELATIONSHIPS,
} from '#modules/partners/client/data/model/act.model.ts'

/** Estado cru do form — strings (os enums começam vazios; a validação Zod barra o submit inválido). */
export type ActFormState = Readonly<{
  name: string
  email: string
  cpf: string
  occupationArea: string
  role: string
  startOfContract: string
  employmentRelationship: string
}>

export type ActFormErrors = Readonly<Record<string, boolean>>

const EMPTY: ActFormState = {
  name: '',
  email: '',
  cpf: '',
  occupationArea: '',
  role: '',
  startOfContract: '',
  employmentRelationship: '',
}

function stateFromValues(v: ActFormValues | undefined): ActFormState {
  if (v === undefined) return EMPTY
  return {
    name: v.name,
    email: v.email,
    cpf: v.cpf,
    occupationArea: v.occupationArea,
    role: v.role,
    startOfContract: v.startOfContract,
    employmentRelationship: v.employmentRelationship,
  }
}

export type ActFormController = Readonly<{
  state: ActFormState
  errors: ActFormErrors
  setField: <K extends keyof ActFormState>(key: K, value: ActFormState[K]) => void
  submit: () => void
}>

export function useActFormController(
  opts: Readonly<{ initial?: ActFormValues; onSubmit: (values: ActFormValues) => void }>,
): ActFormController {
  const [state, setState] = useState<ActFormState>(() => stateFromValues(opts.initial))
  const [errors, setErrors] = useState<ActFormErrors>({})

  const setField = useCallback<ActFormController['setField']>((key, value) => {
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  const submit = useCallback(() => {
    const parsed = ActFormSchema.safeParse({ ...state })
    if (!parsed.success) {
      const next: Record<string, boolean> = {}
      for (const issue of parsed.error.issues) next[issue.path.join('.')] = true
      setErrors(next)
      return
    }
    setErrors({})
    opts.onSubmit(parsed.data)
  }, [state, opts])

  return { state, errors, setField, submit }
}
