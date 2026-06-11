/**
 * Public API do módulo Gestão de Programas — ÚNICO ponto de import por fora do módulo (boundary §I).
 * Slice Programas: grid + inclusão + detalhe/edição (core-api `/api/v1/programs`).
 */
export { listProgramsFn } from '#modules/programs/server/adapters/server-fns/list-programs.query.fn.ts'
export type { ListProgramsFnResult } from '#modules/programs/server/adapters/server-fns/list-programs.query.fn.ts'
export { createProgramFn } from '#modules/programs/server/adapters/server-fns/create-program.service.fn.ts'
export type { CreateProgramFnResult } from '#modules/programs/server/adapters/server-fns/create-program.service.fn.ts'
export { getProgramFn } from '#modules/programs/server/adapters/server-fns/get-program.query.fn.ts'
export type { GetProgramFnResult } from '#modules/programs/server/adapters/server-fns/get-program.query.fn.ts'
export { updateProgramFn } from '#modules/programs/server/adapters/server-fns/update-program.service.fn.ts'
export type { UpdateProgramFnResult } from '#modules/programs/server/adapters/server-fns/update-program.service.fn.ts'
