/**
 * Export CSV do Consolidado ABC (Vitest/jsdom) — comportamento do botão "Exportar CSV":
 *   1. clicar dispara a server fn (via gateway mockado) com os filtros correntes;
 *   2. no sucesso, baixa o artefato que o BFF gerou (Blob + anchor) — o CSV NÃO é montado no client;
 *   3. no erro, mostra a mensagem de falha e NÃO dispara download.
 * O CSV chega PRONTO do servidor (Decisão 11): o teste garante que o client só repassa `content` ao download.
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { exportConsolidadoAbcCsv } from '#modules/budget-plans/client/data/consolidado-export.gateway.ts'
import { useConsolidadoExport } from '#modules/budget-plans/client/planejamento/consolidado/consolidado-export.binding.ts'
import { ConsolidadoFilters } from '#modules/budget-plans/client/planejamento/consolidado/components/consolidado-filters.component.tsx'

vi.mock('#modules/budget-plans/client/data/consolidado-export.gateway.ts', () => ({
  exportConsolidadoAbcCsv: vi.fn(),
}))

const mockedExport = vi.mocked(exportConsolidadoAbcCsv)

function Harness(): ReactNode {
  const exp = useConsolidadoExport({ year: 2026, programRef: undefined })
  return (
    <div>
      <ConsolidadoFilters
        value={{ year: 2026, programRef: undefined }}
        years={[2026]}
        programOptions={[{ ref: 'p1', label: 'PARC' }]}
        labels={{ yearBase: 'Ano Base', programs: 'Programas', apply: 'Filtrar', exportCsv: 'Exportar CSV' }}
        exporting={exp.exporting}
        onApply={() => undefined}
        onExport={exp.exportCsv}
      />
      {exp.errorTag !== null ? <p role="alert">{exp.errorTag}</p> : null}
    </div>
  )
}

const renderHarness = (): void => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <Harness />
    </QueryClientProvider>,
  )
}

let createUrl: ReturnType<typeof vi.fn>
let revokeUrl: ReturnType<typeof vi.fn>
let clickSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  createUrl = vi.fn(() => 'blob:consolidado')
  revokeUrl = vi.fn()
  Object.defineProperty(URL, 'createObjectURL', { value: createUrl, configurable: true })
  Object.defineProperty(URL, 'revokeObjectURL', { value: revokeUrl, configurable: true })
  clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('Consolidado ABC — export CSV (server-side)', () => {
  it('clicar "Exportar CSV" chama a server fn com os filtros correntes', async () => {
    mockedExport.mockResolvedValue({
      ok: true,
      value: { filename: 'consolidado-abc-2026.csv', content: '"a","b"' },
    })
    renderHarness()

    fireEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }))

    await waitFor(() => {
      expect(mockedExport).toHaveBeenCalledWith({ year: 2026, programRef: undefined })
    })
  })

  it('no sucesso, baixa o artefato do BFF (cria e clica um anchor)', async () => {
    mockedExport.mockResolvedValue({
      ok: true,
      value: { filename: 'consolidado-abc-2026.csv', content: '"a","b"' },
    })
    renderHarness()

    fireEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }))

    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalledTimes(1)
    })
    expect(createUrl).toHaveBeenCalledTimes(1)
    expect(revokeUrl).toHaveBeenCalledTimes(1)
  })

  it('no erro, mostra a mensagem e NÃO dispara download', async () => {
    mockedExport.mockResolvedValue({ ok: false, error: 'export-failed' })
    renderHarness()

    fireEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('budget-plans.consolidado.exportError')
    })
    expect(clickSpy).not.toHaveBeenCalled()
  })
})
