'use client'
import { AUTH_BYPASS_ENABLED, authBypassSession } from '@/utils/authBypass'
import axios from 'axios'
import { getSession, signOut } from 'next-auth/react'
import formDataAxiosTransformer from './formDataAxiosTransformer'
const baseURL = process.env.NEXT_PUBLIC_API_URL

const ApiClient = () => {
  const defaultOptions = {
    baseURL,
    transformRequest: [formDataAxiosTransformer].concat(
      axios.defaults.transformRequest ? axios.defaults.transformRequest : [],
    ),
  }

  const instance = axios.create(defaultOptions)

  instance.interceptors.request.use(async (request) => {
    const session = AUTH_BYPASS_ENABLED ? authBypassSession : await getSession()
    if (session) {
      request.headers.Authorization = `Bearer ${session.user.token}`
    }
    return request
  })

  instance.interceptors.response.use(
    (response) => {
      return response
    },
    (error) => {
      if (
        !AUTH_BYPASS_ENABLED &&
        error?.response?.status === 401 &&
        error?.response?.data?.message === 'Unauthorized'
      ) {
        signOut({ callbackUrl: '/login' })
      }
      return Promise.reject(error)
    },
  )

  return instance
}

export default ApiClient()
