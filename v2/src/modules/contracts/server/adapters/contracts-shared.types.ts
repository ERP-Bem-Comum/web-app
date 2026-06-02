/**
 * Tipos compartilhados entre server e client (fronteira adapters).
 * Client-data pode importar de server-adapters; server-application pode importar de server-domain.
 */

// ContractsError — união discriminada de falhas do domínio de contratos.
export type ContractsError =
  | 'invalid-code'
  | 'invalid-value'
  | 'invalid-period'
  | 'missing-contractor'
  | 'contract-not-found'
  | 'amendment-not-found'
  | 'invalid-amendment-type'
  | 'connectivity'
  | 'server'
  | 'unauthorized'

// ContractHistoryEvent — evento de auditoria do contrato.
export type ContractHistoryEvent = Readonly<{
  eventId: string
  contractId: string
  kind: string
  description: string
  occurredAt: string
  userName?: string
  metadata?: Record<string, string | number | boolean | null>
}>
