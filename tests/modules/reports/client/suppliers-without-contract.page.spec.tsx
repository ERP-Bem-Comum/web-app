/**
 * SuppliersWithoutContractPage (Vitest/jsdom) — o painel de filtros deste relatório era 100% PLACEHOLDER até
 * o core-api#694 (5 selects sem fonte, campo de data solto, botão "Filtrar" SEM onClick; só o Limite valia).
 * Estes testes fixam o que mudou:
 *   1. abre mostrando TUDO — a 1ª carga vai sem recorte (filtro é recorte, não pré-requisito);
 *   2. os dropdowns POPULAM com dado real (Programa/Plano) e o Plano dirige a cascata;
 *   3. mudar um campo NÃO re-busca; "Filtrar" commita e manda os filtros ao SERVIDOR;
 *   4. a árvore mostra o Plano Orçamentário REAL (antes era um traço escrito em código).
 * Fixtures SINTÉTICAS.
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok } from '#shared/primitives/result.ts'
import type { SupplierWithoutContract } from '#modules/reports/client/data/model/supplier-without-contract.model.ts'
import { reportsRepository } from '#modules/reports/client/data/repository/reports.repository.instance.ts'
import { SuppliersWithoutContractPage } from '#modules/reports/client/page/suppliers-without-contract.page.tsx'

vi.mock('#modules/reports/client/data/repository/reports.repository.instance.ts', () => ({
  reportsRepository: {
    getSuppliersWithoutContract: vi.fn(),
    getPartnersMap: vi.fn(() => Promise.resolve({ ok: false, error: 'forbidden' })),
  },
}))

// Cascata Centro/Categoria/Subcategoria vem de hooks do financial (vazia aqui — sem plano escolhido).
vi.mock('#modules/financial/public-api/index.ts', () => ({
  listCedenteAccountsFn: vi.fn(() => Promise.resolve({ ok: false, error: 'forbidden' })),
  listSuppliersFn: vi.fn(() => Promise.resolve({ ok: false, error: 'forbidden' })),
  // Espelha o hook real: COM plano devolve a taxonomia do plano; SEM plano cairia no catálogo operacional
  // flat (é justamente o que o binding do relatório precisa barrar).
  useCostCenterOptionsFromPlan: vi.fn((planoRef: string) =>
    planoRef === ''
      ? [{ value: 'op-cc', label: 'CC OPERACIONAL (fora da taxonomia)' }]
      : [{ value: 'cc-1', label: 'Diretoria (do plano)' }],
  ),
  useCategoryOptionsFromPlan: vi.fn((planoRef: string) =>
    planoRef === '' ? [{ value: 'op-cat', label: 'CAT OPERACIONAL (fora da taxonomia)' }] : [],
  ),
  useSubcategoryOptionsFromPlan: vi.fn((planoRef: string) =>
    planoRef === '' ? [{ value: 'op-sub', label: 'SUB OPERACIONAL (fora da taxonomia)' }] : [],
  ),
}))
vi.mock('#modules/budget-plans/public-api/index.ts', () => ({
  listBudgetPlansFn: vi.fn(() =>
    Promise.resolve({
      ok: true,
      data: {
        items: [
          {
            id: 'plan-1',
            year: 2026,
            programName: 'Programa ABC',
            programAbbreviation: 'ABC',
            version: 1,
            scenarioName: null,
            status: 'APROVADO',
            totalInCents: 0,
            updatedByName: null,
            updatedAt: '2026-01-01',
            networkKind: 'ESTADO',
            partnersCount: 0,
            children: [],
          },
        ],
      },
    }),
  ),
  getBudgetPlanDetailFn: vi.fn(() => Promise.resolve({ ok: false, error: 'forbidden' })),
}))
vi.mock('#modules/programs/public-api/index.ts', () => ({
  listProgramsFn: vi.fn(() =>
    Promise.resolve({ ok: true, data: { items: [{ id: 'prog-1', sigla: 'ABC', name: 'Programa ABC' }] } }),
  ),
}))

const mSuppliers = vi.mocked(reportsRepository.getSuppliersWithoutContract)

const SUPPLIERS: readonly SupplierWithoutContract[] = [
  {
    supplierRef: 'sup-1',
    name: 'Comercial Andorinha Ltda',
    totalCents: 1520000,
    payableCount: 4,
    budgetPlanRef: 'plan-1',
    budgetPlanName: '2026 ABC 1.0',
  },
]

function renderPage(): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  render(<SuppliersWithoutContractPage />, { wrapper })
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('SuppliersWithoutContractPage — filtros ligados ao servidor (#694)', () => {
  it('a 1ª carga vai SEM recorte — a tela abre mostrando tudo', async () => {
    mSuppliers.mockResolvedValue(ok(SUPPLIERS))
    renderPage()
    await screen.findAllByText('Comercial Andorinha Ltda')
    expect(mSuppliers).toHaveBeenCalledWith({})
  })

  it('a árvore mostra o Plano Orçamentário REAL (antes era um traço escrito em código)', async () => {
    mSuppliers.mockResolvedValue(ok(SUPPLIERS))
    renderPage()
    await screen.findAllByText('Comercial Andorinha Ltda')
    // O plano é o 2º nível: aparece ao expandir o fornecedor.
    fireEvent.click(screen.getByRole('button', { name: 'Expandir' }))
    // Escopo na TABELA: o mesmo rótulo também existe como <option> no dropdown de Plano.
    const tabela = screen.getByRole('table')
    await waitFor(() => {
      expect(within(tabela).getByText('2026 ABC 1.0')).toBeTruthy()
    })
  })

  it('mudar um campo NÃO re-busca; "Filtrar" manda o recorte ao servidor', async () => {
    mSuppliers.mockResolvedValue(ok(SUPPLIERS))
    renderPage()
    await screen.findAllByText('Comercial Andorinha Ltda')
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))

    const programa = await screen.findByLabelText('Programa')
    await waitFor(() => {
      expect(programa.querySelectorAll('option').length).toBeGreaterThan(1)
    })
    mSuppliers.mockClear()
    fireEvent.change(programa, { target: { value: 'prog-1' } })
    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-01-01' } })
    // Draft: nada foi ao servidor ainda.
    expect(mSuppliers).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    await waitFor(() => {
      expect(mSuppliers).toHaveBeenCalledWith({ programId: 'prog-1', dueFrom: '2026-01-01' })
    })
  })

  it('"Limpar filtros" zera TODOS de uma vez e volta a mostrar tudo (sem exigir o "Filtrar")', async () => {
    mSuppliers.mockResolvedValue(ok(SUPPLIERS))
    renderPage()
    await screen.findAllByText('Comercial Andorinha Ltda')
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))

    const programa = await screen.findByLabelText('Programa')
    await waitFor(() => {
      expect(programa.querySelectorAll('option').length).toBeGreaterThan(1)
    })
    fireEvent.change(programa, { target: { value: 'prog-1' } })
    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-01-01' } })
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    await waitFor(() => {
      expect(mSuppliers).toHaveBeenCalledWith({ programId: 'prog-1', dueFrom: '2026-01-01' })
    })

    // O refetch troca a tela por "Carregando…" (o painel some junto) — espera o dado voltar.
    await screen.findAllByText('Comercial Andorinha Ltda')
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    mSuppliers.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    // Volta ao estado SEM recorte na hora — limpar É voltar a ver tudo, sem exigir o "Filtrar".
    // A queryKey volta para a de "sem filtro", que já está em cache: pode não haver nova ida ao
    // servidor — o que NÃO pode é sobrar recorte. Nenhuma chamada depois do limpar leva filtro.
    await waitFor(() => {
      expect((screen.getByLabelText('Programa') as HTMLSelectElement).value).toBe('')
    })
    expect((screen.getByLabelText('De') as HTMLInputElement).value).toBe('')
    for (const [arg] of mSuppliers.mock.calls) expect(arg).toEqual({})
    await screen.findAllByText('Comercial Andorinha Ltda')
  })

  it('SEM plano escolhido, Centro/Categoria/Subcategoria ficam só com "Todos" — nada do catálogo operacional', async () => {
    mSuppliers.mockResolvedValue(ok(SUPPLIERS))
    renderPage()
    await screen.findAllByText('Comercial Andorinha Ltda')
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))

    for (const rotulo of ['Centro de custo', 'Categoria de custo', 'Subcategoria de custo']) {
      const campo = await screen.findByLabelText(rotulo)
      const opcoes = [...campo.querySelectorAll('option')].map((o) => o.textContent)
      expect(opcoes).toEqual(['Todos'])
    }
    // O que o catálogo operacional ofereceria NÃO pode aparecer (ADR-0051: quem manda é o plano).
    expect(screen.queryByText(/OPERACIONAL/)).toBeNull()
  })

  it('COM plano escolhido, o Centro passa a listar a taxonomia DAQUELE plano', async () => {
    mSuppliers.mockResolvedValue(ok(SUPPLIERS))
    renderPage()
    await screen.findAllByText('Comercial Andorinha Ltda')
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))

    const plano = await screen.findByLabelText('Plano Orçamentário')
    await waitFor(() => {
      expect(plano.querySelector('option[value="plan-1"]')).toBeTruthy()
    })
    fireEvent.change(plano, { target: { value: 'plan-1' } })

    const centro = screen.getByLabelText('Centro de custo')
    await waitFor(() => {
      expect(centro.querySelector('option[value="cc-1"]')).toBeTruthy()
    })
    expect(centro.textContent).toContain('Diretoria (do plano)')
  })

  it('o Plano popula com dado real e o "Todos" segue como opção', async () => {
    mSuppliers.mockResolvedValue(ok(SUPPLIERS))
    renderPage()
    await screen.findAllByText('Comercial Andorinha Ltda')
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    const plano = await screen.findByLabelText('Plano Orçamentário')
    await waitFor(() => {
      expect(plano.querySelector('option[value="plan-1"]')).toBeTruthy()
    })
    expect(plano.querySelector('option[value=""]')).toBeTruthy()
  })
})
