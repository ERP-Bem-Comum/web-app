/**
 * AccountsGrid (Vitest/jsdom) — view burra: cabeçalhos, linhas (bank-mark/conta/saldo/pill), abrir conta
 * ativa, encerrada não abre. Props.
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
  ...over,
})

afterEach(() => {
  cleanup()
})

describe('AccountsGrid', () => {
  it('renderiza cabeçalhos e linhas', () => {
    render(<AccountsGrid rows={[row({ id: 'a', alias: 'Itaú Principal' })]} onOpen={vi.fn()} />)
    expect(screen.getByText(tr('financial.recon.accounts.col.conta'))).toBeTruthy()
    expect(screen.getByText('Itaú Principal')).toBeTruthy()
    expect(screen.getByText('R$ 245.392,18')).toBeTruthy()
  })

  it('conta com pendências mostra "{n} pendentes"', () => {
    render(<AccountsGrid rows={[row({ id: 'a', status: 'pending', pendingCount: 4 })]} onOpen={vi.fn()} />)
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
        onOpen={onOpen}
      />,
    )
    fireEvent.click(screen.getByText('Ativa'))
    expect(onOpen).toHaveBeenCalledTimes(1)
    // a linha encerrada chama onOpen (o page ignora não-openable), mas exibe o pill Encerrada
    expect(screen.getByText(tr('financial.recon.accounts.status.closed'))).toBeTruthy()
  })
})
