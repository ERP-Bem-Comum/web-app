/**
 * AnaliseRecebimentosPage + AnaliseReportView (Vitest/jsdom) — comportamento da tela "Análise de Recebimentos":
 *   1. COM placeholder (fonte 'r' cheia): título de recebimentos + 2 gráficos (Distribuição por Centro de Custo
 *      + Distribuição Mensal) + tabela-matriz ("Análise por plano orçamentário") + passador de meses render.
 *   2. filtros: o toggle "Filtros" revela os selects; o período é o do lado de receber ("Período de recebimento").
 *   3. export: clicar "CSV" no dropdown dispara o download (Blob + anchor).
 *   4. EMPTY STATE (crítico): com um relatório VAZIO (0 planos, total 0), a tela mostra o empty state honesto
 *      "Nenhum recebimento registrado" — SEM gráficos/tabela/filtros quebrados (validando a remoção futura do
 *      placeholder). Testado renderizando o `AnaliseReportView` compartilhado com um relatório vazio injetado.
 *
 * Sem non-null assertion `!` (guardas explícitas). O engine/derivações são cobertos por node:test.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { AnaliseRecebimentosPage } from '#modules/reports/client/page/analise-recebimentos.page.tsx'
import {
  AnaliseReportView,
  type AnaliseReportViewLabels,
} from '#modules/reports/client/components/analise-report-view.component.tsx'
import { loadAnalise, monthsInRange, ANALISE_PERIOD } from '#modules/reports/client/analise.view-model.ts'
import type { AnaliseReport } from '#modules/reports/client/analise.view-model.ts'

const report = loadAnalise('r')
const firstPlano = report.planos[0]

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('AnaliseRecebimentosPage — COM placeholder (fonte cheia)', () => {
  it('mostra o título "Análise de Recebimentos"', () => {
    render(<AnaliseRecebimentosPage />)
    expect(screen.getByText('Análise de Recebimentos')).toBeTruthy()
  })

  it('renderiza os planos (raízes) e a linha "Valor total do período"', () => {
    render(<AnaliseRecebimentosPage />)
    expect(firstPlano).toBeDefined()
    expect(screen.getAllByText(firstPlano?.name ?? '__none__').length).toBeGreaterThan(0)
    expect(screen.getByText('Valor total do período')).toBeTruthy()
    expect(screen.getByText('Análise por plano orçamentário')).toBeTruthy()
  })

  it('mostra os 2 gráficos (Distribuição por Centro de Custo + Distribuição Mensal)', () => {
    render(<AnaliseRecebimentosPage />)
    expect(screen.getByText('Distribuição por Centro de Custo')).toBeTruthy()
    expect(screen.getByText('Distribuição Mensal')).toBeTruthy()
  })

  it('começa em "Jan/26 – Mar/26" com "Meses anteriores" desabilitado', () => {
    render(<AnaliseRecebimentosPage />)
    expect(screen.getByText('Jan/26 – Mar/26')).toBeTruthy()
    const prev = screen.getByRole('button', { name: 'Meses anteriores' })
    expect(prev.hasAttribute('disabled')).toBe(true)
  })

  it('o toggle "Filtros" revela os selects; o período é "Período de recebimento"', () => {
    render(<AnaliseRecebimentosPage />)
    const toggle = screen.getByRole('button', { name: 'Filtros' })
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByLabelText('Programa')).toBeTruthy()
    expect(screen.getByLabelText('Período de recebimento')).toBeTruthy()
  })
})

describe('AnaliseRecebimentosPage — export CSV', () => {
  it('clicar em "CSV" no menu Exportar dispara o download (cria e clica um anchor)', () => {
    const createUrl = vi.fn(() => 'blob:analise-rec')
    const revokeUrl = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { value: createUrl, configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeUrl, configurable: true })
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    render(<AnaliseRecebimentosPage />)
    fireEvent.click(screen.getByRole('button', { name: 'CSV' }))

    expect(createUrl).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeUrl).toHaveBeenCalledTimes(1)
  })
})

// Empty state honesto: relatório VAZIO (fonte `[]` quando o placeholder for removido). Renderiza o
// AnaliseReportView compartilhado com um relatório vazio + os rótulos de recebimentos. As colunas de mês
// permanecem definidas (a matriz TERIA colunas) — mas nada é exibido no caminho vazio.
const EMPTY_REPORT: AnaliseReport = {
  totalPeriodo: 0,
  months: monthsInRange(ANALISE_PERIOD),
  planos: [],
}

const RECEBIMENTOS_LABELS: AnaliseReportViewLabels = {
  back: 'Voltar',
  title: 'Análise de Recebimentos',
  filters: {
    title: 'Filtros',
    allOption: 'Todos',
    programa: 'Programa',
    plano: 'Plano Orçamentário',
    periodo: 'Período de recebimento',
    periodoDe: 'De',
    periodoAte: 'Até',
    conta: 'Conta bancária',
    status: 'Status',
    centro: 'Centro de custo',
    categoria: 'Categoria',
    subcategoria: 'Subcategoria',
    filtrar: 'Filtrar',
    limpar: 'Limpar filtros',
    statusChips: ['Rascunho', 'Aberto', 'Aprovado', 'Pago', 'Conciliado'],
  },
  export: { label: 'Exportar', csv: 'CSV', pdf: 'PDF' },
  charts: { byCostCenter: 'Distribuição por Centro de Custo', monthly: 'Distribuição Mensal' },
  chartEmptyLabel: 'Nenhum dado para exibir.',
  table: {
    cardTitle: 'Análise por plano orçamentário',
    nameCol: 'Plano Orçamentário / Centro de custo',
    totalCol: 'Valor total',
    totalRow: 'Valor total do período',
    expand: 'Expandir',
    collapse: 'Recolher',
    prevMonths: 'Meses anteriores',
    nextMonths: 'Próximos meses',
  },
  empty: 'Nenhum recebimento registrado',
  emptyHint: 'Ainda não há recebíveis lançados.',
}

describe('Análise de Recebimentos — EMPTY STATE honesto (relatório vazio)', () => {
  it('mostra "Nenhum recebimento registrado" e o título, SEM gráficos/tabela/filtros', () => {
    render(
      <AnaliseReportView
        report={EMPTY_REPORT}
        labels={RECEBIMENTOS_LABELS}
        csvFilename="analise-recebimentos.csv"
        chartTone="rec"
      />,
    )
    // Empty state presente.
    expect(screen.getByText('Nenhum recebimento registrado')).toBeTruthy()
    // Cabeçalho (título) permanece.
    expect(screen.getByText('Análise de Recebimentos')).toBeTruthy()
    // NADA quebrado: sem gráficos, sem tabela (Valor total do período), sem Filtros.
    expect(screen.queryByText('Distribuição por Centro de Custo')).toBeNull()
    expect(screen.queryByText('Análise por plano orçamentário')).toBeNull()
    expect(screen.queryByText('Valor total do período')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Filtros' })).toBeNull()
  })
})
