/**
 * Binding de opções de CONTA-CÉDENTE para o "Pagar da conta" do Lançar Documento — ADAPTER React. Lista
 * as MESMAS contas cadastradas na Conciliação (`reconciliationRepository.listAccounts`, #138) e oferece só
 * as ATIVAS — a conta escolhida vira `contaDebitoRef` no create (#197), e a baixa do título é direcionada
 * a ela. Erro/loading → []. Reusa a cadeia BFF da Conciliação (mesmo bounded context financeiro).
 */
import { useQuery } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import type { ReconciliationAccount } from '#modules/financial/client/data/model/reconciliation.model.ts'

export type AccountOption = Readonly<{ value: string; label: string }>

const accountLabel = (a: ReconciliationAccount): string =>
  `${a.alias} · ${a.bankName} · CC ${a.accountNumber}-${a.accountDv}`

export function useAccountOptions(): readonly AccountOption[] {
  const query = useQuery({
    queryKey: ['financial', 'cedente-account-options'] as const,
    queryFn: async (): Promise<readonly ReconciliationAccount[]> => {
      const r = await reconciliationRepository.listAccounts()
      return r.ok ? r.value : []
    },
    staleTime: 60_000,
    // Só contas ATIVAS podem receber a baixa (a Conciliação não opera contas encerradas).
    select: (accounts: readonly ReconciliationAccount[]): readonly AccountOption[] =>
      accounts.filter((a) => a.status === 'Active').map((a) => ({ value: a.id, label: accountLabel(a) })),
  })
  return query.data ?? []
}
