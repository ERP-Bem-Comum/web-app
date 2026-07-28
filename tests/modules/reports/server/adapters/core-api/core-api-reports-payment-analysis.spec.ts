/**
 * core-api-reports.getPaymentAnalysis (Vitest/jsdom) — threading dos filtros (#446) para a QUERYSTRING do
 * `GET /reports/analysis/payables`. Mocka o `resultFetch` (borda HTTP) e inspeciona a URL montada:
 *   • `dueStart`/`dueEnd` (janela [start,end), end EXCLUSIVO) sempre entram;
 *   • `status` só quando definido;
 *   • o token vai à borda; o corpo válido vira Model.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

import { ok } from '#shared/primitives/result.ts'
import { createCoreApiReportsClient } from '#modules/reports/server/adapters/core-api/core-api-reports.ts'

vi.mock('#external/core-api/result-fetch.ts', () => ({ resultFetch: vi.fn() }))
import { resultFetch } from '#external/core-api/result-fetch.ts'

const mFetch = vi.mocked(resultFetch)

afterEach(() => {
  vi.clearAllMocks()
})

const client = createCoreApiReportsClient('http://api/reports', 'http://api/financial')

function calledUrl(): string {
  const first = mFetch.mock.calls[0]
  if (first === undefined) throw new Error('resultFetch não foi chamado')
  return first[0]
}

describe('getPaymentAnalysis — querystring da janela (#446)', () => {
  it('sem status → só dueStart/dueEnd; endpoint /analysis/payables', async () => {
    mFetch.mockResolvedValue(ok({ totalValueOfPeriod: 0, data: [] }))
    await client.getPaymentAnalysis({ dueStart: '2024-01-01', dueEnd: '2028-01-01' }, 'tok')
    const url = calledUrl()
    expect(url).toContain('/analysis/payables?')
    expect(url).toContain('dueStart=2024-01-01')
    expect(url).toContain('dueEnd=2028-01-01')
    expect(url).not.toContain('status=')
  })

  it('com status → entra na querystring; token vai à borda', async () => {
    mFetch.mockResolvedValue(ok({ totalValueOfPeriod: 0, data: [] }))
    await client.getPaymentAnalysis(
      { dueStart: '2026-01-01', dueEnd: '2026-02-01', status: 'Approved' },
      'tok-9',
    )
    expect(calledUrl()).toContain('status=Approved')
    expect(mFetch.mock.calls[0]?.[1]).toEqual({ token: 'tok-9' })
  })

  it('corpo válido vira Model (ok) atravessando o mapper', async () => {
    mFetch.mockResolvedValue(
      ok({
        totalValueOfPeriod: 1000,
        data: [{ id: null, name: null, total: 1000, itens: [], costCenters: [] }],
      }),
    )
    const r = await client.getPaymentAnalysis({ dueStart: '2026-01-01', dueEnd: '2026-02-01' }, 'tok')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.totalValueOfPeriod).toBe(1000)
      expect(r.value.data[0]?.name).toBe(null)
    }
  })
})
