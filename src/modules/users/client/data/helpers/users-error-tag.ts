/**
 * usersErrorTag — mapeia `UsersError` → tag i18n (§V: a UI nunca olha status; trata só a tag).
 * `switch` exaustivo com guarda `never` (§IV).
 */
import type { UsersError } from '#modules/users/client/data/repository/users-error.ts'

export const usersErrorTag = (e: UsersError): string => {
  switch (e) {
    case 'not-found':
      return 'users.error.not-found'
    case 'validation':
      return 'users.error.validation'
    case 'email-taken':
      return 'users.error.email-taken'
    case 'invalid-current-password':
      return 'users.error.invalid-current-password'
    case 'password-weak':
      return 'users.error.password-weak'
    case 'password-too-short':
      return 'users.error.password-too-short'
    case 'unauthorized':
      return 'users.error.unauthorized'
    case 'forbidden':
      return 'users.error.forbidden'
    case 'conflict':
      return 'users.error.conflict'
    case 'connectivity':
      return 'users.error.connectivity'
    case 'server':
      return 'users.error.server'
    default: {
      const _exhaustive: never = e
      return _exhaustive
    }
  }
}
