import api from '@/services/api'
import { AxiosRequestConfig } from 'axios'

export function apiMutator<T>(config: AxiosRequestConfig): Promise<T> {
  return api.request<T>(config).then((response) => response.data)
}
