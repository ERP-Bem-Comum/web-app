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
  dueDate: '',
  description: '',
  retentions: EMPTY_RETENTIONS,
  reformaTributaria: EMPTY_REFORMA_TRIBUTARIA,
}

type TextKey = 'documentNumber' | 'series' | 'grossValue' | 'dueDate' | 'description'

type FormAction =
  | Readonly<{ kind: 'setType'; value: DocumentType | '' }>
  | Readonly<{ kind: 'setPaymentMethod'; value: PaymentMethod | '' }>
  | Readonly<{ kind: 'setSupplier'; ref: string }>
  | Readonly<{ kind: 'setText'; key: TextKey; value: string }>
  | Readonly<{ kind: 'setRetention'; key: keyof RetentionFieldsReais; value: string }>
  | Readonly<{ kind: 'setReformaTributaria'; key: keyof ReformaTributariaFieldsReais; value: string }>
  | Readonly<{ kind: 'hydrate'; fields: DocumentFormFields }>
  | Readonly<{ kind: 'reset' }>

const reducer = (state: DocumentFormFields, action: FormAction): DocumentFormFields => {
  switch (action.kind) {
    case 'setType':
      // Tipo sem retenção/reforma (≠ NFS-e/RPA) → limpa os blocos correspondentes (gating).
      return {
        ...state,
        type: action.value,
        retentions: retentionsEnabledFor(action.value) ? state.retentions : EMPTY_RETENTIONS,
        reformaTributaria: reformaTributariaEnabledFor(action.value)
          ? state.reformaTributaria
          : EMPTY_REFORMA_TRIBUTARIA,
      }
    case 'setPaymentMethod':
      return { ...state, paymentMethod: action.value }
    case 'setSupplier':
      return { ...state, supplierRef: action.ref }
    case 'setText':
      return { ...state, [action.key]: action.value }
    case 'setRetention':
      return { ...state, retentions: { ...state.retentions, [action.key]: action.value } }
    case 'setReformaTributaria':
      return {
        ...state,
        reformaTributaria: { ...state.reformaTributaria, [action.key]: action.value },
      }
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
  setText: (key: TextKey, value: string) => void
  setRetention: (key: keyof RetentionFieldsReais, value: string) => void
  setReformaTributaria: (key: keyof ReformaTributariaFieldsReais, value: string) => void
  reset: () => void
  // Modal "Tipo de Documento" (UI-state).
  typeModalOpen: boolean
  openTypeModal: () => void
  closeTypeModal: () => void
  // Modal "Forma de Pagamento" (UI-state).
  payModalOpen: boolean
  openPayModal: () => void
  closePayModal: () => void
}>

export function useDocumentFormController(initial?: DocumentFormFields | null): DocumentFormController {
  const [fields, dispatch] = useReducer(reducer, EMPTY_FIELDS)
  const [typeModalOpen, setTypeModalOpen] = useState(false)
  const [payModalOpen, setPayModalOpen] = useState(false)
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
    setText: (key, value) => {
      dispatch({ kind: 'setText', key, value })
    },
    setRetention: (key, value) => {
      dispatch({ kind: 'setRetention', key, value })
    },
    setReformaTributaria: (key, value) => {
      dispatch({ kind: 'setReformaTributaria', key, value })
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
  }
}
