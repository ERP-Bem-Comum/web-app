/**
 * Relatório da Conciliação — view-model PURO (node:test). Deriva as linhas + 6 totalizadores + status a
 * partir de um `AccountStatementPeriod` (#205), cobre o caso VAZIO e a identificação da conta COM NÚMERO
 * (`formatAccountNumber`) do cabeçalho impresso. Sem React/DOM. Import relativo (os #alias resolvem via
 * package.json "imports").
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildReconciliationReport,
  formatAccountNumber,
  periodLabelBR,
  reportStatusTag,
} from '../../../../../src/modules/financial/client/reconciliation-workspace/reconciliation-report.view-model.ts'
import type {
  AccountStatementPeriod,
  ReconciliationAccount,
  StatementTransaction,
} from '../../../../../src/modules/financial/client/data/model/reconciliation.model.ts'

const tx = (over: Partial<StatementTransaction>): StatementTransaction => ({
  id: 'tx-1',
  fitid: 'FIT-1',
  date: '2026-05-18',
  movement: 'Debit',
  entryType: 'Other',
  payeeName: 'Fornecedor ACME',
  memo: 'pagamento',
  valueCents: '150050',
  balanceAfterCents: '900000',
  reconciliationStatus: 'Pending',
  ...over,
})

const period: AccountStatementPeriod = {
  openingBalanceCents: '1000000',
  closingBalanceCents: '850000',
  totalInCents: '50000',
  totalOutCents: '200050',
  counters: { all: 3, in: 1, out: 2, reconciled: 1, pending: 2 },
  movements: [
    tx({
      id: 'a',
      movement: 'Credit',
      payeeName: 'Recebido X',
      valueCents: '50000',
      reconciliationStatus: 'Reconciled',
    }),
    tx({ id: 'b', movement: 'Debit', payeeName: '', memo: 'tarifa mensal', valueCents: '5000' }),
    tx({ id: 'c', movement: 'Debit', payeeName: 'Fornecedor ACME', valueCents: '150050' }),
  ],
}

describe('buildReconciliationReport', () => {
  it('deriva o rótulo do período (DD/MM/AAAA – DD/MM/AAAA)', () => {
    const r = buildReconciliationReport(period, '2026-05-01', '2026-05-31')
    assert.equal(r.periodLabel, '01/05/2026 – 31/05/2026')
    assert.equal(r.isEmpty, false)
  })

  it('deriva os 6 totalizadores formatados em BRL + contadores', () => {
    const { totals } = buildReconciliationReport(period, '2026-05-01', '2026-05-31')
    assert.equal(totals.openingBRL, 'R$ 10.000,00')
    assert.equal(totals.closingBRL, 'R$ 8.500,00')
    assert.equal(totals.totalInBRL, 'R$ 500,00')
    assert.equal(totals.totalOutBRL, 'R$ 2.000,50')
    assert.equal(totals.reconciledCount, 1)
    assert.equal(totals.pendingCount, 2)
  })

  it('deriva as linhas: data/descrição/valor/saldo/status; descrição cai no memo quando sem favorecido', () => {
    const { rows } = buildReconciliationReport(period, '2026-05-01', '2026-05-31')
    assert.equal(rows.length, 3)
    assert.deepEqual(
      rows.map((r) => r.statusTag),
      ['reconciled', 'pending', 'pending'],
    )
    assert.equal(rows[0]?.dateBR, '18/05/2026')
    assert.equal(rows[0]?.valueBRL, 'R$ 500,00')
    assert.equal(rows[0]?.balanceBRL, 'R$ 9.000,00')
    // Sem payeeName → cai no memo (estado honesto, sem travessão).
    assert.equal(rows[1]?.description, 'tarifa mensal')
    assert.equal(rows[2]?.description, 'Fornecedor ACME')
  })

  it('período VAZIO (sem dados) → isEmpty + totalizadores zerados + zero linhas', () => {
    const empty = buildReconciliationReport(null, '2026-05-01', '2026-05-31')
    assert.equal(empty.isEmpty, true)
    assert.equal(empty.rows.length, 0)
    assert.equal(empty.totals.openingBRL, 'R$ 0,00')
    assert.equal(empty.totals.reconciledCount, 0)
    assert.equal(empty.totals.pendingCount, 0)
    // O rótulo do período segue honesto mesmo sem dados.
    assert.equal(empty.periodLabel, '01/05/2026 – 31/05/2026')
  })

  it('período resolvido mas SEM movimentos → isEmpty true com totalizadores reais', () => {
    const noMoves: AccountStatementPeriod = { ...period, movements: [] }
    const r = buildReconciliationReport(noMoves, '2026-05-01', '2026-05-31')
    assert.equal(r.isEmpty, true)
    assert.equal(r.rows.length, 0)
    assert.equal(r.totals.openingBRL, 'R$ 10.000,00')
  })
})

describe('reportStatusTag', () => {
  it('Pending → pending; Reconciled/ManualEntry → reconciled', () => {
    assert.equal(reportStatusTag('Pending'), 'pending')
    assert.equal(reportStatusTag('Reconciled'), 'reconciled')
    assert.equal(reportStatusTag('ManualEntry'), 'reconciled')
  })
})

describe('periodLabelBR', () => {
  it('formata por string pronta (sem new Date)', () => {
    assert.equal(periodLabelBR('2026-01-05', '2026-02-10'), '05/01/2026 – 10/02/2026')
  })
})

describe('formatAccountNumber', () => {
  const account: ReconciliationAccount = {
    id: 'acc-1',
    bankCode: '001',
    bankName: 'Banco do Brasil',
    branch: '1234',
    accountNumber: '56789',
    accountDv: '0',
    alias: 'Conta Corrente BB',
    type: 'Corrente',
    typeLabel: null,
    status: 'Active',
    currentBalanceCents: '100000',
    lastUpdatedAt: '2026-05-31',
    pendingCount: 0,
    openingBalanceCents: null,
    openingBalanceDate: null,
    convenio: '',
    document: '48517263000190',
  }

  it('deriva a identificação COM NÚMERO: banco · Ag · C/C (número-dígito)', () => {
    assert.equal(formatAccountNumber(account), 'Banco do Brasil · Ag. 1234 · C/C 56789-0')
  })

  it('sem conta resolvida (core-api#168 pendente) → string vazia (a view omite a linha)', () => {
    assert.equal(formatAccountNumber(null), '')
  })
})
