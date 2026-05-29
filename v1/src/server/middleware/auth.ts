import { createMiddleware } from '@tanstack/react-start'
import { decodeJwt } from 'jose'
import { getAuthSession, destroyAuthSession } from '@/features/auth/infrastructure/auth-session'
import { getSession, deleteSession } from '@/features/auth/infrastructure/session-store'
import { refreshAccessToken } from '@/features/auth/infrastructure/refresh-token.server-fn'

export type Session = {
  userId: string
  email: string
}

export type AuthContext = {
  session: Session
  accessToken: string
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJwt(token)
    if (!payload.exp) return false
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export const authMiddleware = createMiddleware().server(async ({ request, next }) => {
  const authSession = await getAuthSession()

  if (!authSession) {
    throw new Response('Unauthorized', { status: 401 })
  }

  let session = await getSession(authSession.sessionId)

  if (!session) {
    await destroyAuthSession()
    throw new Response('Unauthorized', { status: 401 })
  }

  // Refresh access token if expired
  if (isTokenExpired(session.accessToken)) {
    const refreshResult = await refreshAccessToken(authSession.sessionId)

    if (!refreshResult.success) {
      await deleteSession(authSession.sessionId)
      await destroyAuthSession()
      throw new Response('Session expired', { status: 401 })
    }

    // Reload session with updated tokens
    session = await getSession(authSession.sessionId)
    if (!session) {
      await destroyAuthSession()
      throw new Response('Unauthorized', { status: 401 })
    }
  }

  return next({
    context: {
      session: {
        userId: session.userId,
        email: session.email,
      },
      accessToken: session.accessToken,
    },
  })
})
