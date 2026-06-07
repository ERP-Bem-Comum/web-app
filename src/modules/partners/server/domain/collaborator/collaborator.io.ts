/**
 * Colaborador — contratos de I/O da fronteira (Zod). Input das server fns (validação na borda §VI) +
 * Model que a UI consome (response normalizado pela ACL). O agregado de domínio vive em `collaborator.ts`.
 * Nomes de campos do complete-registration e valores de `disableBy` alinhados ao contrato REAL do core-api.
 */
import * as z from 'zod'
import type { RegistrationStatus, ActivationStatus, EmploymentRelationship } from './collaborator.types.ts'

const OccupationAreaSchema = z.enum(['PARC', 'DDI', 'DCE', 'EPV'])
const EmploymentRelationshipSchema = z.enum(['CLT', 'PJ'])
const RegistrationStatusSchema = z.enum(['pre-registration', 'complete'])
// Valores REAIS do enum `disableBy` do core-api (códigos legados). A UI mapeia para labels via i18n.
const DeactivationReasonSchema = z.enum([
  'DESLIGAMENTO_ABC',
  'FALECIMENTO',
  'TEMPO_CONTRATO_FINALIZADO',
  'SOLICITACAO_RESCISAO_CONTRATUAL',
])

// ── Input (validado na server fn) ──────────────────────────────────────────────
export const ListCollaboratorsInputSchema = z.object({
  search: z.string().trim().max(120).optional(),
  active: z.boolean().optional(),
  status: RegistrationStatusSchema.optional(),
  occupationAreas: z.array(OccupationAreaSchema).optional(),
  employmentRelationships: z.array(EmploymentRelationshipSchema).optional(),
  roles: z.array(z.string().trim().max(120)).optional(),
  yearOfContract: z.int().min(1900).max(2100).optional(),
  page: z.int().min(1).default(1),
  limit: z.union([z.literal(5), z.literal(10), z.literal(25)]).default(5),
})
export type ListCollaboratorsInput = z.infer<typeof ListCollaboratorsInputSchema>

export const GetCollaboratorInputSchema = z.object({ id: z.string().trim().min(1).max(64) })
export type GetCollaboratorInput = z.infer<typeof GetCollaboratorInputSchema>

export const CreateCollaboratorInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.email(),
  cpf: z.string().trim().min(11).max(14),
  occupationArea: OccupationAreaSchema,
  role: z.string().trim().min(1).max(120),
  startOfContract: z.iso.date(), // YYYY-MM-DD (validado na borda)
  employmentRelationship: EmploymentRelationshipSchema,
})
export type CreateCollaboratorInput = z.infer<typeof CreateCollaboratorInputSchema>

// Cadastro completo (Seção 2 — "Complete seu cadastro", FR-004). Nomes alinhados ao core-api
// (`completeRegistrationBodySchema`). Opcionais na borda. PATCH /collaborators/:id/complete-registration.
export const CompleteCollaboratorRegistrationInputSchema = z.object({
  id: z.string().trim().min(1).max(64),
  rg: z.string().trim().max(20).optional(),
  dateOfBirth: z.iso.date().optional(),
  genderIdentity: z.string().trim().max(60).optional(),
  race: z.string().trim().max(60).optional(),
  education: z.string().trim().max(80).optional(),
  foodCategory: z.string().trim().max(60).optional(),
  foodCategoryDescription: z.string().trim().max(200).optional(),
  completeAddress: z.string().trim().max(300).optional(),
  telephone: z.string().trim().max(20).optional(),
  emergencyContactName: z.string().trim().max(200).optional(),
  emergencyContactTelephone: z.string().trim().max(20).optional(),
  allergies: z.string().trim().max(300).optional(),
  biography: z.string().trim().max(500).optional(),
  experienceInThePublicSector: z.boolean().optional(),
})
export type CompleteCollaboratorRegistrationInput = z.infer<typeof CompleteCollaboratorRegistrationInputSchema>

// Edição dos dados cadastrais (os 7 do pré-cadastro). PUT /collaborators/:id.
export const UpdateCollaboratorInputSchema = CreateCollaboratorInputSchema.extend({
  id: z.string().trim().min(1).max(64),
})
export type UpdateCollaboratorInput = z.infer<typeof UpdateCollaboratorInputSchema>

export const DeactivateCollaboratorInputSchema = z.object({
  id: z.string().trim().min(1).max(64),
  reason: DeactivationReasonSchema, // obrigatório (FR-006); valores reais de `disableBy`.
})
export type DeactivateCollaboratorInput = z.infer<typeof DeactivateCollaboratorInputSchema>

// Reativar: Inactive → Active. Sem motivo (idempotente). Backend: POST /collaborators/:id/reactivate.
export const ReactivateCollaboratorInputSchema = z.object({
  id: z.string().trim().min(1).max(64),
})
export type ReactivateCollaboratorInput = z.infer<typeof ReactivateCollaboratorInputSchema>

// Import em lote (CSV-only). O client lê `File.text()` e envia a STRING; a server fn repassa `text/csv`.
// Teto de 2 MiB validado em BYTES (UTF-8), alinhado ao `bodyLimit` do core-api. FR-007.
export const ImportCollaboratorsInputSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  csv: z
    .string()
    .trim()
    .min(1)
    .max(4 * 1024 * 1024) // guarda barata em chars antes do refine (cap ~2x bytes)
    .refine((s) => new TextEncoder().encode(s).byteLength <= 2 * 1024 * 1024, { error: 'csv-too-large' }),
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
  occupationArea: string // tolerante: o core-api emite string (valores legados possíveis); a UI mapeia p/ label
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
