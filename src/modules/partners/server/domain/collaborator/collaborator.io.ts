/**
 * Colaborador — tipos de I/O do domínio (PUROS, sem Zod — C2 do review). Os schemas Zod correspondentes
 * vivem em `../../adapters/collaborator.io-schemas.ts` (a borda). Nomes de campos do complete-registration
 * e valores de `disableBy` alinhados ao contrato REAL do core-api.
 */
import type {
  RegistrationStatus,
  ActivationStatus,
  EmploymentRelationship,
  OccupationArea,
  DeactivationReason,
  Territory,
} from './collaborator.types.ts'

// ── Input (validado na server fn pelos schemas em adapters) ─────────────────────
export interface ListCollaboratorsInput {
  search?: string
  active?: boolean
  status?: RegistrationStatus
  occupationAreas?: OccupationArea[]
  employmentRelationships?: EmploymentRelationship[]
  roles?: string[]
  yearOfContract?: number
  page: number
  limit: 5 | 10 | 25
}

export interface GetCollaboratorInput {
  id: string
}

export interface CreateCollaboratorInput {
  name: string
  email: string
  cpf: string
  occupationArea: OccupationArea
  role: string
  startOfContract: string // YYYY-MM-DD
  employmentRelationship: EmploymentRelationship
  territory: Territory | null // #42 — entra no create (PUT omite)
}

export interface CompleteCollaboratorRegistrationInput {
  id: string
  rg?: string
  dateOfBirth?: string
  genderIdentity?: string
  race?: string
  education?: string
  foodCategory?: string
  foodCategoryDescription?: string
  completeAddress?: string
  telephone?: string
  emergencyContactName?: string
  emergencyContactTelephone?: string
  allergies?: string
  biography?: string
  experienceInThePublicSector?: boolean
}

// PUT omite território (#42) — não enviar na edição.
export type UpdateCollaboratorInput = Omit<CreateCollaboratorInput, 'territory'> & { id: string }

export interface DeactivateCollaboratorInput {
  id: string
  reason: DeactivationReason
}

export interface ReactivateCollaboratorInput {
  id: string
}

export interface ImportCollaboratorsInput {
  filename: string
  csv: string
}

// Resultado parcial (sucesso COM relatório, não erro): linhas válidas criadas + inválidas reportadas.
export type CollaboratorImportResult = Readonly<{
  created: number
  failed: readonly Readonly<{ line: number; error: string }>[]
}>

// ── Model (o que a UI consome) ─────────────────────────────────────────────────
export type CollaboratorListItem = Readonly<{
  id: string
  name: string
  email: string
  occupationArea: string // tolerante: o core-api emite string (valores legados possíveis); a UI mapeia p/ label
  role: string
  registration: RegistrationStatus
  activation: ActivationStatus
  contractCount: number
}>

export type CollaboratorDetail = CollaboratorListItem &
  Readonly<{
    cpf: string
    startOfContract: string
    employmentRelationship: EmploymentRelationship
    territory: Territory | null
  }>

export type CollaboratorListResponse = Readonly<{
  items: readonly CollaboratorListItem[]
  meta: Readonly<{ page: number; limit: number; total: number }>
}>
