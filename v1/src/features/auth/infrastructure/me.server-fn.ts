import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { serverFetch } from '@/server/http/result-fetch'
import { authMiddleware } from '@/server/middleware/auth'

const meResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
})

export const getMe = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const result = await serverFetch<unknown>('/auth/me', {
      headers: {
        authorization: `Bearer ${context.accessToken}`,
      },
    })

    if (result.isErr()) {
      if (result.error.kind === 'http' && result.error.status === 401) {
        throw new Response('Unauthorized', { status: 401 })
      }
      throw new Response('Failed to fetch user', { status: 500 })
    }

    const parsed = meResponseSchema.safeParse(result.value)
    if (!parsed.success) {
      throw new Response('Invalid user response', { status: 500 })
    }

    return {
      user: {
        id: parsed.data.id,
        email: parsed.data.email,
        name: parsed.data.name ?? parsed.data.email.split('@')[0],
      },
    }
  })
