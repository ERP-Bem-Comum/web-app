/**
 * Mappers do core-api conciliação (puro, node:test): mapHttpError slug→ReconciliationError, e
 * transactions/payables/suggestions/import/reconcile/undo→Model com parse de borda. Verificado contra o
 * contrato real (#152): entryType string livre, suggestions raiz `{ suggestions }`, band alta/media,
 * type derivado pelo backend. Import relativo (os #alias resolvem só no bundler).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  mapHttpError,
  transactionsToModel,
  paidPayablesToModel,
  cedenteAccountsToModel,
  cedenteAccountToModel,
  accountStatementSummary,
  suggestionsToModel,
  importToModel,
  reconciliationCreatedToModel,
  undoToModel,
} from '../../../../../../src/modules/financial/server/adapters/core-api/reconciliation.mappers.ts'
import { isOk, isErr } from '../../../../../../src/shared/primitives/result.ts'
import type { HttpError } from '../../../../../../src/shared/http/http-error.types.ts'

describe('mapHttpError (conciliação)', () => {
  const http = (status: number, code?: string): HttpError => ({
    kind: 'http',
    status,
    body: code === undefined ? null : { error: { code, message: '', requestId: 'r' } },
  })

  it('mapeia slugs do contrato', () => {
    assert.equal(mapHttpError(http(422, 'reconciliation-not-balanced')), 'reconciliation-not-balanced')
    assert.equal(mapHttpError(http(422, 'title-not-paid')), 'title-not-paid')
    assert.equal(mapHttpError(http(409, 'period-closed')), 'period-closed')
    assert.equal(mapHttpError(http(409, 'transaction-already-reconciled')), 'transaction-already-reconciled')
    assert.equal(mapHttpError(http(400, 'unsupported-format')), 'import-unsupported-format')
    assert.equal(mapHttpError(http(422, 'period-has-pending-transactions')), 'period-has-pending')
  })

  it('cai no status quando não há slug', () => {
    assert.equal(mapHttpError(http(404)), 'not-found')
    assert.equal(mapHttpError(http(403)), 'forbidden')
    assert.equal(mapHttpError(http(409)), 'conflict')
    assert.equal(mapHttpError(http(422)), 'validation')
    assert.equal(mapHttpError(http(500)), 'server')
  })

  it('rede/timeout → connectivity; parse → server', () => {
    assert.equal(mapHttpError({ kind: 'network' }), 'connectivity')
    assert.equal(mapHttpError({ kind: 'timeout' }), 'connectivity')
    assert.equal(mapHttpError({ kind: 'parse' }), 'server')
  })
})

describe('transactionsToModel', () => {
  it('mapeia items; entryType passa cru; movement/status tolerantes', () => {
    const raw = {
      items: [
        {
          id: 't1',
          fitid: 'F1',
          date: '2026-06-01',
          movement: 'Credit',
          entryType: 'XFER',
          payeeName: 'Fulano',
          memo: 'pix',
          valueCents: '15000',
          balanceAfterCents: '20000',
          reconciliationStatus: 'Pending',
        },
        {
          id: 't2',
          fitid: 'F2',
          date: '2026-06-02',
          movement: 'WAT', // drift → Debit
          entryType: 'TARIFA',
          payeeName: '',
          memo: '',
          valueCents: '500',
          balanceAfterCents: '19500',
          reconciliationStatus: 'ZZZ', // drift → Pending
        },
      ],
    }
    const r = transactionsToModel(raw)
    assert.ok(isOk(r))
    if (isOk(r)) {
      assert.equal(r.value.length, 2)
      assert.equal(r.value[0]?.movement, 'Credit')
      assert.equal(r.value[0]?.entryType, 'XFER')
      assert.equal(r.value[1]?.movement, 'Debit')
      assert.equal(r.value[1]?.reconciliationStatus, 'Pending')
    }
  })

  it('normaliza date ISO datetime do core-api p/ date-only (YYYY-MM-DD)', () => {
    const raw = {
      items: [
        {
          id: 't1',
          fitid: 'F1',
          date: '2026-06-18T00:00:00.000Z',
          movement: 'Debit',
          entryType: 'PIX',
          payeeName: 'X',
          memo: '',
          valueCents: '100',
          balanceAfterCents: '0',
          reconciliationStatus: 'Pending',
        },
      ],
    }
    const r = transactionsToModel(raw)
    assert.ok(isOk(r))
    if (isOk(r)) assert.equal(r.value[0]?.date, '2026-06-18')
  })

  it('shape inválido → err(server)', () => {
    assert.ok(isErr(transactionsToModel({ nope: true })))
  })
})

describe('paidPayablesToModel', () => {
  it('mapeia mínimo; supplier/docNumber ausentes → null (#172)', () => {
    const raw = {
      items: [
        { id: 'p1', documentId: 'd1', valueCents: '15000', dueDate: '2026-06-10', paymentMethod: 'PIX' },
      ],
    }
    const r = paidPayablesToModel(raw)
    assert.ok(isOk(r))
    if (isOk(r)) {
      assert.equal(r.value[0]?.supplierName, null)
      assert.equal(r.value[0]?.documentNumber, null)
      assert.equal(r.value[0]?.dueDate, '2026-06-10')
    }
  })
})

describe('cedenteAccountsToModel / cedenteAccountToModel (#138)', () => {
  const raw = {
    id: 'b1a7c0de-0000-4000-8000-000000000168',
    bankCode: '237',
    bankName: 'Bradesco',
    type: 'poupanca',
    agency: '1462',
    accountNumber: '0012345',
    accountDigit: '7',
    convenio: '',
    document: '12345678000190',
    status: 'closed',
    nickname: 'Conta Movimento',
    openingBalanceCents: '24539218',
    openingBalanceDate: '2026-06-18',
  }

  it('mapeia branch/accountDv/alias e normaliza type/status; defaults #139', () => {
    const r = cedenteAccountToModel(raw)
    assert.ok(isOk(r))
    if (isOk(r)) {
      assert.equal(r.value.branch, '1462')
      assert.equal(r.value.accountDv, '7')
      assert.equal(r.value.alias, 'Conta Movimento')
      assert.equal(r.value.type, 'Poupanca')
      assert.equal(r.value.status, 'Closed')
      assert.equal(r.value.currentBalanceCents, '24539218') // saldo de abertura até #139
      assert.equal(r.value.pendingCount, 0) // #139
    }
  })

  it('lista é array; bankName/nickname nulos → fallback p/ bankCode; type ausente → Corrente', () => {
    const r = cedenteAccountsToModel([
      { ...raw, bankName: null, nickname: null, type: null, status: 'active' },
    ])
    assert.ok(isOk(r))
    if (isOk(r)) {
      assert.equal(r.value[0]?.bankName, '237')
      assert.equal(r.value[0]?.alias, '237')
      assert.equal(r.value[0]?.type, 'Corrente')
      assert.equal(r.value[0]?.status, 'Active')
    }
  })

  it('shape inválido → err(server)', () => {
    assert.ok(isErr(cedenteAccountsToModel({ nope: true })))
  })
})

describe('accountStatementSummary (#139)', () => {
  it('extrai saldo corrente (closing), pendências (counters.pending) e última data (último dia)', () => {
    const raw = {
      openingBalanceCents: '100000',
      closingBalanceCents: '24539218',
      counters: { all: 12, in: 5, out: 7, reconciled: 9, pending: 3 },
      days: [{ date: '2026-06-01' }, { date: '2026-06-18' }],
    }
    const r = accountStatementSummary(raw)
    assert.ok(isOk(r))
    if (isOk(r)) {
      assert.equal(r.value.closingBalanceCents, '24539218')
      assert.equal(r.value.pendingCount, 3)
      assert.equal(r.value.lastDate, '2026-06-18')
    }
  })

  it('sem dias → lastDate null; date ISO datetime → date-only', () => {
    const semDias = accountStatementSummary({
      openingBalanceCents: '0',
      closingBalanceCents: '0',
      counters: { all: 0, in: 0, out: 0, reconciled: 0, pending: 0 },
      days: [],
    })
    assert.ok(isOk(semDias))
    if (isOk(semDias)) assert.equal(semDias.value.lastDate, null)

    const iso = accountStatementSummary({
      closingBalanceCents: '500',
      counters: { all: 1, in: 1, out: 0, reconciled: 0, pending: 1 },
      days: [{ date: '2026-06-18T00:00:00.000Z' }],
    })
    assert.ok(isOk(iso))
    if (isOk(iso)) assert.equal(iso.value.lastDate, '2026-06-18')
  })

  it('shape inválido → err(server)', () => {
    assert.ok(isErr(accountStatementSummary({ nope: true })))
  })
})

describe('suggestionsToModel', () => {
  it('lê a raiz { suggestions } (não items); band tolerante', () => {
    const raw = {
      suggestions: [
        {
          payableId: 'p1',
          score: 88,
          band: 'alta',
          criteria: {
            payeeMatch: true,
            exactValue: true,
            dateD0: true,
            memoRef: false,
            supplierOpenCount: 2,
          },
        },
        {
          payableId: 'p2',
          score: 55,
          band: 'xx', // drift → media
          criteria: {
            payeeMatch: false,
            exactValue: false,
            dateD0: false,
            memoRef: false,
            supplierOpenCount: 0,
          },
        },
      ],
    }
    const r = suggestionsToModel(raw)
    assert.ok(isOk(r))
    if (isOk(r)) {
      assert.equal(r.value[0]?.band, 'alta')
      assert.equal(r.value[1]?.band, 'media')
    }
  })

  it('usar a chave items (errada) → err(server)', () => {
    assert.ok(isErr(suggestionsToModel({ items: [] })))
  })
})

describe('importToModel / reconciliationCreatedToModel / undoToModel', () => {
  it('import mapeia resumo + período', () => {
    const r = importToModel({
      statementId: 's1',
      imported: 10,
      duplicatesDiscarded: 2,
      period: { start: '2026-06-01', end: '2026-06-30' },
    })
    assert.ok(isOk(r))
    if (isOk(r)) assert.equal(r.value.duplicatesDiscarded, 2)
  })

  it('reconcile mapeia type tolerante', () => {
    const r = reconciliationCreatedToModel({ reconciliationId: 'r1', type: 'Partial', itemCount: 2 })
    assert.ok(isOk(r))
    if (isOk(r)) assert.equal(r.value.type, 'Partial')
    const drift = reconciliationCreatedToModel({ reconciliationId: 'r2', type: 'ZZZ', itemCount: 1 })
    assert.ok(isOk(drift))
    if (isOk(drift)) assert.equal(drift.value.type, 'Individual')
  })

  it('undo sempre status Undone', () => {
    const r = undoToModel({ reconciliationId: 'r1', status: 'whatever' })
    assert.ok(isOk(r))
    if (isOk(r)) assert.equal(r.value.status, 'Undone')
  })
})
