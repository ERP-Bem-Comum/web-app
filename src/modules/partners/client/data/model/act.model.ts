/**
 * Model do client (client-data) — tipos de I/O do repository de ACTs, espelhando `act.io.ts`. Tipos
 * locais (não importa server/domain nem public-api — boundary §I). ACT é PF: 7 campos, com 2 enums
 * (área/vínculo), data de início e status duplo (registration somente-leitura × activation alternável).
 * Aqui também vive o schema Zod do FORMULÁRIO.
 */
import * as z from 'zod'

export type RegistrationStatus = 'pre-registration' | 'complete'
export type ActivationStatus = 'active' | 'inactive'

export const OCCUPATION_AREAS = ['PARC', 'DDI', 'DCE', 'EPV'] as const
export type OccupationArea = (typeof OCCUPATION_AREAS)[number]

export const EMPLOYMENT_RELATIONSHIPS = ['CLT', 'PJ'] as const
export type EmploymentRelationship = (typeof EMPLOYMENT_RELATIONSHIPS)[number]

export type ActListItem = Readonly<{
  id: string
  name: string
  email: string
  occupationArea: string // tolerante a valores legados fora do enum (a UI mapeia p/ label quando casa)
  role: string
  registration: RegistrationStatus
  activation: ActivationStatus
}>

export type ActDetail = ActListItem &
  Readonly<{
    cpf: string
    startOfContract: string
    employmentRelationship: EmploymentRelationship
  }>

export type ActListResponse = Readonly<{
  items: readonly ActListItem[]
  meta: Readonly<{ page: number; limit: number; total: number }>
}>

// ── Inputs enviados pelo repository (a server fn valida no server) ──
export type ActListInput = Readonly<{
  search?: string
  active?: boolean
  order: 'ASC' | 'DESC'
  page: number
  limit: number
}>

export type ActWriteInput = Readonly<{
  name: string
  email: string
  cpf: string
  occupationArea: OccupationArea
  role: string
  startOfContract: string
  employmentRelationship: EmploymentRelationship
}>

// ── Schema do formulário (validação na borda do cliente) ──
const onlyDigits = (raw: string): string => raw.replace(/\D/g, '')

/** CPF: aceita com/sem máscara; normaliza para 11 dígitos (o server fn aceita 11–14). */
export const CpfFieldSchema = z
  .string()
  .trim()
  .transform(onlyDigits)
  .refine((d) => d.length === 11, { error: 'cpf-invalid' })

/** Formulário dos 7 campos do pré-cadastro. */
export const ActFormSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.email(),
  cpf: CpfFieldSchema,
  occupationArea: z.enum(OCCUPATION_AREAS),
  role: z.string().trim().min(1).max(120),
  startOfContract: z.iso.date(), // YYYY-MM-DD
  employmentRelationship: z.enum(EMPLOYMENT_RELATIONSHIPS),
})
export type ActFormValues = z.infer<typeof ActFormSchema>
