/**
 * useRemittancePreview (Vitest/jsdom) — binding do PRÉ-VOO da remessa (VAN, core-api#728). Cobre:
 *   (a) `start` abre a conferência e chama o repository UMA vez, com os ids recebidos;
 *   (b) erro do BFF vira `errorTag` (§V: a UI trata a tag, nunca o status HTTP);
 *   (c) `start([])` não abre nem chama nada (seleção vazia não dispara ida ao backend);
 *   (d) `close` LIMPA o resultado — reabrir com outra seleção não pode mostrar o pré-voo anterior.
 *
 * A (d) é a que importa: pré-voo velho exibido como se fosse o atual é o defeito que a conferência
 * existe para impedir.
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok, err } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import { useRemittancePreview } from '#modules/financial/client/contas-a-pagar-list/remittance-preview.binding.ts'

vi.mock('#modules/financial/client/data/repository/financial.repository.instance.ts', () => ({
  financialRepository: { previewRemittance: vi.fn() },
}))

const mocked = vi.mocked(financialRepository.previewRemittance)

const PREVIEW = {
  lines: [{ documentId: 'doc-1', status: 'ready', route: 'pix', gaps: [], netValueCents: '25000' }],
  readyCount: 1,
  blockedCount: 0,
  outOfVanCount: 0,
  notFoundCount: 0,
  readyTotalCents: '25000',
  blockedTotalCents: '0',
} as never

const setup = () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(() => useRemittancePreview(), { wrapper })
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useRemittancePreview', () => {
  it('start abre a conferência e busca o pré-voo dos ids informados', async () => {
    mocked.mockResolvedValue(ok(PREVIEW))
    const { result } = setup()

    expect(result.current.open).toBe(false)
    act(() => {
      result.current.start(['doc-1'])
    })

    expect(result.current.open).toBe(true)
    await waitFor(() => {
      expect(result.current.preview).not.toBeNull()
    })
    expect(mocked).toHaveBeenCalledTimes(1)
    expect(mocked).toHaveBeenCalledWith({ documentIds: ['doc-1'] })
    expect(result.current.errorTag).toBeNull()
  })

  it('erro do BFF vira tag i18n, sem preview', async () => {
    mocked.mockResolvedValue(err('forbidden'))
    const { result } = setup()

    act(() => {
      result.current.start(['doc-1'])
    })

    await waitFor(() => {
      expect(result.current.errorTag).toBe('financial.error.forbidden')
    })
    expect(result.current.preview).toBeNull()
  })

  it('seleção vazia não abre nem chama o backend', () => {
    const { result } = setup()
    act(() => {
      result.current.start([])
    })
    expect(result.current.open).toBe(false)
    expect(mocked).not.toHaveBeenCalled()
  })

  it('close descarta o resultado — reabrir não mostra o pré-voo anterior', async () => {
    mocked.mockResolvedValue(ok(PREVIEW))
    const { result } = setup()

    act(() => {
      result.current.start(['doc-1'])
    })
    await waitFor(() => {
      expect(result.current.preview).not.toBeNull()
    })

    act(() => {
      result.current.close()
    })

    expect(result.current.open).toBe(false)
    await waitFor(() => {
      expect(result.current.preview).toBeNull()
    })
  })
})
