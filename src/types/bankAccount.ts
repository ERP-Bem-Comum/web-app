import { bankAccountSchema } from '@/validators/account'
import { abstractType } from './global'
import { z } from 'zod'
import { BaseSyntheticEvent } from 'react'

export type BankAccountRow = abstractType & {
  bank: string
  name: string
  integration: string
  pendingReconciliations: number
  lastReconciliation: Date
  systemBalance: number
}

export type IBankAccountTable = abstractType & {
  bank: string
  name: string
  integration: string
  pendingReconciliations: number
  lastReconciliation: Date
  systemBalance: number
}

export type BankAccount = z.infer<typeof bankAccountSchema>

export type EditBankAccount = abstractType &
  BankAccount & {
    integracao: string
    lastReconciliation: Date
  }

export interface useBankAccountsReturn {
  isDisabled: boolean
  success: boolean
  errorMessage: string
  UpdateInitialbalance: (
    { accountNumber, agency, initialBalance }: BankAccount,
    enableInitialbalance: () => void,
    setValue: (balance: number) => void,
  ) => Promise<void>
  modals: {
    isOpenModalShowConfirm: boolean
    onOpenModalShowConfirm: () => void
    onCloseModalShowConfirm: () => void
    isOpenModalQuestion: boolean
    onOpenModalQuestion: () => void
    onCloseModalQuestion: () => void
    isOpenAwaitModal: boolean
  }

  form: {
    onSubmit: (
      data: BankAccount,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      e?: BaseSyntheticEvent<object, any, any>,
      id?: number,
    ) => Promise<void>
  }
}
