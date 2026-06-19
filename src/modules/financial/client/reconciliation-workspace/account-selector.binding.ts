/**
 * Seletor temporário de conta-cedente — ADAPTER React. Enquanto core-api#168 não expõe listar/criar/obter
 * conta, usamos um **UUID v4 fixo de placeholder** (verificado no #152: o import NÃO valida o
 * `debitAccountRef` contra o store e não há conta de seed). A costura `getAccount` consome a porta do
 * repository, que devolve `err('unavailable')` — então a identidade da conta fica **indisponível**
 * (chrome honesto, sem dados fabricados) até #168. Quando #168 chegar, o grid passa o ref real e
 * `getAccount` devolve a conta — sem refactor de fronteira.
 */
import { useQuery } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import type { ReconciliationAccount } from '#modules/financial/client/data/model/reconciliation.model.ts'

export type AccountSelector = Readonly<{
  accountRef: string
  /** Conta-cedente resolvida; null enquanto #168 não expõe o cadastro (chrome honesto). */
  account: ReconciliationAccount | null
  identityAvailable: boolean
}>

const accountQueryOptions = (ref: string) => ({
  queryKey: ['financial', 'reconciliation', 'account', ref] as const,
  queryFn: () => reconciliationRepository.getAccount(ref),
  staleTime: 60_000,
})

export function useAccountSelector(routeAccountRef: string): AccountSelector {
  const q = useQuery(accountQueryOptions(routeAccountRef))
  const account = q.data?.ok === true ? q.data.value : null
  return { accountRef: routeAccountRef, account, identityAvailable: account !== null }
}
