/**
 * Model do client (client-data) — tipos de I/O do repository, espelhando o contrato do BFF.
 * Definidos localmente (não importa server/domain nem public-api — boundary §I); a validação do
 * response contra o core-api já acontece na server fn (§IX). Camada `data`.
 */
export type ActivationStatus = 'active' | 'inactive'

export type BankAccount = Readonly<{
  bank: string
  agency: string
  accountNumber: string
  checkDigit: string
}>

export type SupplierPixKey = Readonly<{
  keyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random-key'
  key: string
}>

export type SupplierListItem = Readonly<{
  id: string
  name: string
  email: string
  cnpj: string
  corporateName: string
  fantasyName: string
  serviceCategory: string
  activation: ActivationStatus
}>

export type SupplierDetail = SupplierListItem &
  Readonly<{
    bankAccount: BankAccount | null
    pixKey: SupplierPixKey | null
  }>

export type SupplierListResponse = Readonly<{
  items: readonly SupplierListItem[]
  meta: Readonly<{ page: number; limit: number; total: number }>
}>

// ── Inputs enviados pelo repository (a server fn valida no server) ──
export type SupplierListInput = Readonly<{
  search?: string
  active?: boolean
  // mutável: a server fn (Zod) espera string[]; é input efêmero, não estado.
  categories?: string[]
  order: 'ASC' | 'DESC'
  page: number
  limit: number
}>

export type SupplierWriteInput = Readonly<{
  name: string
  corporateName: string
  fantasyName: string
  email: string
  cnpj: string
  serviceCategory: string
  bankAccount: BankAccount | null
  pixKey: SupplierPixKey | null
}>
