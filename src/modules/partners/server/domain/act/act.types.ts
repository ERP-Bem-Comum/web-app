/**
 * Act — Acordo de Cooperação Técnica firmado com uma instituição parceira (CNPJ). Tipos do agregado.
 * Imutável (§IV). Espelha o NÚCLEO do Fornecedor (CNPJ/razão social/conta/PIX), com `hasFinancialTransfer`
 * explícito, vigência (start/end), `actNumber`, `legalRepresentative` e `occupationArea`. VOs branded para
 * CNPJ/Email. Situação = `active` boolean (alinha ao `actDetailSchema` do core-api #32).
 */
import type { CNPJ } from '../value-objects/cnpj.value-object.ts'
import type { Email } from '../value-objects/email.value-object.ts'

export const OCCUPATION_AREAS = ['PARC', 'DDI', 'DCE', 'EPV'] as const
export type OccupationArea = (typeof OCCUPATION_AREAS)[number]

// ⚠️ O contrato do core-api usa `random-key` (com hífen), igual ao Fornecedor.
export const PIX_KEY_TYPES = ['cpf', 'cnpj', 'email', 'phone', 'random-key'] as const
export type PixKeyType = (typeof PIX_KEY_TYPES)[number]

export type BankAccount = Readonly<{
  bank: string
  agency: string
  accountNumber: string
  checkDigit: string
}>

export type PixKey = Readonly<{ keyType: PixKeyType; key: string }>

export type ActInput = Readonly<{
  actNumber: string
  name: string
  email: Email
  cnpj: CNPJ
  corporateName: string
  fantasyName: string
  occupationArea: OccupationArea
  legalRepresentative: string
  startDate: string
  endDate: string
  hasFinancialTransfer: boolean
  bankAccount: BankAccount | null
  pixKey: PixKey | null
}>

export type Act = ActInput & Readonly<{ active: boolean }>
