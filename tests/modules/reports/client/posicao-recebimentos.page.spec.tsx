/**
 * PosicaoRecebimentosPage + PosicaoReportView (Vitest/jsdom) — comportamento da tela "Posição de Recebimentos":
 *   1. COM placeholder (fonte 'r' cheia): 4 KPIs (Atrasado/Recebido/A receber/Total) + 2 gráficos (Resumo
 *      total + Distribuição por Financiador) + tabela ("Posição por financiador") renderizam; o título é o
 *      de recebimentos; as 3 medidas do lado de receber aparecem.
 *   2. export: clicar "CSV" no dropdown dispara o download (Blob + anchor).
 *   3. EMPTY STATE (crítico): com um relatório VAZIO (0 nós, total 0), a tela mostra o empty state honesto
 *      "Nenhum recebimento registrado" — SEM KPIs/gráficos/tabela quebrados (validando a remoção futura do
 *      placeholder). Testado renderizando o `PosicaoReportView` compartilhado com um relatório vazio injetado.
 *
 * Sem non-null assertion `!` (guardas explícitas). O engine/derivações são cobertos por node:test.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { PosicaoRecebimentosPage } from '#modules/reports/client/page/posicao-recebimentos.page.tsx'
import {
  PosicaoReportView,
  type PosicaoReportViewLabels,
} from '#modules/reports/client/components/posicao-report-view.component.tsx'
import { loadPosicao, CSV_HEADER_RECEBIMENTOS } from '#modules/reports/client/posicao.view-model.ts'
import type { PosicaoReport } from '#modules/reports/client/posicao.view-model.ts'

const report = loadPosicao('r')
const firstFinancier = report.suppliers[0]

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('PosicaoRecebimentosPage — COM placeholder (fonte cheia)', () => {
  it('mostra o título "Posição de Recebimentos"', () => {
    render(<PosicaoRecebimentosPage />)
    expect(screen.getByText('Posição de Recebimentos')).toBeTruthy()
  })

  it('renderiza os 4 KPIs de recebíveis (Atrasado / Recebido / A receber / Total)', () => {
    render(<PosicaoRecebimentosPage />)
    expect(screen.getAllByText('Atrasado').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Recebido').length).toBeGreaterThan(0)
    expect(screen.getAllByText('A receber').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Total').length).toBeGreaterThan(0)
  })

  it('mostra as 3 medidas do lado de receber (Em atraso / Recebido / A receber)', () => {
    render(<PosicaoRecebimentosPage />)
    expect(screen.getAllByText('Em atraso').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Recebido').length).toBeGreaterThan(0)
    expect(screen.getAllByText('A receber').length).toBeGreaterThan(0)
  })

  it('mostra os 2 gráficos (Resumo total + Distribuição por Financiador)', () => {
    render(<PosicaoRecebimentosPage />)
    expect(screen.getByText('Resumo total')).toBeTruthy()
    expect(screen.getByText('Distribuição por Financiador')).toBeTruthy()
  })

  it('renderiza a tabela por financiador + o financiador (raiz) e a linha "Total Geral"', () => {
    render(<PosicaoRecebimentosPage />)
    expect(screen.getByText('Posição por financiador')).toBeTruthy()
    expect(firstFinancier).toBeDefined()
    expect(screen.getAllByText(firstFinancier?.name ?? '__none__').length).toBeGreaterThan(0)
    expect(screen.getByText('Total Geral')).toBeTruthy()
  })

  it('o toggle "Filtros" existe e o campo do lado de receber é "Financiador"', () => {
    render(<PosicaoRecebimentosPage />)
    const toggle = screen.getByRole('button', { name: 'Filtros' })
    fireEvent.click(toggle)
    expect(screen.getByLabelText('Financiador')).toBeTruthy()
  })
})

describe('PosicaoRecebimentosPage — export CSV', () => {
  it('clicar em "CSV" no menu Exportar dispara o download (cria e clica um anchor)', () => {
    const createUrl = vi.fn(() => 'blob:recebimentos')
    const revokeUrl = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { value: createUrl, configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeUrl, configurable: true })
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    render(<PosicaoRecebimentosPage />)
    fireEvent.click(screen.getByRole('button', { name: 'CSV' }))

    expect(createUrl).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeUrl).toHaveBeenCalledTimes(1)
  })
})

// Empty state honesto: relatório VAZIO (fonte `[]` quando o placeholder for removido). Renderiza o
// PosicaoReportView compartilhado com um relatório vazio + os rótulos de recebimentos.
const EMPTY_REPORT: PosicaoReport = {
  totals: { emAtrasoCents: 0, pagoCents: 0, aPagarCents: 0 },
  suppliers: [],
}

const RECEBIMENTOS_LABELS: PosicaoReportViewLabels = {
  back: 'Voltar',
  title: 'Posição de Recebimentos',
  filters: {
    title: 'Filtros',
    allOption: 'Todos',
    plano: 'Plano Orçamentário',
    periodo: 'Período de vencimento',
    periodoDe: 'De',
    periodoAte: 'Até',
    conta: 'Conta bancária',
    status: 'Status',
    centro: 'Centro de custo',
    categoria: 'Categoria',
    subcategoria: 'Subcategoria',
    partner: 'Financiador',
    filtrar: 'Filtrar',
  },
  export: { label: 'Exportar', csv: 'CSV', pdf: 'PDF' },
  kpi: {
    atrasado: 'Atrasado',
    pago: 'Recebido',
    aPagar: 'A receber',
    total: 'Total',
    atrasadoSub: 'Vencido e não recebido',
    pagoSub: 'Valores recebidos',
    aPagarSub: 'A vencer',
    totalSub: 'Recebíveis no período',
  },
  measure: { emAtraso: 'Em atraso', pago: 'Recebido', aPagar: 'A receber' },
  chart: {
    resumoTotal: 'Resumo total',
    distribuicao: 'Distribuição por Financiador',
    centerCaption: 'total',
  },
  table: {
    title: 'Posição por financiador',
    nameCol: 'Financiador / Centro de custo / Categoria',
    totalRow: 'Total Geral',
    expand: 'Expandir',
    collapse: 'Recolher',
  },
  empty: 'Nenhum recebimento registrado',
  emptyHint: 'Ainda não há recebíveis lançados.',
  chartEmptyLabel: 'Nenhum dado para exibir.',
}

describe('Posição de Recebimentos — EMPTY STATE honesto (relatório vazio)', () => {
  it('mostra "Nenhum recebimento registrado" e o título, SEM KPIs/gráficos/tabela', () => {
    render(
      <PosicaoReportView
        report={EMPTY_REPORT}
        labels={RECEBIMENTOS_LABELS}
        csvFilename="posicao-recebimentos.csv"
        csvHeader={CSV_HEADER_RECEBIMENTOS}
      />,
    )
    // Empty state presente.
    expect(screen.getByText('Nenhum recebimento registrado')).toBeTruthy()
    // Cabeçalho (título) permanece.
    expect(screen.getByText('Posição de Recebimentos')).toBeTruthy()
    // NADA quebrado: sem KPIs (Atrasado), sem gráficos (Resumo total), sem tabela (Total Geral), sem Filtros.
    expect(screen.queryByText('Atrasado')).toBeNull()
    expect(screen.queryByText('Resumo total')).toBeNull()
    expect(screen.queryByText('Total Geral')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Filtros' })).toBeNull()
  })
})
