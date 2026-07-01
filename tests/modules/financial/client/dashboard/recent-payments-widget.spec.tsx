/**
 * recent-payments-widget (vitest/jsdom) — view BURRA do widget "Últimos pagamentos" (042). Recebe
 * `{ status, rows }` por props (sem rede) e apresenta: loading (skeleton), vazio, dados (3 linhas com
 * labels e valores). `t` passthrough (retorna a key) p/ asserts determinísticos das colunas/estados.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { RecentPaymentsWidget } from '#modules/financial/client/dashboard/components/recent-payments-widget.component.tsx'
import type { RecentPaymentRow } from '#modules/financial/client/dashboard/recent-payments.view-model.ts'

const t = (key: string): string => key

afterEach(() => {
  cleanup()
})

const rows: readonly RecentPaymentRow[] = [
  {
    payableId: 'p1',
    supplier: 'Bambu Educação',
    debitAccount: 'Conta Itaú',
    value: 'R$ 1.500,50',
    paidAt: '30/06/2026',
  },
  {
    payableId: 'p2',
    supplier: 'Acme LTDA',
    debitAccount: 'Conta BB',
    value: 'R$ 320,00',
    paidAt: '29/06/2026',
  },
  { payableId: 'p3', supplier: '—', debitAccount: '—', value: 'R$ 90,00', paidAt: '28/06/2026' },
]

describe('RecentPaymentsWidget', () => {
  it('loading → não renderiza a tabela (só o título e o skeleton)', () => {
    render(<RecentPaymentsWidget status="loading" rows={[]} t={t} />)
    expect(screen.getByText('dashboard.recent-payments.title')).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('vazio → mensagem de nenhum pagamento, sem tabela', () => {
    render(<RecentPaymentsWidget status="empty" rows={[]} t={t} />)
    expect(screen.getByText('dashboard.recent-payments.empty')).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('error → nota de erro com role=alert', () => {
    render(<RecentPaymentsWidget status="error" rows={[]} t={t} />)
    expect(screen.getByRole('alert').textContent).toBe('dashboard.recent-payments.error')
  })

  it('forbidden → nota discreta de permissão, sem tabela', () => {
    render(<RecentPaymentsWidget status="forbidden" rows={[]} t={t} />)
    expect(screen.getByText('dashboard.recent-payments.forbidden')).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('ready → tabela com cabeçalhos e 3 linhas de dados (labels + valores)', () => {
    render(<RecentPaymentsWidget status="ready" rows={rows} t={t} />)
    expect(screen.getByRole('table')).toBeTruthy()
    expect(screen.getByText('dashboard.recent-payments.col.supplier')).toBeTruthy()
    expect(screen.getByText('dashboard.recent-payments.col.debit-account')).toBeTruthy()
    expect(screen.getByText('dashboard.recent-payments.col.value')).toBeTruthy()
    expect(screen.getByText('dashboard.recent-payments.col.paid-at')).toBeTruthy()

    // 3 linhas de dados (+1 do thead)
    expect(screen.getAllByRole('row')).toHaveLength(4)
    expect(screen.getByText('Bambu Educação')).toBeTruthy()
    expect(screen.getByText('R$ 1.500,50')).toBeTruthy()
    expect(screen.getByText('30/06/2026')).toBeTruthy()
    // fornecedor/conta ausentes → "—"
    expect(screen.getAllByText('—')).toHaveLength(2)
  })
})
