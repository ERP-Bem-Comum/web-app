import { useState, useCallback } from 'react'
import type { CreateAmendmentInput, AmendmentType } from '#modules/contracts/client/data/model/contracts.model.ts'

export type AmendmentFormState = Readonly<{
  type: AmendmentType | null
  description: string
  impactValueCents: number
  impactDirection: 'acrescimo' | 'supressao'
  newEndDate: string
  startDate: string
  signedAt: string
  hasDocument: boolean
}>

export const useAmendmentFormController = (onSubmit: (input: CreateAmendmentInput) => void) => {
  const [state, setState] = useState<AmendmentFormState>({
    type: null,
    description: '',
    impactValueCents: 0,
    impactDirection: 'acrescimo',
    newEndDate: '',
    startDate: '',
    signedAt: '',
    hasDocument: false,
  })

  const update = useCallback(<K extends keyof AmendmentFormState>(key: K, value: AmendmentFormState[K]) => {
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  const submit = useCallback(() => {
    if (!state.type) return
    const input: CreateAmendmentInput = {
      type: state.type,
      description: state.description || undefined,
      impactValueCents: state.type === 'valor'
        ? state.impactDirection === 'supressao' ? -state.impactValueCents : state.impactValueCents
        : undefined,
      newEndDate: state.type === 'prazo' && state.newEndDate ? new Date(state.newEndDate) : undefined,
      startDate: state.startDate ? new Date(state.startDate) : undefined,
      signedAt: state.signedAt ? new Date(state.signedAt) : undefined,
    }
    onSubmit(input)
  }, [state, onSubmit])

  return { state, update, submit }
}
