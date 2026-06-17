/**
 * Model do client (client-data) — tipos de I/O do repository de Colaboradores, espelhando
 * `collaborator.io.ts` (server) por ESTRUTURA, sem importá-lo (boundary §I). Colaborador é PF com
 * cadastro em 2 etapas (pré-cadastro dos 7 campos → complete dos dados pessoais), status duplo
 * (registration somente-leitura × activation alternável), desativação com Motivo e import CSV.
 * Aqui também vive o schema Zod do FORMULÁRIO (pré-cadastro). Espelha `act.model.ts`.
 */
import * as z from 'zod'

export type RegistrationStatus = 'pre-registration' | 'complete'
export type ActivationStatus = 'active' | 'inactive'

export const OCCUPATION_AREAS = ['PARC', 'DDI', 'DCE', 'EPV'] as const
export type OccupationArea = (typeof OCCUPATION_AREAS)[number]

export const EMPLOYMENT_RELATIONSHIPS = ['CLT', 'PJ'] as const
export type EmploymentRelationship = (typeof EMPLOYMENT_RELATIONSHIPS)[number]

// Território (#42) — UF (sigla IBGE) + município (texto livre). Ambos opcionais.
export type Territory = Readonly<{ uf: string | null; municipality: string | null }>

/** As 27 UFs (sigla + nome) — fonte estática local p/ o select; o backend valida o catálogo IBGE. */
export const BR_UF: readonly Readonly<{ sigla: string; nome: string }>[] = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
] as const

// Enums canônicos do cadastro completo (códigos legados do core-api — o backend rejeita texto livre).
export const GENDER_IDENTITIES = [
  'PREFIRO_NAO_RESPONDER',
  'HOMEM_CIS',
  'HOMEM_TRANS',
  'MULHER_CIS',
  'MULHER_TRANS',
  'TRAVESTI',
  'NAO_BINARIO',
  'OUTRO',
] as const
export const RACES = ['AMARELO', 'BRANCO', 'PARDO', 'INDIGENA', 'PRETO', 'PREFIRO_NAO_RESPONDER'] as const
export const EDUCATION_LEVELS = [
  'EDUCACAO_INFANTIL',
  'ENSINO_FUNDAMENTAL',
  'ENSINO_MEDIO',
  'ENSINO_SUPERIOR',
  'POS_GRADUACAO',
  'MESTRADO',
  'DOUTORADO',
] as const
export const FOOD_CATEGORIES = [
  'ONIVORO',
  'VEGANO',
  'VEGETARIANO',
  'PESCETARIANO',
  'OUTRO',
  'PREFIRO_NAO_RESPONDER',
] as const

/** Valores REAIS do enum `disableBy` do core-api (a UI mapeia p/ label via i18n). */
export const DEACTIVATION_REASONS = [
  'DESLIGAMENTO_ABC',
  'FALECIMENTO',
  'TEMPO_CONTRATO_FINALIZADO',
  'SOLICITACAO_RESCISAO_CONTRATUAL',
] as const
export type DeactivationReason = (typeof DEACTIVATION_REASONS)[number]

export type CollaboratorListItem = Readonly<{
  id: string
  name: string
  email: string
  occupationArea: string // tolerante a valores legados fora do enum (a UI mapeia p/ label quando casa)
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
    territory: Territory | null // #42
  }>

export type CollaboratorListResponse = Readonly<{
  items: readonly CollaboratorListItem[]
  meta: Readonly<{ page: number; limit: number; total: number }>
}>

export type CollaboratorImportResult = Readonly<{
  created: number
  failed: readonly Readonly<{ line: number; error: string }>[]
}>

// ── Inputs enviados pelo repository (a server fn valida no server) ──
export type CollaboratorListInput = Readonly<{
  search?: string
  active?: boolean
  status?: RegistrationStatus
  occupationAreas?: OccupationArea[]
  employmentRelationships?: EmploymentRelationship[]
  roles?: string[]
  yearOfContract?: number
  page: number
  limit: 5 | 10 | 25
}>

/** Pré-cadastro: os 7 campos essenciais + território (#42, opcional). */
export type CollaboratorWriteInput = Readonly<{
  name: string
  email: string
  cpf: string
  occupationArea: OccupationArea
  role: string
  startOfContract: string
  employmentRelationship: EmploymentRelationship
  territory: Territory | null
}>

/** Cadastro completo (dados pessoais; todos opcionais). `id` identifica o colaborador. */
export type CollaboratorCompleteInput = Readonly<{
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
}>

export type CollaboratorDeactivateInput = Readonly<{ id: string; reason: DeactivationReason }>
export type CollaboratorImportInput = Readonly<{ filename: string; csv: string }>

// ── Schema do formulário (validação na borda do cliente) — espelha ActFormSchema ──
const onlyDigits = (raw: string): string => raw.replace(/\D/g, '')

/** CPF: aceita com/sem máscara; normaliza para 11 dígitos (o server fn aceita 11–14). */
export const CpfFieldSchema = z
  .string()
  .trim()
  .transform(onlyDigits)
  .refine((d) => d.length === 11, { error: 'cpf-invalid' })

/** Território (#42) — UF + município, ambos opcionais (texto livre). */
export const TerritoryFormSchema = z.object({
  uf: z.string().trim().max(2).nullable(),
  municipality: z.string().trim().max(120).nullable(),
})

/** Formulário dos 7 campos do pré-cadastro + território (#42). */
export const CollaboratorFormSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.email(),
  cpf: CpfFieldSchema,
  occupationArea: z.enum(OCCUPATION_AREAS),
  role: z.string().trim().min(1).max(120),
  startOfContract: z.iso.date(), // YYYY-MM-DD
  employmentRelationship: z.enum(EMPLOYMENT_RELATIONSHIPS),
  territory: TerritoryFormSchema.nullable().default(null),
})
export type CollaboratorFormValues = z.infer<typeof CollaboratorFormSchema>
