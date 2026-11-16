/**
 * Relatório da Conciliação — view-model PURO (node:test). Deriva as linhas, os lotes, os cartões e a situação a
 * partir de um `AccountStatementPeriod` (#205), cobre o caso VAZIO e a identificação da conta COM NÚMERO
 * (`formatAccountNumber`) do cabeçalho impresso. Sem React/DOM. Import relativo (os #alias resolvem via
 * package.json "imports").
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildReconciliationReport,
  formatAccountNumber,
  formatEmission,
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
  it('deriva o rótulo do período (DD/MM/AAAA a DD/MM/AAAA)', () => {
    const r = buildReconciliationReport(period, '2026-05-01', '2026-05-31')
    assert.equal(r.periodLabel, '01/05/2026 a 31/05/2026')
    assert.equal(r.isEmpty, false)
  })

  it('deriva os cartões de saldo em BRL e os totais sem símbolo', () => {
    const { totals } = buildReconciliationReport(period, '2026-05-01', '2026-05-31')
    assert.equal(totals.openingBRL, 'R$ 10.000,00')
    assert.equal(totals.closingBRL, 'R$ 8.500,00')
    assert.equal(totals.totalInBRL, 'R$ 500,00')
    assert.equal(totals.totalOutBRL, 'R$ 2.000,50')
    assert.equal(totals.totalOut, '2.000,50')
  })

  it('deriva as linhas no modelo de extrato: data curta, histórico do banco, entrada/saída, saldo, situação', () => {
    const { rows } = buildReconciliationReport(period, '2026-05-01', '2026-05-31')
    assert.equal(rows.length, 3)
    assert.deepEqual(
      rows.map((r) => r.statusTag),
      ['reconciled', 'pending', 'pending'],
    )
    assert.equal(rows[0]?.dateBR, '18/05/26')
    assert.equal(rows[0]?.inValue, '500,00')
    assert.equal(rows[0]?.outValue, '—')
    assert.equal(rows[1]?.outValue, '50,00')
    assert.equal(rows[0]?.balance, '9.000,00')
    // O histórico é o que o banco enviou (memo); sem memo, cai no favorecido.
    assert.equal(rows[1]?.description, 'tarifa mensal')
    const semMemo = buildReconciliationReport(
      { ...period, movements: [tx({ memo: '', payeeName: 'Fornecedor ACME' })] },
      '2026-05-01',
      '2026-05-31',
    )
    assert.equal(semMemo.rows[0]?.description, 'Fornecedor ACME')
  })

  it('coluna Entrada só aparece quando o período tem entrada', () => {
    assert.equal(buildReconciliationReport(period, '2026-05-01', '2026-05-31').showIn, true)
    const soSaidas = { ...period, movements: [tx({ movement: 'Debit' })] }
    assert.equal(buildReconciliationReport(soSaidas, '2026-05-01', '2026-05-31').showIn, false)
  })

  const title = (payableId: string, cents: string, over: Record<string, unknown> = {}) => ({
    payableId,
    documentNumber: `NF ${payableId}`,
    payeeName: `Fornecedor ${payableId}`,
    retentionType: null,
    dueDate: '2026-08-27',
    reconciledValueCents: cents,
    ...over,
  })

  it('lote: mais de um título abre sob a transação, com total; o lote conta como uma movimentação', () => {
    const lote = tx({
      id: 'lote',
      valueCents: '336112',
      reconciliationStatus: 'Reconciled',
      reconciliation: {
        reconciliationId: 'rec',
        titles: [title('a', '120000'), title('b', '150000'), title('c', '66112')],
      },
    })
    const r = buildReconciliationReport({ ...period, movements: [lote] }, '2026-08-01', '2026-08-31')
    assert.equal(r.hasBatch, true)
    assert.equal(r.movementCount, 1)
    assert.equal(r.rows[0]?.isBatch, true)
    assert.equal(r.rows[0]?.batch?.count, 3)
    assert.equal(r.rows[0]?.batch?.total, '3.361,12')
    assert.deepEqual(r.rows[0]?.batch?.titles[0], {
      id: 'a',
      documento: 'NF a',
      name: 'Fornecedor a',
      nameTag: null,
      vencimento: '27/08/2026',
      value: '1.200,00',
    })
  })

  it('não é lote: um título só ou lançamento manual fica na linha principal (detalhe no modal)', () => {
    const umTitulo = tx({
      reconciliationStatus: 'Reconciled',
      reconciliation: { reconciliationId: 'rec', titles: [title('a', '150050')] },
    })
    const r = buildReconciliationReport({ ...period, movements: [umTitulo] }, '2026-08-01', '2026-08-31')
    assert.equal(r.rows[0]?.batch, null)
    assert.equal(r.hasBatch, false)
  })

  it('título não resolvido aparece com travessão e valor; imposto retido traz o órgão', () => {
    const lote = tx({
      reconciliation: {
        reconciliationId: 'rec',
        titles: [
          title('a', '100', { documentNumber: null, payeeName: null, dueDate: null }),
          title('b', '200', { retentionType: 'ISS' }),
        ],
      },
    })
    const r = buildReconciliationReport({ ...period, movements: [lote] }, '2026-08-01', '2026-08-31')
    const [first, second] = r.rows[0]?.batch?.titles ?? []
    assert.equal(first?.documento, '—')
    assert.equal(first?.vencimento, '—')
    assert.equal(first?.value, '1,00')
    assert.notEqual(second?.nameTag, null)
  })

  it('emissão: DD/MM/AAAA HH:mm', () => {
    assert.equal(formatEmission(new Date(2026, 10, 6, 9, 5)), '06/11/2026 09:05')
  })

  it('período VAZIO (sem dados) → isEmpty + totalizadores zerados + zero linhas', () => {
    const empty = buildReconciliationReport(null, '2026-05-01', '2026-05-31')
    assert.equal(empty.isEmpty, true)
    assert.equal(empty.rows.length, 0)
    assert.equal(empty.totals.openingBRL, 'R$ 0,00')
    assert.equal(empty.movementCount, 0)
    // O rótulo do período segue honesto mesmo sem dados.
    assert.equal(empty.periodLabel, '01/05/2026 a 31/05/2026')
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
    assert.equal(periodLabelBR('2026-01-05', '2026-02-10'), '05/01/2026 a 10/02/2026')
  })
})

describe('formatAccountNumber', () => {
  const account: ReconciliationAccount = {
    id: 'acc-1',
    bankCode: '001',
    bankName: 'Banco do Brasil',
    branch: '1234',
    branchDv: '5',
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
    assert.equal(formatAccountNumber(account), 'Banco do Brasil · Ag. 1234-5 · C/C 56789-0')
  })

  it('sem conta resolvida (core-api#168 pendente) → string vazia (a view omite a linha)', () => {
    assert.equal(formatAccountNumber(null), '')
  })
})
