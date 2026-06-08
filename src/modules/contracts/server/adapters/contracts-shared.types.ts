/**
 * Tipos compartilhados entre server e client (fronteira adapters).
 * Client-data pode importar de server-adapters; server-application pode importar de server-domain.
 * ContractHistoryEvent foi movido para server-domain/contracts.types.ts para respeitar boundaries.
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
  | 'not-implemented'
  | 'invalid-pdf'
  | 'file-too-large'
  | 'invalid-signed-at'
  | 'no-signed-document'
  | 'document-conflict'
  | 'storage-unavailable'

// Re-export de ContractHistoryEvent do server-domain (boundaries-compatível).
export type { ContractHistoryEvent } from '#modules/contracts/server/domain/contracts.types.ts'
