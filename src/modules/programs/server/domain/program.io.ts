/**
 * Programs — tipos de I/O do domínio (PUROS, sem Zod — C2). Os schemas Zod vivem na borda
 * (`../adapters/programs.io-schemas.ts`). Alinhado ao contrato REAL do core-api (`/api/v1/programs`).
 */

export type ProgramStatus = 'ATIVO' | 'INATIVO'

// ── Input (validado na server fn pelos schemas em adapters) ─────────────────────
export interface ListProgramsInput {
  search?: string
  status?: ProgramStatus
  order: 'ASC' | 'DESC'
  page: number
  limit: 5 | 10 | 25
}

// Criação (POST /programs). director/generalCharacteristics opcionais (null quando vazio).
export interface CreateProgramInput {
  name: string
  sigla: string
  director: string | null
  generalCharacteristics: string | null
}

// Edição (PUT /programs/:id) — campos + version (optimistic-lock).
export interface UpdateProgramInput {
  name: string
  sigla: string
  director: string | null
  generalCharacteristics: string | null
  version: number
}

export type CreatedProgram = Readonly<{ id: string }>

// ── Model (o que a UI consome) ─────────────────────────────────────────────────
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

// Detalhe — director/generalCharacteristics normalizados ('' quando null); version p/ o optimistic-lock.
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
