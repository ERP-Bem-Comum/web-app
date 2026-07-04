/**
 * CollaboratorTable (Vitest/jsdom) — view burra da nova identidade: cabeçalhos, linha com avatar/nome/chips,
 * estados vazio/loading e clique na linha.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import {
  CollaboratorTable,
  type CollaboratorTableStatus,
} from '#modules/partners/client/collaborator-list/components/collaborator-table.component.tsx'
import type { CollaboratorRow } from '#modules/partners/client/collaborator-list/collaborator-list.view-model.ts'

afterEach(() => {
  cleanup()
})

const labels = {
  caption: 'Colaboradores',
  name: 'Nome completo',
  email: 'E-mail',
  area: 'Área de atuação',
  contracts: 'Contratos/Aditivos',
  role: 'Função',
  status: 'Status',
  situacao: 'Situação',
  statusActive: 'Ativo',
  statusInactive: 'Inativo',
  situacaoComplete: 'Cadastrado',
  situacaoPreRegistration: 'Pré-cadastro',
  empty: 'Nenhum colaborador cadastrado.',
  loading: 'Carregando…',
} as const

const rows: readonly CollaboratorRow[] = [
  {
    id: '1',
    name: 'Alexandre Novaes',
    email: 'alexandre@avigem.com.br',
    occupationArea: 'DDI',
    role: 'Saxofonista',
    registration: 'complete',
    activation: 'active',
    contractCount: 0,
  },
  {
    id: '2',
    name: 'Maria de Jesus',
    email: 'maria@dejesus.com',
    occupationArea: 'EPV',
    role: 'Guitarrista',
    registration: 'pre-registration',
    activation: 'inactive',
    contractCount: 2,
  },
]

const baseProps = (state: CollaboratorTableStatus, over: Record<string, unknown> = {}) => ({
  state,
  labels,
  areaLabel: (a: string) => a,
  initials: (n: string) => {
    const p = n.trim().split(/\s+/)
    return ((p[0]?.[0] ?? '') + (p.length > 1 ? (p[p.length - 1]?.[0] ?? '') : '')).toUpperCase()
  },
  onRowClick: vi.fn(),
  ...over,
})

describe('CollaboratorTable', () => {
  it('renderiza os 7 cabeçalhos', () => {
    render(<CollaboratorTable {...baseProps({ status: 'ready', rows })} />)
    for (const h of [
      'Nome completo',
      'E-mail',
      'Área de atuação',
      'Contratos/Aditivos',
      'Função',
      'Status',
      'Situação',
    ]) {
      expect(screen.getByRole('columnheader', { name: h })).toBeTruthy()
    }
  })

  it('renderiza linha com avatar (iniciais), nome, e-mail e chips de status/situação', () => {
    render(<CollaboratorTable {...baseProps({ status: 'ready', rows })} />)
    expect(screen.getByText('AN')).toBeTruthy() // iniciais
    expect(screen.getByText('Alexandre Novaes')).toBeTruthy()
    expect(screen.getByText('alexandre@avigem.com.br')).toBeTruthy()
    expect(screen.getByText('Ativo')).toBeTruthy()
    expect(screen.getByText('Cadastrado')).toBeTruthy()
    // segunda linha: Inativo + Pré-cadastro
    expect(screen.getByText('Inativo')).toBeTruthy()
    expect(screen.getByText('Pré-cadastro')).toBeTruthy()
  })

  it('clicar na linha dispara onRowClick com o registro', () => {
    const onRowClick = vi.fn()
    render(<CollaboratorTable {...baseProps({ status: 'ready', rows }, { onRowClick })} />)
    fireEvent.click(screen.getByText('Alexandre Novaes'))
    expect(onRowClick).toHaveBeenCalledWith(rows[0])
  })

  it('estado vazio (ready com 0 linhas) mostra emptyLabel', () => {
    render(<CollaboratorTable {...baseProps({ status: 'ready', rows: [] })} />)
    expect(screen.getByText('Nenhum colaborador cadastrado.')).toBeTruthy()
  })

  it('estado loading mostra loadingLabel', () => {
    render(<CollaboratorTable {...baseProps({ status: 'loading' })} />)
    expect(screen.getByRole('status').textContent).toContain('Carregando…')
  })

  it('estado erro mostra a mensagem', () => {
    render(<CollaboratorTable {...baseProps({ status: 'error', message: 'Falha ao carregar' })} />)
    expect(screen.getByRole('alert').textContent).toContain('Falha ao carregar')
  })
})
