/**
 * RealizadoXPlanejadoPage (Vitest/jsdom) — resumo dos filtros APLICADOS abaixo do título (reflete `applied`,
 * não o draft) + o botão "Filtros" sempre acessível. Fonte REAL mockada (`reportsRepository.getRealizedReport`)
 * e as options de filtro mockadas (`realizado-filters.binding`). Fixtures SINTÉTICAS.
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok } from '#shared/primitives/result.ts'
import type { RealizedBudgetRow } from '#modules/reports/client/data/model/realized-report.model.ts'
import { reportsRepository } from '#modules/reports/client/data/repository/reports.repository.instance.ts'
import { RealizadoXPlanejadoPage } from '#modules/reports/client/page/realizado-x-planejado.page.tsx'

vi.mock('#modules/reports/client/data/repository/reports.repository.instance.ts', () => ({
  reportsRepository: { getRealizedReport: vi.fn() },
}))

// Options de filtro mockadas (a resolução UUID→rótulo do resumo usa estas listas).
vi.mock('#modules/reports/client/realizado-filters.binding.ts', () => ({
  useProgramaOptions: () => [{ value: 'prog-1', label: 'GOD' }],
  usePlanoOptions: () => [{ value: 'plan-1', label: '2026 GOD 1.0' }],
  useNetworkOptions: () => ({ estados: [], municipiosByUf: {} }),
  useAnoOptions: () => [2026],
}))

const mRealized = vi.mocked(reportsRepository.getRealizedReport)

const ROWS: readonly RealizedBudgetRow[] = [
  {
    centroCusto: 'Diretoria',
    categoria: 'Consultoria',
    subcategoria: '',
    months: Array.from({ length: 12 }, (_unused, i) => ({
      month: i,
      planejadoCents: i === 0 ? 100000 : 0,
      realizadoCents: i === 0 ? 50000 : 0,
      provisionadoCents: 0,
    })),
  },
]

function renderPage(): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  render(<RealizadoXPlanejadoPage />, { wrapper })
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('RealizadoXPlanejadoPage — resumo dos filtros aplicados', () => {
  it('subtítulo inicial mostra só o Ano (sempre aplicado); mudar draft NÃO altera; "Filtrar" aplica', async () => {
    mRealized.mockResolvedValue(ok(ROWS))
    renderPage()

    // Inicial: applied = { year: 2026 } → subtítulo "Ano: 2026".
    await screen.findByText('Ano: 2026')

    // Abre os filtros e escolhe Programa + Plano (DRAFT — ainda não aplica).
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    fireEvent.change(screen.getByLabelText('Programa'), { target: { value: 'prog-1' } })
    fireEvent.change(screen.getByLabelText('Plano orçamentário'), { target: { value: 'plan-1' } })
    // Sem "Filtrar", o subtítulo NÃO muda (reflete o aplicado, não o draft).
    expect(screen.queryByText(/Programa: GOD/)).toBeNull()

    // "Aplicar filtros" commita → subtítulo passa a refletir o recorte (UUID→rótulo).
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    await screen.findByText('Programa: GOD · Plano orçamentário: 2026 GOD 1.0 · Ano: 2026')
  })

  it('o botão "Filtros" fica acessível mesmo com dado vazio (o usuário reabre e afrouxa)', async () => {
    mRealized.mockResolvedValue(ok([]))
    renderPage()
    // Mesmo sem linhas, a tela monta (KPIs zerados) e o toggle "Filtros" segue no DOM.
    expect(await screen.findByRole('button', { name: 'Filtros' })).toBeTruthy()
    // O subtítulo continua mostrando o Ano aplicado.
    expect(screen.getByText('Ano: 2026')).toBeTruthy()
  })
})
