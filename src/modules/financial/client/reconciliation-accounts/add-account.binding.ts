/**
 * useAddAccount — controller do form "Nova Conta Bancária" (#138, POST /cedente-accounts). UI-state do
 * formulário + validação + submit via `reconciliationRepository.createAccount`. Sucesso → invalida o grid
 * (queryKey das contas) e fecha. Erros → tag i18n. `document` (CNPJ) é obrigatório (exigência do core-api).
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import { maskMoneyBRL, reaisToCents } from '#modules/financial/client/data/money.ts'
import { maskCnpj, unmaskCnpj } from '#shared/document/cnpj.ts'
import type {
  AccountType,
  CreateCedenteAccountInput,
} from '#modules/financial/client/data/model/reconciliation.model.ts'
import { OTHER_BANK_CODE, maskDateInput, dateInputToIso } from './reconciliation-accounts.view-model.ts'

export type AddAccountBinding = Readonly<{
  bankCode: string
  customBankName: string // #206: instituição digitada quando banco = "Outro"
  needsBankName: boolean // true quando banco = "Outro" (a UI mostra o campo de instituição)
  type: AccountType
  typeLabel: string // #206: "Identificação da conta" exigida p/ Cartão corporativo/Outro
  needsTypeLabel: boolean // true quando type = Cartao/Outro (a UI mostra o campo)
  agency: string
  account: string // "número-DV" combinado (ex.: 0012345-7); separado em accountNumber/accountDigit no submit
  document: string
  nickname: string
  openingBalance: string
  openingBalanceDate: string
  canSubmit: boolean
  submitting: boolean
  errorTag: string | null
  setBank: (code: string) => void
  setCustomBankName: (v: string) => void
  setType: (t: AccountType) => void
  setTypeLabel: (v: string) => void
  setAgency: (v: string) => void
  setAccount: (v: string) => void
  setDocument: (v: string) => void
  setNickname: (v: string) => void
  setOpeningBalance: (v: string) => void
  setOpeningBalanceDate: (v: string) => void
  reset: () => void
  submit: () => void
}>

export function useAddAccount(
  bankNameOf: (code: string) => string | undefined,
  onCreated: () => void,
): AddAccountBinding {
  const qc = useQueryClient()
  const [bankCode, setBankCode] = useState('')
  const [customBankName, setCustomBankName] = useState('')
  const [type, setType] = useState<AccountType>('Corrente')
  const [typeLabel, setTypeLabel] = useState('')
  const [agency, setAgency] = useState('')
  const [account, setAccount] = useState('')
  const [document, setDocument] = useState('')
  const [nickname, setNickname] = useState('')
  const [openingBalance, setOpeningBalance] = useState('')
  const [openingBalanceDate, setOpeningBalanceDate] = useState('')
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const reset = () => {
    setBankCode('')
    setCustomBankName('')
    setType('Corrente')
    setTypeLabel('')
    setAgency('')
    setAccount('')
    setDocument('')
    setNickname('')
    setOpeningBalance('')
    setOpeningBalanceDate('')
    setErrorTag(null)
  }

  const mut = useMutation({
    mutationFn: (input: CreateCedenteAccountInput) => reconciliationRepository.createAccount(input),
    onSuccess: (res) => {
      if (res.ok) {
        setErrorTag(null)
        void qc.invalidateQueries({ queryKey: ['financial', 'reconciliation', 'accounts'] })
        reset()
        onCreated()
      } else {
        setErrorTag(reconciliationErrorTag(res.error))
      }
    },
  })

  // #206: banco "Outro" pede o nome da instituição; tipo Cartão corporativo/Outro pede a identificação da conta.
  const needsBankName = bankCode === OTHER_BANK_CODE
  const needsTypeLabel = type === 'Cartao' || type === 'Outro'
  const canSubmit =
    bankCode.trim() !== '' &&
    agency.trim() !== '' &&
    account.trim() !== '' &&
    document.trim() !== '' &&
    (!needsBankName || customBankName.trim() !== '') &&
    (!needsTypeLabel || typeLabel.trim() !== '')

  return {
    bankCode,
    customBankName,
    needsBankName,
    type,
    typeLabel,
    needsTypeLabel,
    agency,
    account,
    document,
    nickname,
    openingBalance,
    openingBalanceDate,
    canSubmit,
    submitting: mut.isPending,
    errorTag,
    setBank: (code) => {
      setBankCode(code)
    },
    setCustomBankName: (v) => {
      setCustomBankName(v)
    },
    setType: (t) => {
      setType(t)
    },
    setTypeLabel: (v) => {
      setTypeLabel(v)
    },
    setAgency: (v) => {
      setAgency(v)
    },
    setAccount: (v) => {
      setAccount(v)
    },
    setDocument: (v) => {
      setDocument(maskCnpj(v)) // máscara CNPJ ao digitar (cru vai ao backend no submit via unmaskCnpj)
    },
    setNickname: (v) => {
      setNickname(v)
    },
    setOpeningBalance: (v) => {
      setOpeningBalance(maskMoneyBRL(v))
    },
    setOpeningBalanceDate: (v) => {
      setOpeningBalanceDate(maskDateInput(v)) // máscara DD/MM/AAAA (convertida p/ ISO no submit)
    },
    reset,
    submit: () => {
      if (!canSubmit) return
      // Saldo de abertura: o backend exige saldo E data juntos (ou ambos vazios) — valida cedo c/ msg clara.
      const hasBalance = openingBalance.trim() !== ''
      const hasDate = openingBalanceDate.trim() !== ''
      if (hasBalance !== hasDate) {
        setErrorTag('financial.recon.add.balancePair')
        return
      }
      const balance = openingBalance.trim()
      let openingBalanceCents: string | undefined
      if (balance !== '') {
        const r = reaisToCents(balance)
        if (!r.ok) {
          setErrorTag('financial.recon.add.invalidBalance')
          return
        }
        openingBalanceCents = r.value
      }
      // Data do saldo: "DD/MM/AAAA" → ISO "AAAA-MM-DD" (o backend exige z.iso.date). Vazia → undefined.
      let isoDate: string | undefined
      const dateStr = openingBalanceDate.trim()
      if (dateStr !== '') {
        const iso = dateInputToIso(dateStr)
        if (iso === null) {
          setErrorTag('financial.recon.add.invalidDate')
          return
        }
        isoDate = iso
      }
      // "0012345-7" → número "0012345" + DV "7"; sem '-' → DV vazio.
      const acc = account.trim()
      const dash = acc.lastIndexOf('-')
      const accountNumber = dash > 0 ? acc.slice(0, dash) : acc
      const accountDigit = dash > 0 ? acc.slice(dash + 1, dash + 3) : ''
      // #206: banco "Outro" → o nome vem do campo livre; senão, do catálogo.
      const bankName = needsBankName ? customBankName.trim() : bankNameOf(bankCode)
      mut.mutate({
        bankCode,
        bankName,
        type,
        ...(needsTypeLabel && typeLabel.trim() !== '' ? { typeLabel: typeLabel.trim() } : {}), // #206
        agency: agency.trim(),
        accountNumber,
        accountDigit,
        document: unmaskCnpj(document.trim()), // CNPJ cru (só alfanum.) — a UI guarda mascarado
        nickname: nickname.trim() === '' ? undefined : nickname.trim(),
        openingBalanceCents,
        openingBalanceDate: isoDate,
      })
    },
  }
}
