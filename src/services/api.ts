'use client'
import { AUTH_BYPASS_ENABLED, authBypassSession } from '@/utils/authBypass'
import { getSession, signOut } from 'next-auth/react'
import { createHttpClient } from './http-client'

const baseURL = process.env.NEXT_PUBLIC_API_URL

const api = createHttpClient({
  baseURL,
  onRequest: async (init) => {
    const session = AUTH_BYPASS_ENABLED ? authBypassSession : await getSession()
    if (session) {
      const headers = new Headers(init.headers)
      headers.set('Authorization', `Bearer ${session.user.token}`)
      return { ...init, headers }
    }
    return init
  },
  onUnauthorized: (error) => {
    if (AUTH_BYPASS_ENABLED) return
    const data = error.response?.data as { message?: string } | undefined
    if (data?.message === 'Unauthorized') {
      signOut({ callbackUrl: '/login' })
    }
  },
})

export default api
