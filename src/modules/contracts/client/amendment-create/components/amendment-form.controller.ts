import { useState, useCallback } from 'react'
import type { CreateAmendmentInput, AmendmentType } from '#modules/contracts/client/data/model/contracts.model.ts'
// Re-export para as views (§XI: componentes não importam client/data direto — pegam tipos via controller).
export type { CreateAmendmentInput, AmendmentType } from '#modules/contracts/client/data/model/contracts.model.ts'

export type AmendmentFormState = Readonly<{
  type: AmendmentType | null
  description: string
  impactValueCents: number
  impactDirection: 'acrescimo' | 'supressao'
  newEndDate: string
  startDate: string
  signedAt: string
  hasDocument: boolean
  // Distrato (encerramento antecipado): data efetiva do distrato. Capturada aqui; a religação ao
  // POST /contracts/:id/end (Terminate) é do tech lead — ver handbook/core-api/tickets/CTR-HTTP-DISTRATO-*.
  terminationDate: string
}>

// Anexo opcional no MESMO save do create: documento assinado + data de assinatura → homologa em
// seguida (fluxo unificado). Sem anexo → aditivo nasce Pendente, sem efeito.
export type AmendmentAttach = Readonly<{ file: File; signedAt: string }>

export const useAmendmentFormController = (onSubmit: (input: CreateAmendmentInput, attach?: AmendmentAttach) => void) => {
  const [state, setState] = useState<AmendmentFormState>({
    type: null,
    description: '',
    impactValueCents: 0,
    impactDirection: 'acrescimo',
    newEndDate: '',
    startDate: '',
    signedAt: '',
    hasDocument: false,
    terminationDate: '',
  })

  const update = useCallback(<K extends keyof AmendmentFormState>(key: K, value: AmendmentFormState[K]) => {
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  const submit = useCallback((attach?: AmendmentAttach) => {
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
    onSubmit(input, attach)
  }, [state, onSubmit])

  return { state, update, submit }
}
