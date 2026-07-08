/**
 * RelatorioGeralPage + RelatorioGeralTable (Vitest/jsdom) — comportamento da tela do "Relatório Geral":
 *   1. renderiza a tabela (15 colunas) + Exportar + a paginação (BrandPaginator);
 *   2. paginação: perPage=10 → mostra só a fatia da página; "Anterior" começa desabilitado; "Próxima" avança;
 *      trocar "itens por página" volta para a 1ª página;
 *   3. lista VAZIA → empty state honesto ("Nenhum lançamento no período").
 * A page não usa router (sem mock necessário).
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'

import { RelatorioGeralPage } from '#modules/reports/client/page/relatorio-geral.page.tsx'
import { RelatorioGeralTable } from '#modules/reports/client/components/relatorio-geral-table.component.tsx'
import {
  loadRelatorioGeral,
  PER_PAGE_DEFAULT,
  totalPages,
} from '#modules/reports/client/relatorio-geral.view-model.ts'

const TOTAL = loadRelatorioGeral().length
const PAGES = totalPages(TOTAL, PER_PAGE_DEFAULT)

/** Nº de linhas de DADOS (role="row") — desconta a linha de cabeçalho (também role="row"). */
function dataRowCount(): number {
  return screen.getAllByRole('row').length - 1
}

afterEach(() => {
  cleanup()
})

describe('RelatorioGeralPage — tabela + colunas', () => {
  it('renderiza as 15 colunas do legado + Exportar', () => {
    render(<RelatorioGeralPage />)
    // Alguns rótulos de coluna coincidem com labels de filtro (Tipo/Fornecedor/Categoria) — escopo no
    // cabeçalho da tabela (1ª linha role="row") para evitar colisão.
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
    expect(screen.getByText('Exportar')).toBeTruthy()
  })
})

describe('RelatorioGeralPage — seletor de colunas', () => {
  it('botão "Colunas" abre o menu; desmarcar "Fornecedor" oculta a coluna do cabeçalho', () => {
    render(<RelatorioGeralPage />)
    // Fornecedor visível por padrão (escopo no cabeçalho da tabela p/ não colidir com o filtro).
    const before = screen.getAllByRole('row')[0]
    if (before === undefined) throw new Error('cabeçalho da tabela ausente')
    expect(within(before).getByText('Fornecedor')).toBeTruthy()

    // Abre o menu e desmarca a coluna Fornecedor.
    fireEvent.click(screen.getByText('Colunas'))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Fornecedor' }))

    const after = screen.getAllByRole('row')[0]
    if (after === undefined) throw new Error('cabeçalho da tabela ausente')
    expect(within(after).queryByText('Fornecedor')).toBeNull()
  })
})

describe('RelatorioGeralPage — paginação', () => {
  it(`mostra só a fatia da página (${String(PER_PAGE_DEFAULT)} linhas na 1ª página)`, () => {
    render(<RelatorioGeralPage />)
    expect(dataRowCount()).toBe(PER_PAGE_DEFAULT)
    // "Página 1 de N" (o BrandPaginator normaliza os nós de texto com espaço simples).
    expect(screen.getByText(`Página 1 de ${String(PAGES)}`)).toBeTruthy()
  })

  it('"Anterior" começa desabilitado; "Próxima" avança a fatia (1ª linha muda)', () => {
    render(<RelatorioGeralPage />)
    const prev = screen.getByText('Anterior')
    expect(prev.hasAttribute('disabled')).toBe(true)

    const firstBefore = screen.getAllByRole('row')[1]?.textContent
    fireEvent.click(screen.getByText('Próxima'))
    const firstAfter = screen.getAllByRole('row')[1]?.textContent
    expect(firstAfter).not.toBe(firstBefore)
  })

  it('trocar "itens por página" para 25 volta para a 1ª página e mostra tudo (< 25)', () => {
    render(<RelatorioGeralPage />)
    fireEvent.click(screen.getByText('Próxima')) // vai p/ página 2
    const select = screen.getByLabelText('Itens por página')
    fireEvent.change(select, { target: { value: '25' } })
    // 25 por página cobre todo o placeholder (< 25) → todas as linhas na 1ª página.
    expect(dataRowCount()).toBe(TOTAL)
    expect(screen.getByText('Anterior').hasAttribute('disabled')).toBe(true)
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
    // No caminho vazio, o cabeçalho de colunas (thead) não é renderizado.
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
