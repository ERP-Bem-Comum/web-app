/**
 * authErrorTag — mapeia o AuthError (propagado pelo BFF) para uma TAG de i18n (§XI). A UI nunca mostra
 * o slug cru; o catálogo (`shared/i18n`) resolve a tag → texto (P.O. refina). Default genérico p/ erros
 * que não fazem sentido no login (ex.: refresh-*).
 */
import type { AuthError } from '#modules/auth/client/data/repository/auth.repository.ts'

export const authErrorTag = (e: AuthError): string => {
  switch (e) {
    case 'invalid-credentials':
      return 'auth.error.invalid-credentials'
    case 'user-disabled':
      return 'auth.error.user-disabled'
    case 'connectivity':
      return 'auth.error.connectivity'
    // Erros que não fazem sentido no login (sessão/refresh/server) → mensagem genérica.
    // Switch exaustivo (sem default): AuthError ganhar variante quebra a compilação aqui.
    case 'refresh-not-found':
    case 'refresh-revoked':
    case 'refresh-rotated':
    case 'refresh-expired':
    case 'unauthorized':
    case 'session-not-found':
    case 'server':
      return 'auth.error.unexpected'
  }
}
