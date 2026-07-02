/**
 * Binding da tela "Calculando Gastos" (US2.4b) — ADAPTER React (§XI). UI-state local: aba (centro),
 * categoria/subcategoria selecionadas e os 12 meses EDITÁVEIS da subcategoria (overrides sobre o
 * placeholder). O total é derivado (soma). "Calcular"/"Salvar" persistem só na 2.4c/#113.
 */
import { useMemo, useState } from 'react'

import {
  buildCalcGastosCentros,
  formatCentsBRL,
  sumMonths,
  MONTH_NAMES,
  type CalcCentro,
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
  setCentro: (id: number) => void
  setCategoria: (id: number) => void
  setSub: (id: number) => void
  prevCentro: () => void
  nextCentro: () => void
  setMonthValue: (monthIndex: number, cents: number) => void
  clearMonth: (monthIndex: number) => void
}>

const firstId = (list: readonly { id: number }[]): number | null => list[0]?.id ?? null

export function useCalcGastos(detail: PlanDetail | null): CalcGastosBinding {
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

  const editMonth = (monthIndex: number, cents: number): void => {
    if (activeSub === null) return
    const base = monthsOf(activeSub.id, activeSub.monthsInCents)
    const next = base.map((v, i) => (i === monthIndex ? Math.max(0, cents) : v))
    setOverrides((prev) => ({ ...prev, [activeSub.id]: next }))
  }

  const activeMonths = activeSub !== null ? monthsOf(activeSub.id, activeSub.monthsInCents) : []

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
    clearMonth: (monthIndex) => {
      editMonth(monthIndex, 0)
    },
  }
}
