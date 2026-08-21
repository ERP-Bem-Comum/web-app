/**
 * useRemittancePreview (Vitest/jsdom) — binding do PRÉ-VOO da remessa (VAN, core-api#728/#804). Cobre:
 *   (a) `start` abre a conferência mas NÃO chama o backend — o pré-voo espera a conta-cedente;
 *   (b) com a conta, chama uma vez e com os DOIS insumos no corpo; trocar a conta re-roda;
 *   (c) conta única com convênio é auto-selecionada (escolha de um item só não é escolha);
 *   (d) erro do BFF vira `errorTag` (§V: a UI trata a tag, nunca o status HTTP);
 *   (e) `start([])` não abre nem chama nada (seleção vazia não dispara ida ao backend);
 *   (f) `close` LIMPA o resultado — reabrir com outra seleção não pode mostrar o pré-voo anterior.
 *
 * A (f) é a que importa: pré-voo velho exibido como se fosse o atual é o defeito que a conferência
 * existe para impedir. A (b) é a que o core-api#804 tornou obrigatória — sem a conta o corpo `.strict()`
 * do backend responde 400, e "o que vai sair" só tem resposta depois de saber quem paga.
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok, err } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { useRemittancePreview } from '#modules/financial/client/contas-a-pagar-list/remittance-preview.binding.ts'

vi.mock('#modules/financial/client/data/repository/financial.repository.instance.ts', () => ({
  financialRepository: {
    previewRemittance: vi.fn(),
    generateRemittance: vi.fn(),
    downloadRemittanceFile: vi.fn(),
  },
}))
vi.mock('#modules/financial/client/data/repository/reconciliation.repository.instance.ts', () => ({
  reconciliationRepository: { listAccounts: vi.fn() },
}))

const mocked = vi.mocked(financialRepository.previewRemittance)
const mockedGenerate = vi.mocked(financialRepository.generateRemittance)
const mockedDownload = vi.mocked(financialRepository.downloadRemittanceFile)
const mockedAccounts = vi.mocked(reconciliationRepository.listAccounts)

const PREVIEW = {
  lines: [
    { payableId: 'doc-1', documentId: 'doc-1', status: 'ready', route: 'pix', gaps: [], valueCents: '25000' },
  ],
  readyCount: 1,
  blockedCount: 0,
  outOfVanCount: 0,
  notFoundCount: 0,
  notApprovedCount: 0,
  readyTotalCents: '25000',
  blockedTotalCents: '0',
} as never

/** Conta-cedente do jeito que o binding a lê: só `status`, `convenio` e `id` decidem alguma coisa aqui. */
const account = (id: string, convenio: string, status = 'Active') => ({ id, convenio, status }) as never

const setup = () => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(() => useRemittancePreview(), { wrapper })
}

/** Abre a conferência e escolhe a conta — o caminho normal desde o core-api#804. */
const startWithAccount = async (result: { current: ReturnType<typeof useRemittancePreview> }) => {
  act(() => {
    result.current.start(['doc-1'])
  })
  act(() => {
    result.current.setCedenteAccountId('acc-1')
  })
  await waitFor(() => {
    expect(result.current.preview).not.toBeNull()
  })
}

const RECEIPT = {
  remittanceId: 'r1',
  fileName: 'CB000123.REM',
  objectKey: 'saida/CB000123.REM',
  nsa: 123,
  totalCents: '140775',
  lineCount: 1,
}

/** Leva o binding até o estado "comprovante na tela" — é o único de onde se pode baixar. */
const setupGenerated = async () => {
  mocked.mockResolvedValue(ok(PREVIEW))
  mockedGenerate.mockResolvedValue(ok(RECEIPT) as never)
  const { result } = setup()
  await startWithAccount(result)
  act(() => {
    result.current.generate(['doc-1'])
  })
  await waitFor(() => {
    expect(result.current.generated).not.toBeNull()
  })
  return result
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Default de cada teste: a listagem de contas falha. Assim NENHUMA conta é auto-selecionada e o que se
// mede é o efeito da escolha explícita — os testes de auto-seleção sobrescrevem isto.
beforeEach(() => {
  mockedAccounts.mockResolvedValue(err('server') as never)
})

describe('useRemittancePreview', () => {
  // ── A ordem que o core-api#804 impôs ──────────────────────────────────────────

  it('⚠️ start abre a conferência mas NÃO chama o backend: o pré-voo espera a conta', async () => {
    mocked.mockResolvedValue(ok(PREVIEW))
    const { result } = setup()

    expect(result.current.open).toBe(false)
    act(() => {
      result.current.start(['doc-1'])
    })

    expect(result.current.open).toBe(true)
    // Sem a conta o corpo do core-api (`.strict()`) responde 400 — chamar seria pedir o erro.
    await waitFor(() => {
      expect(result.current.awaitingAccount).toBe(true)
    })
    expect(mocked).not.toHaveBeenCalled()
    expect(result.current.preview).toBeNull()
  })

  it('com a conta escolhida, confere UMA vez e manda os dois insumos', async () => {
    mocked.mockResolvedValue(ok(PREVIEW))
    const { result } = setup()

    await startWithAccount(result)

    expect(mocked).toHaveBeenCalledTimes(1)
    expect(mocked).toHaveBeenCalledWith({ cedenteAccountId: 'acc-1', payableIds: ['doc-1'] })
    expect(result.current.awaitingAccount).toBe(false)
    expect(result.current.errorTag).toBeNull()
  })

  it('⚠️ trocar a conta RE-confere: a repartição do arquivo muda com quem paga', async () => {
    mocked.mockResolvedValue(ok(PREVIEW))
    const { result } = setup()
    await startWithAccount(result)

    act(() => {
      result.current.setCedenteAccountId('acc-2')
    })

    await waitFor(() => {
      expect(mocked).toHaveBeenCalledTimes(2)
    })
    expect(mocked).toHaveBeenLastCalledWith({ cedenteAccountId: 'acc-2', payableIds: ['doc-1'] })
  })

  it('conta ÚNICA com convênio é auto-selecionada — escolha de um item só não é escolha', async () => {
    mocked.mockResolvedValue(ok(PREVIEW))
    // Duas contas, mas só uma gera remessa: sem convênio a conta nem chega ao arquivo (#722).
    mockedAccounts.mockResolvedValue(ok([account('acc-1', '123456'), account('acc-2', '')]) as never)
    const { result } = setup()

    act(() => {
      result.current.start(['doc-1'])
    })

    await waitFor(() => {
      expect(result.current.preview).not.toBeNull()
    })
    expect(mocked).toHaveBeenCalledWith({ cedenteAccountId: 'acc-1', payableIds: ['doc-1'] })
    expect(result.current.awaitingAccount).toBe(false)
  })

  it('⚠️ com DUAS contas aptas ninguém escolhe pelo operador — errar a conta é pagar pela errada', async () => {
    mocked.mockResolvedValue(ok(PREVIEW))
    mockedAccounts.mockResolvedValue(ok([account('acc-1', '123456'), account('acc-2', '654321')]) as never)
    const { result } = setup()

    act(() => {
      result.current.start(['doc-1'])
    })

    await waitFor(() => {
      expect(result.current.awaitingAccount).toBe(true)
    })
    expect(mocked).not.toHaveBeenCalled()
  })

  it('erro do BFF vira tag i18n, sem preview', async () => {
    mocked.mockResolvedValue(err('forbidden'))
    const { result } = setup()

    act(() => {
      result.current.start(['doc-1'])
    })
    act(() => {
      result.current.setCedenteAccountId('acc-1')
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

    await startWithAccount(result)

    act(() => {
      result.current.close()
    })

    expect(result.current.open).toBe(false)
    await waitFor(() => {
      expect(result.current.preview).toBeNull()
    })
  })

  it('⚠️ reabrir com a MESMA seleção confere de novo — o cadastro pode ter sido corrigido no meio', async () => {
    mocked.mockResolvedValue(ok(PREVIEW))
    const { result } = setup()
    await startWithAccount(result)

    act(() => {
      result.current.close()
    })
    await startWithAccount(result)

    expect(mocked).toHaveBeenCalledTimes(2)
  })

  it('⚠️ gerar exige conta: sem conta escolhida, nada é enviado ao banco', async () => {
    mocked.mockResolvedValue(ok(PREVIEW))
    const { result } = setup()
    act(() => {
      result.current.start(['doc-1'])
    })
    await waitFor(() => {
      expect(result.current.awaitingAccount).toBe(true)
    })

    act(() => {
      result.current.generate(['doc-1'])
    })
    expect(mockedGenerate).not.toHaveBeenCalled()
  })

  it('com conta escolhida, gera e devolve o comprovante', async () => {
    mocked.mockResolvedValue(ok(PREVIEW))
    mockedGenerate.mockResolvedValue(
      ok({
        remittanceId: 'r1',
        fileName: 'CB000123.REM',
        objectKey: 'saida/CB000123.REM',
        nsa: 123,
        totalCents: '140775',
        lineCount: 1,
      }) as never,
    )
    const { result } = setup()
    await startWithAccount(result)

    act(() => {
      result.current.generate(['doc-1'])
    })

    await waitFor(() => {
      expect(result.current.generated?.nsa).toBe(123)
    })
    // A MESMA conta com que se conferiu: gerar com outra faria o arquivo divergir do pré-voo lido.
    expect(mockedGenerate).toHaveBeenCalledWith({ cedenteAccountId: 'acc-1', payableIds: ['doc-1'] })
  })

  it('a recusa do backend chega com a MENSAGEM PT-BR, não só a tag genérica', async () => {
    mocked.mockResolvedValue(ok(PREVIEW))
    mockedGenerate.mockResolvedValue(
      err({
        error: 'validation',
        message: 'A seleção mistura vencimentos diferentes. Uma remessa é de um único dia.',
      }) as never,
    )
    const { result } = setup()
    await startWithAccount(result)
    act(() => {
      result.current.generate(['doc-1'])
    })

    await waitFor(() => {
      expect(result.current.generateErrorMessage).toContain('vencimentos diferentes')
    })
    expect(result.current.generateErrorTag).toBe('financial.error.validation')
  })

  it('a confirmação é um segundo passo — arm/disarm não dispara nada', () => {
    const { result } = setup()
    expect(result.current.confirming).toBe(false)
    act(() => {
      result.current.arm()
    })
    expect(result.current.confirming).toBe(true)
    act(() => {
      result.current.disarm()
    })
    expect(result.current.confirming).toBe(false)
    expect(mockedGenerate).not.toHaveBeenCalled()
  })
  // ── Download do arquivo (specs/103) — cópia de conferência, homologação apenas ──

  it('sem comprovante na tela, baixar é no-op — não há remessa a que o arquivo pertença', () => {
    const { result } = setup()
    act(() => {
      result.current.downloadFile()
    })
    expect(mockedDownload).not.toHaveBeenCalled()
  })

  it('baixa pelo id da remessa gerada e salva com o nome que o backend mandou', async () => {
    const result = await setupGenerated()
    mockedDownload.mockResolvedValue(
      ok({ base64: btoa('CNAB'), fileName: 'CB000123.REM', objectKey: 'saida/CB000123.REM' }) as never,
    )
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    // jsdom não implementa object URLs — sem isto o `createObjectURL` explode antes do que se testa.
    const createUrl = vi.fn().mockReturnValue('blob:stub')
    Object.defineProperty(URL, 'createObjectURL', { value: createUrl, configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true })

    act(() => {
      result.current.downloadFile()
    })

    await waitFor(() => {
      expect(click).toHaveBeenCalledTimes(1)
    })
    expect(mockedDownload).toHaveBeenCalledWith('r1')
    // O nome vem do core-api: é o que o banco espera, não um rótulo nosso.
    expect(click.mock.instances[0]).toHaveProperty('download', 'CB000123.REM')
    expect(result.current.downloadedFromFailures).toBe(false)
    click.mockRestore()
  })

  it('⚠️ objeto vindo de `falhas/` avisa que o envio NÃO completou', async () => {
    const result = await setupGenerated()
    mockedDownload.mockResolvedValue(
      ok({ base64: btoa('CNAB'), fileName: 'CB000123.REM', objectKey: 'falhas/CB000123.REM' }) as never,
    )
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:stub'), configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true })

    act(() => {
      result.current.downloadFile()
    })

    await waitFor(() => {
      expect(result.current.downloadedFromFailures).toBe(true)
    })
  })

  it('hash divergente chega com a MENSAGEM do core-api e nada é salvo', async () => {
    const result = await setupGenerated()
    mockedDownload.mockResolvedValue(
      err({
        error: 'server',
        message: 'O arquivo encontrado não confere com a remessa emitida (hash divergente).',
      }) as never,
    )
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    act(() => {
      result.current.downloadFile()
    })

    await waitFor(() => {
      expect(result.current.downloadErrorMessage).toContain('hash divergente')
    })
    expect(result.current.downloadErrorTag).toBe('financial.error.server')
    expect(click).not.toHaveBeenCalled()
    click.mockRestore()
  })

  it('404 sem mensagem — a tag sozinha, para a UI dizer que o ambiente ainda não serve o arquivo', async () => {
    const result = await setupGenerated()
    mockedDownload.mockResolvedValue(err({ error: 'not-found', message: null }) as never)

    act(() => {
      result.current.downloadFile()
    })

    await waitFor(() => {
      expect(result.current.downloadErrorTag).toBe('financial.error.not-found')
    })
    expect(result.current.downloadErrorMessage).toBeNull()
  })
})
