/**
 * Use-cases de Programs (application) — orquestram o client do core-api. Thin sobre a borda; sem I/O
 * direto (o client é injetado). Result em tudo (§II). `ProgramClient` é uma porta — impl em adapters.
 */
import type { Result } from '#shared/primitives/result.ts'
import type { ProgramsError } from '#modules/programs/server/domain/errors/programs.errors.ts'
import type {
  ListProgramsInput,
  ProgramListResponse,
  CreateProgramInput,
  CreatedProgram,
  ProgramDetail,
  UpdateProgramInput,
} from '#modules/programs/server/domain/program.io.ts'

// Logo (binário): GET devolve bytes+mime; upload envia bytes crus (Content-Type: image/*) → { logoKey }.
export type ProgramLogo = Readonly<{ bytes: Uint8Array; contentType: string }>
export type ProgramLogoUpload = Readonly<{ bytes: Uint8Array; mimeType: string }>

export type ProgramClient = Readonly<{
  list: (input: ListProgramsInput, token: string) => Promise<Result<ProgramListResponse, ProgramsError>>
  create: (input: CreateProgramInput, token: string) => Promise<Result<CreatedProgram, ProgramsError>>
  getById: (id: string, token: string) => Promise<Result<ProgramDetail, ProgramsError>>
  update: (
    id: string,
    input: UpdateProgramInput,
    token: string,
  ) => Promise<Result<ProgramDetail, ProgramsError>>
  getLogo: (id: string, token: string) => Promise<Result<ProgramLogo, ProgramsError>>
  uploadLogo: (
    id: string,
    input: ProgramLogoUpload,
    token: string,
  ) => Promise<Result<Readonly<{ logoKey: string }>, ProgramsError>>
}>

type Deps = Readonly<{ client: ProgramClient }>

export const createListPrograms =
  (deps: Deps) =>
  (input: ListProgramsInput, token: string): Promise<Result<ProgramListResponse, ProgramsError>> =>
    deps.client.list(input, token)

export const createCreateProgram =
  (deps: Deps) =>
  (input: CreateProgramInput, token: string): Promise<Result<CreatedProgram, ProgramsError>> =>
    deps.client.create(input, token)

export const createGetProgram =
  (deps: Deps) =>
  (id: string, token: string): Promise<Result<ProgramDetail, ProgramsError>> =>
    deps.client.getById(id, token)

export const createUpdateProgram =
  (deps: Deps) =>
  (id: string, input: UpdateProgramInput, token: string): Promise<Result<ProgramDetail, ProgramsError>> =>
    deps.client.update(id, input, token)
