/**
 * Binding do gráfico "Realizado × Previsto" (specs/096 P3) — ADAPTER React (ADR-0009: React SÓ aqui).
 * Guarda a SELEÇÃO (UI-state) e roda a query dedicada keyed por ano+seleção — trocar o plano refetcha SÓ
 * o gráfico. `placeholderData` mantém o gráfico/opções durante o refetch (sem flicker). Entrega ao
 * componente uma união discriminada `{ status, chart, options, selectedValue, onSelect }` (§IV/§XI).
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import type { DashboardChart } from '#modules/financial/client/data/model/dashboard-statistics.model.ts'
import type { RealizedSelection } from '#modules/financial/client/data/model/dashboard-realized.model.ts'

import { dashboardRealizedQueryOptions } from './dashboard-realized.query.ts'
import {
  toSelectorOptions,
  valueToSelection,
  selectionToValue,
  type RealizedSelectorOption,
} from './dashboard-realized.view-model.ts'

export type RealizedStatus = 'loading' | 'forbidden' | 'error' | 'empty' | 'ready'

export type DashboardRealizedView = Readonly<{
  status: RealizedStatus
  chart: DashboardChart | null
  options: readonly RealizedSelectorOption[]
  selectedValue: string
  onSelect: (value: string) => void
}>

export function useDashboardRealized(): DashboardRealizedView {
  // Ano corrente via lazy-init (roda 1x, SSR-safe — evita relógio no render, §XI).
  const [year] = useState(() => new Date().getFullYear())
  const [selection, setSelection] = useState<RealizedSelection>({ kind: 'all' })
  const q = useQuery({
    ...dashboardRealizedQueryOptions({ year, selection }),
    placeholderData: (prev) => prev,
  })

  const data = q.data
  const status: RealizedStatus = (() => {
    if (q.isLoading || data === undefined) return 'loading'
    if (data.error === 'forbidden' || data.error === 'unauthorized') return 'forbidden'
    if (data.error !== null || data.result === null) return 'error'
    if (data.result.empty) return 'empty'
    return 'ready'
  })()

  return {
    status,
    chart: data?.result?.chart ?? null,
    options: toSelectorOptions(data?.result?.options ?? []),
    selectedValue: selectionToValue(selection),
    onSelect: (value) => {
      setSelection(valueToSelection(value))
    },
  }
}
