/**
 * recent-payments.view-model (node:test) — derivação PURA do widget "Últimos pagamentos" (042):
 * centavos→BRL, ISO→DD/MM/YYYY (sem `Date`), ref/label null→"—", empty→[]. Imports RELATIVOS.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  toRecentPaymentRow,
  toRecentPaymentRows,
} from '../../../../../src/modules/financial/client/dashboard/recent-payments.view-model.ts'
import type { RecentPayment } from '../../../../../src/modules/financial/client/data/model/recent-payment.model.ts'

const rp = (over: Partial<RecentPayment> = {}): RecentPayment => ({
  payableId: 'p1',
  documentId: 'd1',
  supplierRef: 's1',
  debitAccountRef: 'a1',
  valueCents: '150050',
  paidAt: '2026-06-30',
  ...over,
})

describe('recent-payments view-model', () => {
  it('formata centavos → BRL e ISO → DD/MM/YYYY, com labels resolvidos', () => {
    const row = toRecentPaymentRow(rp(), { supplierLabel: 'Bambu Educação', accountLabel: 'Conta Itaú' })
    assert.equal(row.value, 'R$ 1.500,50')
    assert.equal(row.paidAt, '30/06/2026')
    assert.equal(row.supplier, 'Bambu Educação')
    assert.equal(row.debitAccount, 'Conta Itaú')
    assert.equal(row.payableId, 'p1')
  })

  it('label ausente (null) → "—" no fornecedor e na conta', () => {
    const row = toRecentPaymentRow(rp(), { supplierLabel: null, accountLabel: null })
    assert.equal(row.supplier, '—')
    assert.equal(row.debitAccount, '—')
  })

  it('paidAt null/vazio → "—"', () => {
    assert.equal(
      toRecentPaymentRow(rp({ paidAt: null }), { supplierLabel: null, accountLabel: null }).paidAt,
      '—',
    )
    assert.equal(
      toRecentPaymentRow(rp({ paidAt: '' }), { supplierLabel: null, accountLabel: null }).paidAt,
      '—',
    )
  })

  it('valueCents vazio → R$ 0,00', () => {
    assert.equal(
      toRecentPaymentRow(rp({ valueCents: '' }), { supplierLabel: null, accountLabel: null }).value,
      'R$ 0,00',
    )
  })

  it('ISO datetime (com hora) → só a data DD/MM/YYYY', () => {
    const row = toRecentPaymentRow(rp({ paidAt: '2026-06-30T13:45:00Z' }), {
      supplierLabel: null,
      accountLabel: null,
    })
    assert.equal(row.paidAt, '30/06/2026')
  })

  it('toRecentPaymentRows resolve refs pelos maps e mantém a ordem do backend', () => {
    const items = [
      rp({ payableId: 'p1', supplierRef: 's1', debitAccountRef: 'a1' }),
      rp({ payableId: 'p2', supplierRef: 's2', debitAccountRef: null }),
    ]
    const rows = toRecentPaymentRows(items, {
      resolveSupplier: (ref) => (ref === 's1' ? 'Fornecedor Um' : ref === 's2' ? 'Fornecedor Dois' : null),
      resolveAccount: (ref) => (ref === 'a1' ? 'Conta A' : null),
    })
    assert.equal(rows.length, 2)
    assert.equal(rows[0]?.payableId, 'p1')
    assert.equal(rows[0]?.supplier, 'Fornecedor Um')
    assert.equal(rows[0]?.debitAccount, 'Conta A')
    assert.equal(rows[1]?.supplier, 'Fornecedor Dois')
    assert.equal(rows[1]?.debitAccount, '—') // debitAccountRef null → "—"
  })

  it('empty → []', () => {
    const rows = toRecentPaymentRows([], { resolveSupplier: () => null, resolveAccount: () => null })
    assert.deepEqual(rows, [])
  })
})
