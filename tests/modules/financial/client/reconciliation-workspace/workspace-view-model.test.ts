/**
 * Workspace view-model (puro, node:test) — reducer de UI-state + derivações de progresso. Sem React.
 * Import relativo (os #alias resolvem só no bundler).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  initialWorkspaceUiState,
  workspaceReducer,
  progressLabel,
  progressPercent,
  entryTypeIcon,
  isPending,
  transactionTag,
  filterTransactions,
  groupTransactionsByDay,
  countReconciled,
  parseCents,
  sumCentsOf,
  residualCents,
  canReconcileMulti,
  deriveReconType,
  requiresDestination,
  filterExtrato,
  extratoTotals,
  deriveConferencia,
  groupAccountsForSwitch,
  matchDetailsView,
  buildMatchTitles,
  centsToBRL,
  filterPayables,
  payableTypeOptions,
  sortPayablesRecent,
} from '../../../../../src/modules/financial/client/reconciliation-workspace/reconciliation-workspace.view-model.ts'
import type {
  Movement,
  PaidPayable,
  ReconciliationAccount,
  ReconciliationStatus,
  StatementTransaction,
} from '../../../../../src/modules/financial/client/data/model/reconciliation.model.ts'

const tx = (
  over: Partial<StatementTransaction> & Pick<StatementTransaction, 'id'>,
): StatementTransaction => ({
  fitid: 'F',
  date: '2026-06-01',
  movement: 'Debit' as Movement,
  entryType: 'TED',
  payeeName: 'X',
  memo: '',
  valueCents: '100',
  balanceAfterCents: '0',
  reconciliationStatus: 'Pending' as ReconciliationStatus,
  ...over,
})

describe('workspaceReducer', () => {
  it('estado inicial: aba conciliação, palpites on, filtro pendentes', () => {
    assert.equal(initialWorkspaceUiState.activeTab, 'conciliacao')
    assert.equal(initialWorkspaceUiState.showGuesses, true)
    assert.equal(initialWorkspaceUiState.listFilter, 'pendentes')
    assert.equal(initialWorkspaceUiState.selectedTransactionId, null)
    assert.equal(initialWorkspaceUiState.assocTab, 'sugestao')
  })

  it('set-tab troca a aba ativa', () => {
    const next = workspaceReducer(initialWorkspaceUiState, { type: 'set-tab', tab: 'extrato' })
    assert.equal(next.activeTab, 'extrato')
  })

  it('toggle-guesses inverte o toggle', () => {
    const off = workspaceReducer(initialWorkspaceUiState, { type: 'toggle-guesses' })
    assert.equal(off.showGuesses, false)
    const on = workspaceReducer(off, { type: 'toggle-guesses' })
    assert.equal(on.showGuesses, true)
  })

  it('set-list-filter muda o filtro da lista', () => {
    const next = workspaceReducer(initialWorkspaceUiState, { type: 'set-list-filter', filter: 'todas' })
    assert.equal(next.listFilter, 'todas')
  })

  it('select-transaction guarda o id e volta a aba de associação para Sugestão', () => {
    const onNova = workspaceReducer(initialWorkspaceUiState, { type: 'set-assoc-tab', tab: 'nova' })
    assert.equal(onNova.assocTab, 'nova')
    const selected = workspaceReducer(onNova, { type: 'select-transaction', id: 't1' })
    assert.equal(selected.selectedTransactionId, 't1')
    assert.equal(selected.assocTab, 'sugestao')
  })

  it('set-assoc-tab troca a aba do painel de associação', () => {
    const next = workspaceReducer(initialWorkspaceUiState, { type: 'set-assoc-tab', tab: 'multi' })
    assert.equal(next.assocTab, 'multi')
  })

  it('não muta o estado anterior (imutável)', () => {
    const next = workspaceReducer(initialWorkspaceUiState, { type: 'set-tab', tab: 'extrato' })
    assert.notEqual(next, initialWorkspaceUiState)
    assert.equal(initialWorkspaceUiState.activeTab, 'conciliacao')
  })
})

describe('progresso', () => {
  it('progressLabel = "X/N"', () => {
    assert.equal(progressLabel(46, 128), '46/128')
    assert.equal(progressLabel(0, 0), '0/0')
  })

  it('progressPercent arredonda e limita a 0..100; total 0 → 0', () => {
    assert.equal(progressPercent(46, 128), 36)
    assert.equal(progressPercent(0, 0), 0)
    assert.equal(progressPercent(1, 3), 33)
    assert.equal(progressPercent(3, 3), 100)
  })
})

describe('entryTypeIcon (heurística + fallback por movimento)', () => {
  it('tarifa/juros → fee', () => {
    assert.equal(entryTypeIcon('TARIFA', 'Debit'), 'fee')
    assert.equal(entryTypeIcon('JUROS', 'Credit'), 'fee')
    assert.equal(entryTypeIcon('FEE', 'Debit'), 'fee')
  })
  it('transferência → transfer', () => {
    assert.equal(entryTypeIcon('XFER', 'Debit'), 'transfer')
    assert.equal(entryTypeIcon('TED', 'Credit'), 'transfer')
    assert.equal(entryTypeIcon('DOC', 'Debit'), 'transfer')
  })
  it('aplicação/resgate → investment', () => {
    assert.equal(entryTypeIcon('APLICACAO', 'Debit'), 'investment')
    assert.equal(entryTypeIcon('RESGATE', 'Credit'), 'investment')
  })
  it('desconhecido cai no movimento (in/out)', () => {
    assert.equal(entryTypeIcon('ZZZ', 'Credit'), 'in')
    assert.equal(entryTypeIcon('OTHER', 'Debit'), 'out')
  })
})

describe('derivações da lista', () => {
  const a = tx({ id: 'a', date: '2026-06-01', reconciliationStatus: 'Pending' })
  const b = tx({ id: 'b', date: '2026-06-01', reconciliationStatus: 'Reconciled' })
  const c = tx({ id: 'c', date: '2026-06-02', reconciliationStatus: 'ManualEntry' })
  const d = tx({ id: 'd', date: '2026-06-02', reconciliationStatus: 'Pending' })
  const txs: readonly StatementTransaction[] = [a, b, c, d]

  it('isPending / transactionTag', () => {
    assert.equal(isPending(a), true)
    assert.equal(transactionTag(a), 'pending')
    assert.equal(transactionTag(b), 'reconciled')
    assert.equal(transactionTag(c), 'reconciled')
  })

  it('filterTransactions separa pendentes/conciliadas/todas', () => {
    assert.deepEqual(
      filterTransactions(txs, 'pendentes').map((t) => t.id),
      ['a', 'd'],
    )
    assert.deepEqual(
      filterTransactions(txs, 'conciliadas').map((t) => t.id),
      ['b', 'c'],
    )
    assert.equal(filterTransactions(txs, 'todas').length, 4)
  })

  it('groupTransactionsByDay agrupa por dia preservando a ordem', () => {
    const groups = groupTransactionsByDay(txs)
    assert.equal(groups.length, 2)
    assert.equal(groups[0]?.date, '2026-06-01')
    assert.deepEqual(
      groups[0]?.items.map((t) => t.id),
      ['a', 'b'],
    )
    assert.deepEqual(
      groups[1]?.items.map((t) => t.id),
      ['c', 'd'],
    )
  })

  it('countReconciled conta as não-pendentes', () => {
    assert.equal(countReconciled(txs), 2)
  })
})

describe('balanceamento N:1 / parcial (US3)', () => {
  it('parseCents / sumCentsOf', () => {
    assert.equal(parseCents('15000'), 15000)
    assert.equal(parseCents(''), 0)
    assert.equal(sumCentsOf([{ valueCents: '10000' }, { valueCents: '5000' }]), 15000)
  })

  it('residualCents = extrato − soma (0 quando bate; pode ser negativo)', () => {
    assert.equal(residualCents(15000, 15000), 0)
    assert.equal(residualCents(15000, 12000), 3000)
    assert.equal(residualCents(15000, 16000), -1000)
  })

  it('canReconcileMulti: precisa de ≥1 título e (bate OU diferença classificada)', () => {
    assert.equal(canReconcileMulti(0, 0, false), false) // nada selecionado
    assert.equal(canReconcileMulti(2, 0, false), true) // bate exatamente
    assert.equal(canReconcileMulti(1, 3000, false), false) // diferença sem classificar → bloqueia
    assert.equal(canReconcileMulti(1, 3000, true), true) // diferença classificada → libera
  })

  it('deriveReconType: difference→Partial; senão 1→Individual, ≥2→Multiple', () => {
    assert.equal(deriveReconType(1, false), 'Individual')
    assert.equal(deriveReconType(2, false), 'Multiple')
    assert.equal(deriveReconType(1, true), 'Partial')
    assert.equal(deriveReconType(3, true), 'Partial')
  })
})

describe('lançamento manual (US4)', () => {
  it('requiresDestination só p/ Transfer/Investment/Redemption', () => {
    assert.equal(requiresDestination('Transfer'), true)
    assert.equal(requiresDestination('Investment'), true)
    assert.equal(requiresDestination('Redemption'), true)
    assert.equal(requiresDestination('Payment'), false)
    assert.equal(requiresDestination('Receipt'), false)
    assert.equal(requiresDestination('FeePenaltyInterest'), false)
  })
})

describe('aba Extrato (US8)', () => {
  const cred = tx({ id: 'in1', movement: 'Credit', valueCents: '30000', reconciliationStatus: 'Reconciled' })
  const deb = tx({ id: 'out1', movement: 'Debit', valueCents: '12000', reconciliationStatus: 'Pending' })
  const deb2 = tx({ id: 'out2', movement: 'Debit', valueCents: '8000', reconciliationStatus: 'Pending' })
  const all: readonly StatementTransaction[] = [cred, deb, deb2]

  it('filterExtrato separa por direção/situação', () => {
    assert.deepEqual(
      filterExtrato(all, 'todos').map((t) => t.id),
      ['in1', 'out1', 'out2'],
    )
    assert.deepEqual(
      filterExtrato(all, 'entradas').map((t) => t.id),
      ['in1'],
    )
    assert.deepEqual(
      filterExtrato(all, 'saidas').map((t) => t.id),
      ['out1', 'out2'],
    )
    assert.deepEqual(
      filterExtrato(all, 'conciliados').map((t) => t.id),
      ['in1'],
    )
    assert.deepEqual(
      filterExtrato(all, 'pendentes').map((t) => t.id),
      ['out1', 'out2'],
    )
  })

  it('extratoTotals soma entradas e saídas em centavos', () => {
    const totals = extratoTotals(all)
    assert.equal(totals.inCents, 30000)
    assert.equal(totals.outCents, 20000)
  })
})

describe('modal Alterar conta — groupAccountsForSwitch', () => {
  const acc = (
    over: Partial<ReconciliationAccount> & Pick<ReconciliationAccount, 'id'>,
  ): ReconciliationAccount => ({
    bankCode: '237',
    bankName: 'Bradesco',
    branch: '1462',
    accountNumber: '0012345',
    accountDv: '7',
    alias: 'Bradesco · Movimento',
    type: 'Corrente',
    typeLabel: null,
    status: 'Active',
    currentBalanceCents: '100000',
    lastUpdatedAt: 'hoje',
    pendingCount: 0,
    ...over,
  })
  const accounts = [
    acc({ id: 'a1' }),
    acc({ id: 'a2', bankName: 'Itaú', alias: 'Itaú · Reserva' }),
    acc({ id: 'a3', bankName: 'Santander', alias: 'Santander · Antiga', status: 'Closed' }),
  ]

  it('separa ativas/encerradas e marca a conta atual', () => {
    const groups = groupAccountsForSwitch(accounts, 'a2', '')
    assert.deepEqual(
      groups.active.map((i) => i.id),
      ['a1', 'a2'],
    )
    assert.deepEqual(
      groups.closed.map((i) => i.id),
      ['a3'],
    )
    assert.equal(groups.active.find((i) => i.id === 'a2')?.isCurrent, true)
    assert.equal(groups.active.find((i) => i.id === 'a1')?.isCurrent, false)
  })

  it('conta encerrada não é abrível (openable=false) e a meta segue o formato do mock', () => {
    const groups = groupAccountsForSwitch(accounts, 'a1', '')
    assert.equal(groups.closed[0]?.openable, false)
    assert.equal(groups.active[0]?.openable, true)
    assert.equal(groups.active[0]?.meta, '237 · Ag 1462 · CC 0012345-7')
    assert.equal(groups.active[0]?.initials, 'BR')
  })

  it('filtra pela busca (banco/alias/número), case-insensitive', () => {
    assert.deepEqual(
      groupAccountsForSwitch(accounts, 'a1', 'itaú').active.map((i) => i.id),
      ['a2'],
    )
    assert.deepEqual(
      groupAccountsForSwitch(accounts, 'a1', 'santander').closed.map((i) => i.id),
      ['a3'],
    )
    assert.equal(groupAccountsForSwitch(accounts, 'a1', 'zzz').active.length, 0)
  })
})

describe('modal Detalhes da conciliação — matchDetailsView', () => {
  const base = tx({
    id: 'r1',
    payeeName: 'Gráfica Horizonte',
    entryType: 'DOC',
    fitid: 'E2E-004',
    valueCents: '95000',
    reconciliationStatus: 'Reconciled',
  })

  it('lado extrato é real (vindo da transação)', () => {
    const v = matchDetailsView(base, null, null)
    assert.equal(v.ext.name, 'Gráfica Horizonte')
    assert.equal(v.ext.kind, 'DOC')
    assert.equal(v.ext.id, 'E2E-004')
    assert.equal(v.ext.valueBRL, centsToBRL('95000'))
    assert.equal(v.isManualEntry, false)
  })

  it('sem detalhes (backend ausente, #175) → título/auditoria viram "—"', () => {
    const v = matchDetailsView(base, null, null)
    assert.equal(v.doc.name, '—')
    assert.equal(v.doc.vencimento, '—')
    assert.equal(v.audit.when, '—')
    assert.equal(v.audit.who, '—')
  })

  it('com detalhes, repassa título/auditoria; ManualEntry marca isManualEntry', () => {
    const doc = {
      name: 'NF 0847',
      documento: '0847',
      vencimento: '10/06/2026',
      categoria: 'Serviços',
      valueBRL: 'R$ 950,00',
    }
    const audit = { when: '18/06/2026', who: 'admin' }
    const v = matchDetailsView({ ...base, reconciliationStatus: 'ManualEntry' }, doc, audit)
    assert.equal(v.isManualEntry, true)
    assert.equal(v.doc.documento, '0847')
    assert.equal(v.audit.who, 'admin')
  })

  it('multi=null por padrão (conciliação individual)', () => {
    const v = matchDetailsView(base, null, null)
    assert.equal(v.multi, null)
  })

  it('multi preenchido quando passado (1 saída → N títulos)', () => {
    const multi = { count: 3, lines: [{ valueBRL: 'R$ 300,00' }], totalBRL: 'R$ 742,00' }
    const v = matchDetailsView(base, null, null, multi)
    assert.equal(v.multi?.count, 3)
    assert.equal(v.multi?.totalBRL, 'R$ 742,00')
  })
})

describe('buildMatchTitles (1 saída → N títulos, #175 items)', () => {
  const lookup = (items: readonly { payableId: string; reconciledValueCents: string }[]) =>
    ({
      reconciliationId: 'rec1',
      transactionId: 't1',
      type: 'Multiple' as const,
      status: 'Active' as const,
      reconciledBy: 'u1',
      reconciledAt: '2026-06-21T00:00:00.000Z',
      differenceCents: null,
      items,
    }) as Parameters<typeof buildMatchTitles>[0]

  it('null quando há só 1 item (conciliação individual)', () => {
    assert.equal(buildMatchTitles(lookup([{ payableId: 'p1', reconciledValueCents: '74200' }])), null)
  })

  it('com >1 item: conta, lista por título e soma o total', () => {
    const r = buildMatchTitles(
      lookup([
        { payableId: 'p1', reconciledValueCents: '30000' },
        { payableId: 'p2', reconciledValueCents: '20000' },
        { payableId: 'p3', reconciledValueCents: '24200' },
      ]),
    )
    assert.equal(r?.count, 3)
    assert.equal(r?.lines.length, 3)
    assert.equal(r?.lines[0]?.valueBRL, centsToBRL('30000'))
    assert.equal(r?.totalBRL, centsToBRL('74200'))
  })
})

describe('Buscar/Criar vários — filtros de títulos (filterPayables por tipo de documento)', () => {
  const pay = (over: Partial<PaidPayable> & Pick<PaidPayable, 'id'>): PaidPayable => ({
    documentId: 'd',
    valueCents: '1000',
    dueDate: '2026-05-10',
    paymentMethod: 'PIX',
    supplierName: 'TS Da Silva',
    documentNumber: 'NFS-0001',
    category: 'Serviços / Consultoria',
    documentType: 'NFS-e',
    ...over,
  })
  const list = [
    pay({ id: 'a' }),
    pay({ id: 'b', documentNumber: 'ISS retido', category: 'Imposto / ISS', documentType: 'ISS' }),
    pay({ id: 'c', documentNumber: 'IRRF retido', category: 'Imposto / IRRF', documentType: 'IRRF' }),
    pay({ id: 'd', documentType: null }),
  ]

  it('payableTypeOptions traz os tipos de documento distintos presentes', () => {
    assert.deepEqual(payableTypeOptions(list), ['NFS-e', 'ISS', 'IRRF'])
  })

  it('filtra por Tipo de documento (ex.: IRRF) e por busca textual', () => {
    assert.deepEqual(
      filterPayables(list, '', 'IRRF').map((p) => p.id),
      ['c'],
    )
    assert.deepEqual(
      filterPayables(list, '', 'ISS').map((p) => p.id),
      ['b'],
    )
    assert.deepEqual(
      filterPayables(list, 'iss', 'all').map((p) => p.id),
      ['b'],
    )
    assert.deepEqual(
      filterPayables(list, '', 'all').map((p) => p.id),
      ['a', 'b', 'c', 'd'],
    )
  })

  it('sortPayablesRecent: mais recente (vencimento desc) no topo, sem mutar a entrada', () => {
    const entrada = [
      pay({ id: 'x', dueDate: '2026-05-01' }),
      pay({ id: 'y', dueDate: '2026-07-20' }),
      pay({ id: 'z', dueDate: '2026-06-10' }),
    ]
    assert.deepEqual(
      sortPayablesRecent(entrada).map((p) => p.id),
      ['y', 'z', 'x'],
    )
    assert.equal(entrada[0]?.id, 'x') // entrada preservada (cópia)
  })
})

describe('deriveConferencia (#205 — conferência da conciliação)', () => {
  const mov = (
    id: string,
    movement: 'Credit' | 'Debit',
    valueCents: string,
    status: 'Pending' | 'Reconciled',
  ) => ({
    id,
    fitid: '',
    date: '2026-06-02',
    movement,
    entryType: 'PIX',
    payeeName: 'x',
    memo: '',
    valueCents,
    balanceAfterCents: '0',
    reconciliationStatus: status,
  })
  const base = {
    openingBalanceCents: '184230090', // 1.842.300,90
    closingBalanceCents: '185014235', // 1.850.142,35
    totalInCents: '1030000',
    totalOutCents: '245855',
    counters: { all: 3, in: 2, out: 1, reconciled: 2, pending: 1 },
    movements: [
      mov('a', 'Credit', '600000', 'Reconciled'),
      mov('b', 'Credit', '430000', 'Reconciled'),
      mov('c', 'Debit', '245855', 'Pending'),
    ],
  }

  it('conciliado = inicial + conciliados (com sinal); diferença = final − conciliado', () => {
    const conf = deriveConferencia(base)
    assert.equal(conf?.conciliadoCents, 185260090) // 1.842.300,90 + 6.000 + 4.300
    assert.equal(conf?.diferencaCents, -245855) // 1.850.142,35 − 1.852.600,90 (1 saída pendente)
    assert.equal(conf?.reconciledCount, 2)
    assert.equal(conf?.totalCount, 3)
    assert.equal(conf?.pendingCount, 1)
  })

  it('tudo conciliado → conciliado == saldo final e diferença = 0', () => {
    const conf = deriveConferencia({
      ...base,
      counters: { all: 3, in: 2, out: 1, reconciled: 3, pending: 0 },
      movements: base.movements.map((m) => ({ ...m, reconciliationStatus: 'Reconciled' as const })),
    })
    assert.equal(conf?.conciliadoCents, 185014235) // == closing
    assert.equal(conf?.diferencaCents, 0)
    assert.equal(conf?.pendingCount, 0)
  })

  it('null → null', () => {
    assert.equal(deriveConferencia(null), null)
  })
})
