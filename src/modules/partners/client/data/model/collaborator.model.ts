/**
 * Model do client (client-data) — tipos de I/O do repository de Colaboradores, espelhando
 * `collaborator.io.ts` (server) por ESTRUTURA, sem importá-lo (boundary §I). Colaborador é PF com
 * cadastro em 2 etapas (pré-cadastro dos 7 campos → complete dos dados pessoais), status duplo
 * (registration somente-leitura × activation alternável), desativação com Motivo e import CSV.
 * Aqui também vive o schema Zod do FORMULÁRIO (pré-cadastro). Espelha `act.model.ts`.
 */
import * as z from 'zod'

import {
  type BankAccount,
  type SupplierPixKey as PixKey,
  type PixKeyType,
  PIX_KEY_TYPES,
  isPixKeyType,
  BankAccountFormSchema,
  PixKeyFormSchema,
} from './supplier.model.ts'

export type RegistrationStatus = 'pre-registration' | 'complete'
export type ActivationStatus = 'active' | 'inactive'
// Reuso (DRY) dos tipos/validações de payment-target do Fornecedor (#40).
export type { BankAccount, PixKey, PixKeyType }
export { PIX_KEY_TYPES, isPixKeyType, BankAccountFormSchema, PixKeyFormSchema }

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
  'QUEER',
  'OUTRO',
] as const
export type GenderIdentity = (typeof GENDER_IDENTITIES)[number]
/**
 * Opções do SELETOR de Identidade de Gênero (specs 122 e 130), na ordem e na redação definidas pelo cliente.
 * TRAVESTI fica fora do seletor: não há dado gravado com esse valor, e o rótulo do cliente é
 * "Mulher transgênero / Travesti", de `MULHER_TRANS` (P.O., 23/10). Segue em `GENDER_IDENTITIES` só por
 * espelhar o enum do core-api.
 */
export const GENDER_IDENTITY_OPTIONS = [
  'MULHER_CIS',
  'HOMEM_CIS',
  'MULHER_TRANS',
  'HOMEM_TRANS',
  'NAO_BINARIO',
  'QUEER',
  'OUTRO',
  'PREFIRO_NAO_RESPONDER',
] as const satisfies readonly GenderIdentity[]
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
export type EducationLevel = (typeof EDUCATION_LEVELS)[number]
/**
 * Opções do SELETOR de Escolaridade (spec 126). EDUCACAO_INFANTIL fica fora (decisão da P.O., 19/10/2026) mas
 * segue em `EDUCATION_LEVELS`, que espelha o enum do core-api e é a lista canônica do gráfico de Escolaridade
 * do Equipe — tirar de lá descartaria do gráfico quem já tem o valor gravado.
 */
export const EDUCATION_LEVEL_OPTIONS = [
  'ENSINO_FUNDAMENTAL',
  'ENSINO_MEDIO',
  'ENSINO_SUPERIOR',
  'POS_GRADUACAO',
  'MESTRADO',
  'DOUTORADO',
] as const satisfies readonly EducationLevel[]

/**
 * Opções de um seletor que esconde valores do enum: se o valor ATUAL é um dos escondidos (gravado antes da
 * opção sair), ele entra no fim da lista — senão o <select> mostraria "Selecione..." e o dado pareceria
 * faltando. Valor fora do enum inteiro não entra (não é dado válido).
 */
export const selectableWithCurrent = <V extends string>(
  options: readonly V[],
  all: readonly V[],
  current: string,
): readonly V[] => {
  const hidden = all.find((v) => v === current && !options.includes(v))
  return hidden === undefined ? options : [...options, hidden]
}
export const FOOD_CATEGORIES = [
  'ONIVORO',
  'VEGANO',
  'VEGETARIANO',
  'PESCETARIANO',
  'OUTRO',
  'PREFIRO_NAO_RESPONDER',
] as const

// Perfil completo (US2). Sexo biológico (≠ identidade de gênero) e estado civil — valores batem 1:1
// com o domínio do core-api (sex.ts: 'F'|'M'; civil-status.ts: snake_case EN).
/**
 * Pessoa com Deficiência (spec 131), no texto do cliente. Pergunta 1 = resposta; pergunta 2 (só com "Sim",
 * várias) = tipos, na ordem do formulário. "Outra" abre o texto livre, no molde de Identidade de Gênero.
 */
export const PWD_ANSWERS = ['SIM', 'NAO', 'PREFIRO_NAO_RESPONDER'] as const
export type PwdAnswer = (typeof PWD_ANSWERS)[number]
export const PWD_TYPES = [
  'FISICA',
  'VISUAL',
  'AUDITIVA',
  'INTELECTUAL_MENTAL',
  'TEA',
  'MULTIPLA',
  'OUTRA',
] as const
export type PwdType = (typeof PWD_TYPES)[number]
export const isPwdAnswer = (v: string): v is PwdAnswer => (PWD_ANSWERS as readonly string[]).includes(v)
/** Resposta gravada. "Sim" sem tipo = dado anterior à spec 131, incompleto (fica aberto para preencher). */
export type Pwd = Readonly<{ answer: PwdAnswer; types: readonly PwdType[]; otherDescription: string | null }>
/** Resposta enviada — precisa chegar completa (o core-api recusa com 422). */
export type PwdInput = Readonly<{ answer: PwdAnswer; types?: PwdType[]; otherDescription?: string }>

export const SEXES = ['F', 'M'] as const
export type Sex = (typeof SEXES)[number]
export const MARITAL_STATUSES = ['single', 'married', 'divorced', 'widowed', 'stable_union'] as const
export type MaritalStatus = (typeof MARITAL_STATUSES)[number]

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
    genderIdentityDescription?: string
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
    territory: Territory | null // #42
    bankAccount: BankAccount | null // #40; editável no detalhe (spec 120)
    pixKey: PixKey | null // #40; editável no detalhe (spec 120)
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

/** Pré-cadastro: os 7 campos essenciais + território (#42) + banco/PIX (#40), todos opcionais. */
export type CollaboratorWriteInput = Readonly<{
  name: string
  email: string
  cpf: string
  occupationArea: OccupationArea
  role: string
  startOfContract: string
  employmentRelationship: EmploymentRelationship
  territory: Territory | null
  // #40. No PUT (spec 120): `null` MANTÉM o que está gravado (não remove); objeto substitui.
  bankAccount: BankAccount | null
  pixKey: PixKey | null
}>

/**
 * Edição (PUT): o pré-cadastro + RG, nascimento e raça (spec 124, core-api#1070). Preenchidos UMA vez:
 * ausente mantém o gravado, valor com o campo vazio grava, igual ao gravado mantém, diferente é recusado.
 */
export type CollaboratorUpdateInput = CollaboratorWriteInput &
  Readonly<{
    rg?: string
    dateOfBirth?: string
    race?: string
    // Spec 131: preenche enquanto vazio ou incompleto; completo trava (409).
    pwd?: PwdInput
  }>

/** Cadastro completo (dados pessoais; todos opcionais). `id` identifica o colaborador. */
export type CollaboratorCompleteInput = Readonly<{
  id: string
  rg?: string
  dateOfBirth?: string
  genderIdentity?: string
  genderIdentityDescription?: string
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
  // Perfil completo (US2).
  sex?: string
  maritalStatus?: string
  hasChildren?: boolean
  childrenCount?: number
  childrenAges?: number[]
  pwd?: PwdInput // spec 131
  isOnLeave?: boolean
  leaveDuration?: string
  leaveRenewable?: boolean
  leaveRenewalDuration?: string
  publicSectorExperienceDuration?: string
}>

export type CollaboratorDeactivateInput = Readonly<{ id: string; reason: DeactivationReason }>
export type CollaboratorImportInput = Readonly<{ filename: string; csv: string }>
/** Arquivo CSV de export (histórico) repassado pelo BFF — `{ filename, csv }` (espelha `PartnerExportFile`). */
export type CollaboratorExportFile = Readonly<{ filename: string; csv: string }>

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

/** Formulário dos 7 campos do pré-cadastro + território (#42) + banco/PIX (#40, reuso das schemas
 *  do Fornecedor). */
export const CollaboratorFormSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.email(),
  cpf: CpfFieldSchema,
  occupationArea: z.enum(OCCUPATION_AREAS),
  role: z.string().trim().min(1).max(120),
  startOfContract: z.iso.date(), // YYYY-MM-DD
  employmentRelationship: z.enum(EMPLOYMENT_RELATIONSHIPS),
  territory: TerritoryFormSchema.nullable().default(null),
  bankAccount: BankAccountFormSchema.nullable().default(null),
  pixKey: PixKeyFormSchema.nullable().default(null),
})
export type CollaboratorFormValues = z.infer<typeof CollaboratorFormSchema>
