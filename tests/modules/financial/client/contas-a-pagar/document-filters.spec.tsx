/**
 * AddFilterButton / ActiveFiltersRow (Vitest/jsdom) — filtros avançados (views burras). Cobre: o menu
 * lista dimensões e desabilita as sem backend; adicionar uma dispara onAddFilter; os chips ativos editam
 * e disparam os setters/onRemove. Recebe tudo por props (sem hooks).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import {
  AddFilterButton,
  ActiveFiltersRow,
} from '#modules/financial/client/contas-a-pagar-list/components/document-filters.component.tsx'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

afterEach(() => {
  cleanup()
})

describe('AddFilterButton', () => {
  it('menu fechado não renderiza itens; aberto lista as dimensões', () => {
    const { rerender } = render(
      <AddFilterButton
        menuOpen={false}
        onToggleMenu={vi.fn()}
        onCloseMenu={vi.fn()}
        activeDims={new Set()}
        onAddFilter={vi.fn()}
      />,
    )
    expect(screen.queryByText(tr('financial.list.filter.dim.vencimento'))).toBeNull()
    rerender(
      <AddFilterButton
        menuOpen
        onToggleMenu={vi.fn()}
        onCloseMenu={vi.fn()}
        activeDims={new Set()}
        onAddFilter={vi.fn()}
      />,
    )
    expect(screen.getByText(tr('financial.list.filter.dim.vencimento'))).toBeTruthy()
  })

  it('clicar numa dimensão dispara onAddFilter (só as 3 com backend são listadas)', () => {
    const onAddFilter = vi.fn()
    render(
      <AddFilterButton
        menuOpen
        onToggleMenu={vi.fn()}
        onCloseMenu={vi.fn()}
        activeDims={new Set()}
        onAddFilter={onAddFilter}
      />,
    )
    fireEvent.click(screen.getByText(tr('financial.list.filter.dim.vencimento')))
    expect(onAddFilter).toHaveBeenCalledWith('vencimento')
    // Dimensões sem backend foram descartadas — não aparecem no menu.
    expect(screen.queryByText(tr('financial.list.filter.dim.competencia'))).toBeNull()
    expect(screen.queryByText(tr('financial.list.filter.dim.valor'))).toBeNull()
  })
})

describe('ActiveFiltersRow', () => {
  const noop = {
    onRemoveFilter: vi.fn(),
    onSetVencimento: vi.fn(),
    onSetTipo: vi.fn(),
    onClearFilters: vi.fn(),
    fornecedorQuery: '',
    fornecedorOpen: false,
    supplierMatches: [{ value: 's-1', label: 'Bambu Educação' }],
    onFornecedorQuery: vi.fn(),
    onPickFornecedor: vi.fn(),
  }

  it('sem filtros ativos não renderiza nada', () => {
    const { container } = render(<ActiveFiltersRow activeDims={new Set()} filters={{}} {...noop} />)
    expect(container.textContent).toBe('')
  })

  it('chip de Tipo dispara onSetTipo e ×️ dispara onRemoveFilter', () => {
    const onSetTipo = vi.fn()
    const onRemoveFilter = vi.fn()
    render(
      <ActiveFiltersRow
        activeDims={new Set(['tipo'])}
        filters={{}}
        {...noop}
        onSetTipo={onSetTipo}
        onRemoveFilter={onRemoveFilter}
      />,
    )
    fireEvent.change(screen.getByLabelText(tr('financial.list.filter.dim.tipo')), {
      target: { value: 'RPA' },
    })
    expect(onSetTipo).toHaveBeenCalledWith('RPA')
    fireEvent.click(screen.getByLabelText(tr('financial.list.filter.remove')))
    expect(onRemoveFilter).toHaveBeenCalledWith('tipo')
  })

  it('chip de Vencimento dispara onSetVencimento (de/até)', () => {
    const onSetVencimento = vi.fn()
    render(
      <ActiveFiltersRow
        activeDims={new Set(['vencimento'])}
        filters={{ vencimento: { from: '2026-07-01' } }}
        {...noop}
        onSetVencimento={onSetVencimento}
      />,
    )
    fireEvent.change(screen.getByLabelText(tr('financial.list.filter.to')), {
      target: { value: '2026-07-31' },
    })
    expect(onSetVencimento).toHaveBeenCalledWith('2026-07-01', '2026-07-31')
  })

  it('Fornecedor: busca dispara onFornecedorQuery; escolher um match dispara onPickFornecedor', () => {
    const onFornecedorQuery = vi.fn()
    const onPickFornecedor = vi.fn()
    render(
      <ActiveFiltersRow
        activeDims={new Set(['fornecedor'])}
        filters={{}}
        {...noop}
        fornecedorOpen
        onFornecedorQuery={onFornecedorQuery}
        onPickFornecedor={onPickFornecedor}
      />,
    )
    fireEvent.change(screen.getByLabelText(tr('financial.list.filter.dim.fornecedor')), {
      target: { value: 'bam' },
    })
    expect(onFornecedorQuery).toHaveBeenCalledWith('bam')
    // o dropdown lista os matches (não todos); escolher dispara onPickFornecedor com a opção
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Bambu Educação' }))
    expect(onPickFornecedor).toHaveBeenCalledWith({ value: 's-1', label: 'Bambu Educação' })
  })
})
