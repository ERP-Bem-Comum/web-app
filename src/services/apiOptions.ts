'use client'
import { AUTH_BYPASS_ENABLED, authBypassSession } from '@/utils/authBypass'
import axios from 'axios'
import { getSession } from 'next-auth/react'
import { destroyCookie, parseCookies } from 'nookies'

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4010'

const ApiOptions = () => {
  const defaultOptions = {
    baseURL,
  }

  const instance = axios.create(defaultOptions)

  instance.interceptors.request.use(async (request) => {
    const session = AUTH_BYPASS_ENABLED ? authBypassSession : await getSession()
    if (session) {
      request.headers.Authorization = `Bearer ${session.user.token}`
    } else {
      const cookies = parseCookies()
      if (cookies) {
        request.headers.Authorization =
          'Basic ' + btoa(cookies?.ApprovalsPayableId + ':' + cookies?.ApprovalsPassword)
      }
    }
    return request
  })

  instance.interceptors.response.use(
    (response) => {
      return response
    },
    (error) => {
      if (
        AUTH_BYPASS_ENABLED &&
        (error?.response?.status === 401 || error?.response?.status === 403)
      ) {
        const cleanError = Object.assign(
          new Error('Backend offline — usando dados locais'),
          { response: { status: error.response.status }, isBackendOffline: true },
        )
        // Suprime stack trace no console — comportamento esperado em modo bypass
        cleanError.stack = undefined
        return Promise.reject(cleanError)
      }
      if (error?.response?.status === 401 && error?.response?.data?.message === 'Unauthorized') {
        destroyCookie(null, 'ApprovalsPayableId')
        destroyCookie(null, 'ApprovalsPassword')
        console.log('password expired')
      }
      return Promise.reject(error)
    },
  )

  return instance
}

export default ApiOptions()
