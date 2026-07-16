/**
 * Testes DOM (Vitest/jsdom) do estado da Edição de Orçamento (§1.7). O que se trava aqui é a HONESTIDADE dos
 * 4 estados — cada um manda o operador para um lugar diferente, e o errado o faz procurar o que não existe
 * (ou desistir do que existe):
 *
 *   not-found → o ORÇAMENTO não existe (rede que não é deste plano / plano sumiu)
 *   empty     → o orçamento EXISTE; falta a ESTRUTURA de custo do plano
 *   error     → falha de verdade (transitória ou permissão)
 *   ready     → a grade
 *
 * Achado da P.O. em tela: plano com rede e SEM centro de custo dizia "Orçamento não encontrado" — mentira.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

import { ok, err } from '#shared/primitives/result.ts'
import { budgetPlansRepository } from '#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts'
import { useOrcamento } from '#modules/budget-plans/client/planejamento/detalhe/orcamento/orcamento.binding.ts'
import type {
  BudgetGrid,
  PlanDetail,
  MonthlyCents,
} from '#modules/budget-plans/client/data/model/plan-detail.model.ts'

vi.mock('#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts', () => ({
  budgetPlansRepository: { getBudgetGrid: vi.fn() },
}))

const gridMock = vi.mocked(budgetPlansRepository.getBudgetGrid)

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const zero: MonthlyCents = Array.from({ length: 12 }, () => 0)

const detailWith = (costCenters: PlanDetail['costCenters']): PlanDetail => ({
  id: 'plan-1',
  year: 2026,
  programName: 'Escola Feliz Demais',
  programAbbreviation: null,
  version: 1.1,
  scenarioName: null,
  status: 'RASCUNHO',
  totalInCents: 0,
  networks: [
    { id: 0, name: 'Ceará', ref: 'CE', kind: 'state', uf: 'CE', budgetId: 'bg-ce', totalInCents: 0 },
  ],
  costCenters,
})

const comEstrutura: PlanDetail['costCenters'] = [
  {
    id: 1,
    ref: 'cc-1',
    name: 'Portaria',
    type: 'A PAGAR',
    totalInCents: 0,
    monthlyInCents: zero,
    networkInCents: [],
    categories: [
      {
        id: 11,
        ref: 'cat-11',
        name: 'Limpeza',
        totalInCents: 0,
        monthlyInCents: zero,
        networkInCents: [],
        subCategories: [
          {
            id: 111,
            ref: 'sub-111',
            name: 'Insumos',
            totalInCents: 0,
            monthlyInCents: zero,
            networkInCents: [],
          },
        ],
      },
    ],
  },
]

const grid = (detail: PlanDetail): BudgetGrid => ({ detail, budgetId: 'bg-ce', networkLabel: 'Ceará' })

function Wrapper({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }))
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const setup = (rede = 'CE') => renderHook(() => useOrcamento('plan-1', rede), { wrapper: Wrapper })

describe('useOrcamento — plano SEM estrutura de custo', () => {
  beforeEach(() => {
    gridMock.mockResolvedValue(ok(grid(detailWith([]))))
  })

  it('estado é `empty`, NÃO `not-found` (o orçamento existe — falta a estrutura)', async () => {
    const { result } = setup()
    await waitFor(() => {
      expect(result.current.state.status).toBe('empty')
    })
  })

  it('a tela ainda aparece: título com a rede e o total', async () => {
    const { result } = setup()
    await waitFor(() => {
      expect(result.current.state.status).toBe('empty')
    })
    const s = result.current.state
    if (s.status !== 'empty') throw new Error('esperava empty')
    expect(s.title).toContain('Ceará')
    expect(s.totalLabel).toContain('0,00')
  })
})

describe('useOrcamento — o ORÇAMENTO não existe', () => {
  it('404 do BFF (rede fora do plano) → `not-found`, não `error`', async () => {
    // "Tente novamente" seria conselho errado: tentar de novo dá o mesmo 404.
    gridMock.mockResolvedValue(err('budget-plan-not-found'))
    const { result } = setup()
    await waitFor(() => {
      expect(result.current.state.status).toBe('not-found')
    })
  })
})

describe('useOrcamento — falha de verdade continua sendo erro', () => {
  it('403 → `error` com a tag (a page separa a mensagem de permissão)', async () => {
    gridMock.mockResolvedValue(err('forbidden'))
    const { result } = setup()
    await waitFor(() => {
      expect(result.current.state.status).toBe('error')
    })
    const s = result.current.state
    if (s.status !== 'error') throw new Error('esperava error')
    expect(s.errorTag).toBe('forbidden')
  })

  it('falha inesperada → `error`, nunca `empty` (não fingir "sem estrutura" quando não se sabe)', async () => {
    gridMock.mockResolvedValue(err('unexpected'))
    const { result } = setup()
    await waitFor(() => {
      expect(result.current.state.status).toBe('error')
    })
  })
})

describe('useOrcamento — com estrutura', () => {
  it('plano com centro de custo → `ready` com a grade', async () => {
    gridMock.mockResolvedValue(ok(grid(detailWith(comEstrutura))))
    const { result } = setup()
    await waitFor(() => {
      expect(result.current.state.status).toBe('ready')
    })
    const s = result.current.state
    if (s.status !== 'ready') throw new Error('esperava ready')
    expect(s.centroName).toBe('Portaria')
    expect(s.title).toContain('Ceará')
  })

  it('sem `?rede=` → nem chama o servidor (não há rede a editar)', async () => {
    gridMock.mockResolvedValue(ok(grid(detailWith(comEstrutura))))
    setup('')
    await waitFor(() => {
      expect(gridMock).not.toHaveBeenCalled()
    })
  })
})
