/**
 * useFinancierFormController — estado transiente do formulário de financiador (criar/editar) +
 * validação na borda do cliente (§IX) com `FinancierFormSchema`. Hook de estado (client-controller).
 * Reusado por criar e editar (este último passa `initial`). PJ-only, 6 campos — sem banco/PIX/categoria.
 */
import { useCallback, useState } from 'react'

import {
  FinancierFormSchema,
  type FinancierFormValues,
  type PixKeyType,
} from '#modules/partners/client/data/model/financier.model.ts'

export type { FinancierFormValues } from '#modules/partners/client/data/model/financier.model.ts'
export type { PixKeyType } from '#modules/partners/client/data/model/financier.model.ts'
// A view (client-ui) consome PIX_KEY_TYPES/isPixKeyType POR AQUI (boundary não a deixa tocar data/).
export { PIX_KEY_TYPES, isPixKeyType } from '#modules/partners/client/data/model/financier.model.ts'

export type FinancierFormState = Readonly<{
  name: string
  corporateName: string
  legalRepresentative: string
  cnpj: string
  telephone: string
  address: string
  bank: string
  agency: string
  accountNumber: string
  checkDigit: string
  pixKeyType: PixKeyType
  pixKey: string
}>

export type FinancierFormErrors = Readonly<Record<string, boolean>>

const EMPTY: FinancierFormState = {
  name: '',
  corporateName: '',
  legalRepresentative: '',
  cnpj: '',
  telephone: '',
  address: '',
  bank: '',
  agency: '',
  accountNumber: '',
  checkDigit: '',
  pixKeyType: 'cpf',
  pixKey: '',
}

function stateFromValues(v: FinancierFormValues | undefined): FinancierFormState {
  if (v === undefined) return EMPTY
  return {
    name: v.name,
    corporateName: v.corporateName,
    legalRepresentative: v.legalRepresentative,
    cnpj: v.cnpj,
    telephone: v.telephone,
    address: v.address,
    bank: v.bankAccount?.bank ?? '',
    agency: v.bankAccount?.agency ?? '',
    accountNumber: v.bankAccount?.accountNumber ?? '',
    checkDigit: v.bankAccount?.checkDigit ?? '',
    pixKeyType: v.pixKey?.keyType ?? 'cpf',
    pixKey: v.pixKey?.key ?? '',
  }
}

export type FinancierFormController = Readonly<{
  state: FinancierFormState
  errors: FinancierFormErrors
  setField: <K extends keyof FinancierFormState>(key: K, value: FinancierFormState[K]) => void
  reset: (values?: FinancierFormValues) => void
  submit: () => void
}>

export function useFinancierFormController(
  opts: Readonly<{ initial?: FinancierFormValues; onSubmit: (values: FinancierFormValues) => void }>,
): FinancierFormController {
  const [state, setState] = useState<FinancierFormState>(() => stateFromValues(opts.initial))
  const [errors, setErrors] = useState<FinancierFormErrors>({})

  const setField = useCallback<FinancierFormController['setField']>((key, value) => {
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  const reset = useCallback((values?: FinancierFormValues) => {
    setState(stateFromValues(values))
    setErrors({})
  }, [])

  const submit = useCallback(() => {
    // Banco/PIX (#40): presença inferida do que foi preenchido (sem checkbox). Banco parcial cai no
    // schema (campos min(1)) e bloqueia o submit. Espelha o Fornecedor.
    const hasBank = [state.bank, state.agency, state.accountNumber, state.checkDigit].some(
      (v) => v.trim() !== '',
    )
    const hasPix = state.pixKey.trim() !== ''
    const candidate = {
      name: state.name,
      corporateName: state.corporateName,
      legalRepresentative: state.legalRepresentative,
      cnpj: state.cnpj,
      telephone: state.telephone,
      address: state.address,
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
    const parsed = FinancierFormSchema.safeParse(candidate)
    if (!parsed.success) {
      const next: Record<string, boolean> = {}
      for (const issue of parsed.error.issues) next[issue.path.join('.')] = true
      setErrors(next)
      return
    }
    setErrors({})
    opts.onSubmit(parsed.data)
  }, [state, opts])

  return { state, errors, setField, reset, submit }
}
