/**
 * Colaborador — contratos de I/O da fronteira (Zod). Input das server fns (validação na borda §VI) +
 * Model que a UI consome (response normalizado pela ACL). O agregado de domínio vive em `collaborator.ts`.
 */
import * as z from 'zod'
import type {
  RegistrationStatus,
  ActivationStatus,
  OccupationArea,
  EmploymentRelationship,
} from './collaborator.types.ts'

const OccupationAreaSchema = z.enum(['PARC', 'DDI', 'DCE', 'EPV'])
const EmploymentRelationshipSchema = z.enum(['CLT', 'PJ'])
const RegistrationStatusSchema = z.enum(['pre-registration', 'complete'])
const DeactivationReasonSchema = z.enum(['contract-ended', 'voluntary-exit', 'restructuring', 'other'])

// ── Input (validado na server fn) ──────────────────────────────────────────────
export const ListCollaboratorsInputSchema = z.object({
  search: z.string().trim().optional(),
  active: z.boolean().optional(),
  status: RegistrationStatusSchema.optional(),
  occupationAreas: z.array(OccupationAreaSchema).optional(),
  employmentRelationships: z.array(EmploymentRelationshipSchema).optional(),
  roles: z.array(z.string().trim()).optional(),
  yearOfContract: z.int().optional(),
  page: z.int().min(1).default(1),
  limit: z.union([z.literal(5), z.literal(10), z.literal(25)]).default(5),
})
export type ListCollaboratorsInput = z.infer<typeof ListCollaboratorsInputSchema>

export const GetCollaboratorInputSchema = z.object({ id: z.string().trim().min(1) })
export type GetCollaboratorInput = z.infer<typeof GetCollaboratorInputSchema>

export const CreateCollaboratorInputSchema = z.object({
  name: z.string().trim().min(1),
  email: z.email(),
  cpf: z.string().trim().min(1),
  occupationArea: OccupationAreaSchema,
  role: z.string().trim().min(1),
  startOfContract: z.string().trim().min(1), // ISO date (YYYY-MM-DD)
  employmentRelationship: EmploymentRelationshipSchema,
})
export type CreateCollaboratorInput = z.infer<typeof CreateCollaboratorInputSchema>

// Cadastro completo (Seção 2 — "Complete seu cadastro", FR-004). Campos da 2ª etapa; opcionais na borda.
// PATCH /collaborators/:id/complete-registration — o core-api promove `pre-registration → complete`.
export const CompleteCollaboratorRegistrationInputSchema = z.object({
  id: z.string().trim().min(1),
  rg: z.string().trim().optional(),
  fullAddress: z.string().trim().optional(),
  dateOfBirth: z.string().trim().optional(),
  mobile: z.string().trim().optional(),
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: z.string().trim().optional(),
  genderIdentity: z.string().trim().optional(),
  race: z.string().trim().optional(),
  hasAllergy: z.boolean().optional(),
  allergies: z.string().trim().optional(),
  foodCategory: z.string().trim().optional(),
  education: z.string().trim().optional(),
  publicSectorExperience: z.boolean().optional(),
  miniBio: z.string().trim().max(500).optional(),
})
export type CompleteCollaboratorRegistrationInput = z.infer<typeof CompleteCollaboratorRegistrationInputSchema>

// Edição dos dados cadastrais (os 7 do pré-cadastro). PUT /collaborators/:id.
export const UpdateCollaboratorInputSchema = CreateCollaboratorInputSchema.extend({
  id: z.string().trim().min(1),
})
export type UpdateCollaboratorInput = z.infer<typeof UpdateCollaboratorInputSchema>

export const DeactivateCollaboratorInputSchema = z.object({
  id: z.string().trim().min(1),
  reason: DeactivationReasonSchema, // obrigatório (FR-006). ⚠️ alinhar aos valores `disableBy` do core-api na integração.
})
export type DeactivateCollaboratorInput = z.infer<typeof DeactivateCollaboratorInputSchema>

// Import em lote (CSV-only). O client lê `File.text()` e envia a STRING; a server fn repassa `text/csv`
// ao core-api. Teto ~2 MiB (alinha ao `bodyLimit` do core-api). FR-007.
export const ImportCollaboratorsInputSchema = z.object({
  filename: z.string().trim().min(1),
  csv: z.string().trim().min(1).max(2 * 1024 * 1024),
})
export type ImportCollaboratorsInput = z.infer<typeof ImportCollaboratorsInputSchema>

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
  occupationArea: OccupationArea
  role: string
  registration: RegistrationStatus
  activation: ActivationStatus
}>

export type CollaboratorDetail = CollaboratorListItem &
  Readonly<{
    cpf: string
    startOfContract: string
    employmentRelationship: EmploymentRelationship
  }>

export type CollaboratorListResponse = Readonly<{
  items: readonly CollaboratorListItem[]
  meta: Readonly<{ page: number; limit: number; total: number }>
}>
