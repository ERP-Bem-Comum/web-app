/**
 * useProgramFormController — estado transiente do formulário de Programa (criar/editar) + validação na
 * borda (§IX) com `ProgramFormSchema`. Rastreia "sujo" (isDirty) p/ o modal de descarte. Hook de estado.
 */
import { useCallback, useMemo, useState } from 'react'

import { ProgramFormSchema, type ProgramFormValues } from '#modules/programs/client/data/model/program.model.ts'

export type { ProgramFormValues } from '#modules/programs/client/data/model/program.model.ts'

export type ProgramFormState = Readonly<{
  name: string
  sigla: string
  director: string
  generalCharacteristics: string
}>

export type ProgramFormErrors = Readonly<Record<string, boolean>>

const EMPTY: ProgramFormState = { name: '', sigla: '', director: '', generalCharacteristics: '' }

const stateFromValues = (v: ProgramFormValues | undefined): ProgramFormState =>
  v === undefined
    ? EMPTY
    : { name: v.name, sigla: v.sigla, director: v.director, generalCharacteristics: v.generalCharacteristics }

export type ProgramFormController = Readonly<{
  state: ProgramFormState
  errors: ProgramFormErrors
  isDirty: boolean
  setField: <K extends keyof ProgramFormState>(key: K, value: ProgramFormState[K]) => void
  reset: (values?: ProgramFormValues) => void
  submit: () => void
}>

export function useProgramFormController(
  opts: Readonly<{ initial?: ProgramFormValues; onSubmit: (values: ProgramFormValues) => void }>,
): ProgramFormController {
  const initial = useMemo(() => stateFromValues(opts.initial), [opts.initial])
  const [state, setState] = useState<ProgramFormState>(initial)
  const [baseline, setBaseline] = useState<ProgramFormState>(initial)
  const [errors, setErrors] = useState<ProgramFormErrors>({})

  const setField = useCallback<ProgramFormController['setField']>((key, value) => {
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  const reset = useCallback((values?: ProgramFormValues) => {
    const next = stateFromValues(values)
    setState(next)
    setBaseline(next)
    setErrors({})
  }, [])

  const isDirty =
    state.name !== baseline.name ||
    state.sigla !== baseline.sigla ||
    state.director !== baseline.director ||
    state.generalCharacteristics !== baseline.generalCharacteristics

  const submit = useCallback(() => {
    const parsed = ProgramFormSchema.safeParse({ ...state })
    if (!parsed.success) {
      const next: Record<string, boolean> = {}
      for (const issue of parsed.error.issues) next[issue.path.join('.')] = true
      setErrors(next)
      return
    }
    setErrors({})
    opts.onSubmit(parsed.data)
  }, [state, opts])

  return { state, errors, isDirty, setField, reset, submit }
}
