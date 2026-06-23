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
import type {
  AccountType,
  CreateCedenteAccountInput,
} from '#modules/financial/client/data/model/reconciliation.model.ts'

export type AddAccountBinding = Readonly<{
  bankCode: string
  type: AccountType
  typeLabel: string // #206: texto livre exigido p/ Cartao/Outro
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

  // #206: Cartao/Outro exigem um rótulo livre que identifique a conta.
  const needsTypeLabel = type === 'Cartao' || type === 'Outro'
  const canSubmit =
    bankCode.trim() !== '' &&
    agency.trim() !== '' &&
    account.trim() !== '' &&
    document.trim() !== '' &&
    (!needsTypeLabel || typeLabel.trim() !== '')

  return {
    bankCode,
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
      setDocument(v)
    },
    setNickname: (v) => {
      setNickname(v)
    },
    setOpeningBalance: (v) => {
      setOpeningBalance(maskMoneyBRL(v))
    },
    setOpeningBalanceDate: (v) => {
      setOpeningBalanceDate(v)
    },
    reset,
    submit: () => {
      if (!canSubmit) return
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
      // "0012345-7" → número "0012345" + DV "7"; sem '-' → DV vazio.
      const acc = account.trim()
      const dash = acc.lastIndexOf('-')
      const accountNumber = dash > 0 ? acc.slice(0, dash) : acc
      const accountDigit = dash > 0 ? acc.slice(dash + 1, dash + 3) : ''
      const bankName = bankNameOf(bankCode)
      mut.mutate({
        bankCode,
        bankName,
        type,
        ...(needsTypeLabel && typeLabel.trim() !== '' ? { typeLabel: typeLabel.trim() } : {}), // #206
        agency: agency.trim(),
        accountNumber,
        accountDigit,
        document: document.trim(),
        nickname: nickname.trim() === '' ? undefined : nickname.trim(),
        openingBalanceCents,
        openingBalanceDate: openingBalanceDate.trim() === '' ? undefined : openingBalanceDate.trim(),
      })
    },
  }
}
