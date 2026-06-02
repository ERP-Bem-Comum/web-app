/**
 * useContractFormController — estado transiente do formulário de contrato.
 */
import { useState, useCallback } from 'react'
import type { CreateContractInput } from '#modules/contracts/client/data/model/contracts.model.ts'

export type ContractFormState = Readonly<{
  title: string
  objective: string
  originalValueCents: number
  originalPeriodStart: string
  originalPeriodEnd: string
  classification: 'Contract' | 'ServiceOrder'
  contractModel: 'Service' | 'Donation'
  contractType: 'Supplier' | 'Financier' | 'Collaborator' | 'ACT'
  supplierId: string
  financierId: string
  collaboratorId: string
  programId: number | null
  budgetPlanId: number | null
  categorizacao: 'Avaliação' | 'Operacional' | 'Processo' | null
  centroDeCusto: 'RH' | 'Serviços Gerais' | 'Eventos' | null
  email: string
  telephone: string
  observations: string
}>

export const useContractFormController = (onSubmit: (input: CreateContractInput) => void) => {
  const [state, setState] = useState<ContractFormState>({
    title: '',
    objective: '',
    originalValueCents: 0,
    originalPeriodStart: '',
    originalPeriodEnd: '',
    classification: 'Contract',
    contractModel: 'Service',
    contractType: 'Supplier',
    supplierId: '',
    financierId: '',
    collaboratorId: '',
    programId: null,
    budgetPlanId: null,
    categorizacao: null,
    centroDeCusto: null,
    email: '',
    telephone: '',
    observations: '',
  })

  const update = useCallback(<K extends keyof ContractFormState>(key: K, value: ContractFormState[K]) => {
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  const submit = useCallback(() => {
    const input: CreateContractInput = {
      title: state.title,
      objective: state.objective,
      originalValueCents: state.originalValueCents,
      originalPeriod: {
        start: new Date(state.originalPeriodStart),
        end: new Date(state.originalPeriodEnd),
      },
      classification: state.classification,
      contractModel: state.contractModel,
      contractType: state.contractType,
      supplierId: state.supplierId || undefined,
      financierId: state.financierId || undefined,
      collaboratorId: state.collaboratorId || undefined,
      programId: state.programId ?? undefined,
      budgetPlanId: state.budgetPlanId ?? undefined,
      categorizacao: state.categorizacao ?? undefined,
      centroDeCusto: state.centroDeCusto ?? undefined,
      email: state.email || undefined,
      telephone: state.telephone || undefined,
      observations: state.observations || undefined,
    }
    onSubmit(input)
  }, [state, onSubmit])

  return { state, update, submit }
}
