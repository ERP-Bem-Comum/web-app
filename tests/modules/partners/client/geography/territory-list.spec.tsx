import { afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import { TerritoryList } from '#modules/partners/client/geography/components/territory-list.component.tsx'

// `globals: false` no vitest → sem auto-cleanup; limpamos o DOM entre os casos para o `screen`
// global não acumular renders (senão `getAllByRole` veria checkboxes de testes anteriores).
afterEach(cleanup)

const items = [
  { key: 'SP', label: 'SP', checked: true },
  { key: 'BA', label: 'BA', checked: false },
]

const noop = vi.fn()

function checkboxAt(index: number): HTMLInputElement {
  const el = screen.getAllByRole('checkbox')[index]
  if (!(el instanceof HTMLInputElement)) throw new Error(`sem checkbox no índice ${String(index)}`)
  return el
}

describe('TerritoryList', () => {
  it('renderiza um checkbox por item com o estado correto', () => {
    render(<TerritoryList items={items} emptyLabel="vazio" toggleAria="parceiro" toggleDisabled={false} onToggle={noop} />)
    const checks = screen.getAllByRole('checkbox')
    expect(checks).toHaveLength(2)
    expect(checkboxAt(0).checked).toBe(true)
    expect(checkboxAt(1).checked).toBe(false)
  })

  it('dispara onToggle(key, checked) ao clicar no checkbox', () => {
    const onToggle = vi.fn()
    render(<TerritoryList items={items} emptyLabel="vazio" toggleAria="parceiro" toggleDisabled={false} onToggle={onToggle} />)
    fireEvent.click(checkboxAt(1))
    expect(onToggle).toHaveBeenCalledWith('BA', true)
  })

  it('respeita toggleDisabled (checkboxes desabilitados)', () => {
    render(<TerritoryList items={items} emptyLabel="vazio" toggleAria="parceiro" toggleDisabled onToggle={noop} />)
    for (const c of screen.getAllByRole('checkbox')) {
      expect((c as HTMLInputElement).disabled).toBe(true)
    }
  })

  it('com onSelect: o rótulo vira botão e dispara a seleção', () => {
    const onSelect = vi.fn()
    render(
      <TerritoryList
        items={items}
        emptyLabel="vazio"
        toggleAria="parceiro"
        toggleDisabled={false}
        onToggle={noop}
        onSelect={onSelect}
        selectedKey="SP"
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'BA' }))
    expect(onSelect).toHaveBeenCalledWith('BA')
  })

  it('lista vazia mostra o emptyLabel', () => {
    render(<TerritoryList items={[]} emptyLabel="nada aqui" toggleAria="parceiro" toggleDisabled={false} onToggle={noop} />)
    expect(screen.getByText('nada aqui')).toBeTruthy()
  })
})
