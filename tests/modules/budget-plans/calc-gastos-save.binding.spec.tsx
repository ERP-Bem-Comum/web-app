/**
 * Testes DOM (Vitest/jsdom) da ESCRITA do "Calculando Gastos" (§1.7 + core-api#413): `saveCalc` faz UM POST
 * por mês selecionado, com o alvo `(rede, subcategoria, mês)` correto, e não mente sobre falha parcial.
 *
 * Aqui o repositório é DOUBLE: o que se testa é o FAN-OUT e o tratamento de erro — não a rede.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

import { ok, err } from '#shared/primitives/result.ts'
import { budgetPlansRepository } from '#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts'
import { useCalcGastos } from '#modules/budget-plans/client/planejamento/detalhe/orcamento/calc-gastos.binding.ts'
import type { PlanDetail, MonthlyCents } from '#modules/budget-plans/client/data/model/plan-detail.model.ts'

vi.mock('#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts', () => ({
  budgetPlansRepository: { postBudgetResult: vi.fn() },
}))

const postMock = vi.mocked(budgetPlansRepository.postBudgetResult)

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
beforeEach(() => {
  postMock.mockResolvedValue(ok(undefined))
})

const zero: MonthlyCents = Array.from({ length: 12 }, () => 0)

const detail: PlanDetail = {
  id: 'plan-1',
  year: 2027,
  programName: 'P',
  programAbbreviation: null,
  version: 1,
  scenarioName: null,
  status: 'RASCUNHO',
  totalInCents: 0,
  networks: [],
  costCenters: [
    {
      id: 1,
      ref: 'cc-1',
      name: 'Pessoal',
      active: true,
      type: 'A PAGAR',
      totalInCents: 0,
      monthlyInCents: zero,
      networkInCents: [],
      categories: [
        {
          id: 11,
          ref: 'cat-11',
          name: 'Folha',
          active: true,
          totalInCents: 0,
          monthlyInCents: zero,
          networkInCents: [],
          subCategories: [
            {
              id: 111,
              ref: 'sub-uuid-111',
              name: 'Assessoria',
              active: true,
              totalInCents: 0,
              monthlyInCents: zero,
              networkInCents: [],
              releaseType: 'IPCA',
            },
          ],
        },
      ],
    },
  ],
}

// COMPONENTE (maiúscula): usa hook, então precisa ser um de verdade — `wrapper` minúsculo viola
// rules-of-hooks. `useState` com inicializador dá um QueryClient POR MONTAGEM (recriar a cada render zeraria
// o cache no meio do teste).
function Wrapper({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }))
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const setup = (budgetId: string | null = 'bg-ce') =>
  renderHook(() => useCalcGastos(detail, { planId: 'plan-1', budgetId }), { wrapper: Wrapper })

const IPCA = { kind: 'ipca', baseValueInCents: 100_000, ipca: 0 } as const

describe('saveCalc — um POST por mês (core-api#413)', () => {
  it('3 meses marcados → 3 POSTs, um por mês', async () => {
    const { result } = setup()
    act(() => {
      result.current.saveCalc(IPCA, [0, 1, 2], 100_000)
    })
    await waitFor(() => {
      expect(postMock).toHaveBeenCalledTimes(3)
    })
    expect(postMock.mock.calls.map((c) => c[0].month)).toEqual([1, 2, 3]) // 0..11 → 1..12
  })

  it('manda o ALVO certo: plano, rede e o UUID da subcategoria (não o id sintético)', async () => {
    const { result } = setup()
    act(() => {
      result.current.saveCalc(IPCA, [5], 100_000)
    })
    await waitFor(() => {
      expect(postMock).toHaveBeenCalledTimes(1)
    })
    expect(postMock.mock.calls[0]?.[0]).toMatchObject({
      planId: 'plan-1',
      budgetId: 'bg-ce',
      subcategoryId: 'sub-uuid-111', // o `ref`, não o `111`
      month: 6,
      kind: 'ipca',
    })
  })

  it('nenhum mês marcado → NENHUM POST (não há o que gravar)', async () => {
    const { result } = setup()
    act(() => {
      result.current.saveCalc(IPCA, [], 100_000)
    })
    await waitFor(() => {
      expect(postMock).not.toHaveBeenCalled()
    })
  })

  it('eco otimista: a grade mostra o valor antes do servidor responder', () => {
    const { result } = setup()
    act(() => {
      result.current.saveCalc(IPCA, [0], 100_000)
    })
    expect(result.current.despesas[0]?.cents).toBe(100_000)
  })
})

describe('saveCalc — falha não é escondida', () => {
  it('erro no 2º mês: PARA (não dispara o 3º) e expõe o erro', async () => {
    postMock.mockResolvedValueOnce(ok(undefined)).mockResolvedValueOnce(err('forbidden'))
    const { result } = setup()
    act(() => {
      result.current.saveCalc(IPCA, [0, 1, 2], 100_000)
    })
    await waitFor(() => {
      expect(result.current.saveError).toBe('forbidden')
    })
    // 2 chamadas, não 3: continuar depois da falha só espalharia o estrago.
    expect(postMock).toHaveBeenCalledTimes(2)
  })

  it('sucesso → saveError fica null', async () => {
    const { result } = setup()
    act(() => {
      result.current.saveCalc(IPCA, [0], 100_000)
    })
    await waitFor(() => {
      expect(result.current.saving).toBe(false)
    })
    expect(result.current.saveError).toBeNull()
  })

  it('clearSaveError limpa (erro velho na tela mente sobre o agora)', async () => {
    postMock.mockResolvedValue(err('unexpected'))
    const { result } = setup()
    act(() => {
      result.current.saveCalc(IPCA, [0], 1)
    })
    await waitFor(() => {
      expect(result.current.saveError).toBe('unexpected')
    })
    act(() => {
      result.current.clearSaveError()
    })
    expect(result.current.saveError).toBeNull()
  })

  it('sem rede (budgetId null) → não tenta gravar às cegas', async () => {
    const { result } = setup(null)
    act(() => {
      result.current.saveCalc(IPCA, [0], 100_000)
    })
    await waitFor(() => {
      expect(result.current.saveError).toBe('invalid-input')
    })
    expect(postMock).not.toHaveBeenCalled()
  })
})

// "Descartar Alterações" da página (§1.7). A P.O. verificou no LEGADO: o Salvar da página não processa nada
// (quem grava é o Salvar do drawer) e o Descartar abre confirmação. Mantivemos os dois botões — decisão dela.
describe('discardLocalChanges — joga fora só o que NÃO foi gravado', () => {
  it('sem edição local → nada a descartar (o botão fica desabilitado)', () => {
    const { result } = setup()
    expect(result.current.hasLocalChanges).toBe(false)
  })

  it('editar um mês na mão (lixeira/célula) marca alteração local', () => {
    const { result } = setup()
    act(() => {
      result.current.setMonthValue(0, 999)
    })
    expect(result.current.hasLocalChanges).toBe(true)
  })

  it('descartar limpa a edição local', () => {
    const { result } = setup()
    act(() => {
      result.current.setMonthValue(0, 999)
    })
    act(() => {
      result.current.discardLocalChanges()
    })
    expect(result.current.hasLocalChanges).toBe(false)
  })

  it('descartar NÃO desfaz o que foi GRAVADO — não dispara nenhum POST/DELETE', async () => {
    const { result } = setup()
    act(() => {
      result.current.saveCalc(IPCA, [0], 100_000)
    })
    await waitFor(() => {
      expect(postMock).toHaveBeenCalledTimes(1)
    })
    postMock.mockClear()
    act(() => {
      result.current.discardLocalChanges()
    })
    // Descartar relê do servidor; o que foi gravado, gravado está. Nada de escrita aqui.
    expect(postMock).not.toHaveBeenCalled()
  })

  it('descartar limpa um erro velho na tela (ele mentiria sobre o estado atual)', async () => {
    postMock.mockResolvedValue(err('unexpected'))
    const { result } = setup()
    act(() => {
      result.current.saveCalc(IPCA, [0], 1)
    })
    await waitFor(() => {
      expect(result.current.saveError).toBe('unexpected')
    })
    act(() => {
      result.current.discardLocalChanges()
    })
    expect(result.current.saveError).toBeNull()
  })
})
