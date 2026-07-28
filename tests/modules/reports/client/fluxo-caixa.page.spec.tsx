/**
 * FluxoCaixaPage + views (Vitest/jsdom) — comportamento da tela do "Fluxo de Caixa" com DADOS REAIS (#590,
 * repositório mockado):
 *   1. renderiza as 2 seções (Saídas / Entradas) + os 3 gráficos "Previsto × Realizado" (SEM Centro de Custo) + Exportar + KPIs;
 *   2. renderiza os filtros novos (Subcategoria, Status alinhado ao CAP);
 *   3. a seção Entradas VAZIA (receivables []) cai no empty state honesto ("Nenhuma entrada registrada");
 *   4. o donut Previsto × Realizado com totais 0 cai no placeholder honesto (não quebra).
 * A page não usa router (sem mock necessário). O binding usa TanStack Query → QueryClientProvider no wrapper.
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok } from '#shared/primitives/result.ts'
import type { CashflowReport } from '#modules/reports/client/data/model/cashflow.model.ts'
import { reportsRepository } from '#modules/reports/client/data/repository/reports.repository.instance.ts'
import { FluxoCaixaPage } from '#modules/reports/client/page/fluxo-caixa.page.tsx'
import { RealizadoDonut } from '#modules/reports/client/components/realizado-donut.component.tsx'
import { sectionDonutData, aggregateSection } from '#modules/reports/client/fluxo-caixa.view-model.ts'

vi.mock('#modules/reports/client/data/repository/reports.repository.instance.ts', () => ({
  reportsRepository: { getCashflowReport: vi.fn() },
}))

// Opções dos filtros mockadas (evita as server-fns reais de plano/programa/conta/cascata no jsdom).
vi.mock('#modules/reports/client/fluxo-filters.binding.ts', () => ({
  useFluxoFilterOptions: () => ({
    programa: [{ value: 'prog-1', label: 'GOD' }],
    plano: [{ value: 'plan-1', label: '2026 GOD 1.0' }],
    conta: [],
    centro: [],
    categoria: [],
    subcategoria: [],
  }),
}))

const mCashflow = vi.mocked(reportsRepository.getCashflowReport)

// Fixture REAL: Saídas (payables) em 2 categorias; série (chart) em jan e jun/2026 → meses jan..jun.
const REPORT: CashflowReport = {
  receivables: [],
  payables: [
    {
      categoryRef: 'c1',
      categoryName: 'Pessoal',
      subcategoryRef: 's1',
      subcategoryName: 'Salários',
      realizedCents: 800,
      expectedCents: 900,
    },
    {
      categoryRef: 'c2',
      categoryName: 'Operacional',
      subcategoryRef: 's2',
      subcategoryName: 'Aluguel',
      realizedCents: 500,
      expectedCents: 500,
    },
  ],
  chart: [
    {
      categoryRef: 'c1',
      categoryName: 'Pessoal',
      subcategoryRef: 's1',
      subcategoryName: 'Salários',
      realizedCents: 800,
      expectedCents: 900,
      dueMonth: '2026-01',
    },
    {
      categoryRef: 'c2',
      categoryName: 'Operacional',
      subcategoryRef: 's2',
      subcategoryName: 'Aluguel',
      realizedCents: 500,
      expectedCents: 500,
      dueMonth: '2026-06',
    },
  ],
  // Eixo de CC reconstruído pelo BFF via fan-out (o #590 não o expõe).
  byCostCenter: [
    { ref: 'cc1', name: 'Administrativo', realizedCents: 800, expectedCents: 900 },
    { ref: 'cc2', name: 'Programa Saúde', realizedCents: 500, expectedCents: 500 },
  ],
}

function renderPage(): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  render(<FluxoCaixaPage />, { wrapper })
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('FluxoCaixaPage — composição', () => {
  it('renderiza as 2 seções (Saídas / Entradas) como cabeçalhos', async () => {
    mCashflow.mockResolvedValue(ok(REPORT))
    renderPage()
    // "Saídas"/"Entradas" aparecem como título de donut E como cabeçalho de seção — ao menos um de cada.
    expect((await screen.findAllByRole('heading', { name: 'Saídas' })).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('heading', { name: 'Entradas' }).length).toBeGreaterThanOrEqual(1)
  })

  it('renderiza os 4 gráficos "Previsto × Realizado" (incl. Centro de Custo do fan-out)', async () => {
    mCashflow.mockResolvedValue(ok(REPORT))
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Linha do tempo' })).toBeTruthy()
    // O eixo de Centro de Custo é RECONSTRUÍDO pelo BFF via fan-out (o #590 não o expõe nativamente).
    expect(screen.getByRole('heading', { name: 'Agrupado por Centro de Custo' })).toBeTruthy()
    // Os 2 donuts (Entradas / Saídas) — títulos dos cartões.
    expect(screen.getAllByRole('heading', { name: 'Entradas' }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('heading', { name: 'Saídas' }).length).toBeGreaterThanOrEqual(1)
  })

  it('a linha do tempo usa rótulos de período por índice (nunca "Invalid Date")', async () => {
    mCashflow.mockResolvedValue(ok(REPORT))
    renderPage()
    // "Jan/26" aparece na linha do tempo E no cabeçalho do demonstrativo — ao menos uma ocorrência.
    expect((await screen.findAllByText('Jan/26')).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Jun/26').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText(/Invalid Date/)).toBeNull()
  })

  it('renderiza os filtros novos (Subcategoria, Status alinhado ao CAP)', async () => {
    mCashflow.mockResolvedValue(ok(REPORT))
    renderPage()
    expect(await screen.findByLabelText('Subcategoria')).toBeTruthy()
    const status = screen.getByLabelText('Status')
    expect(status).toBeTruthy()
    // Status reusa os chips do Contas a Pagar (Rascunho … Conciliado) + a allOption.
    expect(screen.getByRole('option', { name: 'Conciliado' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Aprovado' })).toBeTruthy()
  })

  it('renderiza o Exportar e os KPIs (Saídas / Entradas / Saldo)', async () => {
    mCashflow.mockResolvedValue(ok(REPORT))
    renderPage()
    expect(await screen.findByText('Exportar')).toBeTruthy()
    expect(screen.getAllByText('Total de Saídas').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Total de Entradas').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Saldo (realizado)')).toBeTruthy()
    expect(screen.getByText('Saldo (previsto)')).toBeTruthy()
  })

  it('filtros aplicam: "Filtrar" re-busca com o filtro mapeado (Plano → budgetPlanId)', async () => {
    mCashflow.mockResolvedValue(ok(REPORT))
    renderPage()
    await screen.findByText('Exportar')
    fireEvent.change(screen.getByLabelText('Plano Orçamentário'), { target: { value: 'plan-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    await waitFor(() => {
      expect(mCashflow).toHaveBeenCalledWith(expect.objectContaining({ budgetPlanId: 'plan-1' }))
    })
  })

  it('empty-state honesto: resposta vazia (0 payables, 0 chart) monta a tela sem quebrar', async () => {
    mCashflow.mockResolvedValue(ok({ receivables: [], payables: [], chart: [], byCostCenter: [] }))
    renderPage()
    // A tela monta (Exportar presente) e as seções caem no empty-state — sem "Invalid Date".
    expect(await screen.findByText('Exportar')).toBeTruthy()
    expect(screen.queryByText(/Invalid Date/)).toBeNull()
  })
})

describe('FluxoCaixaPage — demonstrativo (statement por mês)', () => {
  it('renderiza o demonstrativo com itens de Saída, Fluxo líquido e Saldo acumulado', async () => {
    mCashflow.mockResolvedValue(ok(REPORT))
    renderPage()
    // Título do card do demonstrativo + as linhas-chave do statement.
    expect(await screen.findByRole('heading', { name: 'Demonstrativo de fluxo de caixa' })).toBeTruthy()
    expect(screen.getByText('= Fluxo líquido do período')).toBeTruthy()
    expect(screen.getByText('= Saldo acumulado')).toBeTruthy()
    // Item de Saída (categoria do fixture) presente como linha do demonstrativo.
    expect(screen.getByText('Pessoal')).toBeTruthy()
    // Entradas vazio (receivables []) → nota honesta.
    expect(screen.getByText(/Nenhuma entrada registrada/)).toBeTruthy()
  })
})

describe('Donut Previsto × Realizado — empty state (Entradas vazias)', () => {
  it('seção vazia → fatias zeradas → o donut cai no placeholder honesto (não quebra)', () => {
    const slices = sectionDonutData(aggregateSection([])).map((s) => ({
      id: s.key,
      label: s.key,
      valueCents: s.valueCents,
      measureKey: s.key === 'previsto' ? ('fluxoPrevisto' as const) : ('fluxoRealizado' as const),
    }))
    render(
      <RealizadoDonut
        slices={slices}
        centerValue="0%"
        centerCaption="execução"
        emptyLabel="Sem movimentações no período."
        animate={false}
        formatValue={(c) => String(c)}
        formatPercent={(p) => `${String(p)}%`}
      />,
    )
    expect(screen.getByText('Sem movimentações no período.')).toBeTruthy()
  })
})
