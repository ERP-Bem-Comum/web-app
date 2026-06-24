/**
 * View-model do workspace de Conciliação (§XI: lógica fora da view; sem React). UI-state como máquina
 * tagged + reducer PURO (testável em node:test) e derivações puras (agrupar por dia, filtro, ícone por
 * `entryType`, progresso, rótulos). As queries de dados entram via o binding. Espelha o padrão de
 * `contas-a-pagar.view-model.ts` (derivação pura) + reducer de UI-state.
 */
import type {
  AccountStatementPeriod,
  Movement,
  PaidPayable,
  ReconciliationAccount,
  ReconciliationPeriod,
  StatementTransaction,
  TransactionReconciliation,
} from '#modules/financial/client/data/model/reconciliation.model.ts'
import { centsToBRL, centsToReais } from '#modules/financial/client/data/money.ts'

// Re-export p/ as views (ui) formatarem dinheiro sem importar de client/data (boundary §I).
export { centsToBRL, centsToReais }

// Re-export dos tipos de model p/ as views tiparem sem importar de client/data (boundary §I).
export type {
  StatementTransaction,
  BankStatementImport,
  Movement,
  PaidPayable,
  ReconciliationAccount,
  ReconciliationPeriod,
  ExportFormat,
  DifferenceTreatment,
  ManualEntryType,
} from '#modules/financial/client/data/model/reconciliation.model.ts'

// ── UI-state (server-state ≠ UI-state, §XI) ─────────────────────────────────────
export type WorkspaceTab = 'extrato' | 'conciliacao'
export type ListFilter = 'pendentes' | 'conciliadas' | 'todas'
export type AssocTab = 'sugestao' | 'nova' | 'multi'
export type ExtratoFilter = 'todos' | 'entradas' | 'saidas' | 'conciliados' | 'pendentes'

export type WorkspaceUiState = Readonly<{
  activeTab: WorkspaceTab
  showGuesses: boolean
  listFilter: ListFilter
  selectedTransactionId: string | null
  assocTab: AssocTab
  extratoFilter: ExtratoFilter
  // statementId do extrato importado nesta sessão (não há endpoint p/ listar extratos → ephemeral).
  statementId: string | null
}>

export const initialWorkspaceUiState: WorkspaceUiState = {
  activeTab: 'conciliacao',
  showGuesses: true,
  listFilter: 'pendentes',
  selectedTransactionId: null,
  assocTab: 'sugestao',
  extratoFilter: 'todos',
  statementId: null,
}

export type WorkspaceAction =
  | Readonly<{ type: 'set-tab'; tab: WorkspaceTab }>
  | Readonly<{ type: 'toggle-guesses' }>
  | Readonly<{ type: 'set-list-filter'; filter: ListFilter }>
  | Readonly<{ type: 'select-transaction'; id: string | null }>
  | Readonly<{ type: 'set-assoc-tab'; tab: AssocTab }>
  | Readonly<{ type: 'set-extrato-filter'; filter: ExtratoFilter }>
  | Readonly<{ type: 'set-statement'; statementId: string }>

export const workspaceReducer = (state: WorkspaceUiState, action: WorkspaceAction): WorkspaceUiState => {
  switch (action.type) {
    case 'set-tab':
      return { ...state, activeTab: action.tab }
    case 'toggle-guesses':
      return { ...state, showGuesses: !state.showGuesses }
    case 'set-list-filter':
      return { ...state, listFilter: action.filter }
    case 'select-transaction':
      // Selecionar uma transação volta a aba de associação para a Sugestão (caminho feliz).
      return { ...state, selectedTransactionId: action.id, assocTab: 'sugestao' }
    case 'set-assoc-tab':
      return { ...state, assocTab: action.tab }
    case 'set-extrato-filter':
      return { ...state, extratoFilter: action.filter }
    case 'set-statement':
      // Novo extrato importado: zera a seleção (as transações mudam).
      return { ...state, statementId: action.statementId, selectedTransactionId: null }
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}

// ── Derivações puras ────────────────────────────────────────────────────────────
/** Rótulo do progresso "conciliado X/N". */
export const progressLabel = (reconciled: number, total: number): string =>
  `${String(reconciled)}/${String(total)}`

/** Percentual conciliado (0..100, inteiro), para a barra. Total 0 → 0. */
export const progressPercent = (reconciled: number, total: number): number => {
  if (total <= 0) return 0
  const pct = Math.round((reconciled / total) * 100)
  return Math.max(0, Math.min(100, pct))
}

// ── Derivações da lista de transações (puras) ───────────────────────────────────

/**
 * Ícone da transação. `entryType` é **string livre** (#152) — heurística sobre o código normalizado, com
 * fallback por `movement` (entrada/saída). Nunca um union fechado.
 */
export type TxIconKind = 'in' | 'out' | 'transfer' | 'fee' | 'investment'
export const entryTypeIcon = (entryType: string, movement: Movement): TxIconKind => {
  const e = entryType.toUpperCase()
  if (e.includes('FEE') || e.includes('TAR') || e.includes('INT') || e.includes('JUR')) return 'fee'
  if (e.includes('XFER') || e.includes('TED') || e.includes('DOC')) return 'transfer'
  if (e.includes('APLIC') || e.includes('INVEST') || e.includes('RESG') || e.includes('REDEM'))
    return 'investment'
  return movement === 'Credit' ? 'in' : 'out'
}

/** É pendente de conciliação? (só `Pending`; `Reconciled`/`ManualEntry` = tratada.) */
export const isPending = (tx: StatementTransaction): boolean => tx.reconciliationStatus === 'Pending'

/**
 * Tag da linha na lista. O contrato não tem endpoint de sugestões em lote (são por transação), então a
 * lista mostra `reconciled`/`pending`; a banda (alta/média/sem match) aparece no painel da transação
 * selecionada (onde as sugestões são buscadas). Ver chrome-gaps (palpite por linha = lacuna de backend).
 */
export type ListTag = 'reconciled' | 'pending'
export const transactionTag = (tx: StatementTransaction): ListTag =>
  isPending(tx) ? 'pending' : 'reconciled'

/** Aplica o filtro da lista (Pendentes/Conciliadas/Todas). */
export const filterTransactions = (
  txs: readonly StatementTransaction[],
  filter: ListFilter,
): readonly StatementTransaction[] => {
  switch (filter) {
    case 'pendentes':
      return txs.filter(isPending)
    case 'conciliadas':
      return txs.filter((t) => !isPending(t))
    case 'todas':
      return txs
    default: {
      const _exhaustive: never = filter
      return _exhaustive
    }
  }
}

/** Agrupa transações por dia (`date`, ISO), preservando a ordem de chegada dentro do dia. */
export type DayGroup = Readonly<{ date: string; items: readonly StatementTransaction[] }>
export const groupTransactionsByDay = (txs: readonly StatementTransaction[]): readonly DayGroup[] => {
  const order: string[] = []
  const byDay = new Map<string, StatementTransaction[]>()
  for (const t of txs) {
    const bucket = byDay.get(t.date)
    if (bucket === undefined) {
      byDay.set(t.date, [t])
      order.push(t.date)
    } else {
      bucket.push(t)
    }
  }
  return order.map((date) => ({ date, items: byDay.get(date) ?? [] }))
}

/** Conta as transações já tratadas (não-pendentes) — alimenta o progresso "X/N". */
export const countReconciled = (txs: readonly StatementTransaction[]): number =>
  txs.filter((t) => !isPending(t)).length

// ── Balanceamento da conciliação N:1 / parcial (puro — US3) ─────────────────────

/** String de centavos → inteiro (defensivo: vazio/NaN → 0). */
export const parseCents = (s: string): number => {
  const n = Number.parseInt(s, 10)
  return Number.isFinite(n) ? n : 0
}

/** Soma (em centavos) dos títulos selecionados. */
export const sumCentsOf = (payables: readonly { valueCents: string }[]): number =>
  payables.reduce((acc, p) => acc + parseCents(p.valueCents), 0)

/**
 * Diferença residual (centavos) = valor do extrato − soma dos títulos. 0 → bate exatamente; ≠ 0 → exige
 * classificação (Juros/Multa/Desconto/Tarifa/Parcial). Pode ser negativa (selecionou além do valor).
 */
export const residualCents = (txValueCents: number, selectedSumCents: number): number =>
  txValueCents - selectedSumCents

/**
 * Pode conciliar (gating do botão): ≥1 título selecionado E (bate exatamente OU a diferença foi
 * classificada). O backend revalida (422 reconciliation-not-balanced), mas a UI nunca deixa enviar
 * desbalanceado (SC-004).
 */
export const canReconcileMulti = (selectedCount: number, residual: number, hasTreatment: boolean): boolean =>
  selectedCount >= 1 && (residual === 0 || hasTreatment)

/** Tipo derivado (espelha o backend `deriveType`): com diferença → Partial; senão 1→Individual, ≥2→Multiple. */
export type ReconType = 'Individual' | 'Multiple' | 'Partial'
export const deriveReconType = (selectedCount: number, hasDifference: boolean): ReconType =>
  hasDifference ? 'Partial' : selectedCount > 1 ? 'Multiple' : 'Individual'

/** Tipos de lançamento manual que exigem conta de destino + confirmação consciente (US4). */
export const requiresDestination = (type: string): boolean =>
  type === 'Transfer' || type === 'Investment' || type === 'Redemption'

// ── Buscar / Criar vários (US3) — filtros de títulos Pago (puro) ────────────────
/** Opções do filtro Tipo = tipos de DOCUMENTO distintos presentes (NFS-e, DANFE, IRRF, CSRF, INSS, ISS…). */
export const payableTypeOptions = (payables: readonly PaidPayable[]): readonly string[] => {
  const seen: string[] = []
  for (const p of payables) {
    if (p.documentType !== null && !seen.includes(p.documentType)) seen.push(p.documentType)
  }
  return seen
}

const payableMatchesSearch = (p: PaidPayable, q: string): boolean => {
  const needle = q.trim().toLowerCase()
  if (needle === '') return true
  return [p.supplierName, p.documentNumber, p.documentId, p.category, p.documentType]
    .filter((v): v is string => v !== null)
    .join(' ')
    .toLowerCase()
    .includes(needle)
}

/** Filtra os títulos Pago por busca textual + Tipo de documento ('all' = todos os tipos). */
export const filterPayables = (
  payables: readonly PaidPayable[],
  search: string,
  documentType: string,
): readonly PaidPayable[] =>
  payables.filter(
    (p) => payableMatchesSearch(p, search) && (documentType === 'all' || p.documentType === documentType),
  )

// ── Aba Extrato (puro — US8) ────────────────────────────────────────────────────

/** Aplica o filtro do extrato (Todos/Entradas/Saídas/Conciliados/Pendentes). */
export const filterExtrato = (
  txs: readonly StatementTransaction[],
  filter: ExtratoFilter,
): readonly StatementTransaction[] => {
  switch (filter) {
    case 'todos':
      return txs
    case 'entradas':
      return txs.filter((t) => t.movement === 'Credit')
    case 'saidas':
      return txs.filter((t) => t.movement === 'Debit')
    case 'conciliados':
      return txs.filter((t) => !isPending(t))
    case 'pendentes':
      return txs.filter(isPending)
    default: {
      const _exhaustive: never = filter
      return _exhaustive
    }
  }
}

/** Totais do extrato (centavos): entradas (Credit) e saídas (Debit). */
export type ExtratoTotals = Readonly<{ inCents: number; outCents: number }>
export const extratoTotals = (txs: readonly StatementTransaction[]): ExtratoTotals => ({
  inCents: txs.filter((t) => t.movement === 'Credit').reduce((a, t) => a + parseCents(t.valueCents), 0),
  outCents: txs.filter((t) => t.movement === 'Debit').reduce((a, t) => a + parseCents(t.valueCents), 0),
})

// ── Conferência da conciliação (#205, apoio p/ fechar o período) — PURO ──────────
// Saldo conciliado = saldo inicial do período + Σ(movimentos já conciliados, com sinal). A "diferença"
// (saldo final − conciliado) = soma do que falta conciliar; quando 0, o período fecha certinho. É só apoio
// — o saldo em destaque é o real (saldo do período/do banco), não este.
export type Conferencia = Readonly<{
  conciliadoCents: number
  diferencaCents: number
  reconciledCount: number
  totalCount: number
  pendingCount: number
}>
export const deriveConferencia = (st: AccountStatementPeriod | null): Conferencia | null => {
  if (st === null) return null
  const opening = parseCents(st.openingBalanceCents)
  const closing = parseCents(st.closingBalanceCents)
  const reconciledSum = st.movements
    .filter((m) => !isPending(m))
    .reduce(
      (acc, m) => acc + (m.movement === 'Credit' ? parseCents(m.valueCents) : -parseCents(m.valueCents)),
      0,
    )
  const conciliadoCents = opening + reconciledSum
  return {
    conciliadoCents,
    diferencaCents: closing - conciliadoCents,
    reconciledCount: st.counters.reconciled,
    totalCount: st.counters.all,
    pendingCount: st.counters.pending,
  }
}

// ── Formatação de data + badge de tipo (puro) ───────────────────────────────────
const WEEKDAYS_PT = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'] as const
const MONTHS_PT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const

/** ISO `YYYY-MM-DD` → "18 mai 2026 · sexta" (cabeçalho do dia no extrato). */
export const formatDayHeader = (iso: string): string => {
  const [y, m, d] = iso.split('-').map((n) => Number.parseInt(n, 10))
  if (y === undefined || m === undefined || d === undefined || !Number.isFinite(y * m * d)) return iso
  const weekday = WEEKDAYS_PT[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] ?? ''
  return `${String(d)} ${MONTHS_PT[m - 1] ?? ''} ${String(y)} · ${weekday}`
}

/** ISO `YYYY-MM-DD` → "18 mai 2026" (compacto, sem dia da semana — usado no rótulo do período de export). */
export const formatShortDate = (iso: string): string => {
  const [y, m, d] = iso.split('-').map((n) => Number.parseInt(n, 10))
  if (y === undefined || m === undefined || d === undefined || !Number.isFinite(y * m * d)) return iso
  return `${String(d)} ${MONTHS_PT[m - 1] ?? ''} ${String(y)}`
}

/** Período mais recente da conta (por data final) — alvo do export "Exportar conciliação". */
export const pickLatestPeriod = (periods: readonly ReconciliationPeriod[]): ReconciliationPeriod | null =>
  periods.length === 0 ? null : periods.reduce((best, p) => (p.periodEnd > best.periodEnd ? p : best))

/** Rótulo honesto do que será exportado: "18 mai 2026 – 17 jun 2026". */
export const periodRangeLabel = (p: ReconciliationPeriod): string =>
  `${formatShortDate(p.periodStart)} – ${formatShortDate(p.periodEnd)}`

/** ISO `YYYY-MM-DD` → "18/05" (coluna Data). */
export const formatDayShort = (iso: string): string => {
  const [, m, d] = iso.split('-')
  return m !== undefined && d !== undefined ? `${d}/${m}` : iso
}

/** Classe do badge de tipo (cor) a partir do `entryType` livre. */
export type ExtratoKind = 'pix' | 'ted' | 'doc' | 'tar' | 'apl' | 'default'
export const extratoKindClass = (entryType: string): ExtratoKind => {
  const e = entryType.toUpperCase()
  if (e.includes('PIX')) return 'pix'
  if (e.includes('TED')) return 'ted'
  if (e.includes('DOC')) return 'doc'
  if (e.includes('TAR') || e.includes('FEE')) return 'tar'
  if (e.includes('APL') || e.includes('INVEST') || e.includes('RESG') || e.includes('REDEM')) return 'apl'
  return 'default'
}

/** Grupo de dia no extrato: cabeçalho formatado, totais do dia e saldo de fechamento (1ª linha). */
export type ExtratoDayGroup = Readonly<{
  date: string
  header: string
  inCents: number
  outCents: number
  saldoCents: string
  items: readonly StatementTransaction[]
}>
export const groupExtratoDays = (txs: readonly StatementTransaction[]): readonly ExtratoDayGroup[] =>
  groupTransactionsByDay(txs).map((g) => {
    const totals = extratoTotals(g.items)
    return {
      date: g.date,
      header: formatDayHeader(g.date),
      inCents: totals.inCents,
      outCents: totals.outCents,
      saldoCents: g.items[0]?.balanceAfterCents ?? '0', // saldo de fechamento = 1ª linha (mais recente)
      items: g.items,
    }
  })

// ── Modal "Alterar conta" — troca de conta sem voltar ao grid (puro) ────────────
/** Item de conta no modal de troca (derivado da conta-cedente; depende de #168 p/ a listagem real). */
export type ChangeAccountItem = Readonly<{
  id: string
  initials: string
  name: string
  meta: string
  balanceBRL: string
  updated: string
  openable: boolean // conta encerrada não abre o workspace
  isCurrent: boolean
}>
export type ChangeAccountGroups = Readonly<{
  active: readonly ChangeAccountItem[]
  closed: readonly ChangeAccountItem[]
}>

const toChangeAccountItem = (a: ReconciliationAccount, currentId: string): ChangeAccountItem => ({
  id: a.id,
  initials: a.bankName.slice(0, 2).toUpperCase(),
  name: a.alias,
  meta: `${a.bankCode} · Ag ${a.branch} · CC ${a.accountNumber}-${a.accountDv}`,
  balanceBRL: centsToBRL(a.currentBalanceCents),
  updated: a.lastUpdatedAt,
  openable: a.status !== 'Closed',
  isCurrent: a.id === currentId,
})

const matchesAccountSearch = (a: ReconciliationAccount, q: string): boolean => {
  const needle = q.trim().toLowerCase()
  if (needle === '') return true
  return [a.alias, a.bankName, a.bankCode, a.branch, a.accountNumber].join(' ').toLowerCase().includes(needle)
}

// ── Modal "Detalhes da conciliação" — clique numa linha conciliada do Extrato (puro) ──
const MATCH_DASH = '—'
export type MatchDetailsDoc = Readonly<{
  name: string
  documento: string
  vencimento: string
  categoria: string
  valueBRL: string
}>
export type MatchDetailsAudit = Readonly<{ when: string; who: string }>
// Lado "Título" quando a saída foi conciliada com VÁRIOS títulos (#175 com >1 item): valor conciliado por
// título + total. Nome/nº de cada título depende do enriquecimento (#172).
export type MatchTitleLine = Readonly<{ valueBRL: string }>
export type MatchTitlesView = Readonly<{
  count: number
  lines: readonly MatchTitleLine[]
  totalBRL: string
}>
export type MatchDetailsView = Readonly<{
  isManualEntry: boolean
  ext: Readonly<{ name: string; date: string; kind: string; id: string; valueBRL: string }>
  // doc/audit dependem do backend expor os detalhes da conciliação (sem GET de detalhes hoje, #175) →
  // sem dados, preenche com "—" (estado honesto, igual ao default do mock). Em preview vêm preenchidos.
  doc: MatchDetailsDoc
  audit: MatchDetailsAudit
  // Preenchido só quando a conciliação é de 1 saída → N títulos (>1 item); senão null (usa `doc`).
  multi: MatchTitlesView | null
}>

const DASH_DOC: MatchDetailsDoc = {
  name: MATCH_DASH,
  documento: MATCH_DASH,
  vencimento: MATCH_DASH,
  categoria: MATCH_DASH,
  valueBRL: MATCH_DASH,
}
const DASH_AUDIT: MatchDetailsAudit = { when: MATCH_DASH, who: MATCH_DASH }

/**
 * Auditoria do modal a partir do lookup da conciliação ativa (#175). `when` = data da conciliação
 * (date-only, p/ evitar fuso); `who` = identificador de quem conciliou (id cru do core-api até o backend
 * resolver nome amigável). O lado Título segue "—" (depende do #172).
 */
export const matchAuditFromLookup = (r: TransactionReconciliation): MatchDetailsAudit => ({
  when: formatDayHeader(r.reconciledAt.slice(0, 10)),
  who: r.reconciledBy,
})

/**
 * Lado "Título" do modal quando UMA saída foi conciliada com VÁRIOS títulos (#175 com >1 item): contagem +
 * valor conciliado por título + total (deixa explícito o rateio). null quando há só 1 item (usa `doc`).
 */
export const buildMatchTitles = (r: TransactionReconciliation): MatchTitlesView | null => {
  if (r.items.length <= 1) return null
  const totalCents = r.items.reduce((acc, it) => acc + Number(it.reconciledValueCents), 0)
  return {
    count: r.items.length,
    lines: r.items.map((it) => ({ valueBRL: centsToBRL(it.reconciledValueCents) })),
    totalBRL: centsToBRL(String(totalCents)),
  }
}

/** Monta a visão do modal de detalhes a partir da transação conciliada (lado extrato = real) + detalhes. */
export const matchDetailsView = (
  tx: StatementTransaction,
  doc: MatchDetailsDoc | null,
  audit: MatchDetailsAudit | null,
  multi: MatchTitlesView | null = null,
): MatchDetailsView => ({
  isManualEntry: tx.reconciliationStatus === 'ManualEntry',
  ext: {
    name: tx.payeeName,
    date: formatDayHeader(tx.date),
    kind: tx.entryType,
    id: tx.fitid,
    valueBRL: centsToBRL(tx.valueCents),
  },
  doc: doc ?? DASH_DOC,
  audit: audit ?? DASH_AUDIT,
  multi,
})

/** Agrupa as contas em ativas/encerradas p/ o modal de troca, filtrando pela busca e marcando a atual. */
export const groupAccountsForSwitch = (
  accounts: readonly ReconciliationAccount[],
  currentId: string,
  search: string,
): ChangeAccountGroups => {
  const filtered = accounts.filter((a) => matchesAccountSearch(a, search))
  return {
    active: filtered.filter((a) => a.status !== 'Closed').map((a) => toChangeAccountItem(a, currentId)),
    closed: filtered.filter((a) => a.status === 'Closed').map((a) => toChangeAccountItem(a, currentId)),
  }
}
