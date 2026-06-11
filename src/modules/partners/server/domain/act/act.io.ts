/**
 * Act — tipos de I/O do domínio (PUROS, sem Zod — C2 do review). Os schemas Zod correspondentes vivem
 * em `../../adapters/act.io-schemas.ts` (a borda). Nomes/valores alinhados ao contrato REAL do core-api
 * (`/api/v1/acts/*`): query simples (page/limit/order/search/active) e os 7 campos do pré-cadastro.
 */
import type {
  RegistrationStatus,
  ActivationStatus,
  EmploymentRelationship,
  OccupationArea,
} from './act.types.ts'

// ── Input (validado na server fn pelos schemas em adapters) ─────────────────────
export interface ListActsInput {
  search?: string
  active?: boolean
  order: 'ASC' | 'DESC'
  page: number
  limit: number
}

export interface GetActInput {
  id: string
}

export interface CreateActInput {
  name: string
  email: string
  cpf: string
  occupationArea: OccupationArea
  role: string
  startOfContract: string // YYYY-MM-DD
  employmentRelationship: EmploymentRelationship
}

export type UpdateActInput = CreateActInput & { id: string }

export interface DeactivateActInput {
  id: string
}

export interface ReactivateActInput {
  id: string
}

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
