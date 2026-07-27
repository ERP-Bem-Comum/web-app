/**
 * useAnalisePagamentos (Vitest/jsdom) — ADAPTER da "Análise de Pagamentos" ligada ao core-api (#446) via
 * `reportsRepository.getPaymentAnalysis` MOCKADO (sem RPC real). União discriminada §IV do `state`:
 *   • loading inicial → ready com o AnaliseReport montado (meses derivados do MIN..MAX do dado);
 *   • resposta vazia (data: []) → ready com planos []/months [] (empty-state honesto na View);
 *   • erro do BFF → status error + tag i18n.
 * Fixtures SINTÉTICAS.
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok, err } from '#shared/primitives/result.ts'
import type { PaymentAnalysis } from '#modules/reports/client/data/model/payment-analysis.model.ts'
import { reportsRepository } from '#modules/reports/client/data/repository/reports.repository.instance.ts'
import { useAnalisePagamentos } from '#modules/reports/client/analise.binding.ts'

vi.mock('#modules/reports/client/data/repository/reports.repository.instance.ts', () => ({
  reportsRepository: { getPaymentAnalysis: vi.fn() },
}))

const mAnalysis = vi.mocked(reportsRepository.getPaymentAnalysis)

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const ANALYSIS: PaymentAnalysis = {
  totalValueOfPeriod: 60000,
  data: [
    {
      id: null,
      name: null, // → "Sem plano"
      total: 60000,
      itens: [
        { monthYear: '2026-01', total: 10000 },
        { monthYear: '2026-03', total: 50000 },
      ],
      costCenters: [
        {
          id: null,
          name: null, // → "Sem centro de custo"
          total: 60000,
          itens: [
            { monthYear: '2026-01', total: 10000 },
            { monthYear: '2026-03', total: 50000 },
          ],
        },
      ],
    },
  ],
}

describe('useAnalisePagamentos', () => {
  it('loading inicial → ready com o relatório montado (meses derivados; fev preenchido com 0)', async () => {
    mAnalysis.mockResolvedValue(ok(ANALYSIS))
    const { result } = renderHook(() => useAnalisePagamentos(), { wrapper: wrapper() })
    expect(result.current.status).toBe('loading')
    await waitFor(() => {
      expect(result.current.status).toBe('ready')
    })
    if (result.current.status === 'ready') {
      expect(result.current.report.totalPeriodo).toBe(60000)
      expect(result.current.report.months).toEqual(['2026-01', '2026-02', '2026-03'])
      expect(result.current.report.planos[0]?.name).toBe('Sem plano')
      expect(result.current.report.planos[0]?.children[0]?.name).toBe('Sem centro de custo')
      expect(result.current.report.planos[0]?.children[0]?.monthCells['2026-02']).toBe(0)
    }
  })

  it('resposta vazia (data: []) → ready com planos []/months [] (empty-state honesto)', async () => {
    mAnalysis.mockResolvedValue(ok({ totalValueOfPeriod: 0, data: [] }))
    const { result } = renderHook(() => useAnalisePagamentos(), { wrapper: wrapper() })
    await waitFor(() => {
      expect(result.current.status).toBe('ready')
    })
    if (result.current.status === 'ready') {
      expect(result.current.report.planos.length).toBe(0)
      expect(result.current.report.months.length).toBe(0)
    }
  })

  it('erro do BFF → status error + tag i18n', async () => {
    mAnalysis.mockResolvedValue(err('forbidden'))
    const { result } = renderHook(() => useAnalisePagamentos(), { wrapper: wrapper() })
    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    if (result.current.status === 'error') {
      expect(result.current.error).toBe('forbidden')
      expect(result.current.errorTag).toBe('reports.error.forbidden')
    }
  })
})
