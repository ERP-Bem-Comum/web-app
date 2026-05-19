import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { BankReconciliationType } from '@/enums/reconciliation'
import api from './api'
import { Response } from '@/types/global'
import { handleError } from '@/utils/errorHandling'

type Transfer = {
  type: BankReconciliationType.TRANSFER
  recordSystem?: {
    id: number // id do bank reconciliation
  }
}

export type TransactionRecord = {
  id: number
  documentNumber: string
  date: string
  amount: number
  title: string
  description: string
}

type TransactionEntry = {
  type: BankReconciliationType.TRANSACTION_ENTRY
  recordSystem?: TransactionRecord
}

export type BankDetail = {
  accountInfo: {
    name: string
    agency: string
    account: string
    balance: number
    updatedAt: Date
    balanceSystem: number
  }
  transactions: Array<
    {
      reconciled: boolean
      type: BankReconciliationType
      extract: {
        documentNumber: string
        date: string
        amount: number
        title: string
        description: string
      }
      system?: TransactionRecord
      transferedById?: number
    } & (Transfer | TransactionEntry)
  >
  futureTransactions: Array<{
    documentNumber: string
    date: string
    amount: number
    title: string
    description: string
  }>
}

export type responseNewConciliation = {
  system: TransactionRecord
  newBalance: number
}
export const useGetBankDetails = (id: number, period: { start: Date; end: Date }) => {
  const dateStart = period.start.toISOString().split('T')[0]
  const dateEnd = period.end.toISOString().split('T')[0]

  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ['BankDetail', id, dateStart, dateEnd],
    queryFn: () => getBankDetails(id, dateStart, dateEnd),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    enabled: !!id,
  })
  return {
    response: data,
    isLoading,
    isRefetching,
  }
}

const getBankDetails = async (
  id: number,
  dateStart: string,
  dateEnd: string,
): Promise<Response<BankDetail>> => {
  try {
    const resp = await api.get<BankDetail>(
      `/bank-reconciliation/${id}?start=${dateStart}&end=${dateEnd}`,
    )
    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    console.error(error)
    return handleError<BankDetail>(error)
  }
}

export async function editAccountName(id: number, name: string) {
  const response = await api
    .put(`/accounts/${id}`, { name })
    .then((response) => {
      return response
    })
    .catch((error) => {
      return {
        status: 400,
        data: {
          message: error.response.data.message,
        },
      }
    })
  return response.data
}
