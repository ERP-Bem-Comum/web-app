/**
 * FluxoCaixaPage + views (Vitest/jsdom) — comportamento da tela do "Fluxo de Caixa":
 *   1. renderiza as 2 seções (Saídas / Entradas) + os 4 gráficos "Previsto × Realizado" + Exportar + KPIs;
 *   2. renderiza os filtros novos (Subcategoria, Status alinhado ao CAP);
 *   3. a seção Entradas VAZIA cai no empty state honesto ("Nenhuma entrada registrada");
 *   4. o donut Previsto × Realizado com totais 0 cai no placeholder honesto (não quebra).
 * A page não usa router (sem mock necessário).
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { FluxoCaixaPage } from '#modules/reports/client/page/fluxo-caixa.page.tsx'
import { FluxoCaixaSectionTable } from '#modules/reports/client/components/fluxo-caixa-section-table.component.tsx'
import { RealizadoDonut } from '#modules/reports/client/components/realizado-donut.component.tsx'
import {
  sectionDonutData,
  aggregateSection,
  type FluxoSection,
} from '#modules/reports/client/fluxo-caixa.view-model.ts'

afterEach(() => {
  cleanup()
})

describe('FluxoCaixaPage — composição', () => {
  it('renderiza as 2 seções (Saídas / Entradas) como cabeçalhos', () => {
    render(<FluxoCaixaPage />)
    // "Saídas"/"Entradas" aparecem como título de donut E como cabeçalho de seção — ao menos um de cada.
    expect(screen.getAllByRole('heading', { name: 'Saídas' }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('heading', { name: 'Entradas' }).length).toBeGreaterThanOrEqual(1)
  })

  it('renderiza os 4 gráficos "Previsto × Realizado" (títulos)', () => {
    render(<FluxoCaixaPage />)
    expect(screen.getByRole('heading', { name: 'Linha do tempo' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Agrupado por Centro de Custo' })).toBeTruthy()
    // Os 2 donuts (Entradas / Saídas) — títulos dos cartões.
    expect(screen.getAllByRole('heading', { name: 'Entradas' }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('heading', { name: 'Saídas' }).length).toBeGreaterThanOrEqual(1)
  })

  it('a linha do tempo usa rótulos de período por índice (nunca "Invalid Date")', () => {
    render(<FluxoCaixaPage />)
    expect(screen.getByText('Jan/26')).toBeTruthy()
    expect(screen.getByText('Jun/26')).toBeTruthy()
    expect(screen.queryByText(/Invalid Date/)).toBeNull()
  })

  it('renderiza os filtros novos (Subcategoria, Status alinhado ao CAP)', () => {
    render(<FluxoCaixaPage />)
    expect(screen.getByLabelText('Subcategoria')).toBeTruthy()
    const status = screen.getByLabelText('Status')
    expect(status).toBeTruthy()
    // Status reusa os chips do Contas a Pagar (Rascunho … Conciliado) + a allOption.
    expect(screen.getByRole('option', { name: 'Conciliado' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Aprovado' })).toBeTruthy()
  })

  it('renderiza o Exportar e os KPIs (Saídas / Entradas / Saldo)', () => {
    render(<FluxoCaixaPage />)
    expect(screen.getByText('Exportar')).toBeTruthy()
    expect(screen.getAllByText('Total de Saídas').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Total de Entradas').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Saldo (realizado)')).toBeTruthy()
    expect(screen.getByText('Saldo (previsto)')).toBeTruthy()
  })
})

describe('FluxoCaixaSectionTable — empty state (Entradas vazias)', () => {
  const emptySection: FluxoSection = { categories: [], totals: { realizedCents: 0, expectedCents: 0 } }

  it('seção sem categorias mostra o empty state honesto', () => {
    render(
      <FluxoCaixaSectionTable
        section={emptySection}
        labels={{
          cardTitle: 'Entradas',
          nameCol: 'Categoria / Subcategoria',
          measureLabels: { realizedCents: 'Realizado', expectedCents: 'Previsto' },
          totalRow: 'Total de Entradas',
          expand: 'Expandir',
          collapse: 'Recolher',
          empty: 'Nenhuma entrada registrada',
          emptyHint: 'Ainda não há entradas lançadas.',
        }}
      />,
    )
    expect(screen.getByText('Nenhuma entrada registrada')).toBeTruthy()
    // Sem tabela quebrada: o rodapé "Total de Entradas" NÃO aparece no caminho vazio.
    expect(screen.queryByText('Total de Entradas')).toBeNull()
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
