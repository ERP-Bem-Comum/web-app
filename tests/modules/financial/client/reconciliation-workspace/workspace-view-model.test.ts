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
  sortPendingByPayment,
  parseOfxAccount,
  ofxMatchesAccount,
  ofxAccountLabel,
  findSimilarPending,
  isBatchableManualType,
  isFeeLikeTransaction,
  normalizeDesc,
  relabelReconCategory,
  nextPendingWithMatch,
  tituloLabel,
  formatDateDash,
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
    openingBalanceCents: '100000',
    openingBalanceDate: '2026-06-01',
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

  it('com detalhes, repassa título/auditoria; isManualEntry vem do parâmetro (type do lookup)', () => {
    const doc = {
      name: 'NF 0847',
      documento: '0847',
      vencimento: '10/06/2026',
      categoria: 'Serviços',
      valueBRL: 'R$ 950,00',
    }
    const audit = { when: '18/06/2026', who: 'admin' }
    // isManualEntry agora vem do 5º parâmetro (type da reconciliation), não do status da transação.
    const v = matchDetailsView(base, doc, audit, null, true)
    assert.equal(v.isManualEntry, true)
    assert.equal(v.doc.documento, '0847')
    assert.equal(v.audit.who, 'admin')
  })

  it('manualKindTag: tipo específico quando conhecido, genérico quando não', () => {
    const comTipo = matchDetailsView(base, null, null, null, true, 'Investment')
    assert.equal(comTipo.manualKindTag, 'financial.recon.manualType.Investment')
    const semTipo = matchDetailsView(base, null, null, null, true)
    assert.equal(semTipo.manualKindTag, 'financial.recon.match.manualKind')
  })

  it('multi=null por padrão (conciliação individual)', () => {
    const v = matchDetailsView(base, null, null)
    assert.equal(v.multi, null)
  })

  it('multi preenchido quando passado (1 saída → N títulos)', () => {
    const multi = {
      count: 3,
      lines: [{ valueBRL: 'R$ 300,00' }],
      differenceBRL: null,
      differenceTag: '',
      totalBRL: 'R$ 742,00',
    }
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
    assert.equal(
      buildMatchTitles(lookup([{ payableId: 'p1', reconciledValueCents: '74200' }]), '74200'),
      null,
    )
  })

  it('extrato == soma dos títulos: sem linha de diferença; total = soma', () => {
    const r = buildMatchTitles(
      lookup([
        { payableId: 'p1', reconciledValueCents: '30000' },
        { payableId: 'p2', reconciledValueCents: '20000' },
        { payableId: 'p3', reconciledValueCents: '24200' },
      ]),
      '74200',
    )
    assert.equal(r?.count, 3)
    assert.equal(r?.differenceBRL, null)
    assert.equal(r?.differenceTag, '')
    assert.equal(r?.totalBRL, centsToBRL('74200'))
  })

  it('extrato MAIOR que a soma: diferença = ACRÉSCIMO (multa/juros); total = extrato (caso da P.O.)', () => {
    // 3 títulos = R$ 30,50; extrato = R$ 220,50 → diferença R$ 190,00 a mais
    const r = buildMatchTitles(
      lookup([
        { payableId: 'p1', reconciledValueCents: '850' },
        { payableId: 'p2', reconciledValueCents: '1200' },
        { payableId: 'p3', reconciledValueCents: '1000' },
      ]),
      '22050',
    )
    assert.equal(r?.differenceBRL, centsToBRL('19000'))
    assert.equal(r?.differenceTag, 'financial.recon.match.diffSurplus')
    assert.equal(r?.totalBRL, centsToBRL('22050'))
  })

  it('extrato MENOR que a soma: diferença = DESCONTO', () => {
    const r = buildMatchTitles(
      lookup([
        { payableId: 'p1', reconciledValueCents: '3000' },
        { payableId: 'p2', reconciledValueCents: '2000' },
      ]),
      '4500',
    )
    assert.equal(r?.differenceBRL, centsToBRL('500'))
    assert.equal(r?.differenceTag, 'financial.recon.match.diffDiscount')
    assert.equal(r?.totalBRL, centsToBRL('4500'))
  })
})

describe('Buscar/Criar vários — filtros de títulos (filterPayables por tipo de documento)', () => {
  const pay = (over: Partial<PaidPayable> & Pick<PaidPayable, 'id'>): PaidPayable => ({
    documentId: 'd',
    valueCents: '1000',
    dueDate: '2026-05-10',
    paidAt: null,
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

  it('sortPendingByPayment: mais antigo por data de PAGAMENTO no topo; sem paidAt vão ao fim; não muta', () => {
    const entrada = [
      pay({ id: 'semData', paidAt: null }),
      pay({ id: 'jul', paidAt: '2026-07-20' }),
      pay({ id: 'mai', paidAt: '2026-05-01' }),
      pay({ id: 'jun', paidAt: '2026-06-10' }),
    ]
    assert.deepEqual(
      sortPendingByPayment(entrada).map((p) => p.id),
      ['mai', 'jun', 'jul', 'semData'], // asc por paidAt; null ao fim
    )
    assert.equal(entrada[0]?.id, 'semData') // entrada preservada (cópia)
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

describe('validação de conta do OFX (parseOfxAccount / ofxMatchesAccount)', () => {
  const ofx = [
    '<BANKACCTFROM>',
    '<BANKID>001',
    '<BRANCHID>1234',
    '<ACCTID>00123457',
    '<ACCTTYPE>CHECKING',
    '</BANKACCTFROM>',
  ].join('\n')
  const conta = { bankCode: '001', branch: '1234', accountNumber: '0012345', accountDv: '7' }

  it('parseOfxAccount extrai banco/agência/conta/tipo; null sem ACCTID', () => {
    const a = parseOfxAccount(ofx)
    assert.deepEqual(a, { bankId: '001', branchId: '1234', acctId: '00123457', acctType: 'CHECKING' })
    assert.equal(parseOfxAccount('arquivo csv sem bancos'), null)
  })

  it('ofxMatchesAccount: bate com a conta (conta+dígito, tolerante a zeros)', () => {
    const a = parseOfxAccount(ofx)
    assert.ok(a !== null)
    assert.equal(ofxMatchesAccount(a, conta), true)
    // conta sem o dígito embutido (ACCTID = só o número) também bate
    const semDv = parseOfxAccount('<ACCTID>0012345')
    assert.ok(semDv !== null && ofxMatchesAccount(semDv, conta))
  })

  it('ofxMatchesAccount: NÃO bate quando o número da conta é outro (aplicação × corrente)', () => {
    const outra = parseOfxAccount('<BANKID>001\n<ACCTID>99887766')
    assert.ok(outra !== null)
    assert.equal(ofxMatchesAccount(outra, conta), false)
  })

  it('ofxMatchesAccount: NÃO bate quando o banco é outro', () => {
    const outroBanco = parseOfxAccount('<BANKID>237\n<ACCTID>00123457')
    assert.ok(outroBanco !== null)
    assert.equal(ofxMatchesAccount(outroBanco, conta), false)
  })

  it('ofxAccountLabel formata "001 · Ag 1234 · CC 00123457"', () => {
    const a = parseOfxAccount(ofx)
    assert.ok(a !== null)
    assert.equal(ofxAccountLabel(a), '001 · Ag 1234 · CC 00123457')
  })
})

describe('conciliação em lote por padrão (findSimilarPending / isBatchableManualType)', () => {
  const tx = (
    over: Partial<StatementTransaction> & Pick<StatementTransaction, 'id'>,
  ): StatementTransaction => ({
    fitid: '',
    date: '2026-06-03',
    movement: 'Debit',
    entryType: 'FEE',
    payeeName: 'Tarifa bancária',
    memo: '',
    valueCents: '590',
    balanceAfterCents: '0',
    reconciliationStatus: 'Pending',
    ...over,
  })

  it('isBatchableManualType: só tipos sem conta de destino', () => {
    assert.equal(isBatchableManualType('FeePenaltyInterest'), true)
    assert.equal(isBatchableManualType('Payment'), true)
    assert.equal(isBatchableManualType('Receipt'), true)
    assert.equal(isBatchableManualType('Transfer'), false)
    assert.equal(isBatchableManualType('Investment'), false)
    assert.equal(isBatchableManualType('Redemption'), false)
  })

  it('findSimilarPending: pendentes com mesma descrição (normalizada) + mesmo sinal; exclui semente/conciliadas', () => {
    const txs = [
      tx({ id: 'seed' }),
      tx({ id: 'a', payeeName: 'TARIFA  BANCÁRIA' }), // mesma após normalizar
      tx({ id: 'b', reconciliationStatus: 'Reconciled' }), // já conciliada
      tx({ id: 'c', movement: 'Credit' }), // sinal diferente
      tx({ id: 'd', payeeName: 'Outra coisa' }), // descrição diferente
    ]
    const found = findSimilarPending(txs, normalizeDesc('Tarifa bancária'), 'Debit', 'seed')
    assert.deepEqual(
      found.map((t) => t.id),
      ['a'],
    )
  })
})

describe('agrupamento por PERFIL de tarifa (matchFeeLike / isFeeLikeTransaction)', () => {
  const ft = (
    over: Partial<StatementTransaction> & Pick<StatementTransaction, 'id'>,
  ): StatementTransaction => ({
    fitid: '',
    date: '2026-07-05',
    movement: 'Debit',
    entryType: 'Other',
    payeeName: 'Tarifa bancaria mensal',
    memo: '',
    valueCents: '1500',
    balanceAfterCents: '0',
    reconciliationStatus: 'Pending',
    ...over,
  })

  it('isFeeLikeTransaction: detecta tarifa/IOF/juros/multa no tipo/descrição/memo', () => {
    assert.equal(
      isFeeLikeTransaction(ft({ id: '1', payeeName: 'Banco Tarifas', memo: 'Tarifa de manutenção' })),
      true,
    )
    assert.equal(isFeeLikeTransaction(ft({ id: '2', payeeName: 'X', memo: '', entryType: 'FEE' })), true)
    assert.equal(isFeeLikeTransaction(ft({ id: '3', payeeName: 'Cobrança IOF' })), true)
    assert.equal(
      isFeeLikeTransaction(
        ft({ id: '4', payeeName: 'Fornecedor X', memo: 'Pagamento NF', entryType: 'TED' }),
      ),
      false,
    )
  })

  it('findSimilarPending matchFeeLike: tarifa agrupa por perfil (descrição diferente com cara de tarifa)', () => {
    const txs = [
      ft({ id: 'seed' }),
      ft({ id: 'a' }), // descrição idêntica
      ft({ id: 'b', payeeName: 'Banco Tarifas', memo: 'Tarifa de manutenção' }), // fee-like, desc diferente
      ft({ id: 'c', payeeName: 'Fornecedor X', memo: 'Pagamento NF', entryType: 'TED' }), // NÃO fee-like
    ]
    const key = normalizeDesc('Tarifa bancaria mensal')
    // sem matchFeeLike → só a idêntica
    assert.deepEqual(
      findSimilarPending(txs, key, 'Debit', 'seed').map((t) => t.id),
      ['a'],
    )
    // com matchFeeLike → idêntica + fee-like (b); fornecedor (c) fica de fora
    assert.deepEqual(
      findSimilarPending(txs, key, 'Debit', 'seed', true).map((t) => t.id),
      ['a', 'b'],
    )
  })
})

describe('relabel temporário de categorias (relabelReconCategory)', () => {
  it('renomeia as 3 categorias pedidas pela P.O.', () => {
    assert.equal(relabelReconCategory('Ajuste de conciliação'), 'Transferência entre contas')
    assert.equal(relabelReconCategory('Estorno'), 'Resgate')
    assert.equal(relabelReconCategory('Aluguel'), 'Aplicação')
  })
  it('mantém as demais categorias intactas', () => {
    assert.equal(relabelReconCategory('Tarifas bancárias'), 'Tarifas bancárias')
    assert.equal(relabelReconCategory('Doações'), 'Doações')
    assert.equal(relabelReconCategory(''), '')
  })
})

describe('fluxo contínuo: nextPendingWithMatch + tituloLabel', () => {
  it('nextPendingWithMatch: próxima pendente COM match (prefere alta, cíclico, exclui sem-palpite/conciliada)', () => {
    const txs = [
      tx({ id: 'a' }),
      tx({ id: 'b' }),
      tx({ id: 'c' }),
      tx({ id: 'd', reconciliationStatus: 'Reconciled' }),
    ]
    const guesses = new Map<string, { band: 'alta' | 'media' }>([
      ['b', { band: 'media' }],
      ['c', { band: 'alta' }],
      ['d', { band: 'alta' }],
    ])
    assert.equal(nextPendingWithMatch(txs, guesses, 'a'), 'c') // prefere 'alta' (c); 'd' está conciliada
    assert.equal(nextPendingWithMatch(txs, new Map([['b', { band: 'media' as const }]]), 'a'), 'b') // sem alta → media
    assert.equal(nextPendingWithMatch(txs, new Map(), 'a'), null) // ninguém com palpite
    assert.equal(nextPendingWithMatch(txs, new Map([['a', { band: 'alta' as const }]]), 'a'), null) // só a própria
  })
  it('tituloLabel: "Tipo Número"; vazio quando null/sem dados', () => {
    const mkPayable = (over: Partial<PaidPayable>): PaidPayable => ({
      id: 'p',
      documentId: 'd',
      valueCents: '0',
      dueDate: '2026-06-01',
      paidAt: null,
      paymentMethod: '',
      supplierName: null,
      documentNumber: null,
      category: null,
      documentType: null,
      ...over,
    })
    assert.equal(
      tituloLabel(mkPayable({ documentType: 'NFS-e', documentNumber: '2024-0537' })),
      'NFS-e 2024-0537',
    )
    // só número (sem tipo) → número
    assert.equal(tituloLabel(mkPayable({ documentNumber: '456456' })), '456456')
    // sem número (gap #172) → cai no fornecedor
    assert.equal(tituloLabel(mkPayable({ supplierName: 'Receita Federal' })), 'Receita Federal')
    // sem nada → "" (a barra mostra só o valor)
    assert.equal(tituloLabel(mkPayable({})), '')
    assert.equal(tituloLabel(null), '')
  })
})

describe('formatDateDash', () => {
  it('ISO → dd-mm-aaaa', () => {
    assert.equal(formatDateDash('2026-05-18'), '18-05-2026')
  })
  it('null → travessão', () => {
    assert.equal(formatDateDash(null), '—')
  })
  it('vazio → travessão', () => {
    assert.equal(formatDateDash(''), '—')
  })
})
