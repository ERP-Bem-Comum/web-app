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
      active: true,
      type: 'A PAGAR',
      totalInCents: 0,
      monthlyInCents: zero,
      networkInCents: [],
      categories: [
        {
          id: 11,
          ref: 'ref-11',
          name: 'Consultoria Educacional',
          active: true,
          totalInCents: 0,
          monthlyInCents: zero,
          networkInCents: [],
          subCategories: [
            {
              id: 111,
              ref: 'ref-111',
              name: 'Formação de professores',
              active: true,
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
  inherited: 'Inativo por herança',
  lockedByAncestor: (ancestorName: string) =>
    `Inativo porque "${ancestorName}" está desativado. Reative "${ancestorName}" para editar este item.`,
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

function Harness({ detail: d }: { detail: PlanDetail }): ReactNode {
  const b = useCentrosCusto('p-1', d)
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

/** Renderiza o harness com a árvore dada e abre o modal. `openModal()` = a árvore padrão (tudo ativo). */
const renderModal = (d: PlanDetail): void => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <Harness detail={d} />
    </QueryClientProvider>,
  )
  fireEvent.click(screen.getByText('abrir'))
}

const openModal = (): void => {
  renderModal(detail)
}

// ── Árvores com um nó inativo. `active` é o EFETIVO que o core entrega: desativar o CENTRO já chega com os
// filhos em `false` (herança derivada lá, não aqui) — é isso que estas fixtures reproduzem. ──

const withSubActive = (active: boolean): PlanDetail => ({
  ...detail,
  costCenters: detail.costCenters.map((c) => ({
    ...c,
    categories: c.categories.map((cat) => ({
      ...cat,
      subCategories: cat.subCategories.map((s) => ({ ...s, active })),
    })),
  })),
})

const withCentroActive = (active: boolean): PlanDetail => ({
  ...detail,
  costCenters: detail.costCenters.map((c) => ({
    ...c,
    active,
    // Efetivo: o core aplica `cc.active && cat.active` na leitura. Com o centro desligado, os descendentes
    // chegam `false` mesmo tendo intenção `true` — é exatamente o caso que trava os switches dos filhos.
    categories: c.categories.map((cat) => ({
      ...cat,
      active,
      subCategories: cat.subCategories.map((s) => ({ ...s, active })),
    })),
  })),
})

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

  // O switch reflete o `active` do SERVIDOR (feature 075), não um palpite otimista local: antes ele mexia num
  // Set em memória (o nó voltava ativo no F5). Por isso o estado é afirmado renderizando outra árvore — não
  // clicando: o clique só dispara o PATCH, e quem muda o rótulo é a releitura.
  it('o switch mostra o estado do servidor: nó inativo → rótulo "Ativar"', () => {
    renderModal(withSubActive(false))
    const subRow = screen.getByText('Formação de professores').closest('div') as HTMLElement
    // checkbox nativo com role="switch": o estado está na propriedade `checked`, não num `aria-checked`.
    expect((within(subRow).getByRole('switch') as HTMLInputElement).checked).toBe(false)
    expect(within(subRow).getByText('Ativar')).toBeTruthy()
  })

  // A armadilha do core-api#469: o `active` que chega é o EFETIVO (nó ∧ ancestrais), mas o PATCH grava a
  // INTENÇÃO. Ligar o filho com o pai desligado faria o switch voltar sozinho. Travar + dizer QUEM desligou.
  it('filho de centro inativo: switch travado, dizendo quem o desligou', () => {
    renderModal(withCentroActive(false))
    const catRow = screen.getByText('Consultoria Educacional').closest('div') as HTMLElement
    const sw = within(catRow).getByRole('switch') as HTMLInputElement

    expect(sw.disabled).toBe(true)
    expect(sw.getAttribute('aria-label')).toContain('Consultoria')
    expect(within(catRow).getByText('Inativo por herança')).toBeTruthy()
  })

  it('centro é raiz: o switch nunca trava por herança', () => {
    renderModal(withCentroActive(false))
    const centroRow = screen.getByText('Consultoria - A PAGAR').closest('div') as HTMLElement
    expect((within(centroRow).getByRole('switch') as HTMLInputElement).disabled).toBe(false)
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
