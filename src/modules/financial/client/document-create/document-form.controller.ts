/**
 * Controller do form de Lançar Documento — UI-state via `useReducer` (§XI: estado de UI fora da view).
 * Guarda os campos crus (reais/strings); a derivação pura (preview/CSRF/canSubmit) vive em
 * `document-form.view.ts`. Trocar para um tipo sem retenção limpa o bloco de retenções (gating).
 */
import { useEffect, useReducer, useRef, useState } from 'react'

import type { DocumentType, PaymentMethod } from '#modules/financial/client/data/model/document.model.ts'
import {
  EMPTY_RETENTIONS,
  EMPTY_REFORMA_TRIBUTARIA,
  retentionsEnabledFor,
  reformaTributariaEnabledFor,
  issAllowedFor,
  type DocumentFormFields,
  type RetentionFieldsReais,
  type ReformaTributariaFieldsReais,
} from './document-form.view.ts'

const EMPTY_FIELDS: DocumentFormFields = {
  type: '',
  documentNumber: '',
  series: '',
  supplierRef: '',
  paymentMethod: '',
  grossValue: '',
  issueDate: '',
  dueDate: '',
  description: '',
  discounts: '',
  jurosMulta: '',
  accessKey: '',
  paymentComplement: '',
  contractRef: '',
  programRef: '',
  categoryRef: '',
  costCenterRef: '',
  approverRef: '',
  centroCusto: '',
  categoria: '',
  subcategoria: '',
  planoOrcamentario: '',
  retentions: EMPTY_RETENTIONS,
  reformaTributaria: EMPTY_REFORMA_TRIBUTARIA,
}

type TextKey =
  | 'documentNumber'
  | 'series'
  | 'grossValue'
  | 'issueDate'
  | 'dueDate'
  | 'description'
  | 'discounts'
  | 'jurosMulta'
  | 'accessKey'
  | 'paymentComplement'
  | 'centroCusto'
  | 'categoria'
  | 'subcategoria'
  | 'planoOrcamentario'

type FormAction =
  | Readonly<{ kind: 'setType'; value: DocumentType | '' }>
  | Readonly<{ kind: 'setPaymentMethod'; value: PaymentMethod | '' }>
  | Readonly<{ kind: 'setSupplier'; ref: string }>
  | Readonly<{ kind: 'setContractRef'; value: string }>
  | Readonly<{ kind: 'setProgramRef'; value: string }>
  | Readonly<{ kind: 'setCategoryRef'; value: string }>
  | Readonly<{ kind: 'setCostCenterRef'; value: string }>
  | Readonly<{ kind: 'setApproverRef'; value: string }>
  | Readonly<{ kind: 'setText'; key: TextKey; value: string }>
  | Readonly<{ kind: 'setRetention'; key: keyof RetentionFieldsReais; value: string }>
  | Readonly<{ kind: 'setReformaTributaria'; key: keyof ReformaTributariaFieldsReais; value: string }>
  | Readonly<{ kind: 'patch'; patch: Partial<DocumentFormFields> }>
  | Readonly<{ kind: 'hydrate'; fields: DocumentFormFields }>
  | Readonly<{ kind: 'reset' }>

const reducer = (state: DocumentFormFields, action: FormAction): DocumentFormFields => {
  switch (action.kind) {
    case 'setType': {
      // Tipo sem retenção/reforma (≠ NFS-e/RPA) → limpa os blocos correspondentes (gating). RPA mantém
      // retenções, mas NÃO aceita ISS (só NFS-e) → zera ISS herdada p/ não enviar ISS num RPA (422).
      const retentions = retentionsEnabledFor(action.value)
        ? { ...state.retentions, iss: issAllowedFor(action.value) ? state.retentions.iss : '' }
        : EMPTY_RETENTIONS
      return {
        ...state,
        type: action.value,
        retentions,
        reformaTributaria: reformaTributariaEnabledFor(action.value)
          ? state.reformaTributaria
          : EMPTY_REFORMA_TRIBUTARIA,
      }
    }
    case 'setPaymentMethod':
      // Trocar a forma limpa o complemento (cada forma tem o seu campo: boleto/cartão/câmbio/outro).
      return { ...state, paymentMethod: action.value, paymentComplement: '' }
    case 'setSupplier':
      // Trocar de parceiro zera o contrato/programa escolhidos (a hidratação re-deriva pelo novo parceiro).
      return { ...state, supplierRef: action.ref, contractRef: '', programRef: '' }
    case 'setContractRef':
      // Trocar o contrato re-deriva o Programa (volta a herdar do contrato escolhido).
      return { ...state, contractRef: action.value, programRef: '' }
    case 'setProgramRef':
      return { ...state, programRef: action.value }
    case 'setCategoryRef':
      return { ...state, categoryRef: action.value }
    case 'setCostCenterRef':
      return { ...state, costCenterRef: action.value }
    case 'setApproverRef':
      return { ...state, approverRef: action.value }
    case 'setText':
      return { ...state, [action.key]: action.value }
    case 'setRetention':
      return { ...state, retentions: { ...state.retentions, [action.key]: action.value } }
    case 'setReformaTributaria':
      return {
        ...state,
        reformaTributaria: { ...state.reformaTributaria, [action.key]: action.value },
      }
    case 'patch':
      // Preenchimento por OCR (parcial) — só sobrescreve os campos extraídos; o operador confirma.
      return { ...state, ...action.patch }
    case 'hydrate':
      return action.fields
    case 'reset':
      return EMPTY_FIELDS
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}

export type DocumentFormController = Readonly<{
  fields: DocumentFormFields
  setType: (value: DocumentType | '') => void
  setPaymentMethod: (value: PaymentMethod | '') => void
  setSupplier: (ref: string) => void
  setContractRef: (value: string) => void
  setProgramRef: (value: string) => void
  setCategoryRef: (value: string) => void
  setCostCenterRef: (value: string) => void
  setApproverRef: (value: string) => void
  setText: (key: TextKey, value: string) => void
  setRetention: (key: keyof RetentionFieldsReais, value: string) => void
  setReformaTributaria: (key: keyof ReformaTributariaFieldsReais, value: string) => void
  applyPatch: (patch: Partial<DocumentFormFields>) => void
  reset: () => void
  // Modal "Tipo de Documento" (UI-state).
  typeModalOpen: boolean
  openTypeModal: () => void
  closeTypeModal: () => void
  // Modal "Forma de Pagamento" (UI-state).
  payModalOpen: boolean
  openPayModal: () => void
  closePayModal: () => void
  // Dropdown "Alterar contrato" da Categorização (UI-state).
  contractPickerOpen: boolean
  toggleContractPicker: () => void
  closeContractPicker: () => void
}>

export function useDocumentFormController(initial?: DocumentFormFields | null): DocumentFormController {
  const [fields, dispatch] = useReducer(reducer, EMPTY_FIELDS)
  const [typeModalOpen, setTypeModalOpen] = useState(false)
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [contractPickerOpen, setContractPickerOpen] = useState(false)
  // Hidrata UMA vez quando os dados de edição chegam (async). `useRef` evita re-hidratar a cada render,
  // preservando o que o usuário já editou.
  const hydrated = useRef(false)
  useEffect(() => {
    if (initial != null && !hydrated.current) {
      hydrated.current = true
      dispatch({ kind: 'hydrate', fields: initial })
    }
  }, [initial])
  return {
    fields,
    setType: (value) => {
      dispatch({ kind: 'setType', value })
    },
    setPaymentMethod: (value) => {
      dispatch({ kind: 'setPaymentMethod', value })
    },
    setSupplier: (ref) => {
      dispatch({ kind: 'setSupplier', ref })
    },
    setContractRef: (value) => {
      dispatch({ kind: 'setContractRef', value })
    },
    setProgramRef: (value) => {
      dispatch({ kind: 'setProgramRef', value })
    },
    setCategoryRef: (value) => {
      dispatch({ kind: 'setCategoryRef', value })
    },
    setCostCenterRef: (value) => {
      dispatch({ kind: 'setCostCenterRef', value })
    },
    setApproverRef: (value) => {
      dispatch({ kind: 'setApproverRef', value })
    },
    setText: (key, value) => {
      dispatch({ kind: 'setText', key, value })
    },
    setRetention: (key, value) => {
      dispatch({ kind: 'setRetention', key, value })
    },
    setReformaTributaria: (key, value) => {
      dispatch({ kind: 'setReformaTributaria', key, value })
    },
    applyPatch: (patch) => {
      dispatch({ kind: 'patch', patch })
    },
    reset: () => {
      dispatch({ kind: 'reset' })
    },
    typeModalOpen,
    openTypeModal: () => {
      setTypeModalOpen(true)
    },
    closeTypeModal: () => {
      setTypeModalOpen(false)
    },
    payModalOpen,
    openPayModal: () => {
      setPayModalOpen(true)
    },
    closePayModal: () => {
      setPayModalOpen(false)
    },
    contractPickerOpen,
    toggleContractPicker: () => {
      setContractPickerOpen((v) => !v)
    },
    closeContractPicker: () => {
      setContractPickerOpen(false)
    },
  }
}
