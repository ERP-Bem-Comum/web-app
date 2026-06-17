/**
 * Financier (PJ-only) — tipos do agregado. Imutável (§IV). Status único (ativo/inativo). VO branded para
 * CNPJ. `address` é uma única string. Banco/PIX (payment-target) adicionados em #40 — shape idêntico ao
 * Fornecedor (VO payment-target compartilhado no core-api); ambos opcionais.
 */
import type { CNPJ } from '../value-objects/cnpj.value-object.ts'

export type ActivationStatus = 'active' | 'inactive'

// Payment-target (banco/PIX) — mesmo shape do Fornecedor (#40). Type-aliases puros (sem lógica divergente).
export type BankAccount = Readonly<{
  bank: string
  agency: string
  accountNumber: string
  checkDigit: string
}>
export type FinancierPixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random-key'
export type FinancierPixKey = Readonly<{ keyType: FinancierPixKeyType; key: string }>

export type FinancierInput = Readonly<{
  name: string
  corporateName: string
  legalRepresentative: string
  cnpj: CNPJ
  telephone: string
  address: string
}>

export type Financier = FinancierInput & Readonly<{ activation: ActivationStatus }>
