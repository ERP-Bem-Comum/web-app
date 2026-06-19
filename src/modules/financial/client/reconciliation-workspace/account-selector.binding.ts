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

export type AccountSelector = Readonly<{
  accountRef: string
  /** false enquanto #168 não expõe a conta — a UI mostra placeholder honesto, sem inventar dados. */
  identityAvailable: boolean
}>

const accountQueryOptions = (ref: string) => ({
  queryKey: ['financial', 'reconciliation', 'account', ref] as const,
  queryFn: () => reconciliationRepository.getAccount(ref),
  staleTime: 60_000,
})

export function useAccountSelector(routeAccountRef: string): AccountSelector {
  const account = useQuery(accountQueryOptions(routeAccountRef))
  const identityAvailable = account.data?.ok === true
  return { accountRef: routeAccountRef, identityAvailable }
}
