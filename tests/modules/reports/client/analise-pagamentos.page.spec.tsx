/**
 * AnalisePagamentosPage (Vitest/jsdom) — comportamento da tela do relatório "Análise de Pagamentos":
 *   1. filtros recolhíveis: o toggle "Filtros" alterna aria-pressed (abre/fecha) e revela os selects.
 *   2. matriz: renderiza os planos (raízes) + a linha "Valor total do período" + o título do card.
 *   3. passador de mês: começa em Jan/26 – Mar/26 (WIN=3), "Meses anteriores" desabilitado; "Próximos meses"
 *      avança a janela (rótulo do passador muda) e habilita o "anteriores".
 *   4. 2 gráficos: "Distribuição por Centro de Custo" + "Distribuição Mensal".
 *   5. expand/collapse: expandir um plano adiciona a linha do centro de custo na tabela.
 *   6. export: clicar "CSV" no dropdown Exportar dispara o download (Blob + anchor).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { AnalisePagamentosPage } from '#modules/reports/client/page/analise-pagamentos.page.tsx'
import { loadAnalise } from '#modules/reports/client/analise.view-model.ts'

const report = loadAnalise('p')
const firstPlano = report.planos[0]
const firstCostCenter = firstPlano?.children[0]

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('AnalisePagamentosPage — filtros recolhíveis', () => {
  it('mostra o toggle "Filtros" começando fechado (aria-pressed=false)', () => {
    render(<AnalisePagamentosPage />)
    const toggle = screen.getByRole('button', { name: 'Filtros' })
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
  })

  it('clicar em "Filtros" abre o painel (aria-pressed=true) e revela os selects', () => {
    render(<AnalisePagamentosPage />)
    const toggle = screen.getByRole('button', { name: 'Filtros' })
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByLabelText('Programa')).toBeTruthy()
    expect(screen.getByLabelText('Centro de custo')).toBeTruthy()
    expect(screen.getByLabelText('Subcategoria')).toBeTruthy()
  })

  it('clicar de novo fecha (aria-pressed volta a false)', () => {
    render(<AnalisePagamentosPage />)
    const toggle = screen.getByRole('button', { name: 'Filtros' })
    fireEvent.click(toggle)
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
  })
})

describe('AnalisePagamentosPage — matriz tempo-orçamentária', () => {
  it('renderiza os planos (raízes) e a linha "Valor total do período"', () => {
    render(<AnalisePagamentosPage />)
    expect(firstPlano).toBeDefined()
    expect(screen.getAllByText(firstPlano?.name ?? '').length).toBeGreaterThan(0)
    expect(screen.getByText('Valor total do período')).toBeTruthy()
    expect(screen.getByText('Análise por plano orçamentário')).toBeTruthy()
  })

  it('mostra os 2 gráficos (Distribuição por Centro de Custo + Distribuição Mensal)', () => {
    render(<AnalisePagamentosPage />)
    expect(screen.getByText('Distribuição por Centro de Custo')).toBeTruthy()
    expect(screen.getByText('Distribuição Mensal')).toBeTruthy()
  })
})

describe('AnalisePagamentosPage — passador de mês', () => {
  it('começa em "Jan/26 – Mar/26" com "Meses anteriores" desabilitado', () => {
    render(<AnalisePagamentosPage />)
    expect(screen.getByText('Jan/26 – Mar/26')).toBeTruthy()
    const prev = screen.getByRole('button', { name: 'Meses anteriores' })
    expect(prev.hasAttribute('disabled')).toBe(true)
  })

  it('"Próximos meses" avança a janela (Abr/26 – Jun/26) e habilita o "anteriores"', () => {
    render(<AnalisePagamentosPage />)
    const next = screen.getByRole('button', { name: 'Próximos meses' })
    fireEvent.click(next)
    expect(screen.getByText('Abr/26 – Jun/26')).toBeTruthy()
    const prev = screen.getByRole('button', { name: 'Meses anteriores' })
    expect(prev.hasAttribute('disabled')).toBe(false)
  })
})

describe('AnalisePagamentosPage — expand/collapse', () => {
  it('expandir um plano adiciona a linha do centro de custo na tabela', () => {
    render(<AnalisePagamentosPage />)
    const ccName = firstCostCenter?.name ?? '__none__'
    // O CC já aparece no gráfico "Distribuição por Centro de Custo" (1x). Expandir o plano adiciona a linha
    // na tabela (fica 2x).
    const before = screen.getAllByText(ccName).length
    const btn = screen.getAllByRole('button', { name: 'Expandir' })[0]
    if (btn === undefined) throw new Error('sem botão Expandir')
    fireEvent.click(btn)
    const after = screen.getAllByText(ccName).length
    expect(after).toBeGreaterThan(before)

    // Recolher volta ao número anterior.
    const collapseBtn = screen.getAllByRole('button', { name: 'Recolher' })[0]
    if (collapseBtn === undefined) throw new Error('sem botão Recolher')
    fireEvent.click(collapseBtn)
    expect(screen.getAllByText(ccName).length).toBe(before)
  })
})

describe('AnalisePagamentosPage — export CSV', () => {
  it('clicar em "CSV" no menu Exportar dispara o download (cria e clica um anchor)', () => {
    const createUrl = vi.fn(() => 'blob:analise')
    const revokeUrl = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { value: createUrl, configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeUrl, configurable: true })
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    render(<AnalisePagamentosPage />)
    fireEvent.click(screen.getByRole('button', { name: 'CSV' }))

    expect(createUrl).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeUrl).toHaveBeenCalledTimes(1)
  })
})
