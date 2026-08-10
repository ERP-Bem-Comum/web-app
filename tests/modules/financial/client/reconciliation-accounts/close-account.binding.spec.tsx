/**
 * useCloseAccount (Vitest/jsdom) — encerrar conta-cedente com CONFIRMAÇÃO (#close). Cobre:
 *   (a) request → abre o alvo (modal); confirm → chama closeAccount(id), limpa o alvo e invalida o grid;
 *   (b) erro do BFF → mantém o alvo aberto + tag de erro (sem limpar), não invalida;
 *   (c) cancel → fecha o alvo sem chamar o repo.
 * O repository é mockado (sem RPC real).
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok, err } from '#shared/primitives/result.ts'
import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { useCloseAccount } from '#modules/financial/client/reconciliation-accounts/close-account.binding.ts'

vi.mock('#modules/financial/client/data/repository/reconciliation.repository.instance.ts', () => ({
  reconciliationRepository: { closeAccount: vi.fn() },
}))

const mockedClose = vi.mocked(reconciliationRepository.closeAccount)
const ID = 'b1a7c0de-0000-4000-8000-000000000168'

const setup = () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, ...renderHook(() => useCloseAccount(), { wrapper }) }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useCloseAccount', () => {
  it('(a) request abre o alvo; confirm encerra, limpa o alvo e invalida o grid', async () => {
    mockedClose.mockResolvedValue(ok({ id: ID } as never))
    const { client, result } = setup()
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    act(() => {
      result.current.request(ID, 'Conta Movimento')
    })
    expect(result.current.target).toEqual({ id: ID, alias: 'Conta Movimento' })

    act(() => {
      result.current.confirm()
    })
    await waitFor(() => {
      expect(result.current.target).toBeNull()
    })
    expect(mockedClose).toHaveBeenCalledWith(ID)
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['financial', 'reconciliation', 'accounts'],
    })
    expect(result.current.errorTag).toBeNull()
  })

  it('(b) erro do BFF → mantém o alvo aberto + tag de erro', async () => {
    mockedClose.mockResolvedValue(err('forbidden'))
    const { result } = setup()

    act(() => {
      result.current.request(ID, 'Conta Movimento')
    })
    act(() => {
      result.current.confirm()
    })
    await waitFor(() => {
      expect(result.current.errorTag).toBe('financial.recon.error.forbidden')
    })
    expect(result.current.target).not.toBeNull() // segue aberto p/ o usuário reagir
  })

  it('(c) cancel fecha o alvo sem chamar o repo', () => {
    const { result } = setup()
    act(() => {
      result.current.request(ID, 'Conta Movimento')
    })
    act(() => {
      result.current.cancel()
    })
    expect(result.current.target).toBeNull()
    expect(mockedClose).not.toHaveBeenCalled()
  })
})
