/**
 * useBulkStatus (Vitest/jsdom) — "Mudar Status" em massa.
 *
 * O que estes casos prendem é o conserto de um defeito de COMUNICAÇÃO, não de lógica: o binding antes
 * contava as falhas e descartava o `.error`, e a tela caía numa frase única — "Algumas ações não foram
 * concluídas (atualize e tente de novo)".
 *
 * Ela era falsa no caso mais comum. As quatro recusas do aprovador (não cadastrado, sem permissão de
 * aprovar, alçada insuficiente, leitura do auth indisponível) chegam TODAS como 422 → `validation`,
 * porque o `sendDomainError` do core-api colapsa o slug (OWASP API8). Só a MENSAGEM PT-BR as separa —
 * e sem ela o operador era mandado a repetir exatamente o que vai falhar de novo.
 *
 * Por isso os casos cobrem: (a) a mensagem do backend chega por documento; (b) o documento é NOMEADO;
 * (c) sucesso parcial não esconde a falha nem trata tudo como falha.
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok, err } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import { useBulkStatus } from '#modules/financial/client/contas-a-pagar-list/bulk-status.binding.ts'

vi.mock('#modules/financial/client/data/repository/financial.repository.instance.ts', () => ({
  financialRepository: { approve: vi.fn(), undoApproval: vi.fn() },
}))

const mockedApprove = vi.mocked(financialRepository.approve)

const wrapper = ({ children }: { children: ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const setup = () => renderHook(() => useBulkStatus(() => undefined), { wrapper })

const target = (id: string, documentNumber: string) => ({ id, version: 1, documentNumber })

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useBulkStatus — a falha chega ao operador com nome e motivo', () => {
  it('a MENSAGEM do core-api sobrevive por documento — não vira "tente de novo"', async () => {
    mockedApprove.mockResolvedValue(
      err({
        error: 'validation',
        message: 'O aprovador não possui alçada suficiente para este valor.',
      }) as never,
    )
    const { result } = setup()

    act(() => {
      result.current.approve([target('d1', 'NF-100')])
    })

    await waitFor(() => {
      expect(result.current.failures).toHaveLength(1)
    })
    expect(result.current.failures[0]?.documentNumber).toBe('NF-100')
    expect(result.current.failures[0]?.message).toContain('alçada suficiente')
  })

  it('sem mensagem do backend, sobra a TAG — a linha nunca fica muda', async () => {
    mockedApprove.mockResolvedValue(err({ error: 'conflict', message: null }) as never)
    const { result } = setup()

    act(() => {
      result.current.approve([target('d1', 'NF-100')])
    })

    await waitFor(() => {
      expect(result.current.failures).toHaveLength(1)
    })
    expect(result.current.failures[0]?.message).toBeNull()
    expect(result.current.failures[0]?.tag).toBe('financial.error.conflict')
  })

  // ⚠️ O caso que o "contar falhas" errava por construção: com 3 selecionados e 1 recusado, a tela
  // dizia "algumas não foram concluídas" sem dizer QUAL — e o operador não tinha como saber onde mexer.
  it('sucesso parcial: só o documento recusado aparece, e nomeado', async () => {
    mockedApprove
      .mockResolvedValueOnce(ok({}) as never)
      .mockResolvedValueOnce(
        err({ error: 'validation', message: 'O aprovador informado não foi encontrado.' }) as never,
      )
      .mockResolvedValueOnce(ok({}) as never)
    const { result } = setup()

    act(() => {
      result.current.approve([target('d1', 'NF-1'), target('d2', 'NF-2'), target('d3', 'NF-3')])
    })

    await waitFor(() => {
      expect(result.current.failures).toHaveLength(1)
    })
    expect(result.current.failures[0]?.documentNumber).toBe('NF-2')
    expect(result.current.errorTag).toBe('financial.list.status.bulkError')
  })

  it('tudo passou: sem cabeçalho de erro e sem falhas', async () => {
    mockedApprove.mockResolvedValue(ok({}) as never)
    const { result } = setup()

    act(() => {
      result.current.approve([target('d1', 'NF-1')])
    })

    await waitFor(() => {
      expect(mockedApprove).toHaveBeenCalledTimes(1)
    })
    expect(result.current.failures).toHaveLength(0)
    expect(result.current.errorTag).toBeNull()
  })
})
