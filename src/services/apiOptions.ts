'use client'
import { AUTH_BYPASS_ENABLED, authBypassSession } from '@/utils/authBypass'
import { getSession } from 'next-auth/react'
import { destroyCookie, parseCookies } from '@/utils/cookies'
import { createHttpClient } from './http-client'

const baseURL = process.env.NEXT_PUBLIC_API_URL

const apiOptions = createHttpClient({
  baseURL,
  onRequest: async (init) => {
    const session = AUTH_BYPASS_ENABLED ? authBypassSession : await getSession()
    const headers = new Headers(init.headers)
    if (session) {
      headers.set('Authorization', `Bearer ${session.user.token}`)
    } else {
      const cookies = parseCookies()
      if (cookies) {
        headers.set(
          'Authorization',
          'Basic ' + btoa(cookies?.ApprovalsPayableId + ':' + cookies?.ApprovalsPassword),
        )
      }
    }
    return { ...init, headers }
  },
  onUnauthorized: (error) => {
    const data = error.response?.data as { message?: string } | undefined
    if (data?.message === 'Unauthorized') {
      destroyCookie(null, 'ApprovalsPayableId')
      destroyCookie(null, 'ApprovalsPassword')
      console.log('password expired')
    }
  },
})

export default apiOptions
