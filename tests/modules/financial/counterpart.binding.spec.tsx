/**
 * useCounterpart / useConfirmCounterpart (Vitest/jsdom) — binding da contrapartida esperada (US2 do #269).
 * Cobre a união discriminada §IV do `state` derivada do GET counterpart-suggestions (via repository mockado):
 *   (a) candidatas → 'ready' com as linhas ordenadas por score;
 *   (b) lista vazia → 'none';
 *   (c) erro do BFF → 'error' com a tag;
 *   (d) confirmar com sucesso → invalida o namespace de conciliação + chama onConfirmed;
 *   (e) confirmar com erro (counterpart-not-pending) → errorTag pela cadeia §V.
 * O repository é mockado (sem RPC real).
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok, err } from '#shared/primitives/result.ts'
import type {
  ConfirmCounterpartResult,
  CounterpartSuggestion,
} from '#modules/financial/client/data/model/reconciliation.model.ts'
import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { useCounterpart } from '#modules/financial/client/reconciliation-workspace/counterpart.binding.ts'

vi.mock('#modules/financial/client/data/repository/reconciliation.repository.instance.ts', () => ({
  reconciliationRepository: {
    getCounterpartSuggestions: vi.fn(),
    confirmCounterpart: vi.fn(),
  },
}))

const mockedGet = vi.mocked(reconciliationRepository.getCounterpartSuggestions)
const mockedConfirm = vi.mocked(reconciliationRepository.confirmCounterpart)

const sugg = (o: Partial<CounterpartSuggestion>): CounterpartSuggestion => ({
  counterpartId: o.counterpartId ?? 'c1',
  originAccountRef: o.originAccountRef ?? 'acc-1',
  valueCents: o.valueCents ?? '150050',
  expectedDate: o.expectedDate ?? '2026-06-18',
  score: o.score ?? 90,
})

const setup = (txId: string | null, onConfirmed?: (t: string, r: ConfirmCounterpartResult) => void) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const hook = renderHook(() => useCounterpart(txId, onConfirmed), { wrapper })
  return { ...hook, invalidateSpy }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useCounterpart (GET counterpart-suggestions)', () => {
  it('(a) candidatas → ready com linhas ordenadas por score', async () => {
    mockedGet.mockResolvedValue(
      ok([sugg({ counterpartId: 'a', score: 60 }), sugg({ counterpartId: 'b', score: 95 })]),
    )
    const { result } = setup('tx-1')

    await waitFor(() => {
      expect(result.current.state.tag).toBe('ready')
    })
    const state = result.current.state
    if (state.tag !== 'ready') throw new Error('esperava ready')
    expect(state.rows[0]?.counterpartId).toBe('b') // maior score primeiro
    expect(state.rows).toHaveLength(2)
    expect(mockedGet).toHaveBeenCalledWith({ transactionId: 'tx-1' })
  })

  it('(b) lista vazia → none', async () => {
    mockedGet.mockResolvedValue(ok([]))
    const { result } = setup('tx-1')
    await waitFor(() => {
      expect(result.current.state.tag).toBe('none')
    })
  })

  it('(c) erro do BFF → error com a tag', async () => {
    mockedGet.mockResolvedValue(err('server'))
    const { result } = setup('tx-1')
    await waitFor(() => {
      expect(result.current.state.tag).toBe('error')
    })
    const state = result.current.state
    if (state.tag !== 'error') throw new Error('esperava error')
    expect(state.errorTag).toBe('financial.recon.error.server')
  })

  it('transactionId null → idle sem chamar o repository', () => {
    const { result } = setup(null)
    expect(result.current.state.tag).toBe('idle')
    expect(mockedGet).not.toHaveBeenCalled()
  })
})

describe('useCounterpart confirm (POST /reconciliations/counterpart)', () => {
  it('(d) sucesso → invalida o namespace de conciliação + chama onConfirmed', async () => {
    mockedGet.mockResolvedValue(ok([sugg({ counterpartId: 'c1' })]))
    mockedConfirm.mockResolvedValue(ok({ reconciliationId: 'r1', counterpartId: 'c1' }))
    const onConfirmed = vi.fn()
    const { result, invalidateSpy } = setup('tx-1', onConfirmed)

    await waitFor(() => {
      expect(result.current.state.tag).toBe('ready')
    })
    act(() => {
      result.current.confirm('c1')
    })

    await waitFor(() => {
      expect(mockedConfirm).toHaveBeenCalledWith({ transactionId: 'tx-1', counterpartId: 'c1' })
    })
    await waitFor(() => {
      expect(onConfirmed).toHaveBeenCalledWith('tx-1', { reconciliationId: 'r1', counterpartId: 'c1' })
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['financial', 'reconciliation'] })
    expect(result.current.errorTag).toBeNull()
  })

  it('(e) erro (counterpart-not-pending) → errorTag pela cadeia §V', async () => {
    mockedGet.mockResolvedValue(ok([sugg({ counterpartId: 'c1' })]))
    mockedConfirm.mockResolvedValue(err('counterpart-not-pending'))
    const { result } = setup('tx-1')

    await waitFor(() => {
      expect(result.current.state.tag).toBe('ready')
    })
    act(() => {
      result.current.confirm('c1')
    })

    await waitFor(() => {
      expect(result.current.errorTag).toBe('financial.recon.error.counterpart-not-pending')
    })
  })
})
