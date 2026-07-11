/**
 * Binding da tela "Calculando Gastos" (US2.4b) — ADAPTER React (§XI). UI-state local: aba (centro),
 * categoria/subcategoria selecionadas e os 12 meses EDITÁVEIS da subcategoria (overrides sobre o
 * placeholder). O total é derivado (soma).
 *
 * #C2 (fase C): o cálculo IPCA (Tipo B) PERSISTE via `budgetPlansRepository.postIpcaResult` — o command
 * casa a rede (`budgetId`, resolvido do filtro estado/município) × subcategoria (`ref` UUID). Sucesso
 * invalida o DETALHE do plano (mesma query key) → a matriz "Por Rede" reacende a célula via `fillNetworkCells`.
 */
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { isErr } from '#shared/primitives/result.ts'
import { budgetPlansRepository } from '#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts'
import { planDetailQueryKey } from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.query-key.ts'
import {
  buildCalcGastosCentros,
  resolveNetworkBudgetId,
  formatCentsBRL,
  sumMonths,
  MONTH_NAMES,
  type CalcCentro,
  type ReleaseType,
} from './calc-gastos.view-model.ts'
import type { PlanDetail } from '#modules/budget-plans/client/data/model/plan-detail.model.ts'

export type CalcTab = Readonly<{ id: number; name: string; active: boolean }>
export type CalcItem = Readonly<{ id: number; name: string; active: boolean }>
export type CalcDespesa = Readonly<{ monthIndex: number; name: string; label: string; cents: number }>

export type CalcGastosBinding = Readonly<{
  centros: readonly CalcTab[]
  categories: readonly CalcItem[]
  subCategories: readonly CalcItem[]
  despesas: readonly CalcDespesa[]
  totalLabel: string
  hasData: boolean
  /** Modelo de cálculo da subcategoria ativa (roteia o form do lápis). Default IPCA (Tipo B). */
  activeReleaseType: ReleaseType
  setCentro: (id: number) => void
  setCategoria: (id: number) => void
  setSub: (id: number) => void
  prevCentro: () => void
  nextCentro: () => void
  setMonthValue: (monthIndex: number, cents: number) => void
  /** Aplica um mesmo valor a vários meses de uma vez (form "Aplicar aos meses"). */
  applyToMonths: (monthIndices: readonly number[], cents: number) => void
  clearMonth: (monthIndex: number) => void
  // ── #C2 (fase C): persistência do cálculo IPCA (Tipo B) da subcategoria ativa na rede editada. ──
  /** `true` quando dá p/ persistir: rede resolvida (`budgetId`) + subcategoria com `ref` (UUID). */
  canPersistIpca: boolean
  /** POST do cálculo IPCA (base × (1+ipca/100), anual por rede×subcategoria). No-op se `canPersistIpca` = false. */
  applyIpca: (baseValueInCents: number, ipca: number) => void
  ipcaSaving: boolean
  ipcaError: boolean
  /** Sobe 1 a cada POST bem-sucedido — a view usa p/ fechar o drawer/limpar erro. */
  ipcaSavedTick: number
}>

export type CalcGastosContext = Readonly<{ planId: string; estado: string; municipio: string }>

const firstId = (list: readonly { id: number }[]): number | null => list[0]?.id ?? null

export function useCalcGastos(ctx: CalcGastosContext): CalcGastosBinding {
  // #C2 (fase C): o modal opera sobre o DETALHE REAL do plano (mesma query key do Detalhe) — precisa dos `ref`
  // (UUID) das subcategorias e do `budgetId` das redes p/ persistir o cálculo. O grid atrás segue front-first.
  const detailQuery = useQuery({
    queryKey: planDetailQueryKey(ctx.planId),
    queryFn: () => budgetPlansRepository.getPlanDetail(ctx.planId),
  })
  const detail: PlanDetail | null = detailQuery.data?.ok === true ? detailQuery.data.value : null

  const centros = useMemo<readonly CalcCentro[]>(
    () => (detail !== null ? buildCalcGastosCentros(detail) : []),
    [detail],
  )

  const [centroId, setCentroId] = useState<number | null>(firstId(centros))
  const activeCentro = centros.find((c) => c.id === centroId) ?? centros[0] ?? null

  const [categoriaId, setCategoriaId] = useState<number | null>(firstId(activeCentro?.categories ?? []))
  const cats = activeCentro?.categories ?? []
  const activeCat = cats.find((c) => c.id === categoriaId) ?? cats[0] ?? null

  const [subId, setSubId] = useState<number | null>(firstId(activeCat?.subCategories ?? []))
  const subs = activeCat?.subCategories ?? []
  const activeSub = subs.find((s) => s.id === subId) ?? subs[0] ?? null

  // Overrides de meses por subcategoria (edição local).
  const [overrides, setOverrides] = useState<Readonly<Record<number, readonly number[]>>>({})
  const monthsOf = (sid: number, base: readonly number[]): readonly number[] => overrides[sid] ?? base

  const goCentro = (id: number): void => {
    const c = centros.find((x) => x.id === id)
    setCentroId(id)
    const firstCat = c?.categories[0] ?? null
    setCategoriaId(firstCat?.id ?? null)
    setSubId(firstCat?.subCategories[0]?.id ?? null)
  }

  const goCategoria = (id: number): void => {
    setCategoriaId(id)
    const cat = cats.find((x) => x.id === id)
    setSubId(cat?.subCategories[0]?.id ?? null)
  }

  const setMonths = (indices: ReadonlySet<number>, cents: number): void => {
    if (activeSub === null) return
    const base = monthsOf(activeSub.id, activeSub.monthsInCents)
    const next = base.map((v, i) => (indices.has(i) ? Math.max(0, cents) : v))
    setOverrides((prev) => ({ ...prev, [activeSub.id]: next }))
  }

  const editMonth = (monthIndex: number, cents: number): void => {
    setMonths(new Set([monthIndex]), cents)
  }

  const activeMonths = activeSub !== null ? monthsOf(activeSub.id, activeSub.monthsInCents) : []

  // #C2 (fase C): persistência do cálculo IPCA. `budgetId` = rede do filtro; `subcategoryId` = ref UUID da sub.
  const queryClient = useQueryClient()
  const budgetId = detail !== null ? resolveNetworkBudgetId(detail.networks, ctx.estado, ctx.municipio) : null
  const activeSubRef = activeSub?.ref ?? null
  const [ipcaSavedTick, setIpcaSavedTick] = useState(0)
  const ipcaMutation = useMutation({
    mutationFn: budgetPlansRepository.postIpcaResult,
    onSuccess: (res) => {
      if (isErr(res)) return
      void queryClient.invalidateQueries({ queryKey: planDetailQueryKey(ctx.planId) })
      setIpcaSavedTick((t) => t + 1)
    },
  })
  const canPersistIpca = budgetId !== null && activeSubRef !== null
  const applyIpca = (baseValueInCents: number, ipca: number): void => {
    if (budgetId === null || activeSubRef === null) return
    ipcaMutation.mutate({ planId: ctx.planId, budgetId, subcategoryId: activeSubRef, baseValueInCents, ipca })
  }

  return {
    centros: centros.map((c) => ({ id: c.id, name: c.name, active: c.id === activeCentro?.id })),
    categories: cats.map((c) => ({ id: c.id, name: c.name, active: c.id === activeCat?.id })),
    subCategories: subs.map((s) => ({ id: s.id, name: s.name, active: s.id === activeSub?.id })),
    despesas: MONTH_NAMES.map((name, i) => ({
      monthIndex: i,
      name,
      cents: activeMonths[i] ?? 0,
      label: formatCentsBRL(activeMonths[i] ?? 0),
    })),
    totalLabel: formatCentsBRL(sumMonths(activeMonths)),
    hasData: activeSub !== null,
    activeReleaseType: activeSub?.releaseType ?? 'IPCA',
    setCentro: goCentro,
    setCategoria: goCategoria,
    setSub: setSubId,
    prevCentro: () => {
      const idx = centros.findIndex((c) => c.id === activeCentro?.id)
      const prev = centros[idx - 1]
      if (prev !== undefined) goCentro(prev.id)
    },
    nextCentro: () => {
      const idx = centros.findIndex((c) => c.id === activeCentro?.id)
      const next = centros[idx + 1]
      if (next !== undefined) goCentro(next.id)
    },
    setMonthValue: editMonth,
    applyToMonths: (monthIndices, cents) => {
      setMonths(new Set(monthIndices), cents)
    },
    clearMonth: (monthIndex) => {
      editMonth(monthIndex, 0)
    },
    canPersistIpca,
    applyIpca,
    ipcaSaving: ipcaMutation.isPending,
    ipcaError: ipcaMutation.isError || (ipcaMutation.data !== undefined && isErr(ipcaMutation.data)),
    ipcaSavedTick,
  }
}
