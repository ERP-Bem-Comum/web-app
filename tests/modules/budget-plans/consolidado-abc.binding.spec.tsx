/**
 * useConsolidadoAbc (Vitest/jsdom) — binding do Consolidado ABC (feature 062, leitura real). Cobre a união
 * discriminada §IV do `state` derivada do `GET /budget-plans/consolidated-result` (via repository mockado):
 *   (a) planos → status 'ready' com a curva ordenada por contribuição;
 *   (b) `plans: []` → status 'empty' com o header (ano + total 0);
 *   (c) erro do BFF → status 'error' com a tag;
 *   (d) `programOptions` derivam dos programas reais ATIVO (`listProgramsFn`) — o `/options` dá 500 (#394).
 * O repository é mockado (sem RPC real).
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok, err } from '#shared/primitives/result.ts'
import type { ConsolidatedAbc } from '#modules/budget-plans/client/data/model/consolidado-abc.model.ts'
import { budgetPlansRepository } from '#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts'
import { listProgramsFn } from '#modules/programs/public-api/index.ts'
import { useConsolidadoAbc } from '#modules/budget-plans/client/planejamento/consolidado/consolidado-abc.binding.ts'

vi.mock('#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts', () => ({
  budgetPlansRepository: {
    getConsolidado: vi.fn(),
  },
}))
// Opções de programa do filtro vêm do módulo programs (`listProgramsFn`) — o `/options` do budget-plans dá
// 500 (core-api#394), então o Consolidado usa os programas reais ATIVO, como o modal de criar plano.
vi.mock('#modules/programs/public-api/index.ts', () => ({ listProgramsFn: vi.fn() }))

const mockedGetConsolidado = vi.mocked(budgetPlansRepository.getConsolidado)
const mockedListPrograms = vi.mocked(listProgramsFn)
// Programa ATIVO (id = programRef; sigla = rótulo). Só os campos que o binding usa.
const programsOk = (items: readonly { id: string; sigla: string }[]) =>
  ({ ok: true, data: { items } }) as unknown as Awaited<ReturnType<typeof listProgramsFn>>

const RESULT: ConsolidatedAbc = {
  year: 2026,
  totalInCents: 300_000,
  plans: [
    { id: 'p1', programName: 'Parcerias', programAbbreviation: 'PARC', version: 1, totalInCents: 100_000 },
    {
      id: 'p2',
      programName: 'Tempo Integral',
      programAbbreviation: 'ETI',
      version: 2,
      totalInCents: 200_000,
    },
  ],
}
const EMPTY_RESULT: ConsolidatedAbc = { year: 2026, totalInCents: 0, plans: [] }

const setup = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(() => useConsolidadoAbc({ year: 2026, programRef: undefined }), { wrapper })
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useConsolidadoAbc (GET /budget-plans/consolidated-result)', () => {
  it('(a) planos → status ready com a curva ordenada por contribuição', async () => {
    mockedGetConsolidado.mockResolvedValue(ok(RESULT))
    mockedListPrograms.mockResolvedValue(programsOk([{ id: 'p2', sigla: 'ETI' }]))
    const { result } = setup()

    await waitFor(() => {
      expect(result.current.state.status).toBe('ready')
    })
    const state = result.current.state
    if (state.status !== 'ready') throw new Error('esperava status ready')
    expect(state.header.title).toBe('2026 ABC')
    expect(state.rows[0]?.program).toBe('ETI') // maior contribuição primeiro
    expect(state.rows).toHaveLength(2)
    expect(result.current.programOptions).toEqual([{ ref: 'p2', label: 'ETI' }])
    expect(mockedGetConsolidado).toHaveBeenCalledWith({ year: 2026, programRef: undefined })
  })

  it('(b) plans vazio → status empty com header (total 0)', async () => {
    mockedGetConsolidado.mockResolvedValue(ok(EMPTY_RESULT))
    mockedListPrograms.mockResolvedValue(programsOk([]))
    const { result } = setup()

    await waitFor(() => {
      expect(result.current.state.status).toBe('empty')
    })
    const state = result.current.state
    if (state.status !== 'empty') throw new Error('esperava status empty')
    expect(state.header.title).toBe('2026 ABC')
  })

  it('(c) erro do BFF → status error com a tag', async () => {
    mockedGetConsolidado.mockResolvedValue(err('unexpected'))
    mockedListPrograms.mockResolvedValue(programsOk([]))
    const { result } = setup()

    await waitFor(() => {
      expect(result.current.state.status).toBe('error')
    })
    const state = result.current.state
    if (state.status !== 'error') throw new Error('esperava status error')
    expect(state.errorTag).toBe('unexpected')
  })
})
