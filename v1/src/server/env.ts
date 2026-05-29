import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

const rawEnv = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CORE_API_URL: z.string().min(1).default('http://localhost:3000/api/v2'),
    SESSION_SECRET: z.string().min(32),
    REDIS_URL: z.string().optional(),
  },
  clientPrefix: 'NEXT_PUBLIC_',
  client: {
    NEXT_PUBLIC_API_URL: z.string().min(1).optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    CORE_API_URL: process.env.CORE_API_URL || process.env.API_URL || 'http://localhost:3000/api/v2',
    SESSION_SECRET: process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || '',
    REDIS_URL: process.env.REDIS_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  emptyStringAsUndefined: true,
})

export const env = {
  ...rawEnv,
  API_URL: rawEnv.CORE_API_URL,
}
