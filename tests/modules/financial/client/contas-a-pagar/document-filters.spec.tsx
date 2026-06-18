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

  it('dimensão com backend dispara onAddFilter; sem backend fica desabilitada', () => {
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
    // Vencimento (enabled) → clicável
    fireEvent.click(screen.getByText(tr('financial.list.filter.dim.vencimento')))
    expect(onAddFilter).toHaveBeenCalledWith('vencimento')
    // Competência (chrome) → botão desabilitado
    const competencia = screen.getByText(tr('financial.list.filter.dim.competencia')).closest('button')
    expect(competencia?.disabled).toBe(true)
  })
})

describe('ActiveFiltersRow', () => {
  const noop = {
    onRemoveFilter: vi.fn(),
    onSetVencimento: vi.fn(),
    onSetTipo: vi.fn(),
    onSetFornecedor: vi.fn(),
    onClearFilters: vi.fn(),
    supplierOptions: [{ value: 's-1', label: 'Bambu Educação' }],
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
})
