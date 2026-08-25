/**
 * useAddAccount (Vitest/jsdom) — a régua da AGÊNCIA-DV (decisão da P.O., 25/08).
 *
 * O DV da agência passou a ser obrigatório no cadastro da conta-cedente: conta salva sem ele é um
 * cadastro incompleto cujo defeito só aparece na hora de pagar.
 *
 * ⚠️ O ponto mais importante deste arquivo é o último teste: o DV é EXIGIDO na tela mas NÃO VIAJA ao
 * backend, porque não há onde guardá-lo (`fin_cedente_accounts` tem `account_digit` e nenhum
 * `agency_digit`). Concatená-lo em `agency` corromperia o header do CNAB — o campo é posicional, e
 * `digits(agency, 5)` escreveria `14872` onde o banco espera `01487`. Este teste é o que impede alguém
 * de "consertar" a perda do DV do jeito errado.
 *
 * O repository é mockado (sem RPC real).
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok } from '#shared/primitives/result.ts'
import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { useAddAccount } from '#modules/financial/client/reconciliation-accounts/add-account.binding.ts'

vi.mock('#modules/financial/client/data/repository/reconciliation.repository.instance.ts', () => ({
  reconciliationRepository: { createAccount: vi.fn() },
}))

const mockedCreate = vi.mocked(reconciliationRepository.createAccount)
const bankNameOf = (code: string): string | undefined => (code === '237' ? 'Bradesco' : undefined)

const setup = () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(() => useAddAccount(bankNameOf, '30275386000105', vi.fn()), { wrapper })
}

/** Preenche tudo o que o form exige, menos a agência — o campo em teste. */
const fillExceptAgency = (result: { current: ReturnType<typeof useAddAccount> }) => {
  act(() => {
    result.current.setBank('237')
    result.current.setAccount('0012345-7')
  })
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useAddAccount — agência com DV obrigatório', () => {
  it('guarda só DÍGITOS: o hífen digitado não entra no estado', () => {
    const { result } = setup()
    act(() => {
      result.current.setAgency('1487-2')
    })
    expect(result.current.agency).toBe('14872')
  })

  it('não passa de 5 dígitos — colar um número longo não enche o campo para depois "sumir"', () => {
    const { result } = setup()
    act(() => {
      result.current.setAgency('148729999')
    })
    expect(result.current.agency).toBe('14872')
  })

  it('⚠️ agência SEM DV não libera o Salvar', () => {
    const { result } = setup()
    fillExceptAgency(result)
    act(() => {
      result.current.setAgency('1487')
    })
    expect(result.current.agencyIncomplete).toBe(true)
    expect(result.current.canSubmit).toBe(false)
  })

  it('agência COM DV libera o Salvar', () => {
    const { result } = setup()
    fillExceptAgency(result)
    act(() => {
      result.current.setAgency('14872')
    })
    expect(result.current.agencyIncomplete).toBe(false)
    expect(result.current.canSubmit).toBe(true)
  })

  it('campo vazio não é pendência — é o estado inicial', () => {
    const { result } = setup()
    expect(result.current.agencyIncomplete).toBe(false)
    expect(result.current.canSubmit).toBe(false)
  })

  it('⚠️ o submit envia só a BASE (4 dígitos) — o DV NÃO vai concatenado, senão corrompe o CNAB', async () => {
    mockedCreate.mockResolvedValue(ok(undefined) as never)
    const { result } = setup()
    fillExceptAgency(result)
    act(() => {
      result.current.setAgency('14872')
    })
    act(() => {
      result.current.submit()
    })

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalled()
    })
    const [payload] = mockedCreate.mock.calls[0] ?? []
    expect(payload?.agency).toBe('1487')
    // Nem o hífen, nem o DV colado ao final: as duas formas quebrariam `digits(agency, 5)` no header.
    expect(payload?.agency).not.toContain('-')
    expect(payload?.agency).not.toBe('14872')
  })
})
