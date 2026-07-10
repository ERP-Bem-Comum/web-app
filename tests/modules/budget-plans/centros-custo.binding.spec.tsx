/**
 * useCentrosCusto (Vitest/jsdom) — ESCRITA real da estrutura (feature 061 — Grupo B). Cobre a CASCATA e os
 * erros-valor: (a) nome vazio → tag client-side, sem POST; (b) criar categoria usa o `ref` uuid do centro
 * selecionado; (c) criar subcategoria usa o `ref` uuid da categoria + o `launchType` literal; (d) erro do
 * backend vira tag; (e) após criar um centro, ele é auto-selecionado quando a árvore relê (item novo aparece).
 * O repositório é dublado (vi.mock) — nada de rede.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { ok, err } from '#shared/primitives/result.ts'
import type {
  PlanDetail,
  CostStructureTree,
} from '#modules/budget-plans/client/data/model/plan-detail.model.ts'

const addCostCenter = vi.fn()
const addCategory = vi.fn()
const addSubcategory = vi.fn()

vi.mock('#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts', () => ({
  budgetPlansRepository: { addCostCenter, addCategory, addSubcategory },
}))

// Import DEPOIS do mock (o binding lê o repositório dublado).
const { useCentrosCusto } =
  await import('#modules/budget-plans/client/planejamento/detalhe/centros-custo.binding.ts')

const zero = Array.from({ length: 12 }, () => 0)
const mkCat = (
  id: number,
  ref: string,
  name: string,
  subs: PlanDetail['costCenters'][number]['categories'][number]['subCategories'] = [],
): PlanDetail['costCenters'][number]['categories'][number] => ({
  id,
  ref,
  name,
  totalInCents: 0,
  monthlyInCents: zero,
  networkInCents: [],
  subCategories: subs,
})
const mkCentro = (
  id: number,
  ref: string,
  name: string,
  cats: PlanDetail['costCenters'][number]['categories'] = [],
): PlanDetail['costCenters'][number] => ({
  id,
  ref,
  name,
  type: 'A PAGAR',
  totalInCents: 0,
  monthlyInCents: zero,
  networkInCents: [],
  categories: cats,
})
const mkDetail = (centros: PlanDetail['costCenters']): PlanDetail => ({
  id: 'p1',
  year: 2026,
  programName: 'Programa X',
  programAbbreviation: 'PX',
  version: 1,
  scenarioName: null,
  status: 'RASCUNHO',
  totalInCents: 0,
  networks: [],
  costCenters: centros,
})

const wrapper = ({ children }: { children: ReactNode }): ReactNode => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  addCostCenter.mockReset()
  addCategory.mockReset()
  addSubcategory.mockReset()
})
afterEach(() => {
  cleanup()
})

describe('useCentrosCusto — escrita da estrutura (cascata)', () => {
  it('nome vazio → tag name-required, sem POST', () => {
    const detail = mkDetail([mkCentro(1, 'C1', 'Consultoria')])
    const { result } = renderHook(() => useCentrosCusto('p1', detail), { wrapper })
    act(() => {
      result.current.startForm({ kind: 'add-centro' })
    })
    act(() => {
      result.current.submitForm()
    })
    expect(result.current.errorTag).toBe('name-required')
    expect(addCostCenter).not.toHaveBeenCalled()
  })

  it('criar categoria envia o costCenterId = ref uuid do centro selecionado', async () => {
    addCategory.mockResolvedValue(ok(mkTree()))
    const detail = mkDetail([mkCentro(1, 'CENTRO-UUID', 'Consultoria')])
    const { result } = renderHook(() => useCentrosCusto('p1', detail), { wrapper })
    act(() => {
      result.current.selectCentro(1)
    })
    act(() => {
      result.current.startForm({ kind: 'add-categoria', centroId: 1 })
    })
    act(() => {
      result.current.setNome('Nova Categoria')
    })
    act(() => {
      result.current.submitForm()
    })
    await waitFor(() => {
      expect(addCategory.mock.calls[0]?.[0]).toEqual({
        planId: 'p1',
        costCenterId: 'CENTRO-UUID',
        name: 'Nova Categoria',
      })
    })
  })

  it('criar subcategoria envia categoryId = ref uuid da categoria + launchType literal', async () => {
    addSubcategory.mockResolvedValue(ok(mkTree()))
    const detail = mkDetail([mkCentro(1, 'CENTRO-UUID', 'Consultoria', [mkCat(101, 'CAT-UUID', 'Cat')])])
    const { result } = renderHook(() => useCentrosCusto('p1', detail), { wrapper })
    act(() => {
      result.current.selectCentro(1)
    })
    act(() => {
      result.current.startForm({ kind: 'add-sub', centroId: 1, categoriaId: 101 })
    })
    act(() => {
      result.current.setNome('Nova Sub')
      result.current.setReleaseType('IPCA')
    })
    act(() => {
      result.current.submitForm()
    })
    await waitFor(() => {
      expect(addSubcategory.mock.calls[0]?.[0]).toEqual({
        planId: 'p1',
        categoryId: 'CAT-UUID',
        name: 'Nova Sub',
        launchType: 'IPCA',
      })
    })
  })

  it('erro do backend na criação → errorTag com a tag', async () => {
    addCostCenter.mockResolvedValue(err('budget-plan-not-editable'))
    const detail = mkDetail([])
    const { result } = renderHook(() => useCentrosCusto('p1', detail), { wrapper })
    act(() => {
      result.current.startForm({ kind: 'add-centro' })
    })
    act(() => {
      result.current.setNome('Comunicação')
    })
    act(() => {
      result.current.submitForm()
    })
    await waitFor(() => {
      expect(result.current.errorTag).toBe('budget-plan-not-editable')
    })
  })

  it('centro criado é auto-selecionado quando a árvore relê (cascata)', async () => {
    // A árvore-eco do POST inclui o centro novo (ref C2); o detalhe re-lido passa a ter C1 + C2.
    addCostCenter.mockResolvedValue(ok(mkTree(['C1', 'C2'])))
    const detail1 = mkDetail([mkCentro(1, 'C1', 'Consultoria')])
    const detail2 = mkDetail([mkCentro(1, 'C1', 'Consultoria'), mkCentro(2, 'C2', 'Comunicação')])
    const { result, rerender } = renderHook(
      ({ detail }: { detail: PlanDetail }) => useCentrosCusto('p1', detail),
      {
        wrapper,
        initialProps: { detail: detail1 },
      },
    )
    act(() => {
      result.current.startForm({ kind: 'add-centro' })
    })
    act(() => {
      result.current.setNome('Comunicação')
    })
    act(() => {
      result.current.submitForm()
    })
    rerender({ detail: detail2 })
    await waitFor(() => {
      expect(result.current.selectedCentro?.ref).toBe('C2')
    })
  })
})

/** Árvore-eco mínima (opcionalmente com os refs de centro informados). */
function mkTree(centerRefs: readonly string[] = ['C1']): CostStructureTree {
  return {
    budgetPlanId: 'p1',
    costCenters: centerRefs.map((ref) => ({ ref, name: ref, direction: 'A PAGAR', categories: [] })),
  }
}
