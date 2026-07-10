/**
 * useBulkDueDate (Vitest/jsdom) — binding do "Alterar vencimento" em LOTE (#162). Cobre a leitura do
 * `outcome` por item da ÚNICA chamada ao endpoint de lote (`bulkUpdateDueDate`, repository mockado):
 *   (a) todos `ok` → sem errorTag + chama onCompleted (fecha o modal);
 *   (b) falha PARCIAL (algum outcome ≠ ok) → errorTag específico + NÃO chama onCompleted;
 *   (c) erro global (Result err de transporte) → errorTag genérico + NÃO chama onCompleted.
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok, err } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import { useBulkDueDate } from '#modules/financial/client/contas-a-pagar-list/bulk-due-date.binding.ts'

vi.mock('#modules/financial/client/data/repository/financial.repository.instance.ts', () => ({
  financialRepository: { bulkUpdateDueDate: vi.fn() },
}))

const mockedBulk = vi.mocked(financialRepository.bulkUpdateDueDate)
const TARGETS = [
  { id: 'd1', version: 3 },
  { id: 'd2', version: 5 },
] as const

const setup = (onCompleted: () => void) => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(() => useBulkDueDate(onCompleted), { wrapper })
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useBulkDueDate (#162 lote)', () => {
  it('(a) todos ok → 1 chamada de lote, sem erro, chama onCompleted', async () => {
    mockedBulk.mockResolvedValue(
      ok([
        { documentId: 'd1', outcome: 'ok' },
        { documentId: 'd2', outcome: 'ok' },
      ]),
    )
    const onCompleted = vi.fn()
    const { result } = setup(onCompleted)

    act(() => {
      result.current.apply(TARGETS, '2026-08-01')
    })

    await waitFor(() => {
      expect(onCompleted).toHaveBeenCalledTimes(1)
    })
    // UMA chamada só (não fan-out) com items+dueDate.
    expect(mockedBulk).toHaveBeenCalledTimes(1)
    expect(mockedBulk).toHaveBeenCalledWith({
      items: [
        { id: 'd1', version: 3 },
        { id: 'd2', version: 5 },
      ],
      dueDate: '2026-08-01',
    })
    expect(result.current.errorTag).toBeNull()
  })

  it('(b) falha parcial (version-conflict) → errorTag específico, sem onCompleted', async () => {
    mockedBulk.mockResolvedValue(
      ok([
        { documentId: 'd1', outcome: 'ok' },
        { documentId: 'd2', outcome: 'version-conflict' },
      ]),
    )
    const onCompleted = vi.fn()
    const { result } = setup(onCompleted)

    act(() => {
      result.current.apply(TARGETS, '2026-08-01')
    })

    await waitFor(() => {
      expect(result.current.errorTag).toBe('financial.list.dueDate.errorPartial')
    })
    expect(onCompleted).not.toHaveBeenCalled()
  })

  it('(c) erro global (Result err) → errorTag genérico, sem onCompleted', async () => {
    mockedBulk.mockResolvedValue(err('server'))
    const onCompleted = vi.fn()
    const { result } = setup(onCompleted)

    act(() => {
      result.current.apply(TARGETS, '2026-08-01')
    })

    await waitFor(() => {
      expect(result.current.errorTag).toBe('financial.list.dueDate.error')
    })
    expect(onCompleted).not.toHaveBeenCalled()
  })
})
