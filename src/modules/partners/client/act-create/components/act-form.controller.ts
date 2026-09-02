/**
 * useActFormController — estado transiente do formulário de Acordo de Cooperação Técnica (criar/editar)
 * + validação na borda do cliente (§IX) com `ActFormSchema`. Hook de estado (client-controller). Reusado
 * por criar e editar (este último passa `initial`). Regras extras (UI bloqueia, D2/D3/D4):
 *  - `hasFinancialTransfer` true ⇒ exige conta bancária OU PIX (quando off, conta/PIX são limpos);
 *  - vigência: `endDate > startDate` estrito (comparação string ISO `YYYY-MM-DD`, U2).
 */
import { useCallback, useState } from 'react'

import {
  ActFormSchema,
  type ActFormValues,
  type PixKeyType,
} from '#modules/partners/client/data/model/act.model.ts'

// A view (client-ui) consome PIX_KEY_TYPES/isPixKeyType e a lista de áreas POR AQUI — o boundary §XI não
// a deixa tocar `data/`.
export type { ActFormValues, PixKeyType } from '#modules/partners/client/data/model/act.model.ts'
export {
  OCCUPATION_AREAS,
  PIX_KEY_TYPES,
  isPixKeyType,
} from '#modules/partners/client/data/model/act.model.ts'

export type ActFormState = Readonly<{
  actNumber: string
  name: string
  email: string
  cnpj: string
  corporateName: string
  fantasyName: string
  occupationArea: string
  legalRepresentative: string
  startDate: string
  endDate: string
  hasFinancialTransfer: boolean
  bank: string
  agency: string
  accountNumber: string
  checkDigit: string
  pixKeyType: PixKeyType
  pixKey: string
}>

/**
 * Erros do formulário: caminho do campo → **slug** do erro (specs/114, #359).
 *
 * Era `Record<string, boolean>`, e o booleano era o defeito: o Zod entrega path E motivo, e guardar
 * só "falhou" jogava o motivo fora dentro do próprio laço que o lia. A tela então exibia uma
 * constante — "Verifique este campo." — para toda e qualquer violação.
 *
 * O valor é a `message` do issue, que para as regras nomeadas É o slug (`{ error: 'bank-required' }`).
 * Regra ainda sem nome traz o texto padrão do Zod, em inglês; quem o converte na frase genérica é o
 * `formErrorTag` da view — nunca este tipo.
 */
export type ActFormErrors = Readonly<Record<string, string>>

const EMPTY: ActFormState = {
  actNumber: '',
  name: '',
  email: '',
  cnpj: '',
  corporateName: '',
  fantasyName: '',
  occupationArea: '',
  legalRepresentative: '',
  startDate: '',
  endDate: '',
  hasFinancialTransfer: false,
  bank: '',
  agency: '',
  accountNumber: '',
  checkDigit: '',
  pixKeyType: 'cpf',
  pixKey: '',
}

function stateFromValues(v: ActFormValues | undefined): ActFormState {
  if (v === undefined) return EMPTY
  return {
    actNumber: v.actNumber,
    name: v.name,
    email: v.email,
    cnpj: v.cnpj,
    corporateName: v.corporateName,
    fantasyName: v.fantasyName,
    occupationArea: v.occupationArea,
    legalRepresentative: v.legalRepresentative,
    startDate: v.startDate,
    endDate: v.endDate,
    hasFinancialTransfer: v.hasFinancialTransfer,
    bank: v.bankAccount?.bank ?? '',
    agency: v.bankAccount?.agency ?? '',
    accountNumber: v.bankAccount?.accountNumber ?? '',
    checkDigit: v.bankAccount?.checkDigit ?? '',
    pixKeyType: v.pixKey?.keyType ?? 'cpf',
    pixKey: v.pixKey?.key ?? '',
  }
}

export type ActFormController = Readonly<{
  state: ActFormState
  errors: ActFormErrors
  setField: <K extends keyof ActFormState>(key: K, value: ActFormState[K]) => void
  reset: (values?: ActFormValues) => void
  submit: () => void
}>

export function useActFormController(
  opts: Readonly<{ initial?: ActFormValues; onSubmit: (values: ActFormValues) => void }>,
): ActFormController {
  const [state, setState] = useState<ActFormState>(() => stateFromValues(opts.initial))
  const [errors, setErrors] = useState<ActFormErrors>({})

  const setField = useCallback<ActFormController['setField']>((key, value) => {
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  const reset = useCallback((values?: ActFormValues) => {
    setState(stateFromValues(values))
    setErrors({})
  }, [])

  const submit = useCallback(() => {
    const hasBank = [state.bank, state.agency, state.accountNumber, state.checkDigit].some(
      (v) => v.trim() !== '',
    )
    const hasPix = state.pixKey.trim() !== ''
    const candidate = {
      actNumber: state.actNumber,
      name: state.name,
      email: state.email,
      cnpj: state.cnpj,
      corporateName: state.corporateName,
      fantasyName: state.fantasyName,
      occupationArea: state.occupationArea,
      legalRepresentative: state.legalRepresentative,
      startDate: state.startDate,
      endDate: state.endDate,
      hasFinancialTransfer: state.hasFinancialTransfer,
      // Repasse off ⇒ conta/PIX null (mesmo que campos ocultos tenham resíduo).
      bankAccount:
        state.hasFinancialTransfer && hasBank
          ? {
              bank: state.bank,
              agency: state.agency,
              accountNumber: state.accountNumber,
              checkDigit: state.checkDigit,
            }
          : null,
      pixKey: state.hasFinancialTransfer && hasPix ? { keyType: state.pixKeyType, key: state.pixKey } : null,
    }

    const parsed = ActFormSchema.safeParse(candidate)
    const next: Record<string, string> = {}
    if (!parsed.success) {
      for (const issue of parsed.error.issues) next[issue.path.join('.')] = issue.message
    }

    // Regra de repasse (UI bloqueia): true ⇒ conta|pix.
    //
    // ⚠️ Esta regra é do CONTROLLER, não do schema — e por isso o slug é escrito à mão. Ela entra em
    // specs/114 porque é uma regra de banco/PIX: o que falta é exatamente um dos dois.
    //
    // A mensagem passa a dizer o que falta; o que ela NÃO conserta é ONDE o erro aparece — segue
    // ancorado no checkbox, e não nos campos vazios. Esse é o defeito da #362, e mexer nele aqui
    // seria trocar o alvo da fatia sem dizer.
    if (state.hasFinancialTransfer && candidate.bankAccount === null && candidate.pixKey === null) {
      next.hasFinancialTransfer = 'transfer-target-required'
    }
    // Vigência: endDate > startDate estrito (comparação string ISO, U2). Só checa quando ambos válidos.
    if (candidate.startDate !== '' && candidate.endDate !== '' && candidate.endDate <= candidate.startDate) {
      // Entrou de carona: a mudança de tipo obrigou a tocar esta linha, e deixá-la sem nome faria a
      // vigência ser a única regra do ACT ainda muda. É uma frase no catálogo, risco zero.
      next.endDate = 'end-date-not-after-start'
    }

    if (Object.keys(next).length > 0 || !parsed.success) {
      setErrors(next)
      return
    }
    setErrors({})
    opts.onSubmit(parsed.data)
  }, [state, opts])

  return { state, errors, setField, reset, submit }
}
