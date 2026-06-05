/**
 * Cookie de sessão — builder PURO (testável) + serializador. O cookie carrega só o `sessionId` opaco
 * (§I/ADR-0002). `__Host-` exige Secure + Path=/ + sem Domain. SameSite=Strict (anti-CSRF). Max-Age só
 * se persistent ("lembrar este dispositivo"); senão é cookie de sessão (encerra ao fechar o navegador).
 * O *set/clear* real no response é feito pela server function (framework); aqui é a parte pura.
 */
export const SESSION_COOKIE_NAME = '__Host-session'

export type CookieAttrs = Readonly<{
  name: string
  value: string
  httpOnly: boolean
  secure: boolean
  sameSite: 'Strict'
  path: string
  maxAge?: number
}>

export const buildSessionCookie = (
  sessionId: string,
  opts: Readonly<{ persistent: boolean; maxAgeSeconds: number }>,
): CookieAttrs => ({
  name: SESSION_COOKIE_NAME,
  value: sessionId,
  httpOnly: true,
  secure: true,
  sameSite: 'Strict',
  path: '/',
  ...(opts.persistent ? { maxAge: opts.maxAgeSeconds } : {}),
})

export const serializeCookie = (c: CookieAttrs): string => {
  const parts = [`${c.name}=${c.value}`, `Path=${c.path}`, `SameSite=${c.sameSite}`]
  if (c.httpOnly) parts.push('HttpOnly')
  if (c.secure) parts.push('Secure')
  if (c.maxAge !== undefined) parts.push(`Max-Age=${String(c.maxAge)}`)
  return parts.join('; ')
}

/** Header Set-Cookie que EXPIRA o cookie de sessão (logout / sessão morta). */
export const clearSessionCookieHeader = (): string =>
  `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
