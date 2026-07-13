/**
 * useIsolatedDueDate (Vitest/jsdom) — binding do "Alterar vencimento" por TÍTULO ISOLADO (#270). Fan-out: UMA
 * chamada `updatePayableDueDate` por título (não propaga pai↔filhos). Cobre:
 *   (a) todos ok → N chamadas (uma por alvo), sem errorTag, chama onCompleted;
 *   (b) falha PARCIAL (algum Result err) → errorTag específico + NÃO chama onCompleted;
 *   (c) erro global (throw/transporte) → errorTag genérico + NÃO chama onCompleted.
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok, err } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import { useIsolatedDueDate } from '#modules/financial/client/contas-a-pagar-list/isolated-due-date.binding.ts'

vi.mock('#modules/financial/client/data/repository/financial.repository.instance.ts', () => ({
  financialRepository: { updatePayableDueDate: vi.fn() },
}))

const mocked = vi.mocked(financialRepository.updatePayableDueDate)
// 2 títulos do MESMO documento → sequencial, encadeando a version devolvida (a 1ª sobe 3→4).
const TARGETS = [
  { documentId: 'd1', payableId: 'p1', version: 3 },
  { documentId: 'd1', payableId: 'p2', version: 3 },
] as const

// A resposta é o documento atualizado com a NOVA version (o binding a usa p/ o próximo título do mesmo doc).
const detail = { id: 'd1', version: 4 } as never

const setup = (onCompleted: () => void) => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(() => useIsolatedDueDate(onCompleted), { wrapper })
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useIsolatedDueDate (#270 isolado)', () => {
  it('(a) mesmo doc → sequencial, o 2º título usa a version DEVOLVIDA (3→4), sem erro, chama onCompleted', async () => {
    mocked.mockResolvedValue(ok(detail))
    const onCompleted = vi.fn()
    const { result } = setup(onCompleted)
    act(() => {
      result.current.apply(TARGETS, '2026-08-15')
    })
    await waitFor(() => {
      expect(result.current.running).toBe(false)
    })
    // uma chamada por título; o 2º usa a version DEVOLVIDA pelo 1º (4), não a original (3) — evita conflito
    expect(mocked).toHaveBeenCalledTimes(2)
    expect(mocked).toHaveBeenNthCalledWith(1, {
      documentId: 'd1',
      payableId: 'p1',
      version: 3,
      dueDate: '2026-08-15',
    })
    expect(mocked).toHaveBeenNthCalledWith(2, {
      documentId: 'd1',
      payableId: 'p2',
      version: 4,
      dueDate: '2026-08-15',
    })
    expect(result.current.errorTag).toBeNull()
    expect(onCompleted).toHaveBeenCalledTimes(1)
  })

  it('(b) falha parcial (um Result err) → errorTag específico, NÃO chama onCompleted', async () => {
    mocked.mockResolvedValueOnce(ok(detail)).mockResolvedValueOnce(err('invalid-transition'))
    const onCompleted = vi.fn()
    const { result } = setup(onCompleted)
    act(() => {
      result.current.apply(TARGETS, '2026-08-15')
    })
    await waitFor(() => {
      expect(result.current.errorTag).toBe('financial.list.dueDate.errorPartial')
    })
    expect(onCompleted).not.toHaveBeenCalled()
  })

  it('(c) erro global (throw) → errorTag genérico, NÃO chama onCompleted', async () => {
    mocked.mockRejectedValue(new Error('rede'))
    const onCompleted = vi.fn()
    const { result } = setup(onCompleted)
    act(() => {
      result.current.apply(TARGETS, '2026-08-15')
    })
    await waitFor(() => {
      expect(result.current.errorTag).toBe('financial.list.dueDate.error')
    })
    expect(onCompleted).not.toHaveBeenCalled()
  })
})
