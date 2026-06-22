/**
 * Binding de opções de APROVADOR para o Lançar Documento (#148) — ADAPTER React. Lista os usuários
 * elegíveis a aprovar (com `payable:approve`) via a public-api do Auth (cross-módulo SÓ via public-api —
 * §I), p/ o dropdown de Aprovador que envia `approverRef` no create. A server fn já degrada p/ [] (sem
 * sessão / erro). Loading → lista vazia.
 */
import { useQuery } from '@tanstack/react-query'

import { listApproversFn } from '#modules/auth/public-api/index.ts'

export type ApproverOption = Readonly<{ value: string; label: string }>

const approverOptionsQueryOptions = {
  queryKey: ['financial', 'approver-options'] as const,
  queryFn: async (): Promise<readonly ApproverOption[]> => {
    const items = await listApproversFn()
    return items.map((a) => ({ value: a.id, label: a.name }))
  },
  staleTime: 300_000,
}

export function useApproverOptions(): readonly ApproverOption[] {
  const query = useQuery(approverOptionsQueryOptions)
  return query.data ?? []
}
