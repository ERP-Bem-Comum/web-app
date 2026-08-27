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
  extratoTypeTag,
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
  matchDocFromItem,
  centsToBRL,
  filterPayables,
  parseBRLToCents,
  centsToAmountInput,
  dateInRange,
  valueInRange,
  RECON_DOCUMENT_TYPE_OPTIONS,
  INITIAL_MULTI_FILTER,
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
  engineTarget,
  tituloLabel,
  formatDateDash,
  formatDayHeader,
  deriveManualKindFromTx,
  matchAuditFromLookup,
  deleteStatementErrorTag,
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

  it('clear-statement zera o statement e a seleção (extrato excluído, core-api#558)', () => {
    const withStatement = workspaceReducer(
      workspaceReducer(initialWorkspaceUiState, { type: 'set-statement', statementId: 'st-1' }),
      { type: 'select-transaction', id: 't1' },
    )
    assert.equal(withStatement.statementId, 'st-1')
    const cleared = workspaceReducer(withStatement, { type: 'clear-statement' })
    assert.equal(cleared.statementId, null)
    assert.equal(cleared.selectedTransactionId, null)
  })

  it('não muta o estado anterior (imutável)', () => {
    const next = workspaceReducer(initialWorkspaceUiState, { type: 'set-tab', tab: 'extrato' })
    assert.notEqual(next, initialWorkspaceUiState)
    assert.equal(initialWorkspaceUiState.activeTab, 'conciliacao')
  })
})

describe('deleteStatementErrorTag (exclusão do extrato, core-api#558)', () => {
  it('period-closed vira mensagem ACIONÁVEL de exclusão (reabra o período)', () => {
    assert.equal(
      deleteStatementErrorTag('period-closed'),
      'financial.recon.deleteStatement.error.periodClosed',
    )
  })

  it('conciliadas usa a tag própria (já acionável)', () => {
    assert.equal(
      deleteStatementErrorTag('statement-has-reconciled-transactions'),
      'financial.recon.error.statement-has-reconciled-transactions',
    )
  })

  it('demais erros caem no reconciliationErrorTag comum', () => {
    assert.equal(deleteStatementErrorTag('server'), 'financial.recon.error.server')
    assert.equal(deleteStatementErrorTag('forbidden'), 'financial.recon.error.forbidden')
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
    convenio: '',
    document: '48517263000190',
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
      nameTag: null,
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

  it('match 1:1: "Valor conciliado" acende do lookup (singleMatchValueCents) mesmo sem doc', () => {
    const v = matchDetailsView(base, null, null, null, false, null, null, '48550')
    assert.equal(v.doc.valueBRL, centsToBRL('48550'))
    // os demais campos do título seguem "—" até o enriquecimento (#172)
    assert.equal(v.doc.documento, '—')
    assert.equal(v.doc.categoria, '—')
  })

  it('singleMatchValueCents é ignorado em lançamento manual (usa o valor do tx)', () => {
    const v = matchDetailsView(base, null, null, null, true, null, null, '48550')
    assert.equal(v.doc.valueBRL, centsToBRL('95000'))
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
      lines: [{ valueBRL: 'R$ 300,00', name: 'Fornecedor A', nameTag: null, documento: 'NF-1' }],
      differenceBRL: null,
      differenceTag: '',
      totalBRL: 'R$ 742,00',
    }
    const v = matchDetailsView(base, null, null, multi)
    assert.equal(v.multi?.count, 3)
    assert.equal(v.multi?.totalBRL, 'R$ 742,00')
  })

  it('#554/#555: categoria do lookup acende a linha "Categoria" (lançamento manual)', () => {
    const v = matchDetailsView(base, null, null, null, true, null, null, null, 'Serviços / Consultoria')
    assert.equal(v.doc.categoria, 'Serviços / Consultoria')
  })

  it('#554/#555: categoria do lookup sobrepõe o "—" do doc (título 1:1)', () => {
    const doc = {
      name: 'NF 0847',
      nameTag: null,
      documento: '0847',
      vencimento: '10/06/2026',
      categoria: '—',
      valueBRL: 'R$ 950,00',
    }
    const v = matchDetailsView(base, doc, null, null, false, null, null, null, 'Imposto / ISS')
    assert.equal(v.doc.categoria, 'Imposto / ISS')
    assert.equal(v.doc.documento, '0847') // demais campos do doc preservados
  })

  it('#554/#555: categoria null/vazia mantém "—"', () => {
    assert.equal(matchDetailsView(base, null, null, null, true, null, null, null, null).doc.categoria, '—')
    assert.equal(matchDetailsView(base, null, null, null, true, null, null, null, '').doc.categoria, '—')
  })
})

describe('matchAuditFromLookup (#207 — "Por" mostra nome, não UUID)', () => {
  const base = {
    reconciliationId: 'rec1',
    transactionId: 't1',
    type: 'Individual' as const,
    status: 'Active' as const,
    reconciledBy: 'c562bc57-0000-0000-0000-000000000000',
    reconciledAt: '2026-06-21T13:45:00.000Z',
    differenceCents: null,
    category: null,
    items: [],
  }

  it('usa reconciledByName quando resolvido pelo core-api (preferido sobre o id cru)', () => {
    const audit = matchAuditFromLookup({ ...base, reconciledByName: 'Alessandra Castro' })
    assert.equal(audit.who, 'Alessandra Castro')
    assert.equal(audit.when, formatDayHeader('2026-06-21'))
  })

  it('cai no id cru (fallback) enquanto reconciledByName vier null (não-resolvido)', () => {
    const audit = matchAuditFromLookup({ ...base, reconciledByName: null })
    assert.equal(audit.who, 'c562bc57-0000-0000-0000-000000000000')
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
      reconciledByName: null,
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

  it('#357: linhas surfam favorecido + nº do documento do item enriquecido', () => {
    const enriched = (items: readonly unknown[]) =>
      ({
        reconciliationId: 'rec1',
        transactionId: 't1',
        type: 'Multiple' as const,
        status: 'Active' as const,
        reconciledBy: 'u1',
        reconciledByName: null,
        reconciledAt: '2026-06-21T00:00:00.000Z',
        differenceCents: null,
        items,
      }) as Parameters<typeof buildMatchTitles>[0]
    const r = buildMatchTitles(
      enriched([
        {
          payableId: 'p1',
          reconciledValueCents: '30000',
          documentNumber: 'NFS-e 2024-0537',
          supplierName: 'TS Da Silva Serviços Ltda',
          dueDate: '2026-06-10',
          retentionType: null,
        },
        // sem favorecido → cai no nº do documento; sem doc → cai no payableId
        {
          payableId: 'p2',
          reconciledValueCents: '20000',
          documentNumber: 'DOC-9',
          supplierName: null,
          dueDate: null,
          retentionType: null,
        },
      ]),
      '50000',
    )
    assert.equal(r?.lines[0]?.name, 'TS Da Silva Serviços Ltda')
    assert.equal(r?.lines[0]?.nameTag, null)
    assert.equal(r?.lines[0]?.documento, 'NFS-e 2024-0537')
    assert.equal(r?.lines[1]?.name, 'DOC-9')
    assert.equal(r?.lines[1]?.documento, 'DOC-9')
  })

  it('#357: imposto retido → headline da linha é o ÓRGÃO (nameTag), não o fornecedor do pai', () => {
    const enriched = (items: readonly unknown[]) =>
      ({
        reconciliationId: 'rec1',
        transactionId: 't1',
        type: 'Multiple' as const,
        status: 'Active' as const,
        reconciledBy: 'u1',
        reconciledByName: null,
        reconciledAt: '2026-06-21T00:00:00.000Z',
        differenceCents: null,
        items,
      }) as Parameters<typeof buildMatchTitles>[0]
    const r = buildMatchTitles(
      enriched([
        {
          payableId: 'p1',
          reconciledValueCents: '30000',
          documentNumber: '3500',
          supplierName: 'Serraria Bom Jesus LTDA',
          dueDate: '2026-06-30',
          retentionType: 'ISS',
        },
        {
          payableId: 'p2',
          reconciledValueCents: '1000',
          documentNumber: '3500',
          supplierName: 'Serraria Bom Jesus LTDA',
          dueDate: '2026-06-30',
          retentionType: 'IRRF',
        },
      ]),
      '31000',
    )
    assert.equal(r?.lines[0]?.nameTag, 'financial.recon.pending.agency.iss') // ISS → SEFIN
    assert.equal(r?.lines[1]?.nameTag, 'financial.recon.pending.agency.federal') // federais → Receita
  })
})

describe('matchDocFromItem (título individual enriquecido no BFF — interim #172)', () => {
  it('null quando item é null (cai no default "—" da view)', () => {
    assert.equal(matchDocFromItem(null, '150000'), null)
  })

  it('item resolvido: favorecido + documento + vencimento formatado + valor conciliado; categoria "—"', () => {
    const doc = matchDocFromItem(
      {
        payableId: 'pay-1',
        reconciledValueCents: '150000',
        documentNumber: 'NFS-e 2024-0537',
        supplierName: 'TS Da Silva Serviços Ltda',
        dueDate: '2026-06-10',
        retentionType: null,
      },
      '150000',
    )
    assert.equal(doc?.name, 'TS Da Silva Serviços Ltda')
    assert.equal(doc?.nameTag, null) // título-pai → sem tag de órgão
    assert.equal(doc?.documento, 'NFS-e 2024-0537')
    // dueDate ISO é formatado com o mesmo formatDayHeader do resto do arquivo.
    assert.equal(doc?.vencimento, formatDayHeader('2026-06-10'))
    assert.equal(doc?.valueBRL, centsToBRL('150000'))
    // Categoria NÃO vem do core-api (category_ref write-only) — sempre "—".
    assert.equal(doc?.categoria, '—')
  })

  it('sem favorecido: headline cai no nº do documento; sem doc: cai no payableId', () => {
    const byDoc = matchDocFromItem(
      {
        payableId: 'pay-2',
        reconciledValueCents: '5000',
        documentNumber: 'DOC-9',
        supplierName: null,
        dueDate: null,
        retentionType: null,
      },
      '5000',
    )
    assert.equal(byDoc?.name, 'DOC-9')

    const byId = matchDocFromItem(
      {
        payableId: 'pay-3',
        reconciledValueCents: '5000',
        documentNumber: null,
        supplierName: null,
        dueDate: null,
        retentionType: null,
      },
      '5000',
    )
    assert.equal(byId?.name, 'pay-3')
  })

  it('imposto retido: favorecido é o ÓRGÃO (nameTag), não o fornecedor do documento-pai', () => {
    const iss = matchDocFromItem(
      {
        payableId: 'pay-iss',
        reconciledValueCents: '2300',
        documentNumber: '3500',
        supplierName: 'Serraria Bom Jesus LTDA', // fornecedor do PAI — NÃO deve virar o headline
        dueDate: '2026-06-30',
        retentionType: 'ISS',
      },
      '2300',
    )
    // A tag do órgão dirige o headline; ISS → SEFIN (município).
    assert.equal(iss?.nameTag, 'financial.recon.pending.agency.iss')

    const irrf = matchDocFromItem(
      {
        payableId: 'pay-irrf',
        reconciledValueCents: '1000',
        documentNumber: '3500',
        supplierName: 'Serraria Bom Jesus LTDA',
        dueDate: '2026-06-30',
        retentionType: 'IRRF',
      },
      '1000',
    )
    assert.equal(irrf?.nameTag, 'financial.recon.pending.agency.federal') // federais → Receita Federal
  })

  it('campos null → documento/vencimento "—"; valueCents null → valor "—"', () => {
    const doc = matchDocFromItem(
      {
        payableId: 'pay-4',
        reconciledValueCents: '0',
        documentNumber: null,
        supplierName: 'Fornecedor X',
        dueDate: null,
        retentionType: null,
      },
      null,
    )
    assert.equal(doc?.documento, '—')
    assert.equal(doc?.vencimento, '—')
    assert.equal(doc?.valueBRL, '—')
  })
})

describe('deriveManualKindFromTx (tipo do lançamento manual pelo texto — #268)', () => {
  const k = (payeeName: string, entryType = 'Other') =>
    deriveManualKindFromTx(tx({ id: 'm', payeeName, entryType }))

  it('Resgate vence Aplicação ("resgate de aplicação")', () => {
    assert.equal(k('Resgate automatico aplicacao para pagamentos'), 'Redemption')
    assert.equal(k('Resgate enviado para conta corrente'), 'Redemption')
  })
  it('Tarifa vence Transferência ("tarifa de transferência")', () => {
    assert.equal(k('Tarifa transferencia interna'), 'FeePenaltyInterest')
    assert.equal(k('Tarifa bancaria mensal'), 'FeePenaltyInterest')
  })
  it('Aplicação', () => {
    assert.equal(k('Aplicacao recebida da conta corrente'), 'Investment')
  })
  it('Transferência (sem tarifa)', () => {
    assert.equal(k('Transferencia para fornecedor'), 'Transfer')
    assert.equal(k('TED enviada'), 'Transfer')
  })
  it('Pagamento (fornecedor/DANFE/boleto)', () => {
    assert.equal(k('Fornecedor Persist B'), 'Payment')
    assert.equal(k('DANFE 43545 - Padaria Bartolomeu LTDA'), 'Payment')
  })
  it('sem casamento → null (cai no genérico "Nova transação")', () => {
    assert.equal(k('Movimento diverso'), null)
  })
})

describe('Buscar/Criar vários — filtros RICOS (056: filterPayables por objeto de critérios)', () => {
  const pay = (over: Partial<PaidPayable> & Pick<PaidPayable, 'id'>): PaidPayable => ({
    documentId: 'd',
    valueCents: '1000',
    dueDate: '2026-05-10',
    issueDate: '2026-05-01',
    paidAt: null,
    paymentMethod: 'PIX',
    supplierName: 'TS Da Silva',
    documentNumber: 'NFS-0001',
    category: 'Serviços / Consultoria',
    documentType: 'NFS-e',
    ...over,
  })
  // Constrói um MultiFilter completo a partir de overrides (defaults = neutro).
  const mkFilter = (over: Partial<typeof INITIAL_MULTI_FILTER> = {}) => ({
    ...INITIAL_MULTI_FILTER,
    ...over,
  })
  // Impostos retidos: em PRODUÇÃO o tipo vem em `retentionType` (enriquecido no BFF), com `documentType` null
  // (core-api#172) — NÃO em `documentType`. Os fixtures refletem isso.
  const list = [
    pay({ id: 'a' }),
    pay({
      id: 'b',
      documentNumber: 'ISS retido',
      category: 'Imposto / ISS',
      documentType: null,
      retentionType: 'ISS',
    }),
    pay({
      id: 'c',
      documentNumber: 'IRRF retido',
      category: 'Imposto / IRRF',
      documentType: null,
      retentionType: 'IRRF',
    }),
    pay({ id: 'd', documentType: null }),
    pay({
      id: 'e',
      documentNumber: 'INSS retido',
      category: 'Imposto / INSS',
      documentType: null,
      retentionType: 'INSS',
    }),
  ]

  it('RECON_DOCUMENT_TYPE_OPTIONS = lista canônica de documento + impostos retidos (inclui IRRF/CSRF)', () => {
    assert.ok(RECON_DOCUMENT_TYPE_OPTIONS.includes('NFS-e'))
    assert.ok(RECON_DOCUMENT_TYPE_OPTIONS.includes('IRRF'))
    assert.ok(RECON_DOCUMENT_TYPE_OPTIONS.includes('CSRF'))
    assert.ok(RECON_DOCUMENT_TYPE_OPTIONS.includes('ISS'))
  })

  it('filtra imposto retido por retentionType (IRRF/ISS/INSS) e por busca textual', () => {
    assert.deepEqual(
      filterPayables(list, mkFilter({ documentType: 'IRRF' })).map((p) => p.id),
      ['c'],
    )
    assert.deepEqual(
      filterPayables(list, mkFilter({ documentType: 'ISS' })).map((p) => p.id),
      ['b'],
    )
    // O caso do usuário: filtrar por INSS acha o imposto (casa por retentionType, não documentType).
    assert.deepEqual(
      filterPayables(list, mkFilter({ documentType: 'INSS' })).map((p) => p.id),
      ['e'],
    )
    assert.deepEqual(
      filterPayables(list, mkFilter({ search: 'iss' })).map((p) => p.id),
      ['b'],
    )
    assert.deepEqual(
      filterPayables(list, mkFilter()).map((p) => p.id),
      ['a', 'b', 'c', 'd', 'e'],
    )
  })

  it('tipo de DOCUMENTO (NFS-e) casa por documentType (segue null até core-api#172)', () => {
    // Fixture 'a' tem documentType 'NFS-e' → casa; um imposto (retentionType, documentType null) NÃO casa 'NFS-e'.
    assert.deepEqual(
      filterPayables(list, mkFilter({ documentType: 'NFS-e' })).map((p) => p.id),
      ['a'],
    )
  })

  it('dateInRange: comparação por string, bordas inclusivas, lado vazio = aberto', () => {
    assert.equal(dateInRange('2026-06-10', '2026-06-01', '2026-06-30'), true)
    assert.equal(dateInRange('2026-06-01', '2026-06-01', '2026-06-30'), true) // borda inferior
    assert.equal(dateInRange('2026-06-30', '2026-06-01', '2026-06-30'), true) // borda superior
    assert.equal(dateInRange('2026-07-01', '2026-06-01', '2026-06-30'), false)
    assert.equal(dateInRange('2026-06-10', '', '2026-06-30'), true) // sem inferior
    assert.equal(dateInRange('2026-06-10', '2026-06-01', ''), true) // sem superior
  })

  it('filtra por Período — por VENCIMENTO (due) — client-side', () => {
    const byDue = [
      pay({ id: 'mai', dueDate: '2026-05-20', issueDate: '2026-04-01' }),
      pay({ id: 'jun', dueDate: '2026-06-10', issueDate: '2026-05-01' }),
    ]
    assert.deepEqual(
      filterPayables(byDue, mkFilter({ period: { field: 'due', from: '2026-06-01', to: '2026-06-30' } })).map(
        (p) => p.id,
      ),
      ['jun'],
    )
    // Lado aberto (só "de"): pega jun em diante.
    assert.deepEqual(
      filterPayables(byDue, mkFilter({ period: { field: 'due', from: '2026-06-01', to: '' } })).map(
        (p) => p.id,
      ),
      ['jun'],
    )
  })

  it('filtra por Período — por EMISSÃO (issue); issueDate null fica FORA quando há intervalo', () => {
    const byIssue = [
      pay({ id: 'i-abr', dueDate: '2026-06-10', issueDate: '2026-04-15' }),
      pay({ id: 'i-mai', dueDate: '2026-06-11', issueDate: '2026-05-15' }),
      pay({ id: 'i-null', dueDate: '2026-06-12', issueDate: null }),
    ]
    assert.deepEqual(
      filterPayables(
        byIssue,
        mkFilter({ period: { field: 'issue', from: '2026-05-01', to: '2026-05-31' } }),
      ).map((p) => p.id),
      ['i-mai'],
    )
    // Sem intervalo (from/to vazios) → o null NÃO é excluído (filtro de emissão inativo).
    assert.deepEqual(
      filterPayables(byIssue, mkFilter({ period: { field: 'issue', from: '', to: '' } })).map((p) => p.id),
      ['i-abr', 'i-mai', 'i-null'],
    )
  })

  it('valueInRange + filtra por Valor (min/max em centavos) — bordas inclusivas', () => {
    assert.equal(valueInRange(10000, 10000, 100000), true) // borda inferior
    assert.equal(valueInRange(100000, 10000, 100000), true) // borda superior
    assert.equal(valueInRange(9999, 10000, null), false)
    assert.equal(valueInRange(5000, null, null), true) // sem limites
    const byValue = [
      pay({ id: 'baixo', valueCents: '9999' }),
      pay({ id: 'cem', valueCents: '10000' }),
      pay({ id: 'medio', valueCents: '250000' }),
      pay({ id: 'alto', valueCents: '1500000' }),
    ]
    // [R$ 100, R$ 10.000] = [10000, 1000000] centavos → cem + medio.
    assert.deepEqual(
      filterPayables(byValue, mkFilter({ value: { minCents: 10000, maxCents: 1000000 } })).map((p) => p.id),
      ['cem', 'medio'],
    )
    // Só mínimo (R$ 1.000 = 100000): medio (R$ 2.500) + alto (R$ 15.000).
    assert.deepEqual(
      filterPayables(byValue, mkFilter({ value: { minCents: 100000, maxCents: null } })).map((p) => p.id),
      ['medio', 'alto'],
    )
  })

  it('composição dos 4 critérios (busca + tipo + período + valor)', () => {
    const composed = [
      pay({
        id: 'hit',
        documentType: 'NFS-e',
        dueDate: '2026-06-10',
        valueCents: '50000',
        supplierName: 'Alpha',
      }),
      pay({
        id: 'wrongType',
        documentType: 'ISS',
        dueDate: '2026-06-10',
        valueCents: '50000',
        supplierName: 'Alpha',
      }),
      pay({
        id: 'wrongDate',
        documentType: 'NFS-e',
        dueDate: '2026-07-10',
        valueCents: '50000',
        supplierName: 'Alpha',
      }),
      pay({
        id: 'wrongValue',
        documentType: 'NFS-e',
        dueDate: '2026-06-10',
        valueCents: '5000',
        supplierName: 'Alpha',
      }),
      pay({
        id: 'wrongSearch',
        documentType: 'NFS-e',
        dueDate: '2026-06-10',
        valueCents: '50000',
        supplierName: 'Beta',
      }),
    ]
    assert.deepEqual(
      filterPayables(
        composed,
        mkFilter({
          search: 'alpha',
          documentType: 'NFS-e',
          period: { field: 'due', from: '2026-06-01', to: '2026-06-30' },
          value: { minCents: 10000, maxCents: 1000000 },
        }),
      ).map((p) => p.id),
      ['hit'],
    )
  })

  it('parseBRLToCents: PT (milhar/decimal), defensivo (vazio/inválido → null), inverso centsToAmountInput', () => {
    assert.equal(parseBRLToCents('1.234,56'), 123456)
    assert.equal(parseBRLToCents('100'), 10000)
    assert.equal(parseBRLToCents('100,5'), 10050)
    assert.equal(parseBRLToCents('R$ 2.000,00'), 200000)
    assert.equal(parseBRLToCents('1234.56'), 123456) // ponto decimal simples
    assert.equal(parseBRLToCents(''), null)
    assert.equal(parseBRLToCents('   '), null)
    assert.equal(parseBRLToCents('abc'), null)
    assert.equal(centsToAmountInput(123456), '1234,56')
    assert.equal(centsToAmountInput(10000), '100,00')
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
    // afterId inexistente ('') → varre do topo: 1ª pendente COM palpite (usado na auto-seleção ao entrar
    // em Conciliação — a aba Sugestão nunca abre vazia quando existe match).
    assert.equal(nextPendingWithMatch(txs, guesses, ''), 'c') // 'c' (alta) antes de 'b' (media)
    assert.equal(nextPendingWithMatch(txs, new Map([['b', { band: 'media' as const }]]), ''), 'b')
    assert.equal(nextPendingWithMatch(txs, new Map(), ''), null) // sem palpite → cai no topo (na binding)
  })
  it('tituloLabel: "Tipo Número"; vazio quando null/sem dados', () => {
    const mkPayable = (over: Partial<PaidPayable>): PaidPayable => ({
      id: 'p',
      documentId: 'd',
      valueCents: '0',
      dueDate: '2026-06-01',
      issueDate: null,
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

// ── Cascata Centro → Categoria → Subcategoria (EPIC #150) ──
import {
  topLevelCategories,
  subcategoriesOf,
  categoriesForCostCenter,
} from '../../../../../src/modules/financial/client/reconciliation-workspace/reconciliation-workspace.view-model.ts'
import type { FinancialReferences } from '../../../../../src/modules/financial/client/data/model/reconciliation.model.ts'

// A regra da cascata é PURA e mora no helper compartilhado (`data/helpers/categorization-cascade.ts`),
// onde vive a matriz completa de casos (`tests/.../data/categorization-cascade.test.ts`). Aqui só
// guardamos o RE-EXPORT que os call sites desta feature (`manual-entry.binding.ts`) usam — e que o
// placeholder round-robin (TODO core-api#341) NÃO voltou.
const REFS: FinancialReferences = {
  costCenters: [
    { id: 'cc-A', code: '01', name: 'Centro A' },
    { id: 'cc-B', code: '02', name: 'Centro B' },
  ],
  categories: [
    { id: 'cat-1', name: 'Cat 1', group: 'despesa', parentId: null, costCenterId: 'cc-A' },
    { id: 'cat-2', name: 'Cat 2', group: 'despesa', parentId: null, costCenterId: 'cc-B' },
    { id: 'sub-1a', name: 'Sub 1a', group: 'despesa', parentId: 'cat-1', costCenterId: 'cc-A' },
    { id: 'sub-1b', name: 'Sub 1b', group: 'despesa', parentId: 'cat-1', costCenterId: 'cc-A' },
  ],
}

describe('cascata categorização (re-export do helper compartilhado)', () => {
  it('topLevelCategories: só as sem parentId', () => {
    assert.deepEqual(
      topLevelCategories(REFS).map((c) => c.id),
      ['cat-1', 'cat-2'],
    )
  })
  it('subcategoriesOf: filhas por parentId; vazio se nenhuma categoria', () => {
    assert.deepEqual(
      subcategoriesOf(REFS, 'cat-1').map((c) => c.id),
      ['sub-1a', 'sub-1b'],
    )
    assert.deepEqual(subcategoriesOf(REFS, 'cat-2'), [])
    assert.deepEqual(subcategoriesOf(REFS, ''), [])
  })
  it('categoriesForCostCenter: filtra pelo costCenterId REAL (#341), não por partição de índice', () => {
    assert.deepEqual(
      categoriesForCostCenter(REFS, 'cc-A').map((c) => c.id),
      ['cat-1'],
    )
    assert.deepEqual(
      categoriesForCostCenter(REFS, 'cc-B').map((c) => c.id),
      ['cat-2'],
    )
  })
})

describe('extratoTypeTag (TIPO do extrato)', () => {
  it('tipo específico (PIX/TED/…) → null (a view mostra o entryType cru)', () => {
    assert.equal(extratoTypeTag(tx({ id: '1', entryType: 'TED', movement: 'Debit' })), null)
    assert.equal(extratoTypeTag(tx({ id: '2', entryType: 'PIX RECEBIDO', movement: 'Credit' })), null)
  })
  it('genérico ("Other") → direção do movimento (Entrada/Saída)', () => {
    assert.equal(
      extratoTypeTag(tx({ id: '3', entryType: 'Other', movement: 'Credit' })),
      'financial.recon.ext.type.entrada',
    )
    assert.equal(
      extratoTypeTag(tx({ id: '4', entryType: 'Other', movement: 'Debit' })),
      'financial.recon.ext.type.saida',
    )
  })
})

describe('engineTarget — motor de palpite (auto-navegar na aba Conciliação)', () => {
  const base = {
    onConciliacao: true,
    justEntered: false,
    guessesSettled: true,
    selectedId: 't1' as string | null,
    selectedIsMatch: true,
    firstMatchId: 'm1' as string | null,
    fallbackId: 'm1' as string | null,
  }
  it('fora da aba ou palpites não assentados → não mexe (null)', () => {
    assert.equal(engineTarget({ ...base, onConciliacao: false }), null)
    assert.equal(engineTarget({ ...base, guessesSettled: false }), null)
  })
  it('nada selecionado (load/novo extrato) → fallback (1º match ou topo)', () => {
    assert.equal(engineTarget({ ...base, selectedId: null, fallbackId: 'm1' }), 'm1')
    assert.equal(engineTarget({ ...base, selectedId: null, firstMatchId: null, fallbackId: 'topo' }), 'topo')
  })
  it('ENTROU na aba fora de um match → vai pro próximo COM palpite', () => {
    assert.equal(
      engineTarget({ ...base, justEntered: true, selectedIsMatch: false, firstMatchId: 'm2' }),
      'm2',
    )
  })
  it('ENTROU na aba já num match → respeita (null)', () => {
    assert.equal(engineTarget({ ...base, justEntered: true, selectedIsMatch: true }), null)
  })
  it('ENTROU na aba fora de match mas NÃO há match → não mexe (null)', () => {
    assert.equal(
      engineTarget({ ...base, justEntered: true, selectedIsMatch: false, firstMatchId: null }),
      null,
    )
  })
  it('DENTRO da aba (navegando à mão) fora de um match → respeita a escolha (null)', () => {
    assert.equal(engineTarget({ ...base, justEntered: false, selectedIsMatch: false }), null)
  })
})

import { manualEntryBlockedTag } from '../../../../../src/modules/financial/client/reconciliation-workspace/reconciliation-workspace.view-model.ts'
import { ptBR } from '../../../../../src/shared/i18n/catalog.pt-BR.ts'

// ─────────────────────────────────────────────────────────────────────────────
// Classificação obrigatória ao conciliar lançamento manual (#331 + core-api#671).
// O `canSubmit` da view é `manualEntryBlockedTag(...) === null`, então estes casos fixam AS DUAS coisas:
// quando trava e o que a pessoa lê. A isenção é a parte frágil — se `requiresDestination` mudar, a
// divergência com o backend (`isCapitalReallocation`) passaria calada sem estes testes.
describe('manualEntryBlockedTag — classificação obrigatória', () => {
  const ok = {
    hasType: true,
    needsDestination: false,
    destinationFilled: false,
    needsClassification: true,
    categoryFilled: true,
    costCenterFilled: true,
  }

  it('tudo preenchido → libera (null)', () => {
    assert.equal(manualEntryBlockedTag(ok), null)
  })

  it('sem tipo → cobra o tipo antes de qualquer campo', () => {
    assert.equal(
      manualEntryBlockedTag({ ...ok, hasType: false, categoryFilled: false, costCenterFilled: false }),
      'financial.recon.manual.blocked.type',
    )
  })

  it('realocação (Transferência/Aplicação/Resgate) é ISENTA de classificação', () => {
    // Espelha `isCapitalReallocation` do core-api: circula entre contas próprias, não classifica.
    assert.equal(
      manualEntryBlockedTag({
        ...ok,
        needsDestination: true,
        destinationFilled: true,
        needsClassification: false,
        categoryFilled: false,
        costCenterFilled: false,
      }),
      null,
    )
  })

  it('realocação sem conta de destino → cobra o destino, não a classificação', () => {
    assert.equal(
      manualEntryBlockedTag({
        ...ok,
        needsDestination: true,
        destinationFilled: false,
        needsClassification: false,
      }),
      'financial.recon.manual.blocked.destination',
    )
  })

  it('classificável sem NENHUM dos dois → mensagem única (não faz a pessoa resolver em duas rodadas)', () => {
    assert.equal(
      manualEntryBlockedTag({ ...ok, categoryFilled: false, costCenterFilled: false }),
      'financial.recon.manual.blocked.classification',
    )
  })

  it('classificável só sem categoria → nomeia a categoria', () => {
    assert.equal(
      manualEntryBlockedTag({ ...ok, categoryFilled: false }),
      'financial.recon.manual.blocked.category',
    )
  })

  it('classificável só sem centro de custo → nomeia o centro de custo', () => {
    assert.equal(
      manualEntryBlockedTag({ ...ok, costCenterFilled: false }),
      'financial.recon.manual.blocked.costCenter',
    )
  })

  it('todo motivo é uma tag EXISTENTE no catálogo (senão a UI mostra a chave crua)', () => {
    const casos = [
      { ...ok, hasType: false },
      { ...ok, needsDestination: true, destinationFilled: false },
      { ...ok, categoryFilled: false, costCenterFilled: false },
      { ...ok, categoryFilled: false },
      { ...ok, costCenterFilled: false },
    ]
    for (const c of casos) {
      const tag = manualEntryBlockedTag(c)
      assert.ok(tag !== null)
      assert.ok(tag in ptBR, `tag ausente no catálogo: ${tag}`)
    }
  })
})

import {
  statementMemoDetail,
  statementPartyLabel,
} from '../../../../../src/modules/financial/client/reconciliation-workspace/reconciliation-workspace.view-model.ts'

describe('favorecido do extrato no card de match (statementPartyLabel / statementMemoDetail)', () => {
  it('usa o payeeName quando o banco o preenche', () => {
    const tx = { payeeName: 'RECEITA FEDERAL', memo: 'PAGTO GUIA' }
    assert.equal(statementPartyLabel(tx), 'RECEITA FEDERAL')
    assert.equal(statementMemoDetail(tx), 'PAGTO GUIA')
  })

  it('cai no memo quando o OFX/CSV não traz payeeName (card ficava sem identificação)', () => {
    const tx = { payeeName: '   ', memo: 'PAGTO GUIA - RECEITA FEDERAL' }
    assert.equal(statementPartyLabel(tx), 'PAGTO GUIA - RECEITA FEDERAL')
    // O memo virou o rótulo → não se repete como complemento.
    assert.equal(statementMemoDetail(tx), '')
  })

  it('sem payeeName nem memo → vazio (a view decide o traço)', () => {
    assert.equal(statementPartyLabel({ payeeName: '', memo: '' }), '')
    assert.equal(statementMemoDetail({ payeeName: '', memo: '' }), '')
  })

  it('memo que só repete o payeeName (case/espaço) não vira complemento', () => {
    assert.equal(statementMemoDetail({ payeeName: 'Tarifa Bancária', memo: 'TARIFA  BANCÁRIA' }), '')
  })
})
