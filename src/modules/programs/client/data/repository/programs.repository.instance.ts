/**
 * Instância da ProgramsRepository — wire das server functions reais (import direto de server/adapters —
 * boundary §I/§III).
 */
import { listProgramsFn } from '#modules/programs/server/adapters/server-fns/list-programs.query.fn.ts'
import { createProgramFn } from '#modules/programs/server/adapters/server-fns/create-program.service.fn.ts'
import { getProgramFn } from '#modules/programs/server/adapters/server-fns/get-program.query.fn.ts'
import { updateProgramFn } from '#modules/programs/server/adapters/server-fns/update-program.service.fn.ts'

import { createProgramsRepository } from './programs.repository.ts'

export const programsRepository = createProgramsRepository({
  listProgramsFn: (opts) => listProgramsFn(opts),
  createProgramFn: (opts) => createProgramFn(opts),
  getProgramFn: (opts) => getProgramFn(opts),
  updateProgramFn: (opts) => updateProgramFn(opts),
})
