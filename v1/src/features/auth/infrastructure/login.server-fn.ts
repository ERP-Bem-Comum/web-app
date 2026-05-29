import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { serverFetch } from '@/server/http/result-fetch'
import { createSession } from './session-store'
import { createAuthSession } from './auth-session'

const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  userId: z.string(),
  email: z.string().email(),
})

export const login = createServerFn({ method: 'POST' })
  .inputValidator(loginInputSchema)
  .handler(async ({ data }) => {
    const result = await serverFetch<unknown>('/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: data,
    })

    if (result.isErr()) {
      if (result.error.kind === 'http') {
        const body =
          typeof result.error.body === 'string'
            ? result.error.body
            : JSON.stringify(result.error.body)
        throw new Error(body || `Login failed: ${result.error.status}`)
      }
      throw new Error('Login failed: network error')
    }

    const parsed = loginResponseSchema.safeParse(result.value)
    if (!parsed.success) {
      throw new Error('Invalid login response from server')
    }

    const { accessToken, refreshToken, userId, email } = parsed.data

    // Generate opaque session ID and store tokens server-side
    const sessionId = crypto.randomUUID()
    await createSession(sessionId, {
      accessToken,
      refreshToken,
      userId,
      email,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    })

    // Set encrypted cookie with opaque session ID
    await createAuthSession(sessionId)

    return { user: { id: userId, email } }
  })
