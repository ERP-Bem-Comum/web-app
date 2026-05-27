import { z } from 'zod'

const envSchema = z.object({
  API_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export const env = envSchema.parse({
  API_URL: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4010',
  AUTH_SECRET: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '',
  NODE_ENV: process.env.NODE_ENV,
})
