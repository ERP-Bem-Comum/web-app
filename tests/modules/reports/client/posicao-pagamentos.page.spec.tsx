/**
 * PosicaoPagamentosPage + PosicaoTreeTable (Vitest/jsdom) — comportamento da tela do relatório "Posição de
 * Pagamentos" LIGADA À FONTE REAL (#114, via `reportsRepository.getPaymentPosition` MOCKADO):
 *   0. troca placeholder→real: os dados vêm do repository mockado (não das constantes placeholder).
 *   1. loading → ready: enquanto a query resolve mostra "Carregando…"; depois a árvore/KPIs/gráficos.
 *   2. filtros recolhíveis: o toggle "Filtros" alterna aria-pressed.
 *   3. tabela hierárquica: renderiza os fornecedores (raízes) + a linha "Total Geral".
 *   4. expand/collapse: expandir um fornecedor revela seus centros de custo; recolher os esconde.
 *   5. export: clicar "CSV" dispara o download (Blob + anchor).
 *   6. empty-state honesto: `[]` do backend → painel único de vazio (sem árvore).
 *   7. erro do BFF → painel de erro (tag i18n), nunca status HTTP.
 * Fixtures SINTÉTICAS (LGPD).
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok, err } from '#shared/primitives/result.ts'
import type { PaymentPosition } from '#modules/reports/client/data/model/payment-position.model.ts'
import { reportsRepository } from '#modules/reports/client/data/repository/reports.repository.instance.ts'
import { PosicaoPagamentosPage } from '#modules/reports/client/page/posicao-pagamentos.page.tsx'
import { aggregatePosicao, toRawPosicaoRows } from '#modules/reports/client/posicao.view-model.ts'
import { paymentPositionQueryKey } from '#modules/reports/client/posicao.query.ts'

import { listBudgetPlansFn } from '#modules/budget-plans/public-api/index.ts'
import { listSuppliersFn } from '#modules/partners/public-api/index.ts'
import { listCedenteAccountsFn } from '#modules/financial/public-api/index.ts'

vi.mock('#modules/reports/client/data/repository/reports.repository.instance.ts', () => ({
  reportsRepository: {
    getTeam: vi.fn(),
    getSuppliersWithoutContract: vi.fn(),
    getPaymentPosition: vi.fn(),
  },
}))

// Fontes cross-módulo dos dropdowns de filtro (populam agora; APLICAR depende do core-api#588).
vi.mock('#modules/budget-plans/public-api/index.ts', () => ({ listBudgetPlansFn: vi.fn() }))
vi.mock('#modules/partners/public-api/index.ts', () => ({ listSuppliersFn: vi.fn() }))
// Centro/Categoria/Subcategoria vêm da CASCATA do plano (hooks do financial) — mockados como [] (sem plano).
vi.mock('#modules/financial/public-api/index.ts', () => ({
  listCedenteAccountsFn: vi.fn(),
  useCostCenterOptionsFromPlan: vi.fn(() => []),
  useCategoryOptionsFromPlan: vi.fn(() => []),
  useSubcategoryOptionsFromPlan: vi.fn(() => []),
}))

const mockedGetPaymentPosition = vi.mocked(reportsRepository.getPaymentPosition)
const mPlans = vi.mocked(listBudgetPlansFn)
const mSuppliers = vi.mocked(listSuppliersFn)
const mAccounts = vi.mocked(listCedenteAccountsFn)

/** Fontes de filtro com defaults vazios; Fornecedor traz uma opção REAL distinta da árvore. */
function stubFilterSources(): void {
  mPlans.mockResolvedValue({ ok: true, data: { items: [] } } as never)

  mSuppliers.mockResolvedValue({
    ok: true,
    data: { items: [{ id: 'sup-9', name: 'Fornecedor Filtro' }], meta: {} },
  } as never)
  mAccounts.mockResolvedValue({ ok: true, data: [] } as never)
}

// Fixture sintética: 2 fornecedores × centros × categorias, com os 3 buckets já derivados (number/centavos).
const POSITIONS: readonly PaymentPosition[] = [
  {
    supplierRef: 's1',
    supplierName: 'Fornecedor Alfa',
    costCenterRef: 'c1',
    costCenterName: 'Diretoria',
    categoryRef: 'k1',
    categoryName: 'Consultoria',
    // pending = TODOS os não-pagos (inclui os vencidos); overdue ⊆ pending.
    pendingCents: 9000,
    paidCents: 1000,
    overdueCents: 3000,
  },
  {
    supplierRef: 's1',
    supplierName: 'Fornecedor Alfa',
    costCenterRef: 'c2',
    costCenterName: 'Operações',
    categoryRef: 'k2',
    categoryName: 'Materiais',
    pendingCents: 2000,
    paidCents: 0,
    overdueCents: 500,
  },
  {
    supplierRef: 's2',
    supplierName: 'Fornecedor Beta',
    costCenterRef: 'c3',
    costCenterName: 'Marketing',
    categoryRef: 'k3',
    categoryName: 'Serviços',
    pendingCents: 1500,
    paidCents: 4000,
    overdueCents: 0,
  },
]

const report = aggregatePosicao(toRawPosicaoRows(POSITIONS))
const firstSupplier = report.suppliers[0]
const firstCostCenter = firstSupplier?.children[0]

function renderPage(): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  render(<PosicaoPagamentosPage />, { wrapper })
}

/** Renderiza e aguarda a árvore real aparecer (query resolveu). */
async function renderReady(): Promise<void> {
  mockedGetPaymentPosition.mockResolvedValue(ok(POSITIONS))
  stubFilterSources()
  renderPage()
  await screen.findByText('Total Geral')
}

beforeEach(() => {
  // Defaults seguros p/ as fontes de filtro (as queries rodam antes dos early-returns). Testes específicos sobrescrevem.
  stubFilterSources()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('PosicaoPagamentosPage — fonte real (loading/ready)', () => {
  it('mostra o estado de carregamento enquanto a query não resolve', () => {
    mockedGetPaymentPosition.mockReturnValue(new Promise(() => undefined))
    renderPage()
    expect(screen.getByText('Carregando a posição…')).toBeTruthy()
  })

  it('resolve com os dados REAIS do repository (não do placeholder)', async () => {
    await renderReady()
    expect(mockedGetPaymentPosition).toHaveBeenCalledTimes(1)
    expect(screen.getAllByText('Fornecedor Alfa').length).toBeGreaterThan(0)
  })
})

describe('PosicaoPagamentosPage — filtros recolhíveis', () => {
  it('o toggle "Filtros" começa fechado e alterna', async () => {
    await renderReady()
    const toggle = screen.getByRole('button', { name: 'Filtros' })
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByLabelText('Status')).toBeTruthy()
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
  })

  it('popula os dropdowns com opções REAIS (não só "Todos")', async () => {
    await renderReady()
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))

    // Status é estático (chips do CAP): "Aprovado" aparece além do "Todos".
    const statusSelect = screen.getByLabelText('Status')
    expect(within(statusSelect).getByRole('option', { name: 'Aprovado' })).toBeTruthy()
    // Fornecedor vem da fonte real (listSuppliersFn) — opção distinta da árvore.
    const partnerSelect = screen.getByLabelText('Fornecedor')
    await waitFor(() => {
      expect(within(partnerSelect).getByRole('option', { name: 'Fornecedor Filtro' })).toBeTruthy()
    })
    // O "Todos" segue como 1ª opção (prepend).
    expect(within(partnerSelect).getAllByRole('option')[0]?.textContent).toBe('Todos')
  })
})

describe('PosicaoPagamentosPage — aplicar filtro (Filtrar)', () => {
  it('mudar um select NÃO re-busca; só o clique em "Filtrar" dispara a query com os params', async () => {
    await renderReady()
    // 1ª carga: consulta SEM filtro (aplicado = {}).
    expect(mockedGetPaymentPosition).toHaveBeenCalledTimes(1)
    expect(mockedGetPaymentPosition).toHaveBeenLastCalledWith({})

    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    const partnerSelect = screen.getByLabelText('Fornecedor')
    await waitFor(() => {
      expect(within(partnerSelect).getByRole('option', { name: 'Fornecedor Filtro' })).toBeTruthy()
    })

    // Selecionar o fornecedor + o status NÃO deve refetch (só draft).
    fireEvent.change(partnerSelect, { target: { value: 'sup-9' } })
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'Approved' } })
    expect(mockedGetPaymentPosition).toHaveBeenCalledTimes(1)

    // "Filtrar" aplica → re-busca com os params (vazios viram undefined).
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    await waitFor(() => {
      expect(mockedGetPaymentPosition).toHaveBeenCalledTimes(2)
    })
    expect(mockedGetPaymentPosition).toHaveBeenLastCalledWith(
      expect.objectContaining({ supplierRef: 'sup-9', status: 'Approved' }),
    )
  })

  it('o input de data De/Até entra no filtro aplicado', async () => {
    await renderReady()
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-01-01' } })
    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '2026-02-01' } })
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    await waitFor(() => {
      expect(mockedGetPaymentPosition).toHaveBeenLastCalledWith(
        expect.objectContaining({ dueFrom: '2026-01-01', dueTo: '2026-02-01' }),
      )
    })
  })
})

describe('paymentPositionQueryKey — o filtro entra na cache identity', () => {
  it('filtros diferentes → chaves diferentes; ausente → null (troca de filtro re-busca)', () => {
    const empty = paymentPositionQueryKey({})
    const withSupplier = paymentPositionQueryKey({ supplierRef: 'sup-9', status: 'Approved' })
    expect(empty).not.toEqual(withSupplier)
    expect(withSupplier).toContain('sup-9')
    expect(withSupplier).toContain('Approved')
    // Campos ausentes viram null (chave estável, ordem fixa).
    expect(empty).toEqual([
      'reports',
      'payment-position',
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ])
  })
})

describe('PosicaoPagamentosPage — tabela hierárquica', () => {
  it('renderiza os fornecedores (raízes) e a linha "Total Geral"', async () => {
    await renderReady()
    expect(firstSupplier).toBeDefined()
    expect(screen.getAllByText(firstSupplier?.name ?? '').length).toBeGreaterThan(0)
    expect(screen.getByText('Total Geral')).toBeTruthy()
  })

  it('mostra as 3 medidas derivadas (Em atraso / Pago / A pagar) e os cards', async () => {
    await renderReady()
    expect(screen.getAllByText('Em atraso').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pago').length).toBeGreaterThan(0)
    expect(screen.getAllByText('A pagar').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Atrasado').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Total').length).toBeGreaterThan(0)
  })

  it('mostra os 2 gráficos (Resumo total + Distribuição por Fornecedor)', async () => {
    await renderReady()
    expect(screen.getByText('Resumo total')).toBeTruthy()
    expect(screen.getByText('Distribuição por Fornecedor')).toBeTruthy()
  })

  it('NÃO mostra os centros de custo antes de expandir o fornecedor', async () => {
    await renderReady()
    expect(firstCostCenter).toBeDefined()
    expect(screen.queryByText(firstCostCenter?.name ?? '__none__')).toBeNull()
  })
})

describe('PosicaoPagamentosPage — expand/collapse', () => {
  it('expandir um fornecedor revela seus centros de custo; recolher os esconde', async () => {
    await renderReady()
    const ccName = firstCostCenter?.name ?? '__none__'
    const btn = screen.getAllByRole('button', { name: 'Expandir' })[0]
    if (btn === undefined) throw new Error('sem botão Expandir')
    fireEvent.click(btn)
    expect(screen.getByText(ccName)).toBeTruthy()

    const collapseBtn = screen.getAllByRole('button', { name: 'Recolher' })[0]
    if (collapseBtn === undefined) throw new Error('sem botão Recolher')
    fireEvent.click(collapseBtn)
    expect(screen.queryByText(ccName)).toBeNull()
  })
})

describe('PosicaoPagamentosPage — export CSV', () => {
  it('clicar em "CSV" dispara o download (cria e clica um anchor)', async () => {
    const createUrl = vi.fn(() => 'blob:posicao')
    const revokeUrl = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { value: createUrl, configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeUrl, configurable: true })
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    await renderReady()
    fireEvent.click(screen.getByRole('button', { name: 'CSV' }))

    expect(createUrl).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeUrl).toHaveBeenCalledTimes(1)
  })
})

describe('PosicaoPagamentosPage — empty & erro', () => {
  it('backend devolve [] → empty-state honesto (sem "Total Geral")', async () => {
    mockedGetPaymentPosition.mockResolvedValue(ok([]))
    renderPage()
    const empties = await screen.findAllByText('Nenhum dado para exibir.')
    expect(empties.length).toBeGreaterThan(0)
    expect(screen.queryByText('Total Geral')).toBeNull()
  })

  it('erro do BFF → painel de erro com a tag i18n (nunca status HTTP)', async () => {
    mockedGetPaymentPosition.mockResolvedValue(err('forbidden'))
    renderPage()
    await screen.findByText('Não foi possível carregar o relatório.')
    expect(screen.getByText('Você não tem permissão para ver este relatório.')).toBeTruthy()
  })
})

describe('PosicaoTreeTable (via page) — container', () => {
  it('a linha Total Geral existe e a tabela monta', async () => {
    await renderReady()
    expect(screen.getByText('Total Geral')).toBeTruthy()
    expect(within(document.body).getByText('Posição por fornecedor')).toBeTruthy()
  })
})

// Sanity: a agregação da fixture derivou os 3 buckets corretamente (overdue→emAtraso etc.).
describe('fixture sanity', () => {
  it('Fornecedor Alfa soma os buckets certos', async () => {
    await waitFor(() => {
      expect(firstSupplier?.measures.emAtrasoCents).toBe(3500) // overdue 3000 + 500
    })
    expect(firstSupplier?.measures.pagoCents).toBe(1000)
    expect(firstSupplier?.measures.aPagarCents).toBe(7500) // (9000−3000) + (2000−500) = 6000 + 1500
  })
})
