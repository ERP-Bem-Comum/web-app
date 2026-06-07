/**
 * Act — contratos de I/O da fronteira (Zod). Input das server fns (validação na borda §VI) + Model que a
 * UI consome (response normalizado pela ACL). O agregado de domínio vive em `act.ts`. Nomes/valores
 * alinhados ao contrato REAL do core-api (`/api/v1/acts/*`, `act-schemas.ts`): query simples
 * (page/limit/order/search/active) e os 7 campos canônicos do pré-cadastro.
 */
import * as z from 'zod'
import type { RegistrationStatus, ActivationStatus, EmploymentRelationship } from './act.types.ts'

const OccupationAreaSchema = z.enum(['PARC', 'DDI', 'DCE', 'EPV'])
const EmploymentRelationshipSchema = z.enum(['CLT', 'PJ'])

// ── Input (validado na server fn) ──────────────────────────────────────────────
// Query do core-api: page, limit(≤100), order(ASC|DESC), search, active. Sem filtros avançados (provisório).
export const ListActsInputSchema = z.object({
  search: z.string().trim().max(120).optional(),
  active: z.boolean().optional(),
  order: z.enum(['ASC', 'DESC']).default('ASC'),
  page: z.int().min(1).default(1),
  limit: z.int().min(1).max(100).default(5),
})
export type ListActsInput = z.infer<typeof ListActsInputSchema>

export const GetActInputSchema = z.object({ id: z.string().trim().min(1).max(64) })
export type GetActInput = z.infer<typeof GetActInputSchema>

export const CreateActInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.email(),
  cpf: z.string().trim().min(11).max(14),
  occupationArea: OccupationAreaSchema,
  role: z.string().trim().min(1).max(120),
  startOfContract: z.iso.date(), // YYYY-MM-DD (validado na borda)
  employmentRelationship: EmploymentRelationshipSchema,
})
export type CreateActInput = z.infer<typeof CreateActInputSchema>

// Edição (PUT /acts/:id) — substituição total dos 7 campos cadastrais.
export const UpdateActInputSchema = CreateActInputSchema.extend({
  id: z.string().trim().min(1).max(64),
})
export type UpdateActInput = z.infer<typeof UpdateActInputSchema>

// Desativar: SEM motivo (o core-api não recebe body — diferente do Colaborador). Idempotente.
export const DeactivateActInputSchema = z.object({ id: z.string().trim().min(1).max(64) })
export type DeactivateActInput = z.infer<typeof DeactivateActInputSchema>

export const ReactivateActInputSchema = z.object({ id: z.string().trim().min(1).max(64) })
export type ReactivateActInput = z.infer<typeof ReactivateActInputSchema>

// ── Model (o que a UI consome) ─────────────────────────────────────────────────
export type ActListItem = Readonly<{
  id: string
  name: string
  email: string
  occupationArea: string // tolerante: o core-api emite string (valores legados possíveis); a UI mapeia p/ label
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
