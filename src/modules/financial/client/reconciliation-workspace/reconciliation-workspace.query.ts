/**
 * Query options da Conciliação — data AGNÓSTICA (queryFn devolve o `Result`; o binding ramifica em
 * ok/err). Sem filtro server-side (a lista de transações filtra no client). Espelha
 * `contas-a-pagar.query.ts`.
 */
import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'

export const transactionsQueryOptions = (statementId: string | null) => ({
  queryKey: ['financial', 'reconciliation', 'transactions', statementId] as const,
  queryFn: () => reconciliationRepository.listTransactions({ statementId: statementId ?? '' }),
  enabled: statementId !== null,
  staleTime: 15_000,
})

export const paidPayablesQueryOptions = () => ({
  queryKey: ['financial', 'reconciliation', 'paid-payables'] as const,
  queryFn: () => reconciliationRepository.listPaidPayables(),
  staleTime: 30_000,
})

export const suggestionsQueryOptions = (transactionId: string | null) => ({
  queryKey: ['financial', 'reconciliation', 'suggestions', transactionId] as const,
  queryFn: () => reconciliationRepository.getSuggestions({ transactionId: transactionId ?? '' }),
  enabled: transactionId !== null,
  staleTime: 15_000,
})

// Conciliação ativa de uma transação (#175) — só busca p/ transação conciliada (id != null). Habilita
// Desfazer pós-reload + auditoria do modal de detalhes.
export const transactionReconciliationQueryOptions = (transactionId: string | null) => ({
  queryKey: ['financial', 'reconciliation', 'tx-reconciliation', transactionId] as const,
  queryFn: () => reconciliationRepository.getTransactionReconciliation(transactionId ?? ''),
  enabled: transactionId !== null,
  staleTime: 15_000,
})
