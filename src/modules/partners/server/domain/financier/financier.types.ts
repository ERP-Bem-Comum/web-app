/**
 * Financier (PJ-only) — tipos do agregado. Imutável (§IV). Status único (ativo/inativo). VO branded para
 * CNPJ. Sem CPF, sem payment-target, sem variante PF (decidido — PJ-only). `address` é uma única string.
 */
import type { CNPJ } from '../value-objects/cnpj.value-object.ts'

export type ActivationStatus = 'active' | 'inactive'

export type FinancierInput = Readonly<{
  name: string
  corporateName: string
  legalRepresentative: string
  cnpj: CNPJ
  telephone: string
  address: string
}>

export type Financier = FinancierInput & Readonly<{ activation: ActivationStatus }>
