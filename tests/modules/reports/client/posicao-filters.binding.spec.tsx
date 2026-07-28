/**
 * usePosicaoFilterOptions (Vitest/jsdom) — ADAPTER dos dropdowns de filtro da "Posição de Pagamentos".
 * Cada lista vem de uma fonte cross-módulo MOCKADA (public-api), sem RPC real:
 *   • Plano  → só planos APROVADOS, rótulo "ano sigla versão · cenário".
 *   • Fornecedor → nome do fornecedor ativo.
 *   • Conta bancária → apelido; sem apelido cai no texto-livre; sem ambos, banco+conta-DV.
 *   • Centro/Categoria/Subcategoria → CASCATA da árvore do plano (`use*OptionsFromPlan`, ADR-0051): a regra
 *     é do financial (aqui só a WIRING). Assertamos que os hooks recebem os refs certos (plano→centro→categoria).
 *   • Degradação: fonte com { ok:false } / hook [] → a lista vira [] (o dropdown nunca quebra).
 * Fixtures SINTÉTICAS.
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { listBudgetPlansFn } from '#modules/budget-plans/public-api/index.ts'
import { listSuppliersFn } from '#modules/partners/public-api/index.ts'
import {
  listCedenteAccountsFn,
  useCostCenterOptionsFromPlan,
  useCategoryOptionsFromPlan,
  useSubcategoryOptionsFromPlan,
} from '#modules/financial/public-api/index.ts'
import { usePosicaoFilterOptions } from '#modules/reports/client/posicao-filters.binding.ts'

vi.mock('#modules/budget-plans/public-api/index.ts', () => ({ listBudgetPlansFn: vi.fn() }))
vi.mock('#modules/partners/public-api/index.ts', () => ({ listSuppliersFn: vi.fn() }))
vi.mock('#modules/financial/public-api/index.ts', () => ({
  listCedenteAccountsFn: vi.fn(),
  // Cascata dirigida pelo plano — mockada como hooks síncronos (a regra vive/é testada no financial).
  useCostCenterOptionsFromPlan: vi.fn(() => []),
  useCategoryOptionsFromPlan: vi.fn(() => []),
  useSubcategoryOptionsFromPlan: vi.fn(() => []),
}))

const mPlans = vi.mocked(listBudgetPlansFn)
const mSuppliers = vi.mocked(listSuppliersFn)
const mAccounts = vi.mocked(listCedenteAccountsFn)
const mCentro = vi.mocked(useCostCenterOptionsFromPlan)
const mCategoria = vi.mocked(useCategoryOptionsFromPlan)
const mSubcategoria = vi.mocked(useSubcategoryOptionsFromPlan)

function planNode(over: Record<string, unknown>): unknown {
  return {
    id: 'p',
    year: 2026,
    programName: 'Programa Alfa',
    programAbbreviation: 'ALFA',
    version: 1,
    scenarioName: null,
    status: 'APROVADO',
    totalInCents: 0,
    updatedByName: null,
    updatedAt: '2026-01-01',
    networkKind: 'ESTADO',
    partnersCount: 0,
    children: [],
    ...over,
  }
}

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('usePosicaoFilterOptions — fontes reais', () => {
  it('popula plano/fornecedor/conta e cascateia centro/categoria/subcategoria pelo plano', async () => {
    mPlans.mockResolvedValue({
      ok: true,
      data: {
        items: [
          planNode({ id: 'a1', status: 'APROVADO', scenarioName: 'Base' }),
          planNode({ id: 'r1', status: 'RASCUNHO' }), // deve ser filtrado
        ],
      },
    } as never)

    mSuppliers.mockResolvedValue({
      ok: true,
      data: {
        items: [
          { id: 'sup-1', name: 'Fornecedor Alfa' },
          { id: 'sup-2', name: 'Fornecedor Beta' },
        ],
        meta: {},
      },
    } as never)

    mAccounts.mockResolvedValue({
      ok: true,
      data: [
        {
          id: 'acc-1',
          alias: 'Conta Movimento',
          typeLabel: null,
          bankName: 'BB',
          accountNumber: '123',
          accountDv: '4',
        },
        {
          id: 'acc-2',
          alias: '',
          typeLabel: 'Cartão corporativo',
          bankName: 'BB',
          accountNumber: '999',
          accountDv: '0',
        },
        { id: 'acc-3', alias: '', typeLabel: null, bankName: 'Itaú', accountNumber: '555', accountDv: '1' },
      ],
    } as never)

    // Cascata: com plano selecionado, os 3 vêm da árvore do plano.
    mCentro.mockReturnValue([{ value: 'cc-plan', label: 'Centro do Plano' }])
    mCategoria.mockReturnValue([{ value: 'cat-plan', label: 'Categoria do Plano' }])
    mSubcategoria.mockReturnValue([{ value: 'sub-plan', label: 'Subcategoria do Plano' }])

    const { result } = renderHook(() => usePosicaoFilterOptions('plan-uuid', 'cc-plan', 'cat-plan'), {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(result.current.plano.length).toBeGreaterThan(0)
      expect(result.current.conta.length).toBe(3)
    })

    // Plano: só o APROVADO, value=id + rótulo com cenário.
    expect(result.current.plano).toEqual([{ value: 'a1', label: '2026 ALFA 1.0 · Base' }])
    // Fornecedor: value=id, label=nome.
    expect(result.current.partner).toEqual([
      { value: 'sup-1', label: 'Fornecedor Alfa' },
      { value: 'sup-2', label: 'Fornecedor Beta' },
    ])
    // Conta: value=id; label apelido → texto-livre → banco+conta-DV.
    expect(result.current.conta).toEqual([
      { value: 'acc-1', label: 'Conta Movimento' },
      { value: 'acc-2', label: 'Cartão corporativo' },
      { value: 'acc-3', label: 'Itaú 555-1' },
    ])
    // Cascata: as 3 listas vêm dos hooks do plano...
    expect(result.current.centro).toEqual([{ value: 'cc-plan', label: 'Centro do Plano' }])
    expect(result.current.categoria).toEqual([{ value: 'cat-plan', label: 'Categoria do Plano' }])
    expect(result.current.subcategoria).toEqual([{ value: 'sub-plan', label: 'Subcategoria do Plano' }])
    // ...e os hooks recebem os refs certos (plano → centro → categoria).
    expect(mCentro).toHaveBeenCalledWith('plan-uuid')
    expect(mCategoria).toHaveBeenCalledWith('plan-uuid', 'cc-plan')
    expect(mSubcategoria).toHaveBeenCalledWith('plan-uuid', 'cat-plan')
  })

  it('degrada a [] quando as fontes falham (erro/permissão) e a cascata vazia', async () => {
    mPlans.mockResolvedValue({ ok: false, error: 'forbidden' } as never)
    mSuppliers.mockResolvedValue({ ok: false, error: 'forbidden' } as never)
    mAccounts.mockResolvedValue({ ok: false, error: 'forbidden' } as never)
    // Cascata vazia (sem plano). Setado explícito: clearAllMocks limpa histórico mas mantém implementação.
    mCentro.mockReturnValue([])
    mCategoria.mockReturnValue([])
    mSubcategoria.mockReturnValue([])

    const { result } = renderHook(() => usePosicaoFilterOptions('', '', ''), { wrapper: wrapper() })

    await waitFor(() => {
      expect(mPlans).toHaveBeenCalled()
      expect(mAccounts).toHaveBeenCalled()
    })

    expect(result.current.plano).toEqual([])
    expect(result.current.partner).toEqual([])
    expect(result.current.conta).toEqual([])
    expect(result.current.centro).toEqual([])
    expect(result.current.categoria).toEqual([])
    expect(result.current.subcategoria).toEqual([])
  })
})
