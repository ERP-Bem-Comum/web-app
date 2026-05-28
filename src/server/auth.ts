import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader, getRequestHeader } from '@tanstack/react-start/server'
import { z } from 'zod'
import { env } from './env'
import { resultFetch } from '@/shared/http/result-fetch'
import { authMiddleware } from './middleware/auth'

const isDev = env.NODE_ENV === 'development'
const cookieSecure = isDev ? '' : '; Secure'
const SESSION_COOKIE = 'session-token'
const SESSION_MAX_AGE = 8 * 60 * 60 // 8 horas

function setSessionCookie(token: string) {
  setResponseHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; HttpOnly${cookieSecure}; SameSite=Strict; Path=/; Max-Age=${SESSION_MAX_AGE}`,
  )
}

function clearSessionCookie() {
  setResponseHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; HttpOnly${cookieSecure}; SameSite=Strict; Path=/; Max-Age=0`,
  )
}

function createSessionToken(user: { id: number; email: string; name: string }, token: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      user: { userId: user.id, email: user.email, name: user.name, token },
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
    }),
  ).toString('base64url')
  return `${header}.${payload}.`
}

const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const login = createServerFn({ method: 'POST' })
  .inputValidator(loginInputSchema)
  .handler(async ({ data }) => {
    const res = await resultFetch(`${env.API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      if (res.error.kind === 'http') {
        const body = typeof res.error.body === 'string'
          ? res.error.body
          : JSON.stringify(res.error.body)
        throw new Error(body || `Login failed: ${res.error.status}`)
      }
      throw new Error('Login failed: network error')
    }

    const responseData = await res.value.json()
    const user = responseData.user
    const token = responseData.token

    if (!user || !token) {
      throw new Error('Invalid credentials')
    }

    const sessionToken = createSessionToken(user, token)
    setSessionCookie(sessionToken)

    return { user: { id: user.id, email: user.email, name: user.name } }
  })

export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  clearSessionCookie()
  return { success: true }
})

export const getSession = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return {
      user: {
        id: context.session.userId,
        email: context.session.email,
        name: context.session.name,
      },
    }
  })
