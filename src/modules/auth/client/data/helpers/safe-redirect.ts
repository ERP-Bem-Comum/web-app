/**
 * safeRedirect — saneia o destino pós-login (FR-005). Aceita SÓ caminho interno relativo (mesma origem):
 * começa com '/' e não '//' (protocol-relative). Qualquer URL externa/absoluta → fallback. Anti open-redirect.
 */
export const safeRedirect = (raw: string | undefined, fallback = '/'): string => {
  if (raw === undefined || raw === '') return fallback
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback
  return raw
}
