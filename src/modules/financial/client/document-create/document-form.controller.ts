/**
 * Controller do form de Lançar Documento — UI-state via `useReducer` (§XI: estado de UI fora da view).
 * Guarda os campos crus (reais/strings); a derivação pura (preview/CSRF/canSubmit) vive em
 * `document-form.view.ts`. Trocar para um tipo sem retenção limpa o bloco de retenções (gating).
 */
import { useReducer } from 'react'

import type { DocumentType, PaymentMethod } from '#modules/financial/client/data/model/document.model.ts'
import {
  EMPTY_RETENTIONS,
  retentionsEnabledFor,
  type DocumentFormFields,
  type RetentionFieldsReais,
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
}

type TextKey = 'documentNumber' | 'series' | 'grossValue' | 'dueDate' | 'description'

type FormAction =
  | Readonly<{ kind: 'setType'; value: DocumentType | '' }>
  | Readonly<{ kind: 'setPaymentMethod'; value: PaymentMethod | '' }>
  | Readonly<{ kind: 'setSupplier'; ref: string }>
  | Readonly<{ kind: 'setText'; key: TextKey; value: string }>
  | Readonly<{ kind: 'setRetention'; key: keyof RetentionFieldsReais; value: string }>
  | Readonly<{ kind: 'reset' }>

const reducer = (state: DocumentFormFields, action: FormAction): DocumentFormFields => {
  switch (action.kind) {
    case 'setType':
      // Tipo sem retenção (≠ NFS-e/RPA) → limpa o bloco de retenções (gating).
      return {
        ...state,
        type: action.value,
        retentions: retentionsEnabledFor(action.value) ? state.retentions : EMPTY_RETENTIONS,
      }
    case 'setPaymentMethod':
      return { ...state, paymentMethod: action.value }
    case 'setSupplier':
      return { ...state, supplierRef: action.ref }
    case 'setText':
      return { ...state, [action.key]: action.value }
    case 'setRetention':
      return { ...state, retentions: { ...state.retentions, [action.key]: action.value } }
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
  reset: () => void
}>

export function useDocumentFormController(): DocumentFormController {
  const [fields, dispatch] = useReducer(reducer, EMPTY_FIELDS)
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
    reset: () => {
      dispatch({ kind: 'reset' })
    },
  }
}
