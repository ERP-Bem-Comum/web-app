/**
 * Collaborator (PF) — tipos do agregado. Imutável (§IV). Status DUPLO e ortogonal: `registration`
 * (situação cadastral: pré → completo) × `activation` (ativo/inativo). VOs branded para CPF/Email.
 */
import type { CPF } from '../value-objects/cpf.value-object.ts'
import type { Email } from '../value-objects/email.value-object.ts'

export type RegistrationStatus = 'pre-registration' | 'complete'
export type ActivationStatus = 'active' | 'inactive'
export type OccupationArea = 'PARC' | 'DDI' | 'DCE' | 'EPV'
export type EmploymentRelationship = 'CLT' | 'PJ'

// ⚠️ Alinhar aos valores reais do enum `disableBy` do core-api (4 valores) na integração (T029).
export type DeactivationReason =
  | 'contract-ended'
  | 'voluntary-exit'
  | 'restructuring'
  | 'other'

/** Os 7 campos do pré-cadastro (dados ABC). */
export type PreRegistrationInput = Readonly<{
  name: string
  email: Email
  cpf: CPF
  occupationArea: OccupationArea
  role: string
  startOfContract: string
  employmentRelationship: EmploymentRelationship
}>

export type Collaborator = PreRegistrationInput &
  Readonly<{
    registration: RegistrationStatus
    activation: ActivationStatus
    deactivationReason: DeactivationReason | null
  }>
