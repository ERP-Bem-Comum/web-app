/**
 * ProgramsError — erro do módulo de Gestão de Programas propagado pelo BFF (string union). A UI nunca
 * olha status HTTP — trata só a tag i18n derivada via `programsErrorTag` (§V). Espelha o `UsersError`.
 */
export type ProgramsError =
  | 'not-found'
  | 'validation'
  | 'sigla-duplicated' // 409 program-sigla-duplicated
  | 'version-conflict' // 409 program-version-conflict (editado por outra pessoa)
  | 'unauthorized'
  | 'forbidden'
  | 'conflict'
  | 'connectivity'
  | 'server'
