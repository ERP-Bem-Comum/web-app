/**
 * AnalisePagamentosPage (Vitest/jsdom) — tela do relatório "Análise de Pagamentos" LIGADA À FONTE REAL
 * (#446, via `reportsRepository.getPaymentAnalysis` MOCKADO):
 *   1. loading → ready: enquanto a query resolve mostra "Carregando…"; depois a matriz/gráficos.
 *   2. matriz: renderiza os planos (raízes) + a linha "Valor total do período" + o título do card.
 *   3. passador de mês: janela inicial (meses derivados do dado) com "Meses anteriores" desabilitado.
 *   4. 2 gráficos: "Distribuição por Centro de Custo" + "Distribuição Mensal".
 *   5. expand/collapse: expandir um plano adiciona a linha do centro de custo na tabela.
 *   6. export: clicar "CSV" no dropdown Exportar dispara o download (Blob + anchor).
 *   7. empty-state honesto: `data: []` → painel único de vazio (sem "Valor total do período").
 *   8. erro do BFF → painel de erro (tag i18n), nunca status HTTP.
 * Fixtures SINTÉTICAS.
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok, err } from '#shared/primitives/result.ts'
import type { PaymentAnalysis } from '#modules/reports/client/data/model/payment-analysis.model.ts'
import { reportsRepository } from '#modules/reports/client/data/repository/reports.repository.instance.ts'
import { AnalisePagamentosPage } from '#modules/reports/client/page/analise-pagamentos.page.tsx'
import { analiseReportFromAnalysis } from '#modules/reports/client/analise.view-model.ts'

vi.mock('#modules/reports/client/data/repository/reports.repository.instance.ts', () => ({
  reportsRepository: { getPaymentAnalysis: vi.fn() },
}))

// Fontes de filtro cross-módulo: a cascata de Centro/Categoria/Subcategoria vem de HOOKS do financial
// (mockados como [] — sem plano selecionado). `listCedenteAccountsFn` popula a Conta (aqui vazio).
vi.mock('#modules/financial/public-api/index.ts', () => ({
  listCedenteAccountsFn: vi.fn(() => Promise.resolve({ ok: false, error: 'forbidden' })),
  useCostCenterOptionsFromPlan: vi.fn(() => []),
  useCategoryOptionsFromPlan: vi.fn(() => []),
  useSubcategoryOptionsFromPlan: vi.fn(() => []),
}))

const mAnalysis = vi.mocked(reportsRepository.getPaymentAnalysis)

// Fixture: 2 planos × 1 centro de custo cada, série de 3 meses (jan–mar/2026).
const ANALYSIS: PaymentAnalysis = {
  totalValueOfPeriod: 90000,
  data: [
    {
      id: 'p1',
      name: 'Plano Alfa',
      total: 60000,
      itens: [
        { monthYear: '2026-01', total: 20000 },
        { monthYear: '2026-02', total: 20000 },
        { monthYear: '2026-03', total: 20000 },
      ],
      costCenters: [
        {
          id: 'c1',
          name: 'Centro X',
          total: 60000,
          itens: [
            { monthYear: '2026-01', total: 20000 },
            { monthYear: '2026-02', total: 20000 },
            { monthYear: '2026-03', total: 20000 },
          ],
        },
      ],
    },
    {
      id: 'p2',
      name: 'Plano Beta',
      total: 30000,
      itens: [
        { monthYear: '2026-01', total: 10000 },
        { monthYear: '2026-02', total: 10000 },
        { monthYear: '2026-03', total: 10000 },
      ],
      costCenters: [
        {
          id: 'c2',
          name: 'Centro Y',
          total: 30000,
          itens: [
            { monthYear: '2026-01', total: 10000 },
            { monthYear: '2026-02', total: 10000 },
            { monthYear: '2026-03', total: 10000 },
          ],
        },
      ],
    },
  ],
}

const report = analiseReportFromAnalysis(ANALYSIS)
const firstPlano = report.planos[0]
const firstCostCenter = firstPlano?.children[0]

function renderPage(): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  render(<AnalisePagamentosPage />, { wrapper })
}

/** Renderiza e aguarda a matriz real aparecer (query resolveu). */
async function renderReady(): Promise<void> {
  mAnalysis.mockResolvedValue(ok(ANALYSIS))
  renderPage()
  await screen.findByText('Valor total do período')
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AnalisePagamentosPage — fonte real (loading/ready)', () => {
  it('mostra o estado de carregamento enquanto a query não resolve', () => {
    mAnalysis.mockReturnValue(new Promise(() => undefined))
    renderPage()
    expect(screen.getByText('Carregando a análise…')).toBeTruthy()
  })

  it('resolve com os dados REAIS do repository (não do placeholder)', async () => {
    await renderReady()
    expect(mAnalysis).toHaveBeenCalledTimes(1)
    expect(screen.getAllByText('Plano Alfa').length).toBeGreaterThan(0)
  })
})

describe('AnalisePagamentosPage — aplicar período (De/Até + Filtrar)', () => {
  it('1ª carga usa a janela default; mudar as datas NÃO refetch; "Filtrar" aplica o período', async () => {
    await renderReady()
    // 1ª carga: consulta com a janela ampla default (não o período do usuário).
    expect(mAnalysis).toHaveBeenCalledTimes(1)
    const year = new Date().getFullYear()
    expect(mAnalysis).toHaveBeenLastCalledWith({
      dueStart: `${String(year - 2)}-01-01`,
      dueEnd: `${String(year + 2)}-01-01`,
    })

    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    // Editar as datas NÃO deve refetch (só draft).
    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-07-01' } })
    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '2026-09-01' } })
    expect(mAnalysis).toHaveBeenCalledTimes(1)

    // "Filtrar" aplica → re-busca com o período informado.
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    await waitFor(() => {
      expect(mAnalysis).toHaveBeenCalledTimes(2)
    })
    expect(mAnalysis).toHaveBeenLastCalledWith({ dueStart: '2026-07-01', dueEnd: '2026-09-01' })
  })

  it('período incompleto (só uma data) → cai no default (não aplica recorte)', async () => {
    await renderReady()
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-07-01' } })
    // Até vazio → toQuery devolve undefined → binding usa a janela default.
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    const year = new Date().getFullYear()
    // Continua no default (não houve recorte parcial inválido).
    expect(mAnalysis).toHaveBeenLastCalledWith({
      dueStart: `${String(year - 2)}-01-01`,
      dueEnd: `${String(year + 2)}-01-01`,
    })
  })
})

describe('AnalisePagamentosPage — matriz tempo-orçamentária', () => {
  it('renderiza os planos (raízes) e a linha "Valor total do período"', async () => {
    await renderReady()
    expect(firstPlano).toBeDefined()
    expect(screen.getAllByText(firstPlano?.name ?? '').length).toBeGreaterThan(0)
    expect(screen.getByText('Valor total do período')).toBeTruthy()
    expect(screen.getByText('Análise por plano orçamentário')).toBeTruthy()
  })

  it('mostra os 2 gráficos (Distribuição por Centro de Custo + Distribuição Mensal)', async () => {
    await renderReady()
    expect(screen.getByText('Distribuição por Centro de Custo')).toBeTruthy()
    expect(screen.getByText('Distribuição Mensal')).toBeTruthy()
  })
})

describe('AnalisePagamentosPage — passador de mês', () => {
  it('começa em "Jan/26 – Mar/26" (meses derivados do dado) com "Meses anteriores" desabilitado', async () => {
    await renderReady()
    expect(screen.getByText('Jan/26 – Mar/26')).toBeTruthy()
    const prev = screen.getByRole('button', { name: 'Meses anteriores' })
    expect(prev.hasAttribute('disabled')).toBe(true)
  })
})

describe('AnalisePagamentosPage — expand/collapse', () => {
  it('expandir um plano adiciona a linha do centro de custo na tabela', async () => {
    await renderReady()
    const ccName = firstCostCenter?.name ?? '__none__'
    const before = screen.getAllByText(ccName).length
    const btn = screen.getAllByRole('button', { name: 'Expandir' })[0]
    if (btn === undefined) throw new Error('sem botão Expandir')
    fireEvent.click(btn)
    expect(screen.getAllByText(ccName).length).toBeGreaterThan(before)

    const collapseBtn = screen.getAllByRole('button', { name: 'Recolher' })[0]
    if (collapseBtn === undefined) throw new Error('sem botão Recolher')
    fireEvent.click(collapseBtn)
    expect(screen.getAllByText(ccName).length).toBe(before)
  })
})

describe('AnalisePagamentosPage — export CSV', () => {
  it('clicar em "CSV" no menu Exportar dispara o download (cria e clica um anchor)', async () => {
    const createUrl = vi.fn(() => 'blob:analise')
    const revokeUrl = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { value: createUrl, configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeUrl, configurable: true })
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    await renderReady()
    fireEvent.click(screen.getByRole('button', { name: 'CSV' }))

    expect(createUrl).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeUrl).toHaveBeenCalledTimes(1)
  })
})

describe('AnalisePagamentosPage — empty & erro', () => {
  it('backend devolve data:[] → empty-state honesto (sem "Valor total do período")', async () => {
    mAnalysis.mockResolvedValue(ok({ totalValueOfPeriod: 0, data: [] }))
    renderPage()
    await screen.findByText('Nenhum dado para exibir.')
    expect(screen.queryByText('Valor total do período')).toBeNull()
  })

  it('erro do BFF → painel de erro com a tag i18n (nunca status HTTP)', async () => {
    mAnalysis.mockResolvedValue(err('forbidden'))
    renderPage()
    await screen.findByText('Não foi possível carregar o relatório.')
    expect(screen.getByText('Você não tem permissão para ver este relatório.')).toBeTruthy()
  })
})
