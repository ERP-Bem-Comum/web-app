/**
 * usePosicaoFilterOptions (Vitest/jsdom) — ADAPTER dos dropdowns de filtro da "Posição de Pagamentos".
 * Cada lista vem de uma server fn cross-módulo MOCKADA (public-api), sem RPC real:
 *   • Plano  → só planos APROVADOS, rótulo "ano sigla versão · cenário".
 *   • Fornecedor → nome do fornecedor ativo.
 *   • Conta bancária → apelido; sem apelido cai no texto-livre; sem ambos, banco+conta-DV.
 *   • Centro/Categoria/Subcategoria → catálogo FLAT (categoria = topo, subcategoria = filha).
 *   • Degradação: qualquer fonte com { ok:false } → aquela lista vira [] (o dropdown nunca quebra).
 * Fixtures SINTÉTICAS.
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { listBudgetPlansFn } from '#modules/budget-plans/public-api/index.ts'
import { listSuppliersFn } from '#modules/partners/public-api/index.ts'
import { listCedenteAccountsFn, listFinancialReferencesFn } from '#modules/financial/public-api/index.ts'
import { usePosicaoFilterOptions } from '#modules/reports/client/posicao-filters.binding.ts'

vi.mock('#modules/budget-plans/public-api/index.ts', () => ({ listBudgetPlansFn: vi.fn() }))
vi.mock('#modules/partners/public-api/index.ts', () => ({ listSuppliersFn: vi.fn() }))
vi.mock('#modules/financial/public-api/index.ts', () => ({
  listCedenteAccountsFn: vi.fn(),
  listFinancialReferencesFn: vi.fn(),
}))

const mPlans = vi.mocked(listBudgetPlansFn)
const mSuppliers = vi.mocked(listSuppliersFn)
const mAccounts = vi.mocked(listCedenteAccountsFn)
const mRefs = vi.mocked(listFinancialReferencesFn)

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
  it('popula as 6 listas a partir das fontes cross-módulo', async () => {
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

    mRefs.mockResolvedValue({
      ok: true,
      data: {
        costCenters: [{ id: 'c1', code: '01', name: 'Diretoria' }],
        categories: [
          { id: 'k1', name: 'Consultoria', group: 'despesa', parentId: null, costCenterId: null },
          { id: 'k2', name: 'Consultoria Jurídica', group: 'despesa', parentId: 'k1', costCenterId: null },
        ],
      },
    } as never)

    const { result } = renderHook(() => usePosicaoFilterOptions(), { wrapper: wrapper() })

    await waitFor(() => {
      expect(result.current.plano.length).toBeGreaterThan(0)
      expect(result.current.conta.length).toBe(3)
      expect(result.current.centro.length).toBe(1)
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
    // Catálogo flat: categoria = topo; subcategoria = filha; value=id.
    expect(result.current.centro).toEqual([{ value: 'c1', label: 'Diretoria' }])
    expect(result.current.categoria).toEqual([{ value: 'k1', label: 'Consultoria' }])
    expect(result.current.subcategoria).toEqual([{ value: 'k2', label: 'Consultoria Jurídica' }])
  })

  it('degrada a [] quando as fontes falham (erro/permissão)', async () => {
    mPlans.mockResolvedValue({ ok: false, error: 'forbidden' } as never)
    mSuppliers.mockResolvedValue({ ok: false, error: 'forbidden' } as never)
    mAccounts.mockResolvedValue({ ok: false, error: 'forbidden' } as never)
    mRefs.mockResolvedValue({ ok: false, error: 'forbidden' } as never)

    const { result } = renderHook(() => usePosicaoFilterOptions(), { wrapper: wrapper() })

    // Aguarda as queries resolverem (todas → []).
    await waitFor(() => {
      expect(mPlans).toHaveBeenCalled()
      expect(mRefs).toHaveBeenCalled()
    })

    expect(result.current.plano).toEqual([])
    expect(result.current.partner).toEqual([])
    expect(result.current.conta).toEqual([])
    expect(result.current.centro).toEqual([])
    expect(result.current.categoria).toEqual([])
    expect(result.current.subcategoria).toEqual([])
  })
})
