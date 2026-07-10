/**
 * usePlanDetail (Vitest/jsdom) — binding do DETALHE do plano (feature 059, leitura real). Cobre a união
 * discriminada §IV do `state` derivada do `GET /budget-plans/:id` (via repository mockado):
 *   (a) dados com estrutura → status 'ready' com a matriz consolidada;
 *   (b) `costCenters: []` (plano novo, só cabeçalho) → status 'empty' com o header;
 *   (c) erro inesperado do BFF → status 'error' com a tag;
 *   (d) `budget-plan-not-found` (404) → status 'not-found'.
 * O repository é mockado (sem RPC real).
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok, err } from '#shared/primitives/result.ts'
import type { PlanDetail, MonthlyCents } from '#modules/budget-plans/client/data/model/plan-detail.model.ts'
import { budgetPlansRepository } from '#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts'
import { usePlanDetail } from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.binding.ts'

vi.mock('#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts', () => ({
  budgetPlansRepository: {
    getPlanDetail: vi.fn(),
    listBudgetPlans: vi.fn(),
    create: vi.fn(),
    getProgramOptions: vi.fn(),
  },
}))

const mockedGetPlanDetail = vi.mocked(budgetPlansRepository.getPlanDetail)

const ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const zero: MonthlyCents = Array.from({ length: 12 }, () => 0)

/** Detalhe mínimo com UMA estrutura de custo (suficiente p/ a matriz sair). */
const PLAN: PlanDetail = {
  id: ID,
  year: 2026,
  programName: 'Ensino de Tempo Integral',
  programAbbreviation: 'ETI',
  version: 1,
  scenarioName: null,
  status: 'RASCUNHO',
  totalInCents: 0,
  networks: [],
  costCenters: [
    {
      id: 1,
      name: 'Consultoria',
      type: 'A PAGAR',
      totalInCents: 0,
      monthlyInCents: zero,
      networkInCents: [],
      categories: [],
    },
  ],
}

const EMPTY_PLAN: PlanDetail = { ...PLAN, costCenters: [] }

const setup = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(() => usePlanDetail(ID), { wrapper })
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('usePlanDetail (GET /budget-plans/:id)', () => {
  it('(a) dados com estrutura → status ready com matriz', async () => {
    mockedGetPlanDetail.mockResolvedValue(ok(PLAN))
    const { result } = setup()

    await waitFor(() => {
      expect(result.current.state.status).toBe('ready')
    })
    const state = result.current.state
    if (state.status !== 'ready') throw new Error('esperava status ready')
    expect(state.header.title).toContain('ETI')
    expect(state.matrix.rows.length).toBeGreaterThan(0)
    expect(mockedGetPlanDetail).toHaveBeenCalledWith(ID)
  })

  it('(b) costCenters vazio → status empty com header', async () => {
    mockedGetPlanDetail.mockResolvedValue(ok(EMPTY_PLAN))
    const { result } = setup()

    await waitFor(() => {
      expect(result.current.state.status).toBe('empty')
    })
    const state = result.current.state
    if (state.status !== 'empty') throw new Error('esperava status empty')
    expect(state.header.title).toContain('ETI')
  })

  it('(c) erro inesperado → status error com a tag', async () => {
    mockedGetPlanDetail.mockResolvedValue(err('unexpected'))
    const { result } = setup()

    await waitFor(() => {
      expect(result.current.state.status).toBe('error')
    })
    const state = result.current.state
    if (state.status !== 'error') throw new Error('esperava status error')
    expect(state.errorTag).toBe('unexpected')
  })

  it('(d) budget-plan-not-found → status not-found', async () => {
    mockedGetPlanDetail.mockResolvedValue(err('budget-plan-not-found'))
    const { result } = setup()

    await waitFor(() => {
      expect(result.current.state.status).toBe('not-found')
    })
  })
})
