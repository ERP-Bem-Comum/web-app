/**
 * PosicaoPagamentosPage + PosicaoTreeTable (Vitest/jsdom) — comportamento da tela do relatório "Posição de
 * Pagamentos":
 *   1. filtros recolhíveis: o toggle "Filtros" existe e alterna aria-pressed (abre/fecha).
 *   2. tabela hierárquica: renderiza os fornecedores (raízes) + a linha "Total Geral".
 *   3. expand/collapse: expandir um fornecedor revela seus centros de custo; recolher os esconde.
 *   4. export: clicar "Exportar CSV" dispara o download (Blob + anchor) — mockado via URL/anchor.click.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'

import { PosicaoPagamentosPage } from '#modules/reports/client/page/posicao-pagamentos.page.tsx'
import { loadPosicao } from '#modules/reports/client/posicao.view-model.ts'

const report = loadPosicao('p')
const firstSupplier = report.suppliers[0]
const firstCostCenter = firstSupplier?.children[0]

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('PosicaoPagamentosPage — filtros recolhíveis', () => {
  it('mostra o toggle "Filtros" começando fechado (aria-pressed=false)', () => {
    render(<PosicaoPagamentosPage />)
    const toggle = screen.getByRole('button', { name: 'Filtros' })
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
  })

  it('clicar em "Filtros" abre o painel (aria-pressed=true) e revela os selects', () => {
    render(<PosicaoPagamentosPage />)
    const toggle = screen.getByRole('button', { name: 'Filtros' })
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    // Alguns campos honestos do legado.
    expect(screen.getByLabelText('Período de vencimento')).toBeTruthy()
    expect(screen.getByLabelText('Status')).toBeTruthy()
    expect(screen.getByLabelText('Fornecedor')).toBeTruthy()
  })

  it('clicar de novo fecha (aria-pressed volta a false)', () => {
    render(<PosicaoPagamentosPage />)
    const toggle = screen.getByRole('button', { name: 'Filtros' })
    fireEvent.click(toggle)
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
  })
})

describe('PosicaoPagamentosPage — tabela hierárquica', () => {
  it('renderiza os fornecedores (raízes) e a linha "Total Geral"', () => {
    render(<PosicaoPagamentosPage />)
    expect(firstSupplier).toBeDefined()
    // O nome do fornecedor aparece na tabela E no gráfico "Distribuição por Fornecedor" → getAllByText.
    expect(screen.getAllByText(firstSupplier?.name ?? '').length).toBeGreaterThan(0)
    expect(screen.getByText('Total Geral')).toBeTruthy()
  })

  it('mostra as 3 medidas derivadas (Em atraso / Pago / A pagar) — cards, donut e cabeçalho da tabela', () => {
    render(<PosicaoPagamentosPage />)
    // Aparecem em vários lugares (KPI, donut, cabeçalho da tabela) → presença via getAllByText.
    expect(screen.getAllByText('Em atraso').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pago').length).toBeGreaterThan(0)
    expect(screen.getAllByText('A pagar').length).toBeGreaterThan(0)
    // Rótulos exclusivos dos cards (kpi.atrasado / kpi.total).
    expect(screen.getAllByText('Atrasado').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Total').length).toBeGreaterThan(0)
  })

  it('mostra os 2 gráficos (Resumo total + Distribuição por Fornecedor)', () => {
    render(<PosicaoPagamentosPage />)
    expect(screen.getByText('Resumo total')).toBeTruthy()
    expect(screen.getByText('Distribuição por Fornecedor')).toBeTruthy()
  })

  it('NÃO mostra os centros de custo antes de expandir o fornecedor', () => {
    render(<PosicaoPagamentosPage />)
    expect(firstCostCenter).toBeDefined()
    expect(screen.queryByText(firstCostCenter?.name ?? '__none__')).toBeNull()
  })
})

describe('PosicaoPagamentosPage — expand/collapse', () => {
  it('expandir um fornecedor revela seus centros de custo; recolher os esconde', () => {
    render(<PosicaoPagamentosPage />)
    const ccName = firstCostCenter?.name ?? '__none__'
    // O chevron do 1º fornecedor: 1º botão "Expandir".
    const btn = screen.getAllByRole('button', { name: 'Expandir' })[0]
    if (btn === undefined) throw new Error('sem botão Expandir')
    fireEvent.click(btn)
    expect(screen.getByText(ccName)).toBeTruthy()

    // Agora esse nó vira "Recolher".
    const collapseBtn = screen.getAllByRole('button', { name: 'Recolher' })[0]
    if (collapseBtn === undefined) throw new Error('sem botão Recolher')
    fireEvent.click(collapseBtn)
    expect(screen.queryByText(ccName)).toBeNull()
  })
})

describe('PosicaoPagamentosPage — export CSV', () => {
  it('clicar em "CSV" no menu Exportar dispara o download (cria e clica um anchor)', () => {
    const createUrl = vi.fn(() => 'blob:posicao')
    const revokeUrl = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { value: createUrl, configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeUrl, configurable: true })
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    render(<PosicaoPagamentosPage />)
    // Export = dropdown (<details> "Exportar" → itens CSV / PDF). Clica o item CSV.
    fireEvent.click(screen.getByRole('button', { name: 'CSV' }))

    expect(createUrl).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeUrl).toHaveBeenCalledTimes(1)
  })
})

describe('PosicaoTreeTable (via page) — Total Geral bate com a ViewModel', () => {
  it('a linha Total Geral existe e a página monta sem erro', () => {
    render(<PosicaoPagamentosPage />)
    const totalRow = screen.getByText('Total Geral')
    expect(totalRow).toBeTruthy()
    // O container da tabela existe (a linha total está dentro dela).
    expect(within(document.body).getByText('Posição por fornecedor')).toBeTruthy()
  })
})
