/**
 * Cascata da Categorização no Lançar Documento (Vitest/jsdom) — spec 074 · core-api#341.
 * Cobre o wiring REAL da tela: o controller do form (estado + resets) + os bindings de opções
 * (`useCategoryOptions`/`useSubcategoryOptions`, que filtram por centro/categoria sobre o MESMO fetch
 * cacheado de referências). O repositório é mockado (sem RPC).
 *
 * O que se garante aqui (e que a page só repassa): escolher o Centro FILTRA a Categoria; escolher a
 * Categoria FILTRA a Subcategoria; trocar o Centro LIMPA categoria + subcategoria (nunca folha órfã).
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { useDocumentFormController } from '#modules/financial/client/document-create/document-form.controller.ts'
import {
  useCategoryOptions,
  useSubcategoryOptions,
} from '#modules/financial/client/document-create/category-options.binding.ts'

vi.mock('#modules/financial/client/data/repository/reconciliation.repository.instance.ts', () => ({
  reconciliationRepository: { getReferences: vi.fn() },
}))

const mockedRepo = vi.mocked(reconciliationRepository)

// cc-A: Aluguel + Folha (Aluguel tem 2 subcategorias). cc-B: Doações. `Ajuste` é GLOBAL (sem centro).
const REFERENCES = {
  costCenters: [
    { id: 'cc-A', code: '01', name: 'Administrativo' },
    { id: 'cc-B', code: '02', name: 'Projetos' },
  ],
  categories: [
    { id: 'cat-aluguel', name: 'Aluguel', group: 'despesa' as const, parentId: null, costCenterId: 'cc-A' },
    { id: 'cat-folha', name: 'Folha', group: 'despesa' as const, parentId: null, costCenterId: 'cc-A' },
    { id: 'cat-doacoes', name: 'Doações', group: 'receita' as const, parentId: null, costCenterId: 'cc-B' },
    { id: 'cat-ajuste', name: 'Ajuste', group: 'ajuste' as const, parentId: null, costCenterId: null },
    {
      id: 'sub-sala',
      name: 'Sala comercial',
      group: 'despesa' as const,
      parentId: 'cat-aluguel',
      costCenterId: 'cc-A',
    },
    {
      id: 'sub-galpao',
      name: 'Galpão',
      group: 'despesa' as const,
      parentId: 'cat-aluguel',
      costCenterId: 'cc-A',
    },
  ],
}

// Espelha o trio de selects da Categorização da page (Centro/Categoria/Subcategoria), com o MESMO
// controller e os MESMOS bindings — sem arrastar router/OCR/parceiros pra dentro do teste.
function Harness(): ReactNode {
  const controller = useDocumentFormController()
  const categoryOptions = useCategoryOptions(controller.fields.costCenterRef)
  const subcategoryOptions = useSubcategoryOptions(controller.fields.categoryRef)
  return (
    <div>
      <select
        aria-label="centro"
        value={controller.fields.costCenterRef}
        onChange={(e) => {
          controller.setCostCenterRef(e.target.value)
        }}
      >
        <option value="" />
        {REFERENCES.costCenters.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        aria-label="categoria"
        value={controller.fields.categoryRef}
        onChange={(e) => {
          controller.setCategoryRef(e.target.value)
        }}
      >
        <option value="" />
        {categoryOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        aria-label="subcategoria"
        value={controller.fields.subcategoryRef}
        onChange={(e) => {
          controller.setSubcategoryRef(e.target.value)
        }}
      >
        <option value="" />
        {subcategoryOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

const renderHarness = (): void => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <Harness />
    </QueryClientProvider>,
  )
}

const selectOf = (name: string): HTMLSelectElement =>
  screen.getByRole('combobox', { name }) as HTMLSelectElement

const labelsOf = (name: string): readonly string[] =>
  Array.from(selectOf(name).querySelectorAll('option'))
    .map((o) => o.textContent ?? '')
    .filter((t) => t !== '')

const valueOf = (name: string): string => selectOf(name).value

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('cascata Centro → Categoria → Subcategoria (Lançar Documento)', () => {
  it('escolher o Centro filtra a Categoria (as do centro + as globais)', async () => {
    mockedRepo.getReferences.mockResolvedValue({ ok: true, value: REFERENCES })
    renderHarness()
    // Sem centro: todas as de topo (o centro é opcional — não bloqueia).
    await waitFor(() => {
      expect(labelsOf('categoria')).toEqual(['Aluguel', 'Folha', 'Doações', 'Ajuste'])
    })

    fireEvent.change(screen.getByRole('combobox', { name: 'centro' }), { target: { value: 'cc-A' } })
    await waitFor(() => {
      expect(labelsOf('categoria')).toEqual(['Aluguel', 'Folha', 'Ajuste'])
    })

    fireEvent.change(screen.getByRole('combobox', { name: 'centro' }), { target: { value: 'cc-B' } })
    await waitFor(() => {
      expect(labelsOf('categoria')).toEqual(['Doações', 'Ajuste'])
    })
  })

  it('escolher a Categoria filtra a Subcategoria', async () => {
    mockedRepo.getReferences.mockResolvedValue({ ok: true, value: REFERENCES })
    renderHarness()
    await waitFor(() => {
      expect(labelsOf('categoria').length).toBeGreaterThan(0)
    })
    // Subcategoria começa vazia (nenhuma categoria escolhida).
    expect(labelsOf('subcategoria')).toEqual([])

    fireEvent.change(screen.getByRole('combobox', { name: 'categoria' }), {
      target: { value: 'cat-aluguel' },
    })
    await waitFor(() => {
      expect(labelsOf('subcategoria')).toEqual(['Sala comercial', 'Galpão'])
    })

    // Categoria sem filhas → subcategoria vazia de novo (e a seleção anterior não sobrevive).
    fireEvent.change(screen.getByRole('combobox', { name: 'categoria' }), { target: { value: 'cat-folha' } })
    await waitFor(() => {
      expect(labelsOf('subcategoria')).toEqual([])
    })
  })

  it('trocar o Centro LIMPA categoria + subcategoria (não deixa folha órfã)', async () => {
    mockedRepo.getReferences.mockResolvedValue({ ok: true, value: REFERENCES })
    renderHarness()
    await waitFor(() => {
      expect(labelsOf('categoria').length).toBeGreaterThan(0)
    })

    fireEvent.change(screen.getByRole('combobox', { name: 'centro' }), { target: { value: 'cc-A' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'categoria' }), {
      target: { value: 'cat-aluguel' },
    })
    await waitFor(() => {
      expect(labelsOf('subcategoria')).toEqual(['Sala comercial', 'Galpão'])
    })
    fireEvent.change(screen.getByRole('combobox', { name: 'subcategoria' }), {
      target: { value: 'sub-galpao' },
    })
    expect(valueOf('subcategoria')).toBe('sub-galpao')

    // A troca do centro zera os dois níveis de baixo.
    fireEvent.change(screen.getByRole('combobox', { name: 'centro' }), { target: { value: 'cc-B' } })
    await waitFor(() => {
      expect(valueOf('categoria')).toBe('')
    })
    expect(valueOf('subcategoria')).toBe('')
    expect(labelsOf('subcategoria')).toEqual([])
  })

  it('trocar a Categoria limpa só a Subcategoria (o Centro fica)', async () => {
    mockedRepo.getReferences.mockResolvedValue({ ok: true, value: REFERENCES })
    renderHarness()
    await waitFor(() => {
      expect(labelsOf('categoria').length).toBeGreaterThan(0)
    })

    fireEvent.change(screen.getByRole('combobox', { name: 'centro' }), { target: { value: 'cc-A' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'categoria' }), {
      target: { value: 'cat-aluguel' },
    })
    await waitFor(() => {
      expect(labelsOf('subcategoria')).toEqual(['Sala comercial', 'Galpão'])
    })
    fireEvent.change(screen.getByRole('combobox', { name: 'subcategoria' }), {
      target: { value: 'sub-sala' },
    })

    fireEvent.change(screen.getByRole('combobox', { name: 'categoria' }), { target: { value: 'cat-folha' } })
    await waitFor(() => {
      expect(valueOf('subcategoria')).toBe('')
    })
    expect(valueOf('centro')).toBe('cc-A')
  })

  it('erro nas referências → listas vazias, a tela não quebra', async () => {
    mockedRepo.getReferences.mockResolvedValue({ ok: false, error: 'server' })
    renderHarness()
    await waitFor(() => {
      expect(mockedRepo.getReferences).toHaveBeenCalled()
    })
    expect(labelsOf('categoria')).toEqual([])
    expect(labelsOf('subcategoria')).toEqual([])
  })
})
