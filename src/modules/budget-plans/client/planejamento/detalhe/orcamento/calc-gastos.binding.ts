/**
 * Binding da tela "Calculando Gastos" (§1.7) — ADAPTER React (§XI). UI-state local: aba (centro),
 * categoria/subcategoria selecionadas e os 12 meses da subcategoria. O total é derivado (soma).
 *
 * GRAVA de verdade (core-api#413 destravou): cada form de cálculo vira **um POST por mês selecionado** —
 * não há endpoint de lote, e a chave `(rede, subcategoria, mês)` é o que permite os 12 sem colidir.
 * Recalcular um mês que já tem valor SUBSTITUI (upsert no core-api).
 *
 * Os POSTs vão em SEQUÊNCIA, não em `Promise.all`: são 12 escritas na MESMA chave-vizinhança, e o upsert do
 * core-api não promete ordem sob concorrência. Sequencial é mais lento e previsível — e 12 requests é pouco.
 *
 * FALHA PARCIAL é possível (mês 5 grava, mês 6 falha). Não escondemos: paramos no primeiro erro, invalidamos
 * a grade (o que gravou, gravou — a tela mostra a verdade) e devolvemos o erro. Fingir "salvo" com metade no
 * banco seria pior que a falha.
 */
import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { isErr } from '#shared/primitives/result.ts'
import { budgetPlansRepository } from '#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts'
import type { BudgetPlansError } from '#modules/budget-plans/client/data/repository/budget-plans-error.ts'
import {
  toExerciseMonths,
  type BudgetResultPayload,
} from '#modules/budget-plans/client/planejamento/detalhe/orcamento/budget-result-command.view-model.ts'

import {
  buildCalcGastosCentros,
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
  /**
   * GRAVA o cálculo nos meses escolhidos (um POST por mês). Aplica no estado local ANTES de gravar, p/ a
   * tela responder na hora; o refetch da grade depois confirma (ou desmente) com a verdade do servidor.
   */
  saveCalc: (payload: BudgetResultPayload, monthIndices: readonly number[], cents: number) => void
  saving: boolean
  saveError: BudgetPlansError | null
  /** Some quando o usuário mexe de novo — erro velho na tela mente sobre o estado atual. */
  clearSaveError: () => void
}>

/** Alvo da escrita: sem rede não há onde gravar (a grade é sempre de UMA rede). */
export type CalcGastosTarget = Readonly<{ planId: string; budgetId: string | null }>

const firstId = (list: readonly { id: number }[]): number | null => list[0]?.id ?? null

export function useCalcGastos(detail: PlanDetail | null, target: CalcGastosTarget): CalcGastosBinding {
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

  // ── Escrita ────────────────────────────────────────────────────────────────
  const queryClient = useQueryClient()
  const [saveError, setSaveError] = useState<BudgetPlansError | null>(null)

  const saveMutation = useMutation({
    mutationFn: async (
      v: Readonly<{ payload: BudgetResultPayload; subcategoryRef: string; months: readonly number[] }>,
    ): Promise<BudgetPlansError | null> => {
      if (target.budgetId === null) return 'invalid-input' // sem rede não há alvo — não deveria chegar aqui
      // Sequencial e PARANDO no primeiro erro: 12 escritas na mesma vizinhança de chave; e continuar depois
      // de uma falha só espalharia o estrago sem informar melhor.
      for (const month of v.months) {
        const r = await budgetPlansRepository.postBudgetResult({
          ...v.payload,
          planId: target.planId,
          budgetId: target.budgetId,
          subcategoryId: v.subcategoryRef,
          month,
        })
        if (isErr(r)) return r.error
      }
      return null
    },
    onSuccess: (error) => {
      setSaveError(error)
      // Invalida SEMPRE — inclusive no erro parcial: o que gravou, gravou, e a tela tem que mostrar isso.
      void queryClient.invalidateQueries({ queryKey: ['budget-plans'] })
    },
    onError: () => {
      setSaveError('unexpected')
      void queryClient.invalidateQueries({ queryKey: ['budget-plans'] })
    },
  })

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
    saveCalc: (payload, monthIndices, cents) => {
      if (activeSub === null) return
      const months = toExerciseMonths(monthIndices)
      if (months.length === 0) return // nenhum mês marcado: não há o que gravar
      setSaveError(null)
      setMonths(new Set(monthIndices), cents) // eco otimista; o refetch confirma
      saveMutation.mutate({ payload, subcategoryRef: activeSub.ref, months })
    },
    saving: saveMutation.isPending,
    saveError,
    clearSaveError: () => {
      setSaveError(null)
    },
  }
}
