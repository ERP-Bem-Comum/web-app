/**
 * useEditAccount — editar conta-cedente (PATCH /cedente-accounts/:id). Form PRÉ-PREENCHIDO a partir da conta
 * (`open(account)`), com o subconjunto editável: banco, tipo(+identificação), agência, conta-DV, apelido.
 * CNPJ e saldo de abertura são IMUTÁVEIS (não aparecem). Sucesso → invalida o grid e fecha. Espelha
 * `useAddAccount`, mas via `editAccount` (PATCH) e sem os campos imutáveis.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import type {
  AccountType,
  EditCedenteAccountInput,
  ReconciliationAccount,
} from '#modules/financial/client/data/model/reconciliation.model.ts'
import { OTHER_BANK_CODE } from './reconciliation-accounts.view-model.ts'

export type EditAccountBinding = Readonly<{
  /** Conta em edição (modal aberto) — null quando fechado. */
  target: ReconciliationAccount | null
  bankCode: string
  customBankName: string
  needsBankName: boolean
  type: AccountType
  typeLabel: string
  needsTypeLabel: boolean
  agency: string
  account: string // "número-DV" combinado
  nickname: string
  canSubmit: boolean
  saving: boolean
  errorTag: string | null
  setBank: (code: string) => void
  setCustomBankName: (v: string) => void
  setType: (t: AccountType) => void
  setTypeLabel: (v: string) => void
  setAgency: (v: string) => void
  setAccount: (v: string) => void
  setNickname: (v: string) => void
  open: (account: ReconciliationAccount) => void
  cancel: () => void
  submit: () => void
}>

export function useEditAccount(
  bankNameOf: (code: string) => string | undefined,
  onSaved: () => void,
): EditAccountBinding {
  const qc = useQueryClient()
  const [target, setTarget] = useState<ReconciliationAccount | null>(null)
  const [bankCode, setBankCode] = useState('')
  const [customBankName, setCustomBankName] = useState('')
  const [type, setType] = useState<AccountType>('Corrente')
  const [typeLabel, setTypeLabel] = useState('')
  const [agency, setAgency] = useState('')
  const [account, setAccount] = useState('')
  const [nickname, setNickname] = useState('')
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const mut = useMutation({
    mutationFn: (input: EditCedenteAccountInput) => reconciliationRepository.editAccount(input),
    onSuccess: (res) => {
      if (res.ok) {
        setErrorTag(null)
        setTarget(null)
        void qc.invalidateQueries({ queryKey: ['financial', 'reconciliation', 'accounts'] })
        onSaved()
      } else {
        setErrorTag(reconciliationErrorTag(res.error))
      }
    },
  })

  const needsBankName = bankCode === OTHER_BANK_CODE
  const needsTypeLabel = type === 'Cartao' || type === 'Outro'
  const canSubmit =
    bankCode.trim() !== '' &&
    agency.trim() !== '' &&
    account.trim() !== '' &&
    (!needsBankName || customBankName.trim() !== '') &&
    (!needsTypeLabel || typeLabel.trim() !== '')

  return {
    target,
    bankCode,
    customBankName,
    needsBankName,
    type,
    typeLabel,
    needsTypeLabel,
    agency,
    account,
    nickname,
    canSubmit,
    saving: mut.isPending,
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
    setNickname: (v) => {
      setNickname(v)
    },
    open: (a) => {
      setTarget(a)
      setBankCode(a.bankCode)
      setCustomBankName(a.bankName)
      setType(a.type)
      setTypeLabel(a.typeLabel ?? '')
      setAgency(a.branch)
      setAccount(a.accountDv !== '' ? `${a.accountNumber}-${a.accountDv}` : a.accountNumber)
      setNickname(a.alias)
      setErrorTag(null)
    },
    cancel: () => {
      if (mut.isPending) return
      setErrorTag(null)
      setTarget(null)
    },
    submit: () => {
      if (target === null || !canSubmit || mut.isPending) return
      // "0012345-7" → número "0012345" + DV "7"; sem '-' → DV vazio.
      const acc = account.trim()
      const dash = acc.lastIndexOf('-')
      const accountNumber = dash > 0 ? acc.slice(0, dash) : acc
      const accountDigit = dash > 0 ? acc.slice(dash + 1, dash + 3) : ''
      const bankName = needsBankName ? customBankName.trim() : bankNameOf(bankCode)
      mut.mutate({
        id: target.id,
        bankCode,
        ...(bankName !== undefined ? { bankName } : {}),
        type,
        ...(needsTypeLabel && typeLabel.trim() !== '' ? { typeLabel: typeLabel.trim() } : {}),
        agency: agency.trim(),
        accountNumber,
        accountDigit,
        ...(nickname.trim() !== '' ? { nickname: nickname.trim() } : {}),
      })
    },
  }
}
