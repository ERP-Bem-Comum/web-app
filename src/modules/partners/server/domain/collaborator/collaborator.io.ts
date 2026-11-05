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
  Pwd,
  PwdAnswer,
  PwdType,
} from './collaborator.types.ts'

/**
 * Resposta de PcD enviada (spec 131). Precisa vir completa — "Sim" com ao menos um tipo e, com "Outra",
 * o texto; tipos e texto só existem com "Sim" (o core-api recusa com 422).
 */
export interface PwdInput {
  answer: PwdAnswer
  types?: PwdType[]
  otherDescription?: string
}

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
  territory: Territory | null // #42; editável no PUT desde a spec 121 (core-api#1053)
  bankAccount: BankAccount | null // #40; editável no PUT desde a spec 120 (core-api#1029)
  pixKey: CollaboratorPixKey | null // #40; editável no PUT desde a spec 120 (core-api#1029)
}

export interface CompleteCollaboratorRegistrationInput {
  id: string
  rg?: string
  dateOfBirth?: string
  genderIdentity?: string
  genderIdentityDescription?: string // core-api#1054; só com genderIdentity = 'OUTRO'
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
  pwd?: PwdInput // spec 131 — ausente mantém o que o PUT já gravou
  isOnLeave?: boolean
  leaveDuration?: string
  leaveRenewable?: boolean
  leaveRenewalDuration?: string
  publicSectorExperienceDuration?: string
}

// Banco/PIX (spec 120, core-api#1029) e território (spec 121, core-api#1053) entram no PUT: `null` MANTÉM
// o que está gravado (não remove); objeto valida e substitui.
// RG, nascimento e raça (spec 124, core-api#1070): preenchidos UMA vez — ausente mantém, vazio grava,
// igual mantém, diferente do gravado é recusado (409).
// PcD (spec 131): preenche enquanto vazio ou incompleto; completo, trava (mesmo 409).
export type UpdateCollaboratorInput = CreateCollaboratorInput & {
  id: string
  rg?: string
  dateOfBirth?: string
  race?: string
  pwd?: PwdInput
}

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
    genderIdentityDescription?: string // core-api#1054; só com genderIdentity = 'OUTRO'
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
    pwd?: Pwd // spec 131; ausente = não respondeu
    isOnLeave?: boolean
    leaveDuration?: string
    leaveRenewable?: boolean
    leaveRenewalDuration?: string
    publicSectorExperienceDuration?: string
    territory: Territory | null
    bankAccount: BankAccount | null // #40; editável no detalhe (spec 120)
    pixKey: CollaboratorPixKey | null // #40; editável no detalhe (spec 120)
  }>

export type CollaboratorListResponse = Readonly<{
  items: readonly CollaboratorListItem[]
  meta: Readonly<{ page: number; limit: number; total: number }>
}>
