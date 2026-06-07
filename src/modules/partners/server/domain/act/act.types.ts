/**
 * Act (4º tipo de parceiro) — tipos do agregado. Imutável (§IV). Espelha o NÚCLEO do Colaborador:
 * os 7 campos de pré-cadastro + status duplo (`registration` × `activation`). VOs branded para CPF/Email.
 * Provisório (ADR-0036 do core-api): sem complete-registration/import — o shape pode crescer.
 */
import type { CPF } from '../value-objects/cpf.value-object.ts'
import type { Email } from '../value-objects/email.value-object.ts'

export type RegistrationStatus = 'pre-registration' | 'complete'
export type ActivationStatus = 'active' | 'inactive'
export type OccupationArea = 'PARC' | 'DDI' | 'DCE' | 'EPV'
export type EmploymentRelationship = 'CLT' | 'PJ'

/** Os 7 campos do pré-cadastro (idênticos ao núcleo do Colaborador). */
export type PreRegistrationInput = Readonly<{
  name: string
  email: Email
  cpf: CPF
  occupationArea: OccupationArea
  role: string
  startOfContract: string
  employmentRelationship: EmploymentRelationship
}>

export type Act = PreRegistrationInput &
  Readonly<{
    registration: RegistrationStatus
    activation: ActivationStatus
  }>
