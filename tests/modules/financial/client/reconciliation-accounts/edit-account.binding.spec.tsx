/**
 * useEditAccount (Vitest/jsdom) — editar conta-cedente (PATCH). Cobre:
 *   (a) open(account) → pré-preenche os campos a partir da conta (banco/tipo/agência/conta-DV/apelido);
 *   (b) submit → chama editAccount com o `id` + campos, limpa o alvo e invalida o grid;
 *   (c) erro do BFF → mantém o modal aberto + tag de erro (sem invalidar).
 * O repository é mockado (sem RPC real).
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok, err } from '#shared/primitives/result.ts'
import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import type { ReconciliationAccount } from '#modules/financial/client/data/model/reconciliation.model.ts'
import { useEditAccount } from '#modules/financial/client/reconciliation-accounts/edit-account.binding.ts'

vi.mock('#modules/financial/client/data/repository/reconciliation.repository.instance.ts', () => ({
  reconciliationRepository: { editAccount: vi.fn() },
}))

const mockedEdit = vi.mocked(reconciliationRepository.editAccount)
const ID = 'b1a7c0de-0000-4000-8000-000000000168'
const bankNameOf = (code: string): string | undefined => (code === '237' ? 'Bradesco' : undefined)

const ACCOUNT: ReconciliationAccount = {
  id: ID,
  bankCode: '237',
  bankName: 'Bradesco',
  branch: '1462',
  accountNumber: '0012345',
  accountDv: '7',
  alias: 'Conta Movimento',
  type: 'Corrente',
  typeLabel: null,
  status: 'active',
  currentBalanceCents: '0',
  lastUpdatedAt: '2026-06-18',
  pendingCount: 0,
  openingBalanceCents: null,
  openingBalanceDate: null,
} as unknown as ReconciliationAccount

const setup = () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const onSaved = vi.fn()
  return {
    client,
    onSaved,
    ...renderHook(() => useEditAccount(bankNameOf, onSaved), { wrapper }),
  }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useEditAccount', () => {
  it('(a) open pré-preenche os campos a partir da conta', () => {
    const { result } = setup()
    act(() => {
      result.current.open(ACCOUNT)
    })
    expect(result.current.target?.id).toBe(ID)
    expect(result.current.bankCode).toBe('237')
    expect(result.current.type).toBe('Corrente')
    expect(result.current.agency).toBe('1462')
    expect(result.current.account).toBe('0012345-7') // número-DV combinado
    expect(result.current.nickname).toBe('Conta Movimento')
  })

  it('(b) submit → PATCH com id + campos, limpa o alvo, invalida o grid e chama onSaved', async () => {
    mockedEdit.mockResolvedValue(ok({ id: ID } as never))
    const { client, onSaved, result } = setup()
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    act(() => {
      result.current.open(ACCOUNT)
    })
    act(() => {
      result.current.setNickname('Conta Principal')
    })
    act(() => {
      result.current.submit()
    })

    await waitFor(() => {
      expect(result.current.target).toBeNull()
    })
    const arg = mockedEdit.mock.calls[0]?.[0]
    expect(arg?.id).toBe(ID)
    expect(arg?.accountNumber).toBe('0012345')
    expect(arg?.accountDigit).toBe('7')
    expect(arg?.nickname).toBe('Conta Principal')
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['financial', 'reconciliation', 'accounts'],
    })
    expect(onSaved).toHaveBeenCalledTimes(1)
  })

  it('(c) erro do BFF → mantém o modal aberto + tag de erro', async () => {
    mockedEdit.mockResolvedValue(err('forbidden'))
    const { result } = setup()

    act(() => {
      result.current.open(ACCOUNT)
    })
    act(() => {
      result.current.submit()
    })

    await waitFor(() => {
      expect(result.current.errorTag).toBe('financial.recon.error.forbidden')
    })
    expect(result.current.target).not.toBeNull()
  })
})
