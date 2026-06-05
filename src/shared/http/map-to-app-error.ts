/**
 * map-to-app-error — HttpError (transporte) → AppError (semântico p/ UI).
 * Discrimina por STATUS HTTP (mais estável que o slug do core-api). `switch` exaustivo
 * com guarda `never`. 400 → validation com issues [] (core-api não detalha; o BFF preenche).
 */
import type { AppError } from './app-error.types.ts'
import type { HttpError } from './http-error.types.ts'

export const mapToAppError = (e: HttpError): AppError => {
  switch (e.kind) {
    case 'http': {
      const { status } = e
      if (status === 401) return { kind: 'auth:expired' }
      if (status === 403) return { kind: 'auth:forbidden' }
      if (status === 404) return { kind: 'not-found' }
      if (status === 409) return { kind: 'conflict' }
      if (status === 400) return { kind: 'validation', issues: [] }
      if (status >= 500) return { kind: 'server' }
      return { kind: 'unknown', status }
    }
    case 'network':
    case 'timeout':
      return { kind: 'connectivity' }
    case 'parse':
      return { kind: 'bad-gateway' }
    case 'aborted':
      return { kind: 'unknown' }
    default: {
      const exhaustive: never = e
      return exhaustive
    }
  }
}
