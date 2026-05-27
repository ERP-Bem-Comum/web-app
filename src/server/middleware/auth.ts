import { createMiddleware } from '@tanstack/react-start'
import { env } from '../env'

export type Session = {
  userId: number
  email: string
  name: string
  token: string
}

export const authMiddleware = createMiddleware().server(async ({ request, next }) => {
  const cookieHeader = request.headers.get('cookie') || ''
  const sessionToken = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('session-token='))
    ?.split('=')[1]

  if (!sessionToken) {
    throw new Response('Unauthorized', { status: 401 })
  }

  try {
    // JWT simples decode (base64 payload)
    const payload = JSON.parse(
      Buffer.from(sessionToken.split('.')[1], 'base64').toString('utf-8'),
    )

    // Verifica expiração
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new Response('Session expired', { status: 401 })
    }

    const user = payload.user as Session

    if (!user?.token) {
      throw new Response('Invalid session', { status: 401 })
    }

    return next({
      context: {
        session: user,
      },
    })
  } catch {
    throw new Response('Invalid session', { status: 401 })
  }
})
