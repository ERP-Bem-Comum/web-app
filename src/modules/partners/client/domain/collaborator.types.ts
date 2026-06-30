/**
 * Tipos derivados de UI do vertical de Colaboradores (client). Espelha `act.types.ts`, com status duplo.
 */
import type {
  ActivationStatus,
  RegistrationStatus,
} from '#modules/partners/client/data/model/collaborator.model.ts'
export type { ActivationStatus, RegistrationStatus }

/** Linha da tabela (DataTable<CollaboratorRow>) — derivada de CollaboratorListItem por mapper puro. */
export type CollaboratorRow = Readonly<{
  id: string
  name: string
  email: string
  occupationArea: string
  role: string
  registration: RegistrationStatus
  activation: ActivationStatus
  contractCount: number
}>

/** Ação de ciclo de vida no detalhe (sobre a ATIVAÇÃO; o status cadastral é somente-leitura). */
export type StatusAction = 'deactivate' | 'reactivate'
