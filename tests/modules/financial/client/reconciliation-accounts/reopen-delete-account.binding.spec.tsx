/**
 * useReopenAccount / useDeleteAccount (Vitest/jsdom) — as duas saídas que o encerramento passou a ter
 * (core-api#995 B1/B3).
 *
 * O que estes casos prendem é a ASSIMETRIA entre eles, que é decisão de desenho e não descuido:
 * reabrir age DIRETO (é o caminho de recuperação de quem errou, e desfazê-lo é só encerrar de novo),
 * enquanto excluir exige confirmação (não volta pela tela). Se alguém "uniformizar" os dois, é aqui
 * que quebra.
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok, err } from '#shared/primitives/result.ts'
import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { useReopenAccount } from '#modules/financial/client/reconciliation-accounts/reopen-account.binding.ts'
import { useDeleteAccount } from '#modules/financial/client/reconciliation-accounts/delete-account.binding.ts'

vi.mock('#modules/financial/client/data/repository/reconciliation.repository.instance.ts', () => ({
  reconciliationRepository: { reopenAccount: vi.fn(), deleteAccount: vi.fn() },
}))

const mockedReopen = vi.mocked(reconciliationRepository.reopenAccount)
const mockedDelete = vi.mocked(reconciliationRepository.deleteAccount)
const ID = 'b1a7c0de-0000-4000-8000-000000000168'

const wrap = () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, wrapper }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useReopenAccount — o desfazer age direto', () => {
  it('⚠️ NÃO pede confirmação: chama o repositório no primeiro clique', async () => {
    // Confirmar aqui cobraria mais atenção para consertar o engano do que para cometê-lo.
    mockedReopen.mockResolvedValue(ok({ id: ID } as never))
    const { wrapper } = wrap()
    const { result } = renderHook(() => useReopenAccount(), { wrapper })

    act(() => {
      result.current.reopen(ID)
    })

    await waitFor(() => {
      expect(mockedReopen).toHaveBeenCalledWith(ID)
    })
  })

  it('marca a linha em curso e a libera ao terminar — o botão sabe qual é', async () => {
    mockedReopen.mockResolvedValue(ok({ id: ID } as never))
    const { wrapper } = wrap()
    const { result } = renderHook(() => useReopenAccount(), { wrapper })

    act(() => {
      result.current.reopen(ID)
    })
    expect(result.current.reopeningId).toBe(ID)

    await waitFor(() => {
      expect(result.current.reopeningId).toBeNull()
    })
  })

  it('invalida o grid no sucesso — a conta reaberta tem de sair de "Encerradas"', async () => {
    mockedReopen.mockResolvedValue(ok({ id: ID } as never))
    const { client, wrapper } = wrap()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useReopenAccount(), { wrapper })

    act(() => {
      result.current.reopen(ID)
    })

    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['financial', 'reconciliation', 'accounts'] })
    })
  })

  it('⚠️ falha vira tag i18n e NÃO invalida — sem modal, é a única evidência que o operador tem', async () => {
    mockedReopen.mockResolvedValue(err('conflict') as never)
    const { client, wrapper } = wrap()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useReopenAccount(), { wrapper })

    act(() => {
      result.current.reopen(ID)
    })

    await waitFor(() => {
      expect(result.current.errorTag).not.toBeNull()
    })
    expect(invalidate).not.toHaveBeenCalled()
    expect(result.current.reopeningId).toBeNull()
  })
})

describe('useDeleteAccount — excluir exige confirmação', () => {
  it('⚠️ `request` NÃO chama o repositório: só arma o modal', () => {
    mockedDelete.mockResolvedValue(ok({ id: ID } as never))
    const { wrapper } = wrap()
    const { result } = renderHook(() => useDeleteAccount(), { wrapper })

    act(() => {
      result.current.request(ID, 'Conta Movimento')
    })

    expect(result.current.target).toEqual({ id: ID, alias: 'Conta Movimento' })
    expect(mockedDelete).not.toHaveBeenCalled()
  })

  it('`confirm` executa e limpa o alvo no sucesso', async () => {
    mockedDelete.mockResolvedValue(ok({ id: ID } as never))
    const { wrapper } = wrap()
    const { result } = renderHook(() => useDeleteAccount(), { wrapper })

    act(() => {
      result.current.request(ID, 'Conta Movimento')
    })
    act(() => {
      result.current.confirm()
    })

    await waitFor(() => {
      expect(mockedDelete).toHaveBeenCalledWith(ID)
    })
    await waitFor(() => {
      expect(result.current.target).toBeNull()
    })
  })

  it('⚠️ falha MANTÉM o modal aberto — fechar esconderia o motivo e o operador tentaria de novo', async () => {
    mockedDelete.mockResolvedValue(err('conflict') as never)
    const { wrapper } = wrap()
    const { result } = renderHook(() => useDeleteAccount(), { wrapper })

    act(() => {
      result.current.request(ID, 'Conta Movimento')
    })
    act(() => {
      result.current.confirm()
    })

    await waitFor(() => {
      expect(result.current.errorTag).not.toBeNull()
    })
    expect(result.current.target).not.toBeNull()
  })

  it('`confirm` sem alvo é no-op — não há como excluir "a conta nenhuma"', () => {
    const { wrapper } = wrap()
    const { result } = renderHook(() => useDeleteAccount(), { wrapper })

    act(() => {
      result.current.confirm()
    })

    expect(mockedDelete).not.toHaveBeenCalled()
  })
})
