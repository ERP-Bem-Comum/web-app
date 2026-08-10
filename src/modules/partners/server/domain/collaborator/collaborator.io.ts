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
  BankAccount,
  CollaboratorPixKey,
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
  bankAccount: BankAccount | null // #40 — create-only (PUT omite)
  pixKey: CollaboratorPixKey | null // #40 — create-only (PUT omite)
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
  // Perfil completo (US2) — valores das enums (sex/maritalStatus) validados no core-api.
  sex?: string
  maritalStatus?: string
  hasChildren?: boolean
  childrenCount?: number
  childrenAges?: number[]
  isPwd?: boolean
  pwdDescription?: string
  isOnLeave?: boolean
  leaveDuration?: string
  leaveRenewable?: boolean
  leaveRenewalDuration?: string
  publicSectorExperienceDuration?: string
}

// PUT omite território (#42) e banco/PIX (#40) — não enviar na edição.
export type UpdateCollaboratorInput = Omit<
  CreateCollaboratorInput,
  'territory' | 'bankAccount' | 'pixKey'
> & { id: string }

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
    // Dados do cadastro completo (2ª etapa) — opcionais: ausentes enquanto só pré-cadastrado.
    rg?: string
    dateOfBirth?: string
    completeAddress?: string
    telephone?: string
    emergencyContactName?: string
    emergencyContactTelephone?: string
    genderIdentity?: string
    race?: string
    allergies?: string
    foodCategory?: string
    foodCategoryDescription?: string
    education?: string
    biography?: string
    experienceInThePublicSector?: boolean
    // Perfil completo (US2).
    sex?: string
    maritalStatus?: string
    hasChildren?: boolean
    childrenCount?: number
    childrenAges?: number[]
    isPwd?: boolean
    pwdDescription?: string
    isOnLeave?: boolean
    leaveDuration?: string
    leaveRenewable?: boolean
    leaveRenewalDuration?: string
    publicSectorExperienceDuration?: string
    territory: Territory | null
    bankAccount: BankAccount | null // #40 — create-only; exibido read-only no detalhe
    pixKey: CollaboratorPixKey | null // #40 — create-only; exibido read-only no detalhe
  }>

export type CollaboratorListResponse = Readonly<{
  items: readonly CollaboratorListItem[]
  meta: Readonly<{ page: number; limit: number; total: number }>
}>
