import { Response } from '@/types/global'
import api from './api'
import { handleError } from '@/utils/errorHandling'
import { Balance, BalanceParams } from '@/types/apiBradesco'

export const getBalance = async (params: BalanceParams): Promise<Response<Balance>> => {
  try {
    const resp = await api.get<Balance>(`/apiBradesco/balance`, {
      params,
    })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    console.error(error)
    return handleError<Balance>(error)
  }
}
