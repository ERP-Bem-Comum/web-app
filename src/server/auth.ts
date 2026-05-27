import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { env } from './env'
import { resultFetch } from '@/shared/http/result-fetch'
import { authMiddleware } from './middleware/auth'

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
        throw new Response(JSON.stringify(res.error.body), {
          status: res.error.status,
        })
      }
      throw new Response('Login failed', { status: 500 })
    }

    const responseData = await res.value.json()
    const user = responseData.user
    const token = responseData.token

    if (!user || !token) {
      throw new Response('Invalid credentials', { status: 401 })
    }

    // Cria JWT simples com expiração de 8 horas
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
    const payload = Buffer.from(
      JSON.stringify({
        user: { userId: user.id, email: user.email, name: user.name, token },
        exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60,
      }),
    ).toString('base64url')
    const sessionToken = `${header}.${payload}.`

    // Retorna com Set-Cookie header
    return new Response(
      JSON.stringify({ user: { id: user.id, email: user.email, name: user.name } }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'set-cookie': `session-token=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${8 * 60 * 60}`,
        },
      },
    )
  })

export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'set-cookie': `session-token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
    },
  })
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
