/**
 * useContractFormController — estado transiente do formulário de criação de contrato.
 * Replicação v1: campos completos + modal de finalização + selectedPartner + checklist.
 */
import { useState, useCallback, useMemo } from 'react'
import {
  CONTRACT_NUMBER_PATTERN,
  type CreateContractInput,
} from '#modules/contracts/client/data/model/contracts.model.ts'

/**
 * Máscara do número do contrato (spec 118) — PURA. Só dígitos; a barra entra sozinha antes dos 4 últimos
 * (o ano), e o campo aceita até `NNNN/AAAA` (8 dígitos).
 */
export function maskContractNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  return digits.length <= 4 ? digits : `${digits.slice(0, -4)}/${digits.slice(-4)}`
}

/** Vazio é válido (o core-api gera o número); preenchido precisa de `NNN/AAAA` ou `NNNN/AAAA`. */
export const isContractNumberValid = (value: string): boolean =>
  value.trim() === '' || CONTRACT_NUMBER_PATTERN.test(value.trim())

export interface SelectedPartner {
  readonly id: string
  readonly name: string
  readonly cnpj?: string
  readonly cpf?: string
  readonly email?: string
  readonly telephone?: string
  readonly kind: 'Fornecedor' | 'Financiador' | 'Colaborador' | 'Acordo'
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
  // Spec 118: número informado pela usuária, já mascarado (`0123/2024`). '' = o core-api gera.
  contractNumber: string
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
  actId: string
  // IDs técnicos = UUID string (ADR-0013). #502/S3: a categorização vem da ÁRVORE do plano — guardamos o
  // REF (UUID, o que linka) em costCenterRef/categoryRef/subcategoryRef E o NOME exibível em
  // centroDeCusto/categorizacao (o grid/detalhe do contrato mostra o texto; refs são opacos).
  programId: string | null
  budgetPlanId: string | null
  categorizacao: string | null // nome da categoria (exibível)
  centroDeCusto: string | null // nome do centro de custo (exibível)
  costCenterRef: string | null // ref da árvore do plano
  categoryRef: string | null // ref da árvore do plano
  subcategoryRef: string | null // ref da árvore do plano (folha) — sem texto exibível próprio
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
  /** Número preenchido fora do formato `NNN(N)/AAAA` — bloqueia o envio (spec 118). */
  readonly contractNumberInvalid: boolean
  readonly update: <K extends keyof ContractFormState>(key: K, value: ContractFormState[K]) => void
  // #502/S3: seletores cascata-aware da taxonomia do plano — setam o ref (linka) + o nome (exibível) e
  // zeram os níveis de baixo (senão a folha gravada ficaria órfã, §IV). Trocar o plano zera os 3.
  readonly selectPlan: (id: string | null) => void
  readonly selectCostCenter: (ref: string, name: string) => void
  readonly selectCategory: (ref: string, name: string) => void
  readonly selectSubcategory: (ref: string) => void
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
}

export const useContractFormController = (): ContractFormController => {
  const [state, setState] = useState<ContractFormState>({
    contractNumber: '',
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
    actId: '',
    programId: null,
    budgetPlanId: null,
    categorizacao: null,
    centroDeCusto: null,
    costCenterRef: null,
    categoryRef: null,
    subcategoryRef: null,
    email: '',
    telephone: '',
    observations: '',
    bancaryInfo: { bank: '', agency: '', accountNumber: '', dv: '' },
    pixInfo: { keyType: '', key: '' },
  })

  const [selectedPartner, setSelectedPartner] = useState<SelectedPartner | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [validationAttempted, setValidationAttempted] = useState(false)

  const update = useCallback(<K extends keyof ContractFormState>(key: K, value: ContractFormState[K]) => {
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  // #502/S3: cascata da árvore do plano. Cada nível guarda o ref (linka) + o nome (exibível) e zera os de
  // baixo. Trocar o plano troca a ÁRVORE → zera os 3. Valor '' (opção vazia) → null (limpa).
  const selectPlan = useCallback((id: string | null) => {
    setState((s) => ({
      ...s,
      budgetPlanId: id,
      costCenterRef: null,
      centroDeCusto: null,
      categoryRef: null,
      categorizacao: null,
      subcategoryRef: null,
    }))
  }, [])
  const selectCostCenter = useCallback((ref: string, name: string) => {
    setState((s) => ({
      ...s,
      costCenterRef: ref || null,
      centroDeCusto: name || null,
      categoryRef: null,
      categorizacao: null,
      subcategoryRef: null,
    }))
  }, [])
  const selectCategory = useCallback((ref: string, name: string) => {
    setState((s) => ({ ...s, categoryRef: ref || null, categorizacao: name || null, subcategoryRef: null }))
  }, [])
  const selectSubcategory = useCallback((ref: string) => {
    setState((s) => ({ ...s, subcategoryRef: ref || null }))
  }, [])

  const openModal = useCallback(() => {
    setShowModal(true)
  }, [])
  const closeModal = useCallback(() => {
    setShowModal(false)
  }, [])
  const triggerValidation = useCallback(() => {
    setValidationAttempted(true)
  }, [])

  const isOvertopOS = useMemo(() => {
    return state.classification === 'ServiceOrder' && state.originalValueCents > 999_999
  }, [state.classification, state.originalValueCents])

  const contractNumberInvalid = !isContractNumberValid(state.contractNumber)

  const checklist = useMemo(() => {
    const checks = {
      contratado:
        !!selectedPartner || !!(state.supplierId || state.financierId || state.collaboratorId || state.actId),
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
    // O `title` é `varchar(255)` no core-api; o `objective` é `text` (longo). Quando o usuário não informa
    // um título, derivamos um CURTO a partir do objeto (1ª parte, ≤120 + reticências) — antes copiávamos o
    // objeto inteiro e um objeto longo estourava os 255 e derrubava o salvamento (#530).
    const explicit = state.title.trim()
    const derived = state.objective.trim().replace(/\s+/g, ' ')
    const title =
      explicit !== ''
        ? explicit.slice(0, 255)
        : derived === ''
          ? 'Contrato sem título'
          : derived.length > 120
            ? `${derived.slice(0, 120).trimEnd()}…`
            : derived
    const contractNumber = state.contractNumber.trim()
    return {
      // Spec 118: só vai quando preenchido; vazio, o core-api gera o próximo número livre do ano.
      ...(contractNumber !== '' ? { sequentialNumber: contractNumber } : {}),
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
      actId: state.actId || undefined,
      programId: state.programId ?? undefined,
      budgetPlanId: state.budgetPlanId ?? undefined,
      categorizacao: state.categorizacao ?? undefined,
      centroDeCusto: state.centroDeCusto ?? undefined,
      // #502/S3: refs da árvore do plano (linkam a taxonomia planejável; nome exibível já vai acima).
      costCenterRef: state.costCenterRef ?? undefined,
      categoryRef: state.categoryRef ?? undefined,
      subcategoryRef: state.subcategoryRef ?? undefined,
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
    contractNumberInvalid,
    update,
    selectPlan,
    selectCostCenter,
    selectCategory,
    selectSubcategory,
    setSelectedPartner,
    openModal,
    closeModal,
    triggerValidation,
    submit,
    checklist,
  }
}
