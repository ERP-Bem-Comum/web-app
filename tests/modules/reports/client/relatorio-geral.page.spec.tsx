/**
 * RelatorioGeralPage + RelatorioGeralTable (Vitest/jsdom) — comportamento com DADOS REAIS (#442, repositório
 * mockado, paginação SERVER-SIDE):
 *   1. renderiza as 15 colunas + Exportar (estado ready);
 *   2. seletor de colunas oculta uma coluna;
 *   3. paginação server-side: "Página 1 de N" (N = ceil(total/perPage)); "Anterior" desabilitado na 1ª página;
 *      "Próxima" re-busca a página seguinte;
 *   4. filtros aplicam: "Filtrar" re-busca com o filtro mapeado + resumo abaixo do título;
 *   5. RelatorioGeralTable: empty-state (lista vazia / sem colunas) — render direto do componente.
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok } from '#shared/primitives/result.ts'
import type { GeneralReportPage } from '#modules/reports/client/data/model/general-report.model.ts'
import { reportsRepository } from '#modules/reports/client/data/repository/reports.repository.instance.ts'
import { RelatorioGeralPage } from '#modules/reports/client/page/relatorio-geral.page.tsx'
import { RelatorioGeralTable } from '#modules/reports/client/components/relatorio-geral-table.component.tsx'

vi.mock('#modules/reports/client/data/repository/reports.repository.instance.ts', () => ({
  reportsRepository: { getGeneralReport: vi.fn() },
}))
vi.mock('#modules/reports/client/posicao-filters.binding.ts', () => ({
  usePosicaoFilterOptions: () => ({
    plano: [{ value: 'plan-1', label: '2026 GOD 1.0' }],
    partner: [{ value: 'sup-1', label: 'Fornecedor X' }],
    conta: [],
    centro: [],
    categoria: [],
    subcategoria: [],
  }),
}))

const mGeneral = vi.mocked(reportsRepository.getGeneralReport)
const TOTAL = 23

/** Gera uma página do #442 (items com `code` dependente da página, p/ detectar a troca de página). */
function makePage(page: number, pageSize: number): GeneralReportPage {
  const remaining = Math.max(0, TOTAL - (page - 1) * pageSize)
  const count = Math.min(pageSize, remaining)
  const items = Array.from({ length: count }, (_unused, i) => ({
    payableId: `p${String(page)}-${String(i)}`,
    documentId: `d${String(page)}-${String(i)}`,
    code: `PAG-${String(page)}-${String(i)}`,
    dueDate: '2026-01-10',
    payeeKind: 'supplier' as const,
    supplierName: `Fornecedor ${String(page)}-${String(i)}`,
    financierName: null,
    collaboratorName: null,
    costCenterName: 'CC',
    categoryName: 'Cat',
    subcategoryName: 'Sub',
    valueCents: 1000,
    contractNumber: null,
    pixKey: null,
    bankAccount: null,
  }))
  return { items, page, pageSize, total: TOTAL }
}

function renderPage(): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  render(<RelatorioGeralPage />, { wrapper })
}

/** Nº de linhas de DADOS (role="row") — desconta a linha de cabeçalho (também role="row"). */
function dataRowCount(): number {
  return screen.getAllByRole('row').length - 1
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('RelatorioGeralPage — tabela + colunas (dados reais mockados)', () => {
  it('renderiza as 15 colunas do legado + Exportar', async () => {
    mGeneral.mockImplementation((q) => Promise.resolve(ok(makePage(q.page, q.limit))))
    renderPage()
    await screen.findByText('Exportar')
    const header = screen.getAllByRole('row')[0]
    if (header === undefined) throw new Error('cabeçalho da tabela ausente')
    const scope = within(header)
    for (const col of [
      'Data',
      'Vencimento',
      'Tipo',
      'Nº Contrato',
      'Código',
      'Parcela',
      'Apontamento',
      'Fornecedor',
      'Financiador',
      'Colaborador',
      'Centro de Custo',
      'Categoria',
      'Subcategoria',
      'PIX/Bancário',
      'Valor',
    ]) {
      expect(scope.getByText(col)).toBeTruthy()
    }
  })

  it('seletor de colunas: desmarcar "Fornecedor" oculta a coluna do cabeçalho', async () => {
    mGeneral.mockImplementation((q) => Promise.resolve(ok(makePage(q.page, q.limit))))
    renderPage()
    await screen.findByText('Exportar')
    const before = screen.getAllByRole('row')[0]
    if (before === undefined) throw new Error('cabeçalho ausente')
    expect(within(before).getByText('Fornecedor')).toBeTruthy()
    fireEvent.click(screen.getByText('Colunas'))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Fornecedor' }))
    const after = screen.getAllByRole('row')[0]
    if (after === undefined) throw new Error('cabeçalho ausente')
    expect(within(after).queryByText('Fornecedor')).toBeNull()
  })
})

describe('RelatorioGeralPage — paginação SERVER-SIDE', () => {
  it('mostra a 1ª página (10 linhas) e "Página 1 de 3" (ceil(23/10)); "Anterior" desabilitado', async () => {
    mGeneral.mockImplementation((q) => Promise.resolve(ok(makePage(q.page, q.limit))))
    renderPage()
    await screen.findByText('Exportar')
    expect(dataRowCount()).toBe(10)
    expect(screen.getByText('Página 1 de 3')).toBeTruthy()
    expect(screen.getByText('Anterior').hasAttribute('disabled')).toBe(true)
  })

  it('"Próxima" re-busca a página 2 (a 1ª linha muda)', async () => {
    mGeneral.mockImplementation((q) => Promise.resolve(ok(makePage(q.page, q.limit))))
    renderPage()
    await screen.findByText('Exportar')
    const firstBefore = screen.getAllByRole('row')[1]?.textContent
    fireEvent.click(screen.getByText('Próxima'))
    await waitFor(() => {
      expect(mGeneral).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }))
    })
    await waitFor(() => {
      expect(screen.getAllByRole('row')[1]?.textContent).not.toBe(firstBefore)
    })
  })
})

describe('RelatorioGeralPage — filtros aplicam', () => {
  it('"Filtrar" re-busca com o filtro (Plano → budgetPlanId) + resumo abaixo do título', async () => {
    mGeneral.mockImplementation((q) => Promise.resolve(ok(makePage(q.page, q.limit))))
    renderPage()
    await screen.findByText('Exportar')
    fireEvent.change(screen.getByLabelText('Plano Orçamentário'), { target: { value: 'plan-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    await waitFor(() => {
      expect(mGeneral).toHaveBeenCalledWith(expect.objectContaining({ budgetPlanId: 'plan-1', page: 1 }))
    })
    await screen.findByText(/Plano Orçamentário: 2026 GOD 1\.0/)
  })
})

describe('RelatorioGeralTable — empty state', () => {
  it('lista vazia mostra "Nenhum lançamento no período"', () => {
    render(
      <RelatorioGeralTable
        rows={[]}
        columns={[
          { id: 'data', label: 'Data', kind: 'plain' },
          { id: 'valor', label: 'Valor', kind: 'value' },
        ]}
        totalCount={0}
        labels={{
          cardTitle: 'Lançamentos',
          count: '{{count}} lançamentos',
          naLabel: '—',
          empty: 'Nenhum lançamento no período',
          noColumns: 'Selecione ao menos uma coluna para exibir',
        }}
      />,
    )
    expect(screen.getByText('Nenhum lançamento no período')).toBeTruthy()
    const cardEl = screen.getByText('Lançamentos').closest('div')
    if (cardEl === null) throw new Error('cartão da tabela ausente')
    expect(within(cardEl).queryByText('Data')).toBeNull()
  })

  it('nenhuma coluna selecionada mostra "Selecione ao menos uma coluna"', () => {
    render(
      <RelatorioGeralTable
        rows={[]}
        columns={[]}
        totalCount={0}
        labels={{
          cardTitle: 'Lançamentos',
          count: '{{count}} lançamentos',
          naLabel: '—',
          empty: 'Nenhum lançamento no período',
          noColumns: 'Selecione ao menos uma coluna para exibir',
        }}
      />,
    )
    expect(screen.getByText('Selecione ao menos uma coluna para exibir')).toBeTruthy()
  })
})
