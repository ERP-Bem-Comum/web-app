import { sealData, unsealData } from 'iron-session'
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server'
import { env } from '@/server/env'

const SESSION_COOKIE_NAME = 'erp-session'
const SESSION_TTL = 60 * 60 * 24 * 30 // 30 days in seconds

const isDev = env.NODE_ENV === 'development'

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    path: '/',
    secure: !isDev,
    maxAge: SESSION_TTL,
  }
}

export async function sealSession(sessionId: string): Promise<string> {
  return sealData({ sessionId }, { password: env.SESSION_SECRET, ttl: SESSION_TTL })
}

export async function unsealSession(seal: string): Promise<{ sessionId: string } | null> {
  try {
    return await unsealData<{ sessionId: string }>(seal, {
      password: env.SESSION_SECRET,
      ttl: SESSION_TTL,
    })
  } catch {
    return null
  }
}

export async function createAuthSession(sessionId: string): Promise<void> {
  const seal = await sealSession(sessionId)
  setCookie(SESSION_COOKIE_NAME, seal, getCookieOptions())
}

export async function getAuthSession(): Promise<{ sessionId: string } | null> {
  const seal = getCookie(SESSION_COOKIE_NAME)
  if (!seal) return null
  return unsealSession(seal)
}

export async function destroyAuthSession(): Promise<void> {
  deleteCookie(SESSION_COOKIE_NAME, { path: '/' })
}
