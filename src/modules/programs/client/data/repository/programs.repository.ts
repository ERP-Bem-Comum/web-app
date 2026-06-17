/**
 * ProgramsRepository — porta do client para o BFF. Converte `{ ok, data|error }` → `Result` (§II). Tipos
 * do próprio `data/model`; `ProgramsError`/`FnResult` neutros (boundary §I). Fns injetadas (testável).
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type {
  ListProgramsInput,
  ProgramListResponse,
  CreateProgramInput,
  CreatedProgram,
  ProgramDetail,
  UpdateProgramInput,
} from '#modules/programs/client/data/model/program.model.ts'
import type { ProgramsError, FnResult } from '#modules/programs/client/data/repository/programs-error.ts'

type ListFn = (opts: { data: ListProgramsInput }) => Promise<FnResult<ProgramListResponse>>
type CreateFn = (opts: { data: CreateProgramInput }) => Promise<FnResult<CreatedProgram>>
type GetFn = (opts: { data: { id: string } }) => Promise<FnResult<ProgramDetail>>
type UpdateFn = (opts: { data: UpdateProgramInput & { id: string } }) => Promise<FnResult<ProgramDetail>>
// Logo (binário): GET → bytes em base64 (ou null = sem logo); upload → { logoKey }.
export type ProgramLogoData = Readonly<{ base64: string; contentType: string }>
type GetLogoFn = (opts: { data: { id: string } }) => Promise<FnResult<ProgramLogoData | null>>
type UploadLogoFn = (opts: {
  data: { id: string; fileBase64: string; mimeType: string }
}) => Promise<FnResult<{ logoKey: string }>>

export type ProgramsRepository = Readonly<{
  list: (input: ListProgramsInput) => Promise<Result<ProgramListResponse, ProgramsError>>
  create: (input: CreateProgramInput) => Promise<Result<CreatedProgram, ProgramsError>>
  getById: (id: string) => Promise<Result<ProgramDetail, ProgramsError>>
  update: (input: UpdateProgramInput & { id: string }) => Promise<Result<ProgramDetail, ProgramsError>>
  getLogo: (id: string) => Promise<Result<ProgramLogoData | null, ProgramsError>>
  uploadLogo: (
    input: Readonly<{ id: string; fileBase64: string; mimeType: string }>,
  ) => Promise<Result<{ logoKey: string }, ProgramsError>>
}>

export const createProgramsRepository = (
  deps: Readonly<{
    listProgramsFn: ListFn
    createProgramFn: CreateFn
    getProgramFn: GetFn
    updateProgramFn: UpdateFn
    getProgramLogoFn: GetLogoFn
    uploadProgramLogoFn: UploadLogoFn
  }>,
): ProgramsRepository => ({
  list: async (input) => {
    const res = await deps.listProgramsFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  create: async (input) => {
    const res = await deps.createProgramFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getById: async (id) => {
    const res = await deps.getProgramFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  update: async (input) => {
    const res = await deps.updateProgramFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getLogo: async (id) => {
    const res = await deps.getProgramLogoFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  uploadLogo: async (input) => {
    const res = await deps.uploadProgramLogoFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
})
