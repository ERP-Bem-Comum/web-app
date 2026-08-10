/**
 * BrandDataTable + BrandChip + BrandNameCell (Vitest/jsdom) — tabela reutilizável da identidade "brand":
 * cabeçalhos, linha (avatar+nome, chips), estados vazio/loading/erro e clique na linha.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import {
  BrandDataTable,
  BrandChip,
  BrandNameCell,
  type BrandColumn,
  type BrandTableState,
} from '#shared/ui/brand/brand-data-table.component.tsx'

afterEach(() => {
  cleanup()
})

type Row = Readonly<{ id: string; name: string; email: string; active: boolean }>

const rows: readonly Row[] = [
  { id: '1', name: 'Alexandre Novaes', email: 'a@x.com', active: true },
  { id: '2', name: 'Maria de Jesus', email: 'm@y.com', active: false },
]

const columns: readonly BrandColumn<Row>[] = [
  {
    key: 'name',
    header: 'Nome',
    cell: (r) => <BrandNameCell name={r.name} initials="AN" bg="var(--x)" fg="var(--y)" />,
  },
  { key: 'email', header: 'E-mail', cell: (r) => r.email },
  {
    key: 'status',
    header: 'Status',
    cell: (r) => <BrandChip tone={r.active ? 'ok' : 'danger'} label={r.active ? 'Ativo' : 'Inativo'} />,
  },
]

const baseProps = (state: BrandTableState<Row>, over: Record<string, unknown> = {}) => ({
  columns,
  gridTemplate: '1fr 1fr 1fr',
  state,
  rowKey: (r: Row) => r.id,
  caption: 'Tabela',
  emptyLabel: 'Vazio',
  loadingLabel: 'Carregando…',
  onRowClick: vi.fn(),
  ...over,
})

describe('BrandDataTable', () => {
  it('renderiza cabeçalhos e linhas com nome/e-mail/chips', () => {
    render(<BrandDataTable {...baseProps({ status: 'ready', rows })} />)
    expect(screen.getByRole('columnheader', { name: 'Nome' })).toBeTruthy()
    expect(screen.getByText('Alexandre Novaes')).toBeTruthy()
    expect(screen.getByText('a@x.com')).toBeTruthy()
    expect(screen.getByText('Ativo')).toBeTruthy()
    expect(screen.getByText('Inativo')).toBeTruthy()
  })

  it('clique na linha dispara onRowClick', () => {
    const onRowClick = vi.fn()
    render(<BrandDataTable {...baseProps({ status: 'ready', rows }, { onRowClick })} />)
    fireEvent.click(screen.getByText('Alexandre Novaes'))
    expect(onRowClick).toHaveBeenCalledWith(rows[0])
  })

  it('estado vazio / loading / erro', () => {
    render(<BrandDataTable {...baseProps({ status: 'ready', rows: [] })} />)
    expect(screen.getByText('Vazio')).toBeTruthy()
    cleanup()
    render(<BrandDataTable {...baseProps({ status: 'loading' })} />)
    expect(screen.getByRole('status').textContent).toContain('Carregando…')
    cleanup()
    render(<BrandDataTable {...baseProps({ status: 'error', message: 'Falhou' })} />)
    expect(screen.getByRole('alert').textContent).toContain('Falhou')
  })
})
