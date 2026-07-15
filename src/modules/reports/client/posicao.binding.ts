/**
 * Binding da "Posição de Pagamentos" — ADAPTER React (§XI). Lê a posição REAL do core-api (via
 * `reportsRepository.getPaymentPosition`) e monta a árvore agregada pelo view-model puro
 * (`aggregatePosicao(toRawPosicaoRows(...))`). A View consome só o `state` (união discriminada §IV:
 * loading | error | ready). O empty-state honesto (relatório vazio) é resolvido DENTRO da `PosicaoReportView`
 * a partir do `report` (0 nós / total 0). ZERO React/TanStack no view-model — o acoplamento vive aqui.
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { paymentPositionQueryOptions } from './posicao.query.ts'
import { aggregatePosicao, toRawPosicaoRows, type PosicaoReport } from './posicao.view-model.ts'
import { reportsPartnersMapQueryOptions, EMPTY_PARTNERS_MAP } from './reports-partners-map.binding.ts'
import { reportsErrorTag } from './data/helpers/reports-error-tag.ts'
import type { ReportsError } from './data/repository/reports-error.ts'

export type PosicaoBindingState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; error: ReportsError; errorTag: string }>
  | Readonly<{ status: 'ready'; report: PosicaoReport }>

export function usePosicaoPagamentos(): PosicaoBindingState {
  const query = useQuery(paymentPositionQueryOptions())
  // Mapa de parceiros p/ resolver o favorecido não-fornecedor client-side (best-effort; não bloqueia o
  // relatório — sem ele, o favorecido cai no nome do backend / "—").
  const partnersQuery = useQuery(reportsPartnersMapQueryOptions())

  const positions = query.data?.data ?? null
  const error: ReportsError | null = query.data?.error ?? null
  const partnersMap = partnersQuery.data ?? EMPTY_PARTNERS_MAP

  return useMemo<PosicaoBindingState>(() => {
    if (query.isLoading) return { status: 'loading' }
    if (error !== null) return { status: 'error', error, errorTag: reportsErrorTag(error) }
    if (positions !== null)
      return { status: 'ready', report: aggregatePosicao(toRawPosicaoRows(positions, partnersMap)) }
    return { status: 'loading' }
  }, [query.isLoading, error, positions, partnersMap])
}
