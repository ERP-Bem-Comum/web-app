/**
 * useSupplierFormController — estado transiente do formulário de fornecedor (criar/editar) + validação
 * na borda do cliente (§IX) com `SupplierFormSchema`. Hook de estado (client-controller). Reusado por
 * criar e editar (este último passa `initial`).
 */
import { useCallback, useState } from 'react'

import { toBankCode } from '#shared/banking/febraban-banks.ts'
import {
  SupplierFormSchema,
  type SupplierFormValues,
  type PersonType,
  type PixKeyType,
  type ServiceRating,
} from '#modules/partners/client/data/model/supplier.model.ts'

// Reexporta a partir da fonte única (`data/model`) — antes eram cópias da mesma união/lista. A view
// (client-ui) consome PIX_KEY_TYPES/isPixKeyType e SERVICE_RATINGS/isServiceRating POR AQUI, pois o
// boundary não a deixa tocar data/.
export type {
  SupplierFormValues,
  PersonType,
  PixKeyType,
  ServiceRating,
} from '#modules/partners/client/data/model/supplier.model.ts'
export {
  PERSON_TYPES,
  isPersonType,
  PIX_KEY_TYPES,
  isPixKeyType,
  SERVICE_RATINGS,
  isServiceRating,
} from '#modules/partners/client/data/model/supplier.model.ts'

export type SupplierFormState = Readonly<{
  // PJ | PF (#1022). Na edição, vem do `personType` do cadastro.
  personType: PersonType
  name: string
  // Guardados na TELA mesmo em PF (voltar para PJ os devolve); o schema os zera na PF ao enviar.
  corporateName: string
  fantasyName: string
  email: string
  // CPF ou CNPJ cru (sem máscara), conforme o `personType`.
  document: string
  serviceCategory: string
  bank: string
  agency: string
  accountNumber: string
  checkDigit: string
  pixKeyType: PixKeyType
  pixKey: string
  // Avaliação de serviço (§1.6). '' no select = sem avaliação (→ null no submit).
  serviceRating: ServiceRating | ''
  ratingComment: string
}>

export type SupplierFormErrors = Readonly<Record<string, boolean>>

const EMPTY: SupplierFormState = {
  personType: 'PJ',
  name: '',
  corporateName: '',
  fantasyName: '',
  email: '',
  document: '',
  serviceCategory: '',
  bank: '',
  agency: '',
  accountNumber: '',
  checkDigit: '',
  pixKeyType: 'cpf',
  pixKey: '',
  serviceRating: '',
  ratingComment: '',
}

/**
 * O campo `bank` passou a guardar o CÓDIGO de compensação (3 dígitos), mas o cadastro antigo guardava
 * TEXTO LIVRE. Convertemos ao ABRIR o formulário quando dá para reconhecer sem ambiguidade ('0237' e
 * '237 - Bradesco' viram '237'); o que não dá, fica como está e o seletor mostra como não reconhecido.
 *
 * A conversão é silenciosa DE PROPÓSITO só no caso trivial: ela não muda o banco, só o formato de quem
 * já estava certo. Adivinhar por NOME ficaria de fora — errar o banco aqui é pagamento recusado.
 */
const normalizeBankCode = (raw: string): string => toBankCode(raw) ?? raw

function stateFromValues(v: SupplierFormValues | undefined): SupplierFormState {
  if (v === undefined) return EMPTY
  return {
    personType: v.personType,
    name: v.name,
    corporateName: v.corporateName ?? '',
    fantasyName: v.fantasyName ?? '',
    email: v.email,
    document: v.document,
    serviceCategory: v.serviceCategory,
    bank: normalizeBankCode(v.bankAccount?.bank ?? ''),
    agency: v.bankAccount?.agency ?? '',
    accountNumber: v.bankAccount?.accountNumber ?? '',
    checkDigit: v.bankAccount?.checkDigit ?? '',
    pixKeyType: v.pixKey?.keyType ?? 'cpf',
    pixKey: v.pixKey?.key ?? '',
    serviceRating: v.serviceRating ?? '',
    ratingComment: v.ratingComment ?? '',
  }
}

/**
 * Troca PJ ↔ PF (#1022) — PURA. Um CNPJ não vira CPF: o documento é limpo. Razão Social/Nome Fantasia
 * ficam no estado (voltar para PJ os devolve). Se a chave PIX era do documento (tipo CPF/CNPJ), o tipo
 * acompanha a pessoa e a chave antiga — derivada do documento que sumiu — é limpa.
 */
export function switchPersonType(s: SupplierFormState, next: PersonType): SupplierFormState {
  if (s.personType === next) return s
  const pixFromDocument = s.pixKeyType === 'cpf' || s.pixKeyType === 'cnpj'
  return {
    ...s,
    personType: next,
    document: '',
    pixKeyType: pixFromDocument ? (next === 'PF' ? 'cpf' : 'cnpj') : s.pixKeyType,
    pixKey: pixFromDocument && s.pixKey === s.document ? '' : s.pixKey,
  }
}

export type SupplierFormController = Readonly<{
  state: SupplierFormState
  errors: SupplierFormErrors
  setField: <K extends keyof SupplierFormState>(key: K, value: SupplierFormState[K]) => void
  setPersonType: (next: PersonType) => void
  reset: (values?: SupplierFormValues) => void
  submit: () => void
}>

export function useSupplierFormController(
  opts: Readonly<{ initial?: SupplierFormValues; onSubmit: (values: SupplierFormValues) => void }>,
): SupplierFormController {
  const [state, setState] = useState<SupplierFormState>(() => stateFromValues(opts.initial))
  const [errors, setErrors] = useState<SupplierFormErrors>({})

  const setField = useCallback<SupplierFormController['setField']>((key, value) => {
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  const setPersonType = useCallback((next: PersonType) => {
    setState((s) => switchPersonType(s, next))
    // Erros do documento/nomes eram da pessoa anterior.
    setErrors({})
  }, [])

  const reset = useCallback((values?: SupplierFormValues) => {
    setState(stateFromValues(values))
    setErrors({})
  }, [])

  const submit = useCallback(() => {
    // Sem checkbox de "habilitar": a presença de banco/PIX é inferida do que foi preenchido.
    // Banco parcialmente preenchido cai no schema (campos min(1)) e bloqueia o submit.
    const hasBank = [state.bank, state.agency, state.accountNumber, state.checkDigit].some(
      (v) => v.trim() !== '',
    )
    const hasPix = state.pixKey.trim() !== ''
    const candidate = {
      personType: state.personType,
      name: state.name,
      corporateName: state.corporateName,
      fantasyName: state.fantasyName,
      email: state.email,
      document: state.document,
      serviceCategory: state.serviceCategory,
      bankAccount: hasBank
        ? {
            bank: state.bank,
            agency: state.agency,
            accountNumber: state.accountNumber,
            checkDigit: state.checkDigit,
          }
        : null,
      pixKey: hasPix ? { keyType: state.pixKeyType, key: state.pixKey } : null,
      // Avaliação (§1.6): '' = sem avaliação → null. Comentário vazio → null.
      serviceRating: state.serviceRating === '' ? null : state.serviceRating,
      ratingComment: state.ratingComment.trim() !== '' ? state.ratingComment : null,
    }
    const parsed = SupplierFormSchema.safeParse(candidate)
    if (!parsed.success) {
      const next: Record<string, boolean> = {}
      for (const issue of parsed.error.issues) next[issue.path.join('.')] = true
      setErrors(next)
      return
    }
    setErrors({})
    opts.onSubmit(parsed.data)
  }, [state, opts])

  return { state, errors, setField, setPersonType, reset, submit }
}
