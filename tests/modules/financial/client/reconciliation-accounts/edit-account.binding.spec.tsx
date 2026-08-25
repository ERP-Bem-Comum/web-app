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
  // #722: conta AINDA sem convênio — é o caso em que o campo é preenchível.
  convenio: '',
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
    // A conta do fixture foi salva ANTES da regra do DV (specs/107): só os 4 dígitos.
    expect(result.current.agency).toBe('1462')
    expect(result.current.agencyIncomplete).toBe(true)
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
      // Obrigatório desde specs/107: sem o DV o `canSubmit` barra e o submit é no-op.
      result.current.setAgency('14628')
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
      // specs/107: as contas do fixture são anteriores à regra do DV — completar para o submit valer.
      result.current.setAgency('14628')
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

// #722: o convênio é preenchível UMA vez. Trocar um já definido é recusado pelo core-api
// (`cedente-convenio-already-set`) porque ele viaja no nome de toda remessa já transmitida — então o
// front nem tenta, e o 409 nunca chega ao operador como "falha ao salvar a conta".
describe('useEditAccount — convênio preenchível uma vez', () => {
  const withConvenio = { ...ACCOUNT, convenio: '1234567' } as unknown as ReconciliationAccount

  it('conta SEM convênio: campo livre, e o valor preenchido viaja no PATCH', async () => {
    mockedEdit.mockResolvedValue(ok({ id: ID } as never))
    const { result } = setup()
    act(() => {
      result.current.open(ACCOUNT)
    })
    expect(result.current.convenioLocked).toBe(false)

    act(() => {
      result.current.setConvenio('98765')
      // specs/107: as contas do fixture são anteriores à regra do DV — completar para o submit valer.
      result.current.setAgency('14628')
    })
    expect(result.current.convenio).toBe('98765')

    act(() => {
      result.current.submit()
    })
    await waitFor(() => {
      expect(result.current.target).toBeNull()
    })
    expect(mockedEdit.mock.calls[0]?.[0]?.convenio).toBe('98765')
  })

  it('⚠️ conta COM convênio: travado, e o PATCH NÃO carrega o campo', async () => {
    mockedEdit.mockResolvedValue(ok({ id: ID } as never))
    const { result } = setup()
    act(() => {
      result.current.open(withConvenio)
    })
    expect(result.current.convenioLocked).toBe(true)
    expect(result.current.convenio).toBe('1234567')

    // Segunda barreira: mesmo forçando o setter, o valor não muda.
    act(() => {
      result.current.setConvenio('99999')
      // specs/107: as contas do fixture são anteriores à regra do DV — completar para o submit valer.
      result.current.setAgency('14628')
    })
    expect(result.current.convenio).toBe('1234567')

    act(() => {
      result.current.submit()
    })
    await waitFor(() => {
      expect(result.current.target).toBeNull()
    })
    // Nem o valor novo, nem o antigo: reenviar o existente também seria pedir troca.
    expect(mockedEdit.mock.calls[0]?.[0]?.convenio).toBeUndefined()
  })

  // ⚠️ 6, não 20: o campo do header CNAB tem 6 posições (033-038) e o banco TRUNCA o excedente em
  // silêncio — medido num arquivo real, `99999999` virou `Contrato: 999999` no laudo do validador.
  // Como o convênio é preenchível uma vez, salvar com 8 travaria a conta para sempre.
  it('só dígitos e teto de 6 — o campo do header CNAB tem 6 posições', () => {
    const { result } = setup()
    act(() => {
      result.current.open(ACCOUNT)
    })
    act(() => {
      result.current.setConvenio('12ab-34 56')
    })
    expect(result.current.convenio).toBe('123456')

    act(() => {
      result.current.setConvenio('1'.repeat(30))
    })
    expect(result.current.convenio).toHaveLength(6)
  })

  // ── Agência-DV na EDIÇÃO (specs/107) ─────────────────────────────────────────
  //
  // A edição carrega a mesma régua do cadastro: sem ela seria a porta dos fundos por onde uma conta
  // volta a ficar sem dígito.

  it('⚠️ conta ANTIGA abre já cobrando o DV — é assim que o cadastro velho se completa', () => {
    const { result } = setup()
    act(() => {
      result.current.open(ACCOUNT) // branch '1462', salva antes da regra
    })
    expect(result.current.agencyIncomplete).toBe(true)
    expect(result.current.canSubmit).toBe(false)
  })

  it('completar o DV libera o Salvar', () => {
    const { result } = setup()
    act(() => {
      result.current.open(ACCOUNT)
    })
    act(() => {
      result.current.setAgency('14628')
    })
    expect(result.current.agencyIncomplete).toBe(false)
    expect(result.current.canSubmit).toBe(true)
  })

  it('guarda só dígitos, no máximo 5 — o hífen digitado não entra no estado', () => {
    const { result } = setup()
    act(() => {
      result.current.open(ACCOUNT)
    })
    act(() => {
      result.current.setAgency('1462-8999')
    })
    expect(result.current.agency).toBe('14628')
  })

  it('⚠️ o PATCH envia só a BASE (4 dígitos) — o DV NÃO vai concatenado, senão corrompe o CNAB', async () => {
    mockedEdit.mockResolvedValue(ok({ id: ID } as never))
    const { result } = setup()
    act(() => {
      result.current.open(ACCOUNT)
    })
    act(() => {
      result.current.setAgency('14628')
    })
    act(() => {
      result.current.submit()
    })

    await waitFor(() => {
      expect(mockedEdit).toHaveBeenCalled()
    })
    const arg = mockedEdit.mock.calls[0]?.[0]
    expect(arg?.agency).toBe('1462')
    expect(arg?.agency).not.toContain('-')
    expect(arg?.agency).not.toBe('14628')
  })
})
