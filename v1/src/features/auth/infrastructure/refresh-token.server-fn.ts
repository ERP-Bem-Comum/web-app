import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { serverFetch } from '@/server/http/result-fetch'
import { getAuthSession } from './auth-session'
import { getSession, updateSession } from './session-store'
import { env } from '@/server/env'

const refreshResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  userId: z.string(),
})

export async function refreshAccessToken(sessionId: string): Promise<
  | { success: true; accessToken: string; refreshToken: string }
  | { success: false; error: string }
> {
  const session = await getSession(sessionId)
  if (!session) {
    return { success: false, error: 'Session not found' }
  }

  const result = await serverFetch<unknown>('/auth/refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: { refreshToken: session.refreshToken },
  })

  if (result.isErr()) {
    return { success: false, error: 'Refresh failed' }
  }

  const parsed = refreshResponseSchema.safeParse(result.value)
  if (!parsed.success) {
    return { success: false, error: 'Invalid refresh response' }
  }

  const newAccessToken = parsed.data.accessToken
  const newRefreshToken = parsed.data.refreshToken ?? session.refreshToken

  await updateSession(sessionId, {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  })

  return {
    success: true,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  }
}

export const refreshToken = createServerFn({ method: 'POST' }).handler(async () => {
  const authSession = await getAuthSession()
  if (!authSession) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const result = await refreshAccessToken(authSession.sessionId)
  if (!result.success) {
    throw new Response(result.error, { status: 401 })
  }

  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  }
})
