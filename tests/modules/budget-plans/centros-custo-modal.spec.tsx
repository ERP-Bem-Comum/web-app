/**
 * CentrosCustoModal (Vitest/jsdom) — usa o binding REAL (useCentrosCusto) via harness. Cobre: abrir renderiza
 * a árvore; "Adicionar centro" abre o form de centro (com Tipo do centro); "Editar" numa subcategoria abre o
 * form com "Tipo de lançamento"; "Desativar" risca o nome.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { CentrosCustoModal } from '#modules/budget-plans/client/planejamento/detalhe/components/centros-custo-modal.component.tsx'
import { useCentrosCusto } from '#modules/budget-plans/client/planejamento/detalhe/centros-custo.binding.ts'
import type { PlanDetail, MonthlyCents } from '#modules/budget-plans/client/data/model/plan-detail.model.ts'

afterEach(() => {
  cleanup()
})

const zero: MonthlyCents = Array.from({ length: 12 }, () => 0)

const detail: PlanDetail = {
  id: 'p-1',
  year: 2026,
  programName: 'Ensino Público de Valor',
  programAbbreviation: 'EPV',
  version: 1,
  scenarioName: null,
  status: 'RASCUNHO',
  totalInCents: 0,
  networks: [],
  costCenters: [
    {
      id: 1,
      ref: 'ref-1',
      name: 'Consultoria',
      type: 'A PAGAR',
      totalInCents: 0,
      monthlyInCents: zero,
      networkInCents: [],
      categories: [
        {
          id: 11,
          ref: 'ref-11',
          name: 'Consultoria Educacional',
          totalInCents: 0,
          monthlyInCents: zero,
          networkInCents: [],
          subCategories: [
            {
              id: 111,
              ref: 'ref-111',
              name: 'Formação de professores',
              totalInCents: 0,
              monthlyInCents: zero,
              networkInCents: [],
            },
          ],
        },
      ],
    },
  ],
}

const labels = {
  titlePrefix: 'Centros de Custo -',
  subtitle: 'Gerenciar os centros de custos, categorias e produtos/serviços',
  close: 'Fechar',
  centro: 'Centro de Custo',
  addCentro: 'Adicionar centro de custo',
  addCategoria: '+ Categoria',
  addSub: '+ Sub-categoria',
  edit: 'Editar',
  deactivate: 'Desativar',
  activate: 'Ativar',
  expand: 'Expandir',
  collapse: 'Recolher',
  nome: 'Nome',
  centroTipo: 'Tipo do centro de custo',
  subTipo: 'Tipo',
  releaseType: 'Tipo de lançamento',
  cancel: 'Cancelar',
  save: 'Salvar',
  add: 'Adicionar',
  formTitle: {
    'add-centro': 'Adicionar Centro de custo',
    'edit-centro': 'Editar Centro de custo',
    'add-categoria': 'Adicionar Categoria',
    'edit-categoria': 'Editar Categoria',
    'add-sub': 'Adicionar Sub categoria',
    'edit-sub': 'Editar Sub categoria',
  },
} as const

const centroTipoLabels = { 'A PAGAR': 'A PAGAR', 'A RECEBER': 'A RECEBER' } as const
const subTipoLabels = { INSTITUCIONAL: 'Institucional', REDE: 'Rede' } as const
const releaseTypeLabels = {
  DESPESAS_PESSOAIS: 'Despesas de Pessoal',
  IPCA: 'IPCA',
  CAED: 'CAED',
  DESPESAS_LOGISTICAS: 'Despesas de Logística',
} as const

function Harness(): ReactNode {
  const b = useCentrosCusto('p-1', detail)
  return (
    <>
      <button type="button" onClick={b.openModal}>
        abrir
      </button>
      <CentrosCustoModal
        binding={b}
        labels={labels}
        centroTipoLabels={centroTipoLabels}
        subTipoLabels={subTipoLabels}
        releaseTypeLabels={releaseTypeLabels}
        translateError={(tag) => tag}
      />
    </>
  )
}

const openModal = (): void => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <Harness />
    </QueryClientProvider>,
  )
  fireEvent.click(screen.getByText('abrir'))
}

describe('CentrosCustoModal', () => {
  it('abrir renderiza o título com o programa e a árvore', () => {
    openModal()
    expect(screen.getByText('Centros de Custo - EPV')).toBeTruthy()
    expect(screen.getByText('Consultoria Educacional')).toBeTruthy()
    expect(screen.getByText('Formação de professores')).toBeTruthy()
  })

  it('"Adicionar centro de custo" abre o form com Tipo do centro', () => {
    openModal()
    fireEvent.click(screen.getByText('Adicionar centro de custo'))
    expect(screen.getByText('Adicionar Centro de custo')).toBeTruthy()
    expect(screen.getByText('Tipo do centro de custo')).toBeTruthy()
  })

  it('"Editar" na subcategoria abre o form com "Tipo de lançamento"', () => {
    openModal()
    const subRow = screen.getByText('Formação de professores').closest('div') as HTMLElement
    fireEvent.click(within(subRow).getByText('Editar'))
    expect(screen.getByText('Editar Sub categoria')).toBeTruthy()
    expect(screen.getByText('Tipo de lançamento')).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Despesas de Pessoal' })).toBeTruthy()
  })

  it('a chave (switch) desativa: rótulo vira "Ativar"', () => {
    openModal()
    const subRow = screen.getByText('Formação de professores').closest('div') as HTMLElement
    const sw = within(subRow).getByRole('switch')
    expect(sw.getAttribute('aria-label')).toBe('Desativar')
    fireEvent.click(sw)
    expect(within(subRow).getByText('Ativar')).toBeTruthy()
  })

  it('recolher o centro (chevron) esconde as categorias', () => {
    openModal()
    expect(screen.getByText('Consultoria Educacional')).toBeTruthy()
    // Expandido por padrão → o chevron do centro (na linha do centro) é "Recolher".
    const centroRow = screen.getByText('Consultoria - A PAGAR').closest('div') as HTMLElement
    fireEvent.click(within(centroRow).getByLabelText('Recolher'))
    expect(screen.queryByText('Consultoria Educacional')).toBeNull()
  })
})
