/**
 * AccountsGrid (Vitest/jsdom) — view burra: cabeçalhos, linhas (bank-mark/conta/saldo/pill), abrir conta
 * ativa, encerrada não abre, e o EXPAND do cadastro (seta → saldo inicial + data). Props.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { AccountsGrid } from '#modules/financial/client/reconciliation-accounts/components/accounts-grid.component.tsx'
import type { AccountRow } from '#modules/financial/client/reconciliation-accounts/reconciliation-accounts.view-model.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

const row = (over: Partial<AccountRow> & Pick<AccountRow, 'id'>): AccountRow => ({
  bankCode: '237',
  bankName: 'Bradesco',
  alias: 'Conta Movimento',
  branch: '1462',
  accountNumber: '0012345',
  accountDv: '7',
  balanceBRL: 'R$ 245.392,18',
  lastUpdatedAt: '2026-06-18',
  pendingCount: 0,
  status: 'up-to-date',
  openable: true,
  openingBalanceBRL: 'R$ 245.392,18',
  openingDate: '01/06/2026',
  ...over,
})

const noExpand = new Set<string>()

afterEach(() => {
  cleanup()
})

describe('AccountsGrid', () => {
  it('renderiza cabeçalhos e linhas', () => {
    render(
      <AccountsGrid
        rows={[row({ id: 'a', alias: 'Itaú Principal' })]}
        expanded={noExpand}
        onOpen={vi.fn()}
        onToggle={vi.fn()}
      />,
    )
    expect(screen.getByText(tr('financial.recon.accounts.col.conta'))).toBeTruthy()
    expect(screen.getByText('Itaú Principal')).toBeTruthy()
  })

  it('conta com pendências mostra "{n} pendentes"', () => {
    render(
      <AccountsGrid
        rows={[row({ id: 'a', status: 'pending', pendingCount: 4 })]}
        expanded={noExpand}
        onOpen={vi.fn()}
        onToggle={vi.fn()}
      />,
    )
    expect(screen.getByText('4 pendentes')).toBeTruthy()
  })

  it('abrir conta ativa dispara onOpen; encerrada não', () => {
    const onOpen = vi.fn()
    render(
      <AccountsGrid
        rows={[
          row({ id: 'ativa', alias: 'Ativa', openable: true }),
          row({ id: 'fechada', alias: 'Conta Antiga', status: 'closed', openable: false }),
        ]}
        expanded={noExpand}
        onOpen={onOpen}
        onToggle={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByText('Ativa'))
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(screen.getByText(tr('financial.recon.accounts.status.closed'))).toBeTruthy()
  })

  it('a seta dispara onToggle (e NÃO onOpen) e o expand mostra saldo inicial + data', () => {
    const onOpen = vi.fn()
    const onToggle = vi.fn()
    // expandido: o painel do cadastro aparece
    render(
      <AccountsGrid
        rows={[row({ id: 'a', openingBalanceBRL: 'R$ 1.000,00', openingDate: '01/06/2026' })]}
        expanded={new Set(['a'])}
        onOpen={onOpen}
        onToggle={onToggle}
      />,
    )
    expect(screen.getByText(tr('financial.recon.accounts.expand.saldoInicial'))).toBeTruthy()
    expect(screen.getByText('R$ 1.000,00')).toBeTruthy()
    expect(screen.getByText('01/06/2026')).toBeTruthy()
    // clicar na seta → onToggle(id), sem disparar onOpen
    fireEvent.click(screen.getByLabelText(tr('financial.recon.accounts.expand.aria')))
    expect(onToggle).toHaveBeenCalledWith('a')
    expect(onOpen).not.toHaveBeenCalled()
  })
})
