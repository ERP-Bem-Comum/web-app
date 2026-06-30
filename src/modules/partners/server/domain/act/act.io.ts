/**
 * Act — tipos de I/O do domínio (PUROS, sem Zod — C2 do review). Os schemas Zod correspondentes vivem
 * em `../../adapters/act.io-schemas.ts` (a borda). Nomes/valores alinhados ao contrato REAL do core-api
 * (`/api/v1/acts/*`, #32): Acordo de Cooperação Técnica institucional (CNPJ + vigência + repasse).
 */
import type { BankAccount, PixKey, OccupationArea } from './act.types.ts'

// ── Input (validado na server fn pelos schemas em adapters) ─────────────────────
export interface ListActsInput {
  search?: string
  active?: boolean
  hasFinancialTransfer?: boolean
  occupationArea?: OccupationArea
  order: 'ASC' | 'DESC'
  page: number
  limit: number
}

export interface GetActInput {
  id: string
}

export interface CreateActInput {
  actNumber: string
  name: string
  email: string
  cnpj: string
  corporateName: string
  fantasyName: string
  occupationArea: OccupationArea
  legalRepresentative: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD (> startDate)
  hasFinancialTransfer: boolean
  bankAccount: BankAccount | null
  pixKey: PixKey | null
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
  actNumber: string
  name: string
  email: string
  corporateName: string
  fantasyName: string
  occupationArea: string // tolerante: o core-api emite string (valores legados possíveis); a UI mapeia p/ label
  hasFinancialTransfer: boolean
  active: boolean
  contractCount: number
}>

export type ActDetail = ActListItem &
  Readonly<{
    legacyId: number | null
    cnpj: string
    legalRepresentative: string
    startDate: string
    endDate: string
    bankAccount: BankAccount | null
    pixKey: PixKey | null
    createdAt: string
    updatedAt: string
  }>

export type ActListResponse = Readonly<{
  items: readonly ActListItem[]
  meta: Readonly<{ page: number; limit: number; total: number }>
}>
