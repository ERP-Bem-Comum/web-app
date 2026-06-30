/**
 * useCollaboratorFormController — estado transiente do formulário de colaborador (pré-cadastro) +
 * validação na borda (§IX) com `CollaboratorFormSchema`. Hook de estado (client-controller). 7 campos:
 * 2 enums (área/vínculo), data de início, CPF (normalizado p/ 11 dígitos). Espelha act-form.controller.
 */
import { useCallback, useState } from 'react'

import {
  CollaboratorFormSchema,
  type CollaboratorFormValues,
  type PixKeyType,
} from '#modules/partners/client/data/model/collaborator.model.ts'

export type { CollaboratorFormValues } from '#modules/partners/client/data/model/collaborator.model.ts'
export type { PixKeyType } from '#modules/partners/client/data/model/collaborator.model.ts'
// A view (client-ui) consome as listas de enum POR AQUI — o boundary §XI não a deixa tocar `data/`.
export {
  OCCUPATION_AREAS,
  EMPLOYMENT_RELATIONSHIPS,
  BR_UF,
  PIX_KEY_TYPES,
  isPixKeyType,
} from '#modules/partners/client/data/model/collaborator.model.ts'

/** Estado cru do form — strings (os enums começam vazios; a validação Zod barra o submit inválido). */
export type CollaboratorFormState = Readonly<{
  name: string
  email: string
  cpf: string
  occupationArea: string
  role: string
  startOfContract: string
  employmentRelationship: string
  uf: string // '' = sem UF
  municipality: string
  // Banco/PIX (#40) — create-only.
  bank: string
  agency: string
  accountNumber: string
  checkDigit: string
  pixKeyType: PixKeyType
  pixKey: string
}>

export type CollaboratorFormErrors = Readonly<Record<string, boolean>>

const EMPTY: CollaboratorFormState = {
  name: '',
  email: '',
  cpf: '',
  occupationArea: '',
  role: '',
  startOfContract: '',
  employmentRelationship: '',
  uf: '',
  municipality: '',
  bank: '',
  agency: '',
  accountNumber: '',
  checkDigit: '',
  pixKeyType: 'cpf',
  pixKey: '',
}

function stateFromValues(v: CollaboratorFormValues | undefined): CollaboratorFormState {
  if (v === undefined) return EMPTY
  return {
    name: v.name,
    email: v.email,
    cpf: v.cpf,
    occupationArea: v.occupationArea,
    role: v.role,
    startOfContract: v.startOfContract,
    employmentRelationship: v.employmentRelationship,
    uf: v.territory?.uf ?? '',
    municipality: v.territory?.municipality ?? '',
    bank: v.bankAccount?.bank ?? '',
    agency: v.bankAccount?.agency ?? '',
    accountNumber: v.bankAccount?.accountNumber ?? '',
    checkDigit: v.bankAccount?.checkDigit ?? '',
    pixKeyType: v.pixKey?.keyType ?? 'cpf',
    pixKey: v.pixKey?.key ?? '',
  }
}

export type CollaboratorFormController = Readonly<{
  state: CollaboratorFormState
  errors: CollaboratorFormErrors
  setField: <K extends keyof CollaboratorFormState>(key: K, value: CollaboratorFormState[K]) => void
  submit: () => void
}>

export function useCollaboratorFormController(
  opts: Readonly<{ initial?: CollaboratorFormValues; onSubmit: (values: CollaboratorFormValues) => void }>,
): CollaboratorFormController {
  const [state, setState] = useState<CollaboratorFormState>(() => stateFromValues(opts.initial))
  const [errors, setErrors] = useState<CollaboratorFormErrors>({})

  const setField = useCallback<CollaboratorFormController['setField']>((key, value) => {
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  const submit = useCallback(() => {
    // Território (#42): UF/município vazios → null; objeto null quando ambos vazios.
    const uf = state.uf.trim() !== '' ? state.uf.trim() : null
    const municipality = state.municipality.trim() !== '' ? state.municipality.trim() : null
    const territory = uf === null && municipality === null ? null : { uf, municipality }
    // Banco/PIX (#40): presença inferida do que foi preenchido (sem checkbox). Banco parcial cai no
    // schema (campos min(1)) e bloqueia o submit. Espelha o Fornecedor.
    const hasBank = [state.bank, state.agency, state.accountNumber, state.checkDigit].some(
      (v) => v.trim() !== '',
    )
    const hasPix = state.pixKey.trim() !== ''
    const candidate = {
      name: state.name,
      email: state.email,
      cpf: state.cpf,
      occupationArea: state.occupationArea,
      role: state.role,
      startOfContract: state.startOfContract,
      employmentRelationship: state.employmentRelationship,
      territory,
      bankAccount: hasBank
        ? {
            bank: state.bank,
            agency: state.agency,
            accountNumber: state.accountNumber,
            checkDigit: state.checkDigit,
          }
        : null,
      pixKey: hasPix ? { keyType: state.pixKeyType, key: state.pixKey } : null,
    }
    const parsed = CollaboratorFormSchema.safeParse(candidate)
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
