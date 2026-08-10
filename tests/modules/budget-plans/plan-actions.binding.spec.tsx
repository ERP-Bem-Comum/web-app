/**
 * usePlanActions (Vitest/jsdom) — binding das AÇÕES do menu "…" (feature 060). Cobre:
 *   1. approve → chama `repository.approvePlan(id)`, INVALIDA lista + detalhe e reporta `ok`;
 *   2. create-scenery → chama `repository.createScenery(id, name)` com o NOME informado;
 *   3. export-csv → chama `exportPlanCsv`, dispara o download e NÃO invalida;
 *   4. erro de ciclo de vida (409) → reporta a tag por contexto (§V), sem invalidar.
 * O repository é mockado (sem RPC real).
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok, err } from '#shared/primitives/result.ts'
import { budgetPlansRepository } from '#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts'
import { planejamentoListQueryKey } from '#modules/budget-plans/client/planejamento/planejamento-list.binding.ts'
import { planDetailQueryKey } from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.binding.ts'
import {
  usePlanActions,
  type ActionOutcome,
} from '#modules/budget-plans/client/planejamento/plan-actions.binding.ts'

vi.mock('#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts', () => ({
  budgetPlansRepository: {
    approvePlan: vi.fn(),
    startCalibration: vi.fn(),
    createScenery: vi.fn(),
    exportPlanCsv: vi.fn(),
  },
}))

const ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const LIFECYCLE = { id: ID, year: 2027, status: 'APROVADO', version: '1.0', totalInCents: 0 } as const

const setup = (onOutcome: (o: ActionOutcome) => void) => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => usePlanActions(onOutcome), { wrapper })
  return { client, result }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('usePlanActions', () => {
  it('approve → invalida lista + detalhe e reporta ok', async () => {
    vi.mocked(budgetPlansRepository.approvePlan).mockResolvedValue(ok(LIFECYCLE))
    const onOutcome = vi.fn()
    const { client, result } = setup(onOutcome)
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    act(() => {
      result.current.runAction('approve', ID)
    })

    await waitFor(() => {
      expect(onOutcome).toHaveBeenCalledWith({ action: 'approve', ok: true, id: ID, sceneryId: undefined })
    })
    expect(vi.mocked(budgetPlansRepository.approvePlan).mock.calls[0]?.[0]).toBe(ID)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: planejamentoListQueryKey })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: planDetailQueryKey(ID) })
  })

  it('create-scenery → passa o NOME informado', async () => {
    vi.mocked(budgetPlansRepository.createScenery).mockResolvedValue(
      ok({ id: 's1', name: 'Cenário A', status: 'RASCUNHO', version: '1.1' }),
    )
    const onOutcome = vi.fn()
    const { result } = setup(onOutcome)

    act(() => {
      result.current.runAction('create-scenery', ID, 'Cenário A')
    })

    await waitFor(() => {
      // `id` = o PAI: a lista abre o chevron dele para revelar o cenário criado (#423). `sceneryId` = o filho.
      expect(onOutcome).toHaveBeenCalledWith({ action: 'create-scenery', ok: true, id: ID, sceneryId: 's1' })
    })
    expect(vi.mocked(budgetPlansRepository.createScenery).mock.calls[0]?.slice(0, 2)).toEqual([
      ID,
      'Cenário A',
    ])
  })

  it('export-csv → dispara download e NÃO invalida', async () => {
    vi.mocked(budgetPlansRepository.exportPlanCsv).mockResolvedValue(
      ok({ filename: `plano-${ID}.csv`, content: 'a;b\n' }),
    )
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const onOutcome = vi.fn()
    const { client, result } = setup(onOutcome)
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    act(() => {
      result.current.runAction('export-csv', ID)
    })

    await waitFor(() => {
      expect(onOutcome).toHaveBeenCalledWith({ action: 'export-csv', ok: true, id: ID, sceneryId: undefined })
    })
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(createUrl).toHaveBeenCalledTimes(1)
    expect(invalidate).not.toHaveBeenCalled()
  })

  it('409 de ciclo de vida → reporta a tag por contexto, sem invalidar', async () => {
    vi.mocked(budgetPlansRepository.approvePlan).mockResolvedValue(err('budget-plan-already-approved'))
    const onOutcome = vi.fn()
    const { client, result } = setup(onOutcome)
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    act(() => {
      result.current.runAction('approve', ID)
    })

    await waitFor(() => {
      expect(onOutcome).toHaveBeenCalledWith({
        action: 'approve',
        ok: false,
        errorTag: 'budget-plans.action.error.alreadyApproved',
      })
    })
    expect(invalidate).not.toHaveBeenCalled()
  })
})
