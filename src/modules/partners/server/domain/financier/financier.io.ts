/**
 * Financier — tipos de I/O do domínio (PUROS, sem Zod — C2 do review). Os schemas Zod correspondentes
 * vivem em `../../adapters/financier.io-schemas.ts` (a borda). Alinhado ao contrato REAL: PJ-only
 * (6 campos obrigatórios), query page/limit/order/search/active, create/update = PUT total.
 */
import type { ActivationStatus } from './financier.types.ts'

// ── Input (validado na server fn pelos schemas em adapters) ─────────────────────
export interface ListFinanciersInput {
  search?: string
  active?: boolean
  order: 'ASC' | 'DESC'
  page: number
  limit: number
}

export interface GetFinancierInput {
  id: string
}

export interface CreateFinancierInput {
  name: string
  corporateName: string
  legalRepresentative: string
  cnpj: string
  telephone: string
  address: string
}

export type UpdateFinancierInput = CreateFinancierInput & { id: string }

export interface DeactivateFinancierInput {
  id: string
}

export interface ReactivateFinancierInput {
  id: string
}

// ── Model (o que a UI consome) ─────────────────────────────────────────────────
export type FinancierListItem = Readonly<{
  id: string
  name: string
  corporateName: string
  legalRepresentative: string
  cnpj: string
  telephone: string
  activation: ActivationStatus
}>

export type FinancierDetail = FinancierListItem &
  Readonly<{
    address: string
  }>

export type FinancierListResponse = Readonly<{
  items: readonly FinancierListItem[]
  meta: Readonly<{ page: number; limit: number; total: number }>
}>
