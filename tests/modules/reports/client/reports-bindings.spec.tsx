/**
 * Bindings dos Relatórios (Vitest/jsdom) — união discriminada §IV do `state` (loading | error | ready)
 * derivada do repository MOCKADO, sem RPC real:
 *   • usePosicaoPagamentos → ready com árvore agregada; erro → tag; loading inicial.
 *   • useSuppliersWithoutContract → ready com rawRows adaptadas; erro → tag.
 *   • useEquipe → ready com linhas adaptadas (sentinelas LGPD); erro → tag.
 * Fixtures SINTÉTICAS (LGPD).
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok, err } from '#shared/primitives/result.ts'
import type { PaymentPosition } from '#modules/reports/client/data/model/payment-position.model.ts'
import type { SupplierWithoutContract } from '#modules/reports/client/data/model/supplier-without-contract.model.ts'
import type { TeamMember } from '#modules/reports/client/data/model/team-report.model.ts'
import { reportsRepository } from '#modules/reports/client/data/repository/reports.repository.instance.ts'
import { usePosicaoPagamentos } from '#modules/reports/client/posicao.binding.ts'
import { useSuppliersWithoutContract } from '#modules/reports/client/suppliers-without-contract.binding.ts'
import { useEquipe } from '#modules/reports/client/equipe.binding.ts'

vi.mock('#modules/reports/client/data/repository/reports.repository.instance.ts', () => ({
  reportsRepository: {
    getTeam: vi.fn(),
    getSuppliersWithoutContract: vi.fn(),
    getPaymentPosition: vi.fn(),
  },
}))

const mPosition = vi.mocked(reportsRepository.getPaymentPosition)
const mSuppliers = vi.mocked(reportsRepository.getSuppliersWithoutContract)
const mTeam = vi.mocked(reportsRepository.getTeam)

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

const POSITIONS: readonly PaymentPosition[] = [
  {
    supplierRef: 's1',
    supplierName: 'Fornecedor Alfa',
    costCenterRef: 'c1',
    costCenterName: 'Diretoria',
    categoryRef: 'k1',
    categoryName: 'Consultoria',
    pendingCents: 3000,
    paidCents: 1000,
    overdueCents: 9000,
  },
]

describe('usePosicaoPagamentos', () => {
  it('loading inicial → ready com árvore agregada', async () => {
    mPosition.mockResolvedValue(ok(POSITIONS))
    const { result } = renderHook(() => usePosicaoPagamentos(), { wrapper: wrapper() })
    expect(result.current.status).toBe('loading')
    await waitFor(() => {
      expect(result.current.status).toBe('ready')
    })
    if (result.current.status === 'ready') {
      expect(result.current.report.suppliers[0]?.name).toBe('Fornecedor Alfa')
      expect(result.current.report.totals.emAtrasoCents).toBe(9000)
    }
  })

  it('erro do BFF → status error + tag i18n', async () => {
    mPosition.mockResolvedValue(err('forbidden'))
    const { result } = renderHook(() => usePosicaoPagamentos(), { wrapper: wrapper() })
    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    if (result.current.status === 'error') {
      expect(result.current.error).toBe('forbidden')
      expect(result.current.errorTag).toBe('reports.error.forbidden')
    }
  })
})

const SUPPLIERS: readonly SupplierWithoutContract[] = [
  { supplierRef: 'sup-1', name: 'Comercial Andorinha Ltda', totalCents: 1520000, payableCount: 4 },
  { supplierRef: 'sup-2', name: null, totalCents: 5000, payableCount: 1 },
]

describe('useSuppliersWithoutContract', () => {
  it('ready → rawRows adaptadas (name null → supplierRef; budgetPlan "—")', async () => {
    mSuppliers.mockResolvedValue(ok(SUPPLIERS))
    const { result } = renderHook(() => useSuppliersWithoutContract(), { wrapper: wrapper() })
    await waitFor(() => {
      expect(result.current.status).toBe('ready')
    })
    if (result.current.status === 'ready') {
      expect(result.current.rawRows.length).toBe(2)
      expect(result.current.rawRows[0]?.budgetPlan).toBe('—')
      expect(result.current.rawRows[1]?.supplier).toBe('sup-2')
    }
  })

  it('erro → status error + tag', async () => {
    mSuppliers.mockResolvedValue(err('connectivity'))
    const { result } = renderHook(() => useSuppliersWithoutContract(), { wrapper: wrapper() })
    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    if (result.current.status === 'error') {
      expect(result.current.errorTag).toBe('reports.error.connectivity')
    }
  })
})

const TEAM: readonly TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Aurora Ferreira',
    program: 'Programa Semente',
    role: 'Coordenadora',
    employmentRelationship: 'CLT',
    startOfContract: '2025-03-01',
    registrationStatus: 'Ativo',
    active: true,
    education: 'Ensino Superior',
    experienceInPublicSector: true,
  },
]

describe('useEquipe', () => {
  it('ready → linhas adaptadas com sentinelas LGPD (idade null, gênero "—")', async () => {
    mTeam.mockResolvedValue(ok(TEAM))
    const { result } = renderHook(() => useEquipe(), { wrapper: wrapper() })
    await waitFor(() => {
      expect(result.current.status).toBe('ready')
    })
    if (result.current.status === 'ready') {
      expect(result.current.rows[0]?.nome).toBe('Aurora Ferreira')
      expect(result.current.rows[0]?.idade).toBe(null)
      expect(result.current.rows[0]?.genero).toBe('—')
      expect(result.current.rows[0]?.anoContrato).toBe(2025)
    }
  })

  it('erro → status error + tag', async () => {
    mTeam.mockResolvedValue(err('server'))
    const { result } = renderHook(() => useEquipe(), { wrapper: wrapper() })
    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    if (result.current.status === 'error') {
      expect(result.current.errorTag).toBe('reports.error.server')
    }
  })
})
