'use client'
import { AUTH_BYPASS_ENABLED, authBypassSession } from '@/utils/authBypass'
import axios from 'axios'
import { getSession } from 'next-auth/react'
import { destroyCookie, parseCookies } from 'nookies'

const baseURL = process.env.NEXT_PUBLIC_API_URL

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
