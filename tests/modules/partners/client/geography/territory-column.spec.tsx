import { afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import { TerritoryColumn, type ColumnItem } from '#modules/partners/client/geography/components/territory-column.component.tsx'

afterEach(cleanup)

const items: readonly ColumnItem[] = [
  { key: 'CE', label: 'Ceará', added: true },
  { key: 'BA', label: 'Bahia', added: false },
]

const base = {
  title: 'Lista Geral',
  searchId: 'col-search',
  searchValue: '',
  searchPlaceholder: 'Procurar',
  onSearch: vi.fn(),
  columnLabel: 'Estados',
  addedLabel: 'Adicionado',
  addAria: 'Adicionar',
  removeAria: 'Remover',
  disabled: false,
  loadingLabel: 'Carregando…',
}

describe('TerritoryColumn', () => {
  it('modo add: item adicionado mostra "Adicionado"; não adicionado mostra botão add', () => {
    const onAction = vi.fn()
    render(
      <TerritoryColumn {...base} actionLabel="ADD" mode="add" onAction={onAction} emptyLabel="vazio"
        state={{ status: 'ready', items }} />,
    )
    expect(screen.getByText('Adicionado')).toBeTruthy()
    const addBtn = screen.getByRole('button', { name: 'Adicionar' })
    fireEvent.click(addBtn)
    expect(onAction).toHaveBeenCalledWith('BA', false)
  })

  it('modo toggle: adicionado mostra remover (added=true), não adicionado mostra add (added=false)', () => {
    const onAction = vi.fn()
    render(
      <TerritoryColumn {...base} actionLabel="ADD" mode="toggle" onAction={onAction} emptyLabel="vazio"
        state={{ status: 'ready', items }} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }))
    expect(onAction).toHaveBeenCalledWith('CE', true)
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))
    expect(onAction).toHaveBeenCalledWith('BA', false)
  })

  it('modo remove: cada item tem botão remover e dispara onAction', () => {
    const onAction = vi.fn()
    render(
      <TerritoryColumn {...base} title="Adicionados" actionLabel="REMOVER" mode="remove" onAction={onAction}
        emptyLabel="vazio" state={{ status: 'ready', items: [{ key: 'CE', label: 'Ceará', added: true }] }} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }))
    expect(onAction).toHaveBeenCalledWith('CE', true)
  })

  it('placeholder: exibe a mensagem e não renderiza busca/lista', () => {
    render(
      <TerritoryColumn {...base} actionLabel="REMOVER" mode="remove" onAction={vi.fn()} emptyLabel="vazio"
        state={{ status: 'ready', items: [] }} placeholder="pendente backend" />,
    )
    expect(screen.getByText('pendente backend')).toBeTruthy()
    expect(screen.queryByPlaceholderText('Procurar')).toBeNull()
  })

  it('lista vazia mostra emptyLabel', () => {
    render(
      <TerritoryColumn {...base} actionLabel="ADD" mode="add" onAction={vi.fn()} emptyLabel="nada aqui"
        state={{ status: 'ready', items: [] }} />,
    )
    expect(screen.getByText('nada aqui')).toBeTruthy()
  })

  it('disabled desabilita os botões de ação', () => {
    render(
      <TerritoryColumn {...base} actionLabel="ADD" mode="add" onAction={vi.fn()} emptyLabel="vazio" disabled
        state={{ status: 'ready', items }} />,
    )
    expect((screen.getByRole('button', { name: 'Adicionar' }) as HTMLButtonElement).disabled).toBe(true)
  })
})
