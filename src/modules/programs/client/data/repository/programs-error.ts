/**
 * ProgramsError — erro do módulo programs propagado pelo BFF (espelha o `ProgramsError` do server).
 * Arquivo NEUTRO da camada `client/data`. A UI nunca olha status HTTP — trata só a tag via
 * `programsErrorTag` (§V).
 */
export type ProgramsError =
  | 'not-found'
  | 'validation'
  | 'sigla-duplicated'
  | 'version-conflict'
  | 'unauthorized'
  | 'forbidden'
  | 'conflict'
  | 'connectivity'
  | 'server'

export type FnResult<T> =
  | Readonly<{ ok: true; data: T }>
  | Readonly<{ ok: false; error: ProgramsError }>
