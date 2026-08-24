/**
 * useIsolatedDueDate (Vitest/jsdom) — binding do "Alterar vencimento" por TÍTULO ISOLADO (#270). Fan-out: UMA
 * chamada `updatePayableDueDate` por título (não propaga pai↔filhos). Cobre:
 *   (a) todos ok → N chamadas (uma por alvo), sem errorTag, chama onCompleted;
 *   (b) falha PARCIAL (algum Result err) → errorTag específico + NÃO chama onCompleted;
 *   (c) erro global (throw/transporte) → errorTag genérico + NÃO chama onCompleted.
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok, err } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import { useIsolatedDueDate } from '#modules/financial/client/contas-a-pagar-list/isolated-due-date.binding.ts'

vi.mock('#modules/financial/client/data/repository/financial.repository.instance.ts', () => ({
  financialRepository: { updatePayableDueDate: vi.fn() },
}))

const mocked = vi.mocked(financialRepository.updatePayableDueDate)
// 2 títulos do MESMO documento → sequencial, encadeando a version devolvida (a 1ª sobe 3→4).
const TARGETS = [
  { documentId: 'd1', payableId: 'p1', version: 3, expectedDueDate: '2026-07-10' },
  { documentId: 'd1', payableId: 'p2', version: 3, expectedDueDate: '2026-07-20' },
] as const

// A resposta é o documento atualizado com a NOVA version (o binding a usa p/ o próximo título do mesmo doc).
const detail = { id: 'd1', version: 4 } as never

const setup = (onCompleted: () => void) => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(() => useIsolatedDueDate(onCompleted), { wrapper })
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useIsolatedDueDate (#270 isolado)', () => {
  it('(a) mesmo doc → sequencial, o 2º título usa a version DEVOLVIDA (3→4), sem erro, chama onCompleted', async () => {
    mocked.mockResolvedValue(ok(detail))
    const onCompleted = vi.fn()
    const { result } = setup(onCompleted)
    act(() => {
      result.current.apply(TARGETS, '2026-08-15')
    })
    await waitFor(() => {
      expect(result.current.running).toBe(false)
    })
    // uma chamada por título; o 2º usa a version DEVOLVIDA pelo 1º (4), não a original (3) — evita conflito
    expect(mocked).toHaveBeenCalledTimes(2)
    expect(mocked).toHaveBeenNthCalledWith(1, {
      documentId: 'd1',
      payableId: 'p1',
      version: 3,
      dueDate: '2026-08-15',
      // CAS por valor: cada título declara o SEU vencimento atual, não o do vizinho.
      expectedDueDate: '2026-07-10',
    })
    expect(mocked).toHaveBeenNthCalledWith(2, {
      documentId: 'd1',
      payableId: 'p2',
      version: 4,
      dueDate: '2026-08-15',
      expectedDueDate: '2026-07-20',
    })
    expect(result.current.errorTag).toBeNull()
    expect(onCompleted).toHaveBeenCalledTimes(1)
  })

  it('(b) falha parcial (um Result err) → errorTag específico, NÃO chama onCompleted', async () => {
    mocked.mockResolvedValueOnce(ok(detail)).mockResolvedValueOnce(err('invalid-transition'))
    const onCompleted = vi.fn()
    const { result } = setup(onCompleted)
    act(() => {
      result.current.apply(TARGETS, '2026-08-15')
    })
    await waitFor(() => {
      expect(result.current.errorTag).toBe('financial.list.dueDate.errorPartial')
    })
    expect(onCompleted).not.toHaveBeenCalled()
  })

  it('(c) erro global (throw) → errorTag genérico, NÃO chama onCompleted', async () => {
    mocked.mockRejectedValue(new Error('rede'))
    const onCompleted = vi.fn()
    const { result } = setup(onCompleted)
    act(() => {
      result.current.apply(TARGETS, '2026-08-15')
    })
    await waitFor(() => {
      expect(result.current.errorTag).toBe('financial.list.dueDate.error')
    })
    expect(onCompleted).not.toHaveBeenCalled()
  })
})

// core-api#794: salvar documento COM RETENÇÃO falha de forma INTERMITENTE sob chamadas concorrentes
// (503 `document-repository-failure`). Antes, uma falha dessas era contada como "versão desatualizada"
// e mandava o operador atualizar a lista — que é justamente o que não resolve.
describe('useIsolatedDueDate — falha transitória é repetida, e a mensagem segue o motivo', () => {
  const ONE = [{ documentId: 'd1', payableId: 'p1', version: 3, expectedDueDate: '2026-07-10' }] as const

  it('503 do servidor é REPETIDO e passa na segunda tentativa — sem erro para o operador', async () => {
    mocked.mockResolvedValueOnce(err('server')).mockResolvedValueOnce(ok(detail))
    const onCompleted = vi.fn()
    const { result } = setup(onCompleted)
    act(() => {
      result.current.apply(ONE, '2026-08-15')
    })
    await waitFor(() => {
      expect(onCompleted).toHaveBeenCalledTimes(1)
    })
    expect(mocked).toHaveBeenCalledTimes(2) // 1 falha + 1 repetição
    expect(result.current.errorTag).toBeNull()
    expect(result.current.failedCount).toBe(0)
  })

  it('servidor falhando SEMPRE → esgota as repetições e usa a mensagem de servidor, não a de versão', async () => {
    mocked.mockResolvedValue(err('server'))
    const onCompleted = vi.fn()
    const { result } = setup(onCompleted)
    act(() => {
      result.current.apply(ONE, '2026-08-15')
    })
    await waitFor(() => {
      expect(result.current.errorTag).toBe('financial.list.dueDate.errorPartialServer')
    })
    expect(mocked).toHaveBeenCalledTimes(3) // 1 tentativa + 2 repetições
    expect(result.current.failedCount).toBe(1)
    expect(onCompleted).not.toHaveBeenCalled()
  })

  it('⚠️ resposta perdida (connectivity) NÃO é repetida — com CAS por valor, repetir vira falso conflito', async () => {
    // Antes do core-api ADR-0063 isto era repetido. Deixou de ser: se a gravação passou e só a resposta
    // se perdeu, o retry mandaria o `expectedDueDate` antigo contra um título já alterado -> 409, e o
    // operador leria "falhou" sobre algo que deu certo.
    mocked.mockResolvedValue(err('connectivity'))
    const { result } = setup(vi.fn())
    act(() => {
      result.current.apply(ONE, '2026-08-15')
    })
    await waitFor(() => {
      expect(result.current.failedCount).toBe(1)
    })
    expect(mocked).toHaveBeenCalledTimes(1)
  })

  it('⚠️ conflito NÃO é repetido — a mesma pré-condição só produziria o mesmo 409', async () => {
    mocked.mockResolvedValue(err('conflict'))
    const { result } = setup(vi.fn())
    act(() => {
      result.current.apply(ONE, '2026-08-15')
    })
    await waitFor(() => {
      expect(result.current.errorTag).toBe('financial.list.dueDate.errorPartial')
    })
    expect(mocked).toHaveBeenCalledTimes(1)
  })

  it('conflito e falha de servidor juntos → vence o conflito (exige releitura antes de tentar de novo)', async () => {
    mocked.mockResolvedValueOnce(err('conflict')).mockResolvedValue(err('server'))
    const { result } = setup(vi.fn())
    act(() => {
      result.current.apply(TARGETS, '2026-08-15')
    })
    await waitFor(() => {
      expect(result.current.errorTag).toBe('financial.list.dueDate.errorPartial')
    })
    expect(result.current.failedCount).toBe(2)
  })

  it('o contador alimenta o texto — "alguns" não diz se foi 1 de 10 ou 9 de 10', async () => {
    mocked.mockResolvedValue(err('conflict'))
    const { result } = setup(vi.fn())
    act(() => {
      result.current.apply(TARGETS, '2026-08-15')
    })
    await waitFor(() => {
      expect(result.current.failedCount).toBe(2)
    })
  })
})
