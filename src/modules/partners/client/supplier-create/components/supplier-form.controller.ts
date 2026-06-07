/**
 * useSupplierFormController — estado transiente do formulário de fornecedor (criar/editar) + validação
 * na borda do cliente (§IX) com `SupplierFormSchema`. Hook de estado (client-controller). Reusado por
 * criar e editar (este último passa `initial`).
 */
import { useCallback, useState } from 'react'

import { SupplierFormSchema, type SupplierFormValues } from '#modules/partners/client/data/model/supplier.model.ts'

export type { SupplierFormValues } from '#modules/partners/client/data/model/supplier.model.ts'

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random-key'

export type SupplierFormState = Readonly<{
  name: string
  corporateName: string
  fantasyName: string
  email: string
  cnpj: string
  serviceCategory: string
  bankEnabled: boolean
  bank: string
  agency: string
  accountNumber: string
  checkDigit: string
  pixEnabled: boolean
  pixKeyType: PixKeyType
  pixKey: string
}>

export type SupplierFormErrors = Readonly<Record<string, boolean>>

const EMPTY: SupplierFormState = {
  name: '',
  corporateName: '',
  fantasyName: '',
  email: '',
  cnpj: '',
  serviceCategory: '',
  bankEnabled: false,
  bank: '',
  agency: '',
  accountNumber: '',
  checkDigit: '',
  pixEnabled: false,
  pixKeyType: 'cpf',
  pixKey: '',
}

function stateFromValues(v: SupplierFormValues | undefined): SupplierFormState {
  if (v === undefined) return EMPTY
  return {
    name: v.name,
    corporateName: v.corporateName,
    fantasyName: v.fantasyName,
    email: v.email,
    cnpj: v.cnpj,
    serviceCategory: v.serviceCategory,
    bankEnabled: v.bankAccount !== null,
    bank: v.bankAccount?.bank ?? '',
    agency: v.bankAccount?.agency ?? '',
    accountNumber: v.bankAccount?.accountNumber ?? '',
    checkDigit: v.bankAccount?.checkDigit ?? '',
    pixEnabled: v.pixKey !== null,
    pixKeyType: v.pixKey?.keyType ?? 'cpf',
    pixKey: v.pixKey?.key ?? '',
  }
}

export type SupplierFormController = Readonly<{
  state: SupplierFormState
  errors: SupplierFormErrors
  setField: <K extends keyof SupplierFormState>(key: K, value: SupplierFormState[K]) => void
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

  const submit = useCallback(() => {
    const candidate = {
      name: state.name,
      corporateName: state.corporateName,
      fantasyName: state.fantasyName,
      email: state.email,
      cnpj: state.cnpj,
      serviceCategory: state.serviceCategory,
      bankAccount: state.bankEnabled
        ? {
            bank: state.bank,
            agency: state.agency,
            accountNumber: state.accountNumber,
            checkDigit: state.checkDigit,
          }
        : null,
      pixKey: state.pixEnabled ? { keyType: state.pixKeyType, key: state.pixKey } : null,
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

  return { state, errors, setField, submit }
}
