/**
 * Tipos compartilhados entre server e client (fronteira adapters).
 * Client-data pode importar de server-adapters; server-application pode importar de server-domain.
 * ContractHistoryEvent foi movido para server-domain/contracts.types.ts para respeitar boundaries.
 */

// ContractsError — FONTE ÚNICA no domínio (A2); aqui só reexportamos para o client-data consumir
// pela fronteira adapters (client pode importar server-adapters, mas não server-domain direto).
export type { ContractsError } from '#modules/contracts/server/domain/contracts.types.ts'

// Re-export de ContractHistoryEvent do server-domain (boundaries-compatível).
export type { ContractHistoryEvent } from '#modules/contracts/server/domain/contracts.types.ts'

// EndContractInput — input do distrato (#32). Re-export pela fronteira adapters (boundaries-compatível).
// O client-data tem a própria cópia no `contracts.model.ts` (espelha AttachSignedDocumentInput).
export type { EndContractInput } from '#modules/contracts/server/domain/contracts.types.ts'
