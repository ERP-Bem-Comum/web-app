/**
 * Model do client (client-data) — tipos de I/O do repository de Programs + schema do formulário.
 * Tipos locais (não importa server/domain nem public-api — boundary §I).
 */
import * as z from 'zod'

export type ProgramStatus = 'ATIVO' | 'INATIVO'

export type ProgramListItem = Readonly<{
  id: string
  programNumber: number
  name: string
  sigla: string
  generalCharacteristics: string
  logoKey: string | null
  status: ProgramStatus
}>

export type ProgramListResponse = Readonly<{
  items: readonly ProgramListItem[]
  meta: Readonly<{ page: number; limit: number; total: number }>
}>

export type ProgramDetail = Readonly<{
  id: string
  programNumber: number
  name: string
  sigla: string
  director: string
  generalCharacteristics: string
  logoKey: string | null
  status: ProgramStatus
  version: number
}>

export type ListProgramsInput = Readonly<{
  search?: string
  status?: ProgramStatus
  order: 'ASC' | 'DESC'
  page: number
  limit: 5 | 10 | 25
}>

export type CreateProgramInput = Readonly<{
  name: string
  sigla: string
  director: string | null
  generalCharacteristics: string | null
}>

export type UpdateProgramInput = CreateProgramInput & Readonly<{ version: number }>

export type CreatedProgram = Readonly<{ id: string }>

// ── Formulário (criar/editar) — Logo é gated (sem endpoint de exibição; ver ticket) ──
export const ProgramFormSchema = z.object({
  name: z.string().trim().min(1).max(200),
  sigla: z.string().trim().min(1).max(40),
  director: z.string().trim().max(200),
  generalCharacteristics: z.string().trim().max(2000),
})
export type ProgramFormValues = z.infer<typeof ProgramFormSchema>

/** Form → input do create (string vazia → null, como o backend espera). */
export const formToCreateInput = (v: ProgramFormValues): CreateProgramInput => ({
  name: v.name,
  sigla: v.sigla,
  director: v.director !== '' ? v.director : null,
  generalCharacteristics: v.generalCharacteristics !== '' ? v.generalCharacteristics : null,
})
