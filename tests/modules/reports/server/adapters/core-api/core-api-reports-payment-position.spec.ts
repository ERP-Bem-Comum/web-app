/**
 * core-api-reports.getPaymentPosition (Vitest/jsdom) — threading dos filtros (#588) para a QUERYSTRING do
 * `GET /reports/payment-position`. Mocka o `resultFetch` (a borda HTTP) e inspeciona a URL montada:
 *   • só os campos DEFINIDOS entram (undefined é OMITIDO; AND no servidor);
 *   • filtro vazio → sem `?` (endpoint puro);
 *   • os valores (refs, janela [dueFrom,dueTo), status) chegam crus.
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

const client = createCoreApiReportsClient('http://api/reports')

/** URL da 1ª (única) chamada ao resultFetch. */
function calledUrl(): string {
  const first = mFetch.mock.calls[0]
  if (first === undefined) throw new Error('resultFetch não foi chamado')
  return first[0]
}

describe('getPaymentPosition — querystring dos filtros (#588)', () => {
  it('filtro VAZIO → endpoint puro, sem "?"', async () => {
    mFetch.mockResolvedValue(ok({ positions: [] }))
    await client.getPaymentPosition({}, 'tok')
    expect(calledUrl()).toBe('http://api/reports/payment-position')
  })

  it('só os campos DEFINIDOS entram; os ausentes são omitidos', async () => {
    mFetch.mockResolvedValue(ok({ positions: [] }))
    await client.getPaymentPosition(
      {
        budgetPlanRef: 'bp-1',
        supplierRef: 's-1',
        status: 'Approved',
        dueFrom: '2026-01-01',
        dueTo: '2026-02-01',
      },
      'tok',
    )
    const url = calledUrl()
    expect(url).toContain('budgetPlanRef=bp-1')
    expect(url).toContain('supplierRef=s-1')
    expect(url).toContain('status=Approved')
    expect(url).toContain('dueFrom=2026-01-01')
    expect(url).toContain('dueTo=2026-02-01')
    // Não recortados → não aparecem.
    expect(url).not.toContain('cedenteAccountRef')
    expect(url).not.toContain('categoryRef')
  })

  it('passa o token à borda HTTP', async () => {
    mFetch.mockResolvedValue(ok({ positions: [] }))
    await client.getPaymentPosition({ costCenterRef: 'cc-1' }, 'tok-123')
    expect(mFetch.mock.calls[0]?.[1]).toEqual({ token: 'tok-123' })
    expect(calledUrl()).toContain('costCenterRef=cc-1')
  })
})
