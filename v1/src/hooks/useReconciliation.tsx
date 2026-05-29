import { BankReconciliationType } from '@/enums/reconciliation'
import { BankDetail, TransactionRecord } from '@/services/bankDetails'
import { createReconciliation, deleteReconciliation } from '@/services/reconciliation'
import {
  CreateBankReconciliation,
  CreatebankRecordApiOutput,
  FilterDateType,
  TransactionCardProps,
} from '@/types/reconciliation'
import { useMutation } from '@tanstack/react-query'
import { HttpStatusCode } from 'axios'
import { parseISO } from 'date-fns'
import { queryClient } from 'lib/react-query'
import { useState } from 'react'
export interface ReconcileVariables {
  extract: TransactionCardProps
  appointmentId: number
  type: BankReconciliationType
  index: number
  accountId: number
  period: FilterDateType['period']
  system?: TransactionCardProps // usado no TAX/PROFIT
}

export interface UnlinkVariables {
  id: number
  index: number
  accountId: number
  period: FilterDateType['period']
}

export const useReconciliation = () => {
  const [errorMessage, setErrorMessage] = useState<string>()

  const onSubmitTransactionOrTransfer = async ({
    extract,
    appointmentId,
    type,
    accountId,
  }: ReconcileVariables) => {
    if (!extract || !appointmentId) throw new Error('Missing info')

    const dataRecordAPI: CreatebankRecordApiOutput = buildDataRecordApi(extract)

    const dataReconciliation: CreateBankReconciliation = buildDataReconciliation({
      accountId,
      type,
      appointmentId,
    })

    return await createReconciliation(dataRecordAPI, dataReconciliation)
  }

  const onSubmit = async ({
    extract,
    appointmentId,
    type,
    accountId,
    system,
    index,
    period,
  }: ReconcileVariables) => {
    let resp
    if (
      type === BankReconciliationType.TRANSACTION_ENTRY ||
      type === BankReconciliationType.TRANSFER
    ) {
      resp = await onSubmitTransactionOrTransfer({
        extract,
        appointmentId,
        type,
        accountId,
        index,
        period,
      })
    } else if (system && system.categorization) {
      resp = await createReconciliation(
        {
          documentNumber: system.documentNumber,
          transactionAmount: system.amount,
          transactionDate: system.date as Date,
          fullTransactionDescription: system.description,
          categorization: system.categorization,
        },
        {
          accountId,
          type,
        },
      )
    } else {
      throw new Error('error interno')
    }

    if (resp?.status === HttpStatusCode.Created) {
      return resp.data
    } else {
      throw new Error(resp?.error)
    }
  }

  const onUnlink = async ({ id }: UnlinkVariables) => {
    const resp = await deleteReconciliation(id)

    if (resp.status === HttpStatusCode.Ok) {
      return resp.data
    } else {
      throw new Error(resp.error)
    }
  }

  const { mutate: mutateReconcile, isPending: isPendingReconcile } = useMutation({
    mutationFn: onSubmit,
    onSuccess: (data, params) => {
      if (data && params) {
        updateBankDetailCache(
          true,
          params.index,
          params.period,
          params.accountId,
          data.system,
          data.newBalance,
        )
      }
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: (error) => handleError(error, 'reconciliation'),
  })

  const { mutate: mutateUnlink, isPending: isPendingUnlink } = useMutation({
    mutationFn: onUnlink,
    onSuccess: (data, params) => {
      if (params && data) {
        updateBankDetailCache(
          false,
          params.index,
          params.period,
          params.accountId,
          undefined,
          data.newBalance,
        )
      }
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: (error) => handleError(error, 'unlink'),
  })

  const updateBankDetailCache = (
    reconciled: boolean,
    index: number,
    period: FilterDateType['period'],
    accountId: number,
    system?: TransactionRecord,
    newBalance?: number,
  ) => {
    const dateStart = period.start.toISOString().split('T')[0]
    const dateEnd = period.end.toISOString().split('T')[0]
    queryClient.setQueryData(
      ['BankDetail', accountId, dateStart, dateEnd],
      (oldData: BankDetail) => {
        const updatedTransactions = [...oldData.transactions]
        updatedTransactions[index] = {
          ...updatedTransactions[index],
          reconciled,
          system,
        }
        return {
          ...oldData,
          accountInfo: {
            ...oldData.accountInfo,
            balanceSystem: newBalance ?? oldData.accountInfo.balanceSystem,
          },
          transactions: updatedTransactions,
        }
      },
    )
  }

  const buildDataRecordApi = (
    extract: TransactionCardProps,
  ): Omit<CreatebankRecordApiOutput, 'categorization'> => {
    return {
      documentNumber: extract.documentNumber,
      fullTransactionDescription: extract.description,
      transactionAmount: extract.amount,
      transactionDate: parseISO(extract.date as string),
    }
  }

  const buildDataReconciliation = ({
    accountId,
    type,
    appointmentId,
  }: {
    accountId: number
    type: BankReconciliationType
    appointmentId: number
  }): CreateBankReconciliation => {
    const data =
      type === BankReconciliationType.TRANSACTION_ENTRY
        ? { recordSystemId: appointmentId }
        : { transferedById: appointmentId }
    return { ...data, accountId, type }
  }

  const clearErrorMessage = () => {
    setErrorMessage(undefined)
  }

  const handleError = (error: Error, where: 'reconciliation' | 'unlink') => {
    setErrorMessage(error.message)
    console.error(`Error on ${where}:`, error)
  }

  return {
    mutateReconcile,
    updateBankDetailCache,
    mutateUnlink,
    clearErrorMessage,
    errorMessage,
    isPendingReconcile,
    isPendingUnlink,
  }
}
