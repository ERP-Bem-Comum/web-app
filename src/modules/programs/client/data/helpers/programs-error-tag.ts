/**
 * programsErrorTag — mapeia `ProgramsError` → tag i18n (§V). `switch` exaustivo com guarda `never` (§IV).
 */
import type { ProgramsError } from '#modules/programs/client/data/repository/programs-error.ts'

export const programsErrorTag = (e: ProgramsError): string => {
  switch (e) {
    case 'not-found':
      return 'programs.error.not-found'
    case 'validation':
      return 'programs.error.validation'
    case 'sigla-duplicated':
      return 'programs.error.sigla-duplicated'
    case 'version-conflict':
      return 'programs.error.version-conflict'
    case 'unauthorized':
      return 'programs.error.unauthorized'
    case 'forbidden':
      return 'programs.error.forbidden'
    case 'conflict':
      return 'programs.error.conflict'
    case 'connectivity':
      return 'programs.error.connectivity'
    case 'server':
      return 'programs.error.server'
    default: {
      const _exhaustive: never = e
      return _exhaustive
    }
  }
}
