// Substituto de `nookies` no subset usado pelo projeto.
// Todos os callers são Client Components, então só lidamos com `document.cookie`.
// Mantemos o primeiro parâmetro `ctx` (ignorado) para drop-in das assinaturas existentes.

export type CookieOptions = {
  maxAge?: number
  expires?: Date
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
}

const formatOption = (key: string, value: string): string => `; ${key}=${value}`

const serialize = (name: string, value: string, opts: CookieOptions = {}): string => {
  let out = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
  if (opts.maxAge !== undefined) out += formatOption('Max-Age', String(opts.maxAge))
  if (opts.expires) out += formatOption('Expires', opts.expires.toUTCString())
  if (opts.path) out += formatOption('Path', opts.path)
  if (opts.domain) out += formatOption('Domain', opts.domain)
  if (opts.secure) out += '; Secure'
  if (opts.sameSite) {
    const v = opts.sameSite[0]!.toUpperCase() + opts.sameSite.slice(1)
    out += formatOption('SameSite', v)
  }
  return out
}

export const parseCookies = (_ctx?: unknown): Record<string, string> => {
  if (typeof document === 'undefined') return {}
  const out: Record<string, string> = {}
  const raw = document.cookie
  if (!raw) return out
  for (const part of raw.split(';')) {
    const eq = part.indexOf('=')
    if (eq < 0) continue
    const name = decodeURIComponent(part.slice(0, eq).trim())
    const value = decodeURIComponent(part.slice(eq + 1).trim())
    out[name] = value
  }
  return out
}

export const setCookie = (
  _ctx: unknown,
  name: string,
  value: string,
  opts: CookieOptions = {},
): void => {
  if (typeof document === 'undefined') return
  document.cookie = serialize(name, value, opts)
}

export const destroyCookie = (
  _ctx: unknown,
  name: string,
  opts: CookieOptions = {},
): void => {
  if (typeof document === 'undefined') return
  document.cookie = serialize(name, '', {
    ...opts,
    maxAge: 0,
    expires: new Date(0),
    path: opts.path ?? '/',
  })
}
