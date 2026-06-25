/**
 * Grid de contas — view-model (puro, node:test): status, busca, filtro, ordenação, consolidado. Import
 * relativo (os #alias resolvem só no bundler).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  accountStatus,
  deriveAccountRows,
  consolidate,
  maskDateInput,
  dateInputToIso,
} from '../../../../../src/modules/financial/client/reconciliation-accounts/reconciliation-accounts.view-model.ts'
import type { ReconciliationAccount } from '../../../../../src/modules/financial/client/data/model/reconciliation.model.ts'

const acc = (
  over: Partial<ReconciliationAccount> & Pick<ReconciliationAccount, 'id'>,
): ReconciliationAccount => ({
  bankCode: '237',
  bankName: 'Bradesco',
  branch: '1462',
  accountNumber: '0012345',
  accountDv: '7',
  alias: 'Conta Movimento',
  type: 'Corrente',
  typeLabel: null,
  status: 'Active',
  currentBalanceCents: '24539218',
  lastUpdatedAt: '2026-06-18',
  pendingCount: 0,
  openingBalanceCents: '24539218',
  openingBalanceDate: '2026-06-01',
  ...over,
})

describe('accountStatus', () => {
  it('encerrada > pendências > em dia', () => {
    assert.equal(accountStatus(acc({ id: 'a', status: 'Closed', pendingCount: 5 })), 'closed')
    assert.equal(accountStatus(acc({ id: 'b', pendingCount: 3 })), 'pending')
    assert.equal(accountStatus(acc({ id: 'c', pendingCount: 0 })), 'up-to-date')
  })
})

describe('deriveAccountRows', () => {
  const accounts: readonly ReconciliationAccount[] = [
    acc({ id: 'a', alias: 'Itaú Principal', bankName: 'Itaú', pendingCount: 2, currentBalanceCents: '1000' }),
    acc({
      id: 'b',
      alias: 'Bradesco Movimento',
      bankName: 'Bradesco',
      pendingCount: 0,
      currentBalanceCents: '5000',
    }),
    acc({ id: 'c', alias: 'Caixa Encerrada', bankName: 'Caixa', status: 'Closed', currentBalanceCents: '0' }),
  ]

  it('busca por banco/apelido', () => {
    const rows = deriveAccountRows(accounts, { search: 'itaú', status: 'todas', sort: 'nome' })
    assert.deepEqual(
      rows.map((r) => r.id),
      ['a'],
    )
  })

  it('filtro de status', () => {
    assert.deepEqual(
      deriveAccountRows(accounts, { search: '', status: 'pendentes', sort: 'nome' }).map((r) => r.id),
      ['a'],
    )
    assert.deepEqual(
      deriveAccountRows(accounts, { search: '', status: 'encerradas', sort: 'nome' }).map((r) => r.id),
      ['c'],
    )
    assert.deepEqual(
      deriveAccountRows(accounts, { search: '', status: 'em-dia', sort: 'nome' }).map((r) => r.id),
      ['b'],
    )
  })

  it('ordena por saldo (desc) e marca openable (encerrada=false)', () => {
    const rows = deriveAccountRows(accounts, { search: '', status: 'todas', sort: 'saldo' })
    assert.deepEqual(
      rows.map((r) => r.id),
      ['b', 'a', 'c'],
    )
    const closed = rows.find((r) => r.id === 'c')
    assert.equal(closed?.openable, false)
  })
})

describe('consolidate', () => {
  it('soma saldo + total de pendências + contagem', () => {
    const accounts: readonly ReconciliationAccount[] = [
      acc({ id: 'a', currentBalanceCents: '10000', pendingCount: 2 }),
      acc({ id: 'b', currentBalanceCents: '5000', pendingCount: 3 }),
    ]
    const cons = consolidate(accounts)
    assert.equal(cons.accountsCount, 2)
    assert.equal(cons.pendingTotal, 5)
    assert.match(cons.balanceBRL, /150,00/) // 15000 centavos = R$ 150,00
  })
})

describe('máscara/parse da data do saldo (maskDateInput / dateInputToIso)', () => {
  it('maskDateInput: dígitos → DD/MM/AAAA progressivo', () => {
    assert.equal(maskDateInput('0'), '0')
    assert.equal(maskDateInput('0105'), '01/05')
    assert.equal(maskDateInput('01052026'), '01/05/2026')
    assert.equal(maskDateInput('010520269999'), '01/05/2026') // corta em 8 dígitos
    assert.equal(maskDateInput('01/05/2026'), '01/05/2026') // idempotente
  })

  it('dateInputToIso: DD/MM/AAAA → ISO; null se incompleto/inválido', () => {
    assert.equal(dateInputToIso('01/05/2026'), '2026-05-01')
    assert.equal(dateInputToIso('01052026'), '2026-05-01')
    assert.equal(dateInputToIso('01/05'), null) // incompleto
    assert.equal(dateInputToIso('32/05/2026'), null) // dia inválido
    assert.equal(dateInputToIso('01/13/2026'), null) // mês inválido
  })
})
