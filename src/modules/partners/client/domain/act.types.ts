/**
 * Tipos derivados de UI do vertical de ACTs (client). Espelha `financier.types.ts`, com status duplo.
 */
import type { ActivationStatus, RegistrationStatus } from '#modules/partners/client/data/model/act.model.ts'
export type { ActivationStatus, RegistrationStatus }

/** Linha da tabela (DataTable<ActRow>) — derivada de ActListItem por mapper puro. */
export type ActRow = Readonly<{
  id: string
  name: string
  email: string
  occupationArea: string
  role: string
  registration: RegistrationStatus
  activation: ActivationStatus
}>

/** Ação de ciclo de vida no detalhe (sobre a ATIVAÇÃO; o status cadastral é somente-leitura). */
export type StatusAction = 'deactivate' | 'reactivate'
