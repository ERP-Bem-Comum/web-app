import { createStorage, type Storage } from 'unstorage'
import memoryDriver from 'unstorage/drivers/memory'
import redisDriver from 'unstorage/drivers/redis'
import { env } from '@/server/env'

export type SessionData = {
  accessToken: string
  refreshToken: string
  userId: string
  email: string
  expiresAt: number
}

function createSessionStorage(): Storage<SessionData> {
  if (env.REDIS_URL) {
    return createStorage<SessionData>({
      driver: redisDriver({ url: env.REDIS_URL }),
    })
  }
  return createStorage<SessionData>({
    driver: memoryDriver(),
  })
}

const storage = createSessionStorage()

export async function createSession(
  sessionId: string,
  data: SessionData,
): Promise<void> {
  await storage.setItem(sessionId, data, {
    // 30 days in seconds for TTL when supported
    ttl: 30 * 24 * 60 * 60,
  } as any)
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  return (await storage.getItem(sessionId)) ?? null
}

export async function deleteSession(sessionId: string): Promise<void> {
  await storage.removeItem(sessionId)
}

export async function updateSession(
  sessionId: string,
  data: Partial<SessionData>,
): Promise<void> {
  const existing = await getSession(sessionId)
  if (!existing) return
  await storage.setItem(sessionId, { ...existing, ...data })
}
