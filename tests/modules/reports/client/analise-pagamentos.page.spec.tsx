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
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react'
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

// Planos/Programas populam Plano e Programa — e são o que torna esses dois filtros APLICÁVEIS (o recorte é
// client-side: o #446 é `.strict()` e não os aceita). Os ids casam com os do `ANALYSIS`.
const planNode = (id: string, abbr: string): Readonly<Record<string, unknown>> => ({
  id,
  year: 2026,
  programName: `Programa ${abbr}`,
  programAbbreviation: abbr,
  version: 1,
  scenarioName: null,
  status: 'APROVADO',
  totalInCents: 0,
  updatedByName: null,
  updatedAt: '2026-01-01',
  networkKind: 'ESTADO',
  partnersCount: 0,
  children: [],
})
vi.mock('#modules/budget-plans/public-api/index.ts', () => ({
  listBudgetPlansFn: vi.fn(() =>
    Promise.resolve({ ok: true, data: { items: [planNode('p1', 'ABC'), planNode('p2', 'XYZ')] } }),
  ),
}))
vi.mock('#modules/programs/public-api/index.ts', () => ({
  listProgramsFn: vi.fn(() =>
    Promise.resolve({
      ok: true,
      data: {
        items: [
          { sigla: 'ABC', name: 'Programa ABC' },
          { sigla: 'XYZ', name: 'Programa XYZ' },
        ],
      },
    }),
  ),
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
    // Resumo do período aplicado abaixo do título (só o período aplica no #446). findByText: aguarda o re-render
    // "ready" após o refetch da nova queryKey.
    await screen.findByText('Período de vencimento: 01/07/2026 – 01/09/2026')
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

describe('AnalisePagamentosPage — aplicar Status (#446)', () => {
  it('Status=Pago manda o ENUM (Paid), muda a queryKey/refetch e entra no resumo; sem Filtrar não refetch', async () => {
    await renderReady()
    expect(mAnalysis).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    // Selecionar o status NÃO deve refetch (só draft).
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'Paid' } })
    expect(mAnalysis).toHaveBeenCalledTimes(1)

    // "Filtrar" aplica → re-busca. Sem datas → janela default + o status.
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    await waitFor(() => {
      expect(mAnalysis).toHaveBeenCalledTimes(2)
    })
    // Confirma que o valor enviado é o ENUM (Paid), não o rótulo ("Pago").
    expect(mAnalysis).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'Paid' }))
    // Resumo mostra o rótulo PT (value→label), sem exibir a janela default como período escolhido.
    await screen.findByText('Status: Pago')
    expect(screen.queryByText(/Período de vencimento:/)).toBeNull()
  })

  it('oferece só o enum reduzido (Aberto/Aprovado/Pago) — sem Rascunho/Transmitido/Conciliado', async () => {
    await renderReady()
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    const statusSelect = screen.getByLabelText('Status')
    expect(within(statusSelect).getByRole('option', { name: 'Aberto' })).toBeTruthy()
    expect(within(statusSelect).getByRole('option', { name: 'Aprovado' })).toBeTruthy()
    expect(within(statusSelect).getByRole('option', { name: 'Pago' })).toBeTruthy()
    expect(within(statusSelect).queryByRole('option', { name: 'Rascunho' })).toBeNull()
    expect(within(statusSelect).queryByRole('option', { name: 'Transmitido' })).toBeNull()
    expect(within(statusSelect).queryByRole('option', { name: 'Conciliado' })).toBeNull()
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

  it('vazio COM filtros → "Filtros" e a barra (De/Até + Filtrar) seguem acessíveis (não prende)', async () => {
    // Repro do bug: período que retorna vazio não pode esconder os filtros.
    mAnalysis.mockResolvedValue(ok({ totalValueOfPeriod: 0, data: [] }))
    renderPage()
    await screen.findByText('Nenhum dado para exibir.')
    const toggle = screen.getByRole('button', { name: 'Filtros' })
    expect(toggle).toBeTruthy()
    fireEvent.click(toggle)
    expect(screen.getByLabelText('De')).toBeTruthy()
    expect(screen.getByLabelText('Até')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Filtrar' })).toBeTruthy()
  })

  it('erro do BFF → painel de erro com a tag i18n (nunca status HTTP)', async () => {
    mAnalysis.mockResolvedValue(err('forbidden'))
    renderPage()
    await screen.findByText('Não foi possível carregar o relatório.')
    expect(screen.getByText('Você não tem permissão para ver este relatório.')).toBeTruthy()
  })
})

/**
 * Recorte CLIENT-SIDE (#446 é `.strict()`: só aceita período+status). Programa/Plano/Centro de Custo
 * aplicam sobre o grão que a resposta JÁ traz (Plano × CC × mês) — sem ida ao servidor, sem refetch.
 */
describe('AnalisePagamentosPage — recorte client-side (Programa/Plano)', () => {
  it('Plano Orçamentário RECORTA a matriz ao clicar Filtrar (client-side; o #446 não aceita o filtro)', async () => {
    mAnalysis.mockResolvedValue(ok(ANALYSIS))
    await renderReady()
    expect(screen.getByText('Plano Beta')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    const plano = await screen.findByLabelText('Plano Orçamentário')
    await waitFor(() => {
      expect(within(plano as HTMLSelectElement).getByText('2026 XYZ 1.0')).toBeTruthy()
    })
    // Antes de "Filtrar" a tela NÃO se mexe (draft) — o Beta continua lá.
    fireEvent.change(plano, { target: { value: 'p2' } })
    expect(screen.getByText('Plano Alfa')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    await waitFor(() => {
      expect(screen.queryByText('Plano Alfa')).toBeNull()
    })
    expect(screen.getByText('Plano Beta')).toBeTruthy()
    // O resumo abaixo do título passa a declarar o que foi aplicado.
    expect(screen.getByText(/Plano Orçamentário: 2026 XYZ 1\.0/)).toBeTruthy()
  })

  it('Programa recorta pelos planos do programa E estreita a lista de Planos', async () => {
    mAnalysis.mockResolvedValue(ok(ANALYSIS))
    await renderReady()

    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    const programa = await screen.findByLabelText('Programa')
    await waitFor(() => {
      expect(within(programa as HTMLSelectElement).getByText('ABC')).toBeTruthy()
    })
    fireEvent.change(programa, { target: { value: 'ABC' } })

    // A lista de Planos passa a mostrar só os do programa escolhido.
    const plano = screen.getByLabelText('Plano Orçamentário') as HTMLSelectElement
    await waitFor(() => {
      expect(within(plano).queryByText('2026 XYZ 1.0')).toBeNull()
    })
    expect(within(plano).getByText('2026 ABC 1.0')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    await waitFor(() => {
      expect(screen.queryByText('Plano Beta')).toBeNull()
    })
    expect(screen.getByText('Plano Alfa')).toBeTruthy()
  })
})
