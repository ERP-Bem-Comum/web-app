/**
 * CSRF de origem (FR-014) — complementa o cookie `SameSite=Strict`. Valida que uma requisição de
 * MUTAÇÃO veio da mesma origem: prefere `Sec-Fetch-Site` (sinal forte dos navegadores modernos) e,
 * na ausência, compara `Origin` com `Host`. Sem sinais → rejeita (conservador). Server-side.
 */
export type OriginHeaders = Readonly<{
  secFetchSite?: string | null
  origin?: string | null
  host?: string | null
}>

export const isSameOriginRequest = (h: OriginHeaders): boolean => {
  if (typeof h.secFetchSite === 'string') {
    return h.secFetchSite === 'same-origin' || h.secFetchSite === 'none'
  }
  if (typeof h.origin === 'string' && typeof h.host === 'string') {
    try {
      return new URL(h.origin).host === h.host
    } catch {
      return false
    }
  }
  return false
}
