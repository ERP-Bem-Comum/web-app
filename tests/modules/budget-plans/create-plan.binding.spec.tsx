/**
 * useCreatePlan (Vitest/jsdom) — binding do "Adicionar Plano Orçamentário" (feature 058). Cobre o FLUXO alvo:
 *   1. no sucesso, a server fn (via repository mockado) cria o plano, o binding INVALIDA a lista (a grid relê
 *      o real) e chama `onCreated` (fecha o modal) — sem checagem de unicidade client-side;
 *   2. no 409 (`budget-plan-already-exists`), expõe a tag de CONFLITO do backend e NÃO fecha;
 *   3. form inválido (sem programa) → tag required, sem chamar o repository.
 * O repository é mockado (sem RPC real).
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok, err } from '#shared/primitives/result.ts'
import { budgetPlansRepository } from '#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts'
import { planejamentoListQueryKey } from '#modules/budget-plans/client/planejamento/planejamento-list.binding.ts'
import { useCreatePlan } from '#modules/budget-plans/client/planejamento/create-plan.binding.ts'

vi.mock('#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts', () => ({
  budgetPlansRepository: { create: vi.fn(), getProgramOptions: vi.fn(), listBudgetPlans: vi.fn() },
}))

const mockedCreate = vi.mocked(budgetPlansRepository.create)

const REF = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const CREATED = {
  id: 'p-new',
  year: 2027,
  programRef: REF,
  status: 'RASCUNHO',
  version: '1.0',
  totalInCents: 0,
} as const

const setup = (onCreated: () => void) => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => useCreatePlan(onCreated), { wrapper })
  return { client, result }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useCreatePlan (POST /budget-plans)', () => {
  it('sucesso → invalida a lista e chama onCreated (fecha o modal)', async () => {
    mockedCreate.mockResolvedValue(ok(CREATED))
    const onCreated = vi.fn()
    const { client, result } = setup(onCreated)
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    act(() => {
      result.current.setYear('2027')
      result.current.setProgram(REF)
    })
    act(() => {
      result.current.submit()
    })

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledTimes(1)
    })
    // React Query v5 chama a mutationFn com (variables, context) — checamos só o 1º arg (o input real).
    expect(mockedCreate.mock.calls[0]?.[0]).toEqual({ year: 2027, programRef: REF })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: planejamentoListQueryKey })
    expect(result.current.errorTag).toBeNull()
  })

  it('409 → tag de conflito do backend, NÃO fecha', async () => {
    mockedCreate.mockResolvedValue(err('budget-plan-already-exists'))
    const onCreated = vi.fn()
    const { result } = setup(onCreated)

    act(() => {
      result.current.setYear('2027')
      result.current.setProgram(REF)
    })
    act(() => {
      result.current.submit()
    })

    await waitFor(() => {
      expect(result.current.errorTag).toBe('budget-plans.create.conflict')
    })
    expect(onCreated).not.toHaveBeenCalled()
  })

  it('form inválido (sem programa) → required, sem chamar o repository', () => {
    const onCreated = vi.fn()
    const { result } = setup(onCreated)

    act(() => {
      result.current.submit()
    })

    expect(result.current.errorTag).toBe('budget-plans.create.requiredProgram')
    expect(mockedCreate).not.toHaveBeenCalled()
  })
})
