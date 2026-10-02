/**
 * Supplier — tipos de I/O do domínio (PUROS, sem Zod — C2 do review). Os schemas Zod correspondentes
 * vivem em `../../adapters/supplier.io-schemas.ts` (a borda). Alinhado ao contrato REAL: query
 * page/limit/order/search/active/categories; create/update = PUT total; bankAccount/pixKey coesos (ou null).
 */
import type {
  ActivationStatus,
  BankAccount,
  PersonType,
  SupplierPixKey,
  ServiceRating,
} from './supplier.types.ts'

// ── Input (validado na server fn pelos schemas em adapters) ─────────────────────
export interface ListSuppliersInput {
  search?: string
  active?: boolean
  categories?: string[]
  order: 'ASC' | 'DESC'
  page: number
  limit: number
}

export interface GetSupplierInput {
  id: string
}

export interface CreateSupplierInput {
  name: string
  email: string
  // CPF (PF) ou CNPJ (PJ), com ou sem máscara — o client do core-api normaliza (#1022).
  document: string
  // `null` na pessoa física: o campo não existe para PF (o core-api recusa preenchido com 422).
  corporateName: string | null
  fantasyName: string | null
  serviceCategory: string
  bankAccount: BankAccount | null
  pixKey: SupplierPixKey | null
  // Avaliação de serviço (§1.6) — opcionais; null = sem avaliação (D2).
  serviceRating: ServiceRating | null
  ratingComment: string | null
}

export type UpdateSupplierInput = CreateSupplierInput & { id: string }

export interface DeactivateSupplierInput {
  id: string
}

export interface ReactivateSupplierInput {
  id: string
}

// ── Model (o que a UI consome) ─────────────────────────────────────────────────
export type SupplierListItem = Readonly<{
  id: string
  name: string
  email: string
  // CPF (11) ou CNPJ (14), sem máscara. `personType` é a leitura do core-api, nunca deduzida do tipo de parceiro.
  document: string
  personType: PersonType
  corporateName: string | null
  fantasyName: string | null
  serviceCategory: string
  activation: ActivationStatus
  contractCount: number
}>

export type SupplierDetail = SupplierListItem &
  Readonly<{
    bankAccount: BankAccount | null
    pixKey: SupplierPixKey | null
    // Avaliação de serviço (§1.6) — leitura tolerante: desconhecido → null (D2).
    serviceRating: ServiceRating | null
    ratingComment: string | null
  }>

export type SupplierListResponse = Readonly<{
  items: readonly SupplierListItem[]
  meta: Readonly<{ page: number; limit: number; total: number }>
}>
