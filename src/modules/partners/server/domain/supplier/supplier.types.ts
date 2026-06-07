/**
 * Supplier (PJ) — tipos do agregado. Imutável (§IV). Status único (ativo/inativo). VOs branded para
 * CNPJ/Email. Dados bancários + PIX coesos (nomes EN alinhados ao core-api). O catálogo de categorias é
 * uma união aberta na borda (string validada pelo core-api → `invalid-service-category`).
 */
import type { CNPJ } from '../value-objects/cnpj.value-object.ts'
import type { Email } from '../value-objects/email.value-object.ts'

export type ActivationStatus = 'active' | 'inactive'

export type BankAccount = Readonly<{
  bank: string
  agency: string
  accountNumber: string
  checkDigit: string
}>

// ⚠️ O response do core-api usa `random-key` (com hífen), diferente do VO PixKey genérico (`random`).
export type SupplierPixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random-key'
export type SupplierPixKey = Readonly<{ keyType: SupplierPixKeyType; key: string }>

export type SupplierInput = Readonly<{
  name: string
  email: Email
  cnpj: CNPJ
  corporateName: string
  fantasyName: string
  serviceCategory: string
  bankAccount: BankAccount | null
  pixKey: SupplierPixKey | null
}>

export type Supplier = SupplierInput & Readonly<{ activation: ActivationStatus }>
