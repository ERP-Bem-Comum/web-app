'use client'
import { destroyCookie, parseCookies } from '@/utils/cookies'
import { createHttpClient } from './http-client'

const baseURL = process.env.NEXT_PUBLIC_API_URL

const apiShared = createHttpClient({
  baseURL,
  onRequest: (init) => {
    const cookies = parseCookies()
    const headers = new Headers(init.headers)
    if (cookies) {
      headers.set(
        'Authorization',
        'Basic ' + btoa(cookies?.shareUsername + ':' + cookies?.sharePassword),
      )
    }
    return { ...init, headers }
  },
  onUnauthorized: (error) => {
    const data = error.response?.data as { message?: string } | undefined
    if (data?.message === 'Unauthorized') {
      destroyCookie(null, 'shareBudgetId')
      destroyCookie(null, 'shareUsername')
      destroyCookie(null, 'sharePassword')
      console.log('password expired')
    }
  },
})

export default apiShared
