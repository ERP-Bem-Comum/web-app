/**
 * useContractFormController — estado transiente do formulário de criação de contrato.
 * Replicação v1: campos completos + modal de finalização + selectedPartner + checklist.
 */
import { useState, useCallback, useMemo } from 'react'
import type { CreateContractInput } from '#modules/contracts/client/data/model/contracts.model.ts'

export interface SelectedPartner {
  readonly id: string
  readonly name: string
  readonly cnpj?: string
  readonly cpf?: string
  readonly email?: string
  readonly telephone?: string
  readonly kind: 'Fornecedor' | 'Financiador' | 'Colaborador'
  readonly bancaryInfo?: Readonly<{
    bank: string
    agency: string
    accountNumber: string
    dv: string
  }>
  readonly pixInfo?: Readonly<{
    keyType: string
    key: string
  }>
}

export type ContractFormState = Readonly<{
  title: string
  objective: string
  originalValueCents: number
  valorInput: string
  originalPeriodStart: string
  originalPeriodEnd: string
  classification: 'Contract' | 'ServiceOrder'
  contractModel: 'Service' | 'Donation'
  contractType: 'Supplier' | 'Financier' | 'Collaborator' | 'ACT'
  supplierId: string
  financierId: string
  collaboratorId: string
  // IDs técnicos = UUID string (ADR-0013). categorizacao/centroDeCusto = string livre.
  programId: string | null
  budgetPlanId: string | null
  categorizacao: string | null
  centroDeCusto: string | null
  email: string
  telephone: string
  observations: string
  bancaryInfo: Readonly<{
    bank: string
    agency: string
    accountNumber: string
    dv: string
  }>
  pixInfo: Readonly<{
    keyType: string
    key: string
  }>
}>

export interface ContractFormController {
  readonly state: ContractFormState
  readonly selectedPartner: SelectedPartner | null
  readonly showModal: boolean
  readonly isOvertopOS: boolean
  readonly validationAttempted: boolean
  readonly update: <K extends keyof ContractFormState>(key: K, value: ContractFormState[K]) => void
  readonly setSelectedPartner: (partner: SelectedPartner | null) => void
  readonly openModal: () => void
  readonly closeModal: () => void
  readonly triggerValidation: () => void
  readonly submit: () => CreateContractInput
  readonly checklist: Readonly<{
    checks: Readonly<{
      contratado: boolean
      contrato: boolean
      valor: boolean
      vigencia: boolean
      programa: boolean
      categorizacao: boolean
      centroDeCusto: boolean
    }>
    done: number
    total: number
  }>
  readonly currentYear: number
}

export const useContractFormController = (): ContractFormController => {
  const [state, setState] = useState<ContractFormState>({
    title: '',
    objective: '',
    originalValueCents: 0,
    valorInput: '',
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
    bancaryInfo: { bank: '', agency: '', accountNumber: '', dv: '' },
    pixInfo: { keyType: '', key: '' },
  })

  const [selectedPartner, setSelectedPartner] = useState<SelectedPartner | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [validationAttempted, setValidationAttempted] = useState(false)
  // Ano corrente estável (lazy) p/ o número provisório — fora do render da view burra (C1).
  const [currentYear] = useState(() => new Date().getFullYear())

  const update = useCallback(<K extends keyof ContractFormState>(key: K, value: ContractFormState[K]) => {
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  const openModal = useCallback(() => { setShowModal(true) }, [])
  const closeModal = useCallback(() => { setShowModal(false) }, [])
  const triggerValidation = useCallback(() => { setValidationAttempted(true) }, [])

  const isOvertopOS = useMemo(() => {
    return state.classification === 'ServiceOrder' && state.originalValueCents > 999_999
  }, [state.classification, state.originalValueCents])

  const checklist = useMemo(() => {
    const checks = {
      contratado: !!selectedPartner || !!(state.supplierId || state.financierId || state.collaboratorId),
      contrato: !!state.objective,
      valor: (state.originalValueCents || 0) > 0,
      vigencia: !!state.originalPeriodStart && !!state.originalPeriodEnd,
      programa: !!state.programId || !!state.budgetPlanId,
      categorizacao: !!state.categorizacao,
      centroDeCusto: !!state.centroDeCusto,
    }
    const done = Object.values(checks).filter(Boolean).length
    return { checks, done, total: 7 }
  }, [state, selectedPartner])

  const submit = useCallback((): CreateContractInput => {
    const title = state.title.trim() || state.objective.trim() || 'Contrato sem título'
    return {
      title,
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
      bancaryInfo: state.bancaryInfo.bank ? state.bancaryInfo : undefined,
      pixInfo: state.pixInfo.key ? state.pixInfo : undefined,
    }
  }, [state])

  return {
    state,
    selectedPartner,
    showModal,
    isOvertopOS,
    validationAttempted,
    update,
    setSelectedPartner,
    openModal,
    closeModal,
    triggerValidation,
    submit,
    checklist,
    currentYear,
  }
}
