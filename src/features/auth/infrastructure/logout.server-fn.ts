import { createServerFn } from '@tanstack/react-start'
import { serverFetch } from '@/server/http/result-fetch'
import { getAuthSession, destroyAuthSession } from './auth-session'
import { getSession, deleteSession } from './session-store'

export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  const authSession = await getAuthSession()

  if (authSession) {
    const session = await getSession(authSession.sessionId)

    // Attempt to revoke refresh token on backend
    if (session) {
      await serverFetch<unknown>('/auth/logout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: { refreshToken: session.refreshToken },
      })
    }

    // Clean up server-side session
    await deleteSession(authSession.sessionId)
  }

  // Clear client cookie
  await destroyAuthSession()

  return { success: true }
})
