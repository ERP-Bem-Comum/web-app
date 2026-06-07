import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { DataTable } from '#shared/ui/organisms/data-table/data-table.component.tsx'
import type {
  Column,
  DataTableState,
} from '#shared/ui/organisms/data-table/data-table.types.ts'

afterEach(() => {
  cleanup()
})

type Row = Readonly<{ id: string; name: string; doc: string }>

const columns: readonly Column<Row>[] = [
  { key: 'name', header: 'Nome', cell: (r) => r.name },
  { key: 'doc', header: 'Documento', cell: (r) => r.doc, width: 'narrow' },
]

const rows: readonly Row[] = [
  { id: '1', name: 'Acme', doc: '111' },
  { id: '2', name: 'Globex', doc: '222' },
]

const baseProps = {
  columns,
  rowKey: (r: Row) => r.id,
  emptyLabel: 'Nenhum resultado',
  loadingLabel: 'Carregando…',
} as const

describe('DataTable', () => {
  it('ready com linhas: renderiza valores nas colunas certas, na ordem', () => {
    const state: DataTableState<Row> = { status: 'ready', rows }
    render(<DataTable<Row> {...baseProps} state={state} />)

    // cabeçalhos na ordem definida
    const headers = screen.getAllByRole('columnheader').map((th) => th.textContent)
    expect(headers).toEqual(['Nome', 'Documento'])

    // 1 linha de cabeçalho + 2 de dados
    expect(screen.getAllByRole('row')).toHaveLength(3)

    // células do corpo (apenas <td>) na ordem linha-a-linha, coluna-a-coluna
    const cells = screen.getAllByRole('cell').map((td) => td.textContent)
    expect(cells).toEqual(['Acme', '111', 'Globex', '222'])
  })

  it('ready vazio: exibe emptyLabel e nenhuma linha de dado', () => {
    const state: DataTableState<Row> = { status: 'ready', rows: [] }
    render(<DataTable<Row> {...baseProps} state={state} />)

    expect(screen.getByText('Nenhum resultado')).toBeTruthy()
    // só o header row existe; nenhuma linha de dado real (Acme/Globex)
    expect(screen.queryByText('Acme')).toBeNull()
  })

  it('loading: expõe role="status" com loadingLabel e nenhuma linha de dado', () => {
    const state: DataTableState<Row> = { status: 'loading' }
    render(<DataTable<Row> {...baseProps} state={state} />)

    const status = screen.getByRole('status')
    expect(status.textContent).toContain('Carregando…')
    expect(screen.queryByText('Acme')).toBeNull()
  })

  it('error: exibe a mensagem fornecida no estado', () => {
    const state: DataTableState<Row> = { status: 'error', message: 'Falha ao carregar' }
    render(<DataTable<Row> {...baseProps} state={state} />)

    expect(screen.getByText('Falha ao carregar')).toBeTruthy()
    expect(screen.queryByText('Acme')).toBeNull()
  })

  it('célula customizada: column.cell pode retornar um elemento (ReactNode)', () => {
    const richColumns: readonly Column<Row>[] = [
      { key: 'name', header: 'Nome', cell: (r) => r.name },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        cell: (r) => <span data-testid={`tag-${r.id}`}>ativo</span>,
      },
    ]
    const state: DataTableState<Row> = { status: 'ready', rows }
    render(
      <DataTable<Row>
        columns={richColumns}
        state={state}
        rowKey={(r) => r.id}
        emptyLabel="Nenhum resultado"
        loadingLabel="Carregando…"
      />,
    )

    expect(screen.getByTestId('tag-1')).toBeTruthy()
    expect(screen.getByTestId('tag-2')).toBeTruthy()
  })

  it('caption: quando fornecida, vira o nome acessível da tabela', () => {
    const state: DataTableState<Row> = { status: 'ready', rows }
    render(<DataTable<Row> {...baseProps} state={state} caption="Fornecedores" />)

    expect(screen.getByRole('table', { name: 'Fornecedores' })).toBeTruthy()
  })
})
