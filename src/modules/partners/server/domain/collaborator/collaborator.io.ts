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

const OCCUPATION = z.enum(['PARC', 'DDI', 'DCE', 'EPV'])
const EMPLOYMENT = z.enum(['CLT', 'PJ'])
const REGISTRATION = z.enum(['pre-registration', 'complete'])
const REASON = z.enum(['contract-ended', 'voluntary-exit', 'restructuring', 'other'])

// ── Input (validado na server fn) ──────────────────────────────────────────────
export const ListCollaboratorsInputSchema = z.object({
  search: z.string().trim().optional(),
  active: z.boolean().optional(),
  status: REGISTRATION.optional(),
  occupationAreas: z.array(OCCUPATION).optional(),
  employmentRelationships: z.array(EMPLOYMENT).optional(),
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
  occupationArea: OCCUPATION,
  role: z.string().trim().min(1),
  startOfContract: z.string().trim().min(1), // ISO date (YYYY-MM-DD)
  employmentRelationship: EMPLOYMENT,
})
export type CreateCollaboratorInput = z.infer<typeof CreateCollaboratorInputSchema>

export const DeactivateCollaboratorInputSchema = z.object({
  id: z.string().trim().min(1),
  reason: REASON, // obrigatório (FR-006). ⚠️ alinhar aos valores `disableBy` do core-api na integração.
})
export type DeactivateCollaboratorInput = z.infer<typeof DeactivateCollaboratorInputSchema>

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
