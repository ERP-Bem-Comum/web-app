import { handleError } from '@/utils/errorHandling'
import api from './api'
import { Response } from '@/types/global'
import { HttpStatusCode } from 'axios'

export const generateCnab = async (selectedIds: Array<number>): Promise<Response<boolean>> => {
  try {
    const response = await api.post(`/payables/export`, {
      selectedIds,
    })

    return {
      data: true,
      status: response.status,
      error: '',
      meta: null,
    }
  } catch (error) {
    console.error(error)
    return handleError<boolean>(error)
  }
}
