/**
 * View-model do workspace de Conciliação (§XI: lógica fora da view; sem React). UI-state como máquina
 * tagged + reducer PURO (testável em node:test) e derivações puras (agrupar por dia, filtro, ícone por
 * `entryType`, progresso, rótulos). As queries de dados entram via o binding. Espelha o padrão de
 * `contas-a-pagar.view-model.ts` (derivação pura) + reducer de UI-state.
 */
import type {
  AccountStatementPeriod,
  AccountType,
  ManualEntryType,
  Movement,
  PaidPayable,
  ReconciliationAccount,
  ReconciliationPeriod,
  StatementTransaction,
  SuggestionBand,
  TransactionReconciliation,
  TransactionReconciliationItem,
} from '#modules/financial/client/data/model/reconciliation.model.ts'
import { centsToBRL, centsToReais } from '#modules/financial/client/data/money.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import type { ReconciliationError } from '#modules/financial/client/data/repository/reconciliation-error.ts'
// Lista CANÔNICA de tipos de documento + impostos retidos (mesma fonte do Contas a Pagar). Reuso dentro da
// MESMA feature (financial), view-model → view-model (boundary permite `sameFeature('client-view-model')`) —
// não duplica a fonte da verdade (056). Ambos são núcleo puro (ADR-0009), então node:test resolve os #alias.
import {
  DOCUMENT_TYPE_OPTIONS,
  RETENTION_TYPE_OPTIONS,
} from '#modules/financial/client/contas-a-pagar-list/contas-a-pagar.view-model.ts'

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
  | Readonly<{ type: 'clear-statement' }>

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
    case 'clear-statement':
      // Extrato excluído (core-api#558): some o statement + a seleção (as transações foram removidas).
      return { ...state, statementId: null, selectedTransactionId: null }
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}

/**
 * Tag i18n do erro ao EXCLUIR o extrato (core-api#558). PURA. Traduz os 2 erros de guarda para uma
 * mensagem ACIONÁVEL no contexto de exclusão: `period-closed` → "reabra o período" (a mensagem genérica só
 * diz "período fechado", que não orienta aqui). Os demais erros caem no `reconciliationErrorTag` comum —
 * inclusive `statement-has-reconciled-transactions`, cuja mensagem própria já é acionável.
 */
export const deleteStatementErrorTag = (e: ReconciliationError): string =>
  e === 'period-closed' ? 'financial.recon.deleteStatement.error.periodClosed' : reconciliationErrorTag(e)

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

// ── Fluxo contínuo: auto-avanço + barra de confirmação ──────────────────────────
/**
 * Rótulo do título p/ a barra de confirmação. Preferência: "Tipo Número" (ex.: "NFS-e 2024-0537") →
 * fornecedor → tipo → "". O nº/tipo do documento ainda não vêm na rota /payables (gap core-api#172, sai
 * null/UUID), então no seed cai no fornecedor ou em "" e a barra mostra só o VALOR; acende sozinho com #172.
 */
export const tituloLabel = (p: PaidPayable | null): string => {
  if (p === null) return ''
  const docType = p.documentType ?? ''
  const docNum = p.documentNumber ?? ''
  if (docNum !== '') return docType !== '' ? `${docType} ${docNum}` : docNum
  if (p.supplierName !== null && p.supplierName !== '') return p.supplierName
  return docType
}

/**
 * Favorecido de um TÍTULO DE IMPOSTO RETIDO = o ÓRGÃO arrecadador, não o fornecedor do documento-pai.
 * Genérico por tipo (`documentType`): ISS → SEFIN (município); federais (IRRF/INSS/CSRF/PIS/COFINS/CSLL) →
 * Receita Federal. Retorna a TAG i18n do órgão, ou `null` quando não é imposto retido (segue o fornecedor).
 */
export const retentionAgencyTag = (retentionType: string | null | undefined): string | null => {
  if (retentionType === null || retentionType === undefined) return null
  const rt = retentionType.trim().toUpperCase()
  if (rt === 'ISS') return 'financial.recon.pending.agency.iss'
  return rt === 'IRRF' || rt === 'INSS' || rt === 'CSRF' ? 'financial.recon.pending.agency.federal' : null
}

/**
 * Próxima transação PENDENTE com match (palpite no `guesses`) a partir de `afterId` — busca CÍCLICA na
 * ordem da lista, preferindo banda 'alta' (alta confiança); senão qualquer match. Pula as sem palpite e a
 * própria `afterId`. `null` quando não há nenhuma pendente com match. PURA. (P.O.: manter sempre um match ativo.)
 */
export const nextPendingWithMatch = (
  txs: readonly StatementTransaction[],
  guesses: ReadonlyMap<string, { band: SuggestionBand }>,
  afterId: string,
): string | null => {
  const n = txs.length
  if (n === 0) return null
  const start = txs.findIndex((t) => t.id === afterId)
  const scan = (wantAlta: boolean): string | null => {
    for (let i = 1; i <= n; i++) {
      const t = txs[(start + i) % n]
      if (t === undefined || t.id === afterId || !isPending(t)) continue
      const g = guesses.get(t.id)
      if (g !== undefined && (!wantAlta || g.band === 'alta')) return t.id
    }
    return null
  }
  return scan(true) ?? scan(false)
}

/**
 * Motor de palpite — alvo da seleção na aba Conciliação (P.O.: "como um motor", sempre landar numa transação
 * COM palpite). Retorna o txId a selecionar, ou `null` (não mexe na seleção). PURA. Regras:
 *  - fora da aba, palpites não assentados, ou sem nenhum match → não mexe;
 *  - nada selecionado (load inicial / novo extrato) → `fallbackId` (1º match, ou topo se não há match);
 *  - acabou de ENTRAR na aba e a tx atual NÃO tem palpite → o próximo COM palpite (`firstMatchId`), só se existir;
 *  - já dentro da aba e escolhendo à mão → respeita a escolha (retorna null).
 * O auto-avanço ao conciliar é tratado à parte (`nextPendingWithMatch` a partir da tx conciliada).
 */
export const engineTarget = (
  p: Readonly<{
    onConciliacao: boolean
    justEntered: boolean
    guessesSettled: boolean
    selectedId: string | null
    selectedIsMatch: boolean
    firstMatchId: string | null
    fallbackId: string | null
  }>,
): string | null => {
  if (!p.onConciliacao || !p.guessesSettled) return null
  if (p.selectedId === null) return p.fallbackId
  if (p.justEntered && !p.selectedIsMatch && p.firstMatchId !== null) return p.firstMatchId
  return null
}

// ── Relabel TEMPORÁRIO de categorias (só no front) ──────────────────────────────
// Pedido P.O.: a Nova transação da conciliação precisa das categorias "Transferência entre contas",
// "Resgate" e "Aplicação", mas SEM mexer no backend por ora. Reaproveitamos 3 categorias de referência
// existentes pelo NOME — o `id` (UUID) segue intacto p/ o backend (que valida igual). Quando o backend
// ganhar categorias dedicadas a movimentos entre contas, basta remover este mapa.
// ⚠️ É só rótulo de UI: o lançamento fica gravado na categoria original (ex.: "Aplicação" = id de "Aluguel").
const RECON_CATEGORY_RELABEL: Readonly<Record<string, string>> = {
  'Ajuste de conciliação': 'Transferência entre contas',
  Estorno: 'Resgate',
  Aluguel: 'Aplicação',
}
export const relabelReconCategory = (name: string): string => RECON_CATEGORY_RELABEL[name] ?? name

// ── Cascata Centro de Custo → Categoria → Subcategoria (EPIC web-app#150 · core-api#341) ────────────
// As derivações são PURAS e compartilhadas com o Lançar Documento → `data/helpers/categorization-cascade.ts`
// (spec 074). O placeholder round-robin que fingia a relação centro→categoria MORREU: o #341 entregou o
// `costCenterId` real na categoria. Re-exportado aqui p/ os call sites (e o teste) desta feature.
export {
  topLevelCategories,
  subcategoriesOf,
  categoriesForCostCenter,
} from '#modules/financial/client/data/helpers/categorization-cascade.ts'

// ── Sugestão de conciliação em LOTE por padrão (front) ──────────────────────────
/** Normaliza a descrição (payeeName) p/ comparar transações "do mesmo tipo": case/espaço-insensível. */
export const normalizeDesc = (s: string): string => s.trim().toLowerCase().replace(/\s+/g, ' ')

// Tipos de lançamento manual que o LOTE (confirmBatch) suporta hoje — NÃO precisam de conta de destino/
// produto (o template do batch do backend não os carrega). Resgate/Aplicação/Transferência ficam de fora.
export const BATCHABLE_MANUAL_TYPES: readonly ManualEntryType[] = ['Payment', 'Receipt', 'FeePenaltyInterest']
export const isBatchableManualType = (type: ManualEntryType): boolean => BATCHABLE_MANUAL_TYPES.includes(type)

// Palavras-chave de TARIFA bancária (descrição/tipo) — p/ agrupar tarifas de descrições DIFERENTES no lote
// (ex.: "Tarifa bancária mensal" + "Tarifa de manutenção de conta"). Conciliam do mesmo jeito.
const FEE_KEYWORDS: readonly string[] = ['TARIFA', 'IOF', 'JUROS', 'MULTA', 'ANUIDADE', 'FEE']
/** Transação com cara de tarifa bancária (palavra-chave no tipo/descrição/memo). */
export const isFeeLikeTransaction = (tx: StatementTransaction): boolean => {
  const hay = `${tx.entryType} ${tx.payeeName} ${tx.memo}`.toUpperCase()
  return FEE_KEYWORDS.some((k) => hay.includes(k))
}

/**
 * Transações PENDENTES do MESMO perfil (mesmo sinal/movimento) de uma já conciliada — p/ sugerir conciliar
 * em lote com o mesmo padrão. Exclui a própria (`excludeId`). Casa por descrição idêntica; e, p/ TARIFA
 * (`matchFeeLike`), também por PERFIL de tarifa (qualquer transação com cara de tarifa) — todas conciliam igual.
 */
export const findSimilarPending = (
  txs: readonly StatementTransaction[],
  descKey: string,
  movement: Movement,
  excludeId: string,
  matchFeeLike = false,
): readonly StatementTransaction[] =>
  txs.filter(
    (t) =>
      isPending(t) &&
      t.id !== excludeId &&
      t.movement === movement &&
      (normalizeDesc(t.payeeName) === descKey || (matchFeeLike && isFeeLikeTransaction(t))),
  )

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

/**
 * Por que o "Conciliar" do lançamento manual está travado — `null` = liberado. PURA.
 *
 * O `canSubmit` da view deriva DESTE resultado (`=== null`), e não de um booleano paralelo: assim é
 * impossível o botão ficar desabilitado sem motivo exibível, ou habilitado com um motivo pendente. Foi
 * o que faltou quando a classificação virou obrigatória (#331 + core-api#671) — a pessoa via o botão
 * morto sem saber que faltava categoria ou centro de custo (mesma lição do PR #252).
 *
 * A ordem importa: reporta o PRIMEIRO obstáculo, do mais estrutural (tipo) ao mais específico (campo).
 */
export type ManualEntryGate = Readonly<{
  hasType: boolean
  needsDestination: boolean
  destinationFilled: boolean
  needsClassification: boolean
  categoryFilled: boolean
  costCenterFilled: boolean
}>

export const manualEntryBlockedTag = (g: ManualEntryGate): string | null => {
  if (!g.hasType) return 'financial.recon.manual.blocked.type'
  if (g.needsDestination && !g.destinationFilled) return 'financial.recon.manual.blocked.destination'
  if (!g.needsClassification) return null
  if (!g.categoryFilled && !g.costCenterFilled) return 'financial.recon.manual.blocked.classification'
  if (!g.categoryFilled) return 'financial.recon.manual.blocked.category'
  if (!g.costCenterFilled) return 'financial.recon.manual.blocked.costCenter'
  return null
}

/** Tipos de lançamento manual que exigem conta de destino + confirmação consciente (US4). */
export const requiresDestination = (type: string): boolean =>
  type === 'Transfer' || type === 'Investment' || type === 'Redemption'

// Títulos pendentes de conciliação (Pago), MAIS ANTIGO no topo — pela DATA DE PAGAMENTO (`paidAt`), a data
// relevante p/ o match da conciliação (≈ saída bancária). Sem `paidAt` (seed antigo / rota ainda não expõe)
// vão ao FIM. PURO; não muta a entrada.
export const sortPendingByPayment = (payables: readonly PaidPayable[]): readonly PaidPayable[] =>
  [...payables].sort((a, b) => {
    if (a.paidAt === null) return b.paidAt === null ? 0 : 1
    if (b.paidAt === null) return -1
    return a.paidAt.localeCompare(b.paidAt)
  })

// ── Buscar / Criar vários (US3/056) — filtros RICOS de títulos Pago (puro) ───────
/**
 * Lista CANÔNICA de tipos p/ o filtro Tipo = tipos de documento (NFS-e/DANFE/RPA/Fatura/Boleto/Recibo/
 * Imposto) + impostos retidos (IRRF/ISS/INSS/CSRF), na mesma ordem do Contas a Pagar. É a lista COMPLETA
 * (não só os presentes nos dados) — a View mostra tudo; o `documentType` do título casa por igualdade.
 */
export const RECON_DOCUMENT_TYPE_OPTIONS: readonly string[] = [
  ...DOCUMENT_TYPE_OPTIONS,
  ...RETENTION_TYPE_OPTIONS,
]

/** Campo de data do filtro de Período: por Vencimento (`due`) ou por Emissão (`issue`). */
export type PeriodField = 'due' | 'issue'

/**
 * Critérios do filtro rico (056). `documentType` = 'all' → não filtra. `period.from`/`period.to` vazios =
 * lado aberto; `field` escolhe dueDate (sempre presente) ou issueDate (pode ser null → excluído quando o
 * filtro de Emissão está ativo). `value.min/maxCents` = null → lado aberto.
 */
export type MultiFilter = Readonly<{
  search: string
  documentType: string
  period: Readonly<{ field: PeriodField; from: string; to: string }>
  value: Readonly<{ minCents: number | null; maxCents: number | null }>
}>

/** Filtro neutro (nada filtrando) — default do binding e ponto de partida dos popovers. */
export const INITIAL_MULTI_FILTER: MultiFilter = {
  search: '',
  documentType: 'all',
  period: { field: 'due', from: '', to: '' },
  value: { minCents: null, maxCents: null },
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

/**
 * Converte um valor R$ digitado (PT: milhar com ponto, decimal com vírgula — ex.: "1.234,56") em CENTAVOS.
 * Parse DEFENSIVO: vazio/inválido → null (= sem limite). Aceita também ponto decimal simples ("1234.56").
 * Nunca lança; ignora símbolos (R$, espaços). PURO.
 */
export const parseBRLToCents = (raw: string): number | null => {
  const cleaned = raw.trim().replace(/[^\d.,]/g, '')
  if (cleaned === '') return null
  // PT: pontos = separador de milhar (removidos); vírgula = separador decimal (vira ponto).
  const hasComma = cleaned.includes(',')
  const normalized = hasComma ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned
  const n = Number.parseFloat(normalized)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

/**
 * Inverso de `parseBRLToCents` p/ reidratar o campo de texto ao reabrir o popover: centavos → "1234,56" (PT,
 * vírgula decimal, sem símbolo/milhar). PURO. Usado só p/ preencher o rascunho editável (não é formatação BRL).
 */
export const centsToAmountInput = (cents: number): string => (cents / 100).toFixed(2).replace('.', ',')

/**
 * Data date-only "YYYY-MM-DD" dentro do intervalo [from, to] por comparação de STRING (lexical, sem fuso —
 * NUNCA `new Date`). Bordas inclusivas; lado vazio = aberto. PURO.
 */
export const dateInRange = (date: string, from: string, to: string): boolean =>
  (from === '' || date >= from) && (to === '' || date <= to)

/** Valor (centavos) dentro de [minCents, maxCents]. Bordas inclusivas; lado null = aberto. PURO. */
export const valueInRange = (cents: number, minCents: number | null, maxCents: number | null): boolean =>
  (minCents === null || cents >= minCents) && (maxCents === null || cents <= maxCents)

/**
 * Filtra os títulos Pago pelo objeto de critérios rico (056): busca textual + Tipo (documento/imposto, igualdade)
 * + Período (Vencimento OU Emissão, intervalo de datas por string) + Valor (intervalo min–max em centavos).
 * Tudo client-side sobre a lista já carregada (puro). No modo Emissão, título sem `issueDate` (null) fica FORA
 * quando há intervalo — de forma honesta (não inventa data).
 */
export const filterPayables = (
  payables: readonly PaidPayable[],
  filter: MultiFilter,
): readonly PaidPayable[] => {
  const { search, documentType, period, value } = filter
  const periodActive = period.from !== '' || period.to !== ''
  return payables.filter((p) => {
    if (!payableMatchesSearch(p, search)) return false
    // Tipo: imposto retido (IRRF/ISS/INSS/CSRF) casa por `retentionType` (o `documentType` do título-filho vem
    // null enquanto o core-api#172 não o expõe; o órgão/tipo do imposto vive em `retentionType`, enriquecido no
    // BFF). Tipos de documento (NFS-e/DANFE/…) seguem casando por `documentType` (null → não casa até #172).
    if (documentType !== 'all') {
      const isRetention = RETENTION_TYPE_OPTIONS.some((rt) => rt === documentType)
      const field = isRetention ? p.retentionType : p.documentType
      if (field !== documentType) return false
    }
    if (periodActive) {
      const d = period.field === 'due' ? p.dueDate : p.issueDate
      if (d === null || d === '') return false // Emissão ausente → fora do filtro (honesto)
      if (!dateInRange(d, period.from, period.to)) return false
    }
    return valueInRange(parseCents(p.valueCents), value.minCents, value.maxCents)
  })
}

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

/** ISO `YYYY-MM-DD` → "18/05/2026" (DD/MM/AAAA). null → "—" (sem data de pagamento ainda). */
export const formatDateBR = (iso: string | null): string => {
  if (iso === null) return '—'
  const [y, m, d] = iso.split('-')
  return y !== undefined && m !== undefined && d !== undefined ? `${d}/${m}/${y}` : iso
}

/** ISO (YYYY-MM-DD) → dd-mm-aaaa (sem `new Date`, evita fuso). "—" se nulo. */
export const formatDateDash = (iso: string | null): string => {
  if (iso === null || iso === '') return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return y !== undefined && m !== undefined && d !== undefined ? `${d}-${m}-${y}` : iso
}

// ── Validação do extrato OFX (conta do arquivo × conta atual) — front puro, ANTES de importar ──────────
// Lê o <BANKACCTFROM> do OFX (banco/agência/conta+dígito) e compara com a conta da tela. Se for de OUTRA
// conta, a UI pede confirmação ("Importar mesmo assim?"). Evita conciliar com o extrato da conta errada.
export type OfxAccount = Readonly<{
  bankId: string | null
  branchId: string | null
  acctId: string
  acctType: string | null
}>

/** Extrai a conta do OFX (SGML: tag-valor sem fechamento). null se não houver ACCTID (ex.: CSV/sem bloco). */
export const parseOfxAccount = (content: string): OfxAccount | null => {
  const grab = (tag: string): string | null => {
    const m = new RegExp(`<${tag}>\\s*([^\\s<\\r\\n]+)`, 'i').exec(content)
    return m?.[1] !== undefined ? m[1].trim() : null
  }
  const acctId = grab('ACCTID')
  if (acctId === null || acctId === '') return null
  return { bankId: grab('BANKID'), branchId: grab('BRANCHID'), acctId, acctType: grab('ACCTTYPE') }
}

// Só dígitos, sem zeros à esquerda (tolerante a formatação: "0012345" ≡ "12345").
const acctDigits = (s: string | null): string => (s ?? '').replace(/\D/g, '').replace(/^0+/, '')

export type AccountIdentity = Readonly<{
  bankCode: string
  branch: string
  accountNumber: string
  accountDv: string
}>

/** O OFX é da conta atual? Compara banco (se presente) + número da conta (com/sem dígito). Branch é frouxo. */
export const ofxMatchesAccount = (ofx: OfxAccount, account: AccountIdentity): boolean => {
  const bankOk = ofx.bankId === null || acctDigits(ofx.bankId) === acctDigits(account.bankCode)
  const fileAcct = acctDigits(ofx.acctId)
  const withDv = acctDigits(account.accountNumber + account.accountDv)
  const noDv = acctDigits(account.accountNumber)
  const acctOk = fileAcct === withDv || fileAcct === noDv
  return bankOk && acctOk
}

/** Rótulo da conta do arquivo p/ a mensagem de confirmação (ex.: "001 · Ag 1234 · CC 00123457"). */
export const ofxAccountLabel = (ofx: OfxAccount): string => {
  const parts = [ofx.bankId, ofx.branchId !== null ? `Ag ${ofx.branchId}` : null, `CC ${ofx.acctId}`]
  return parts.filter((p): p is string => p !== null && p !== '').join(' · ')
}

/** Classe do badge de tipo (cor) a partir do `entryType` livre. */
export type ExtratoKind = 'pix' | 'ted' | 'doc' | 'tar' | 'apl' | 'entrada' | 'saida' | 'default'
export const extratoKindClass = (entryType: string): ExtratoKind => {
  const e = entryType.toUpperCase()
  if (e.includes('PIX')) return 'pix'
  if (e.includes('TED')) return 'ted'
  if (e.includes('DOC')) return 'doc'
  if (e.includes('TAR') || e.includes('FEE')) return 'tar'
  if (e.includes('APL') || e.includes('INVEST') || e.includes('RESG') || e.includes('REDEM')) return 'apl'
  return 'default'
}

/**
 * Rótulo do TIPO no extrato. Tipo específico reconhecido (PIX/TED/DOC/Tarifa/Aplicação) → mostra o próprio
 * `entryType`. Genérico ("Other"/vazio — comum no seed e quando o OFX não traz TRNTYPE) → cai na DIREÇÃO do
 * movimento (Entrada/Saída). Devolve TAG i18n OU `null` (null = a view mostra o `entryType` cru).
 * 🔁 O tipo "de verdade" (PIX/TED/Boleto…) depende do parser do OFX expor o TRNTYPE (backend).
 */
export const extratoTypeTag = (tx: StatementTransaction): string | null =>
  extratoKindClass(tx.entryType) === 'default'
    ? tx.movement === 'Credit'
      ? 'financial.recon.ext.type.entrada'
      : 'financial.recon.ext.type.saida'
    : null

/** Cor do badge de TIPO: tipo específico mantém sua cor; genérico usa a NATUREZA (Entrada=verde/Saída=vermelho). */
export const extratoBadgeKind = (tx: StatementTransaction): ExtratoKind => {
  const kind = extratoKindClass(tx.entryType)
  if (kind !== 'default') return kind
  return tx.movement === 'Credit' ? 'entrada' : 'saida'
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
// Tipo da conta → tag i18n (a view traduz; view-model fica i18n-agnóstica p/ o tipo).
const SWITCH_TYPE_TAG: Readonly<Record<AccountType, string>> = {
  Corrente: 'financial.recon.add.type.corrente',
  Poupanca: 'financial.recon.add.type.poupanca',
  Investimento: 'financial.recon.add.type.investimento',
  Cartao: 'financial.recon.add.type.cartao',
  Outro: 'financial.recon.add.type.outro',
}

export type ChangeAccountItem = Readonly<{
  id: string
  initials: string
  name: string
  meta: string
  typeTag: string // tag i18n do tipo (Corrente/Investimento/Cartão…) p/ exibir abaixo do apelido
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
  typeTag: SWITCH_TYPE_TAG[a.type],
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
  // Tag i18n do favorecido quando o título é imposto retido (ISS→SEFIN, federais→Receita Federal). A view
  // traduz e prefere sobre `name` — o favorecido do imposto é o ÓRGÃO, não o fornecedor do documento-pai.
  nameTag: string | null
  documento: string
  vencimento: string
  categoria: string
  valueBRL: string
}>
export type MatchDetailsAudit = Readonly<{ when: string; who: string }>
// Lado "Título" quando a saída foi conciliada com VÁRIOS títulos (#175 com >1 item): por título, favorecido
// (ou ÓRGÃO no imposto retido) + nº do documento + valor conciliado. Favorecido/documento vêm do item
// enriquecido no BFF via `payables:batch` (#357); antes só o valor era exibido.
export type MatchTitleLine = Readonly<{
  valueBRL: string
  // Favorecido: fornecedor (fallback nº doc, fallback payableId). A view prefere `nameTag` quando presente.
  name: string
  // Tag i18n do ÓRGÃO arrecadador quando imposto retido (ISS→SEFIN, federais→Receita); null → usa `name`.
  nameTag: string | null
  // Nº do documento (ou "—" quando ausente). A view esconde a linha do documento quando "—".
  documento: string
}>
export type MatchTitlesView = Readonly<{
  count: number
  lines: readonly MatchTitleLine[]
  // Diferença (extrato − Σtítulos): acréscimo (multa/juros) ou desconto. null quando não há diferença.
  differenceBRL: string | null
  differenceTag: string // i18n da linha de diferença ('' quando não há)
  totalBRL: string // total conciliado = VALOR DO EXTRATO (= Σtítulos + diferença)
}>
export type MatchDetailsView = Readonly<{
  isManualEntry: boolean
  // Tag i18n da FORMA do lançamento manual (Pagamento/Transferência/Aplicação/Resgate/Tarifa…) quando
  // conhecida (sessão; ou backend via #268); senão a genérica "Nova transação". A view traduz.
  manualKindTag: string
  // CONTRAPARTE do lançamento: conta de destino (transferência/aplicação/resgate) ou fornecedor
  // (pagamento/recebimento). `labelTag` vazio → não há linha (ex.: tarifa). `value` "—" até saber (sessão/#268).
  manualCounterparty: Readonly<{ labelTag: string; value: string }>
  // Hint honesto embaixo do lado manual: transferência/aplicação/resgate = movimentação entre contas
  // próprias (contrapartida), NÃO tarifa/despesa. Demais tipos mantêm o exemplo tarifa/despesa.
  manualHintTag: string
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
  nameTag: null,
  documento: MATCH_DASH,
  vencimento: MATCH_DASH,
  categoria: MATCH_DASH,
  valueBRL: MATCH_DASH,
}
const DASH_AUDIT: MatchDetailsAudit = { when: MATCH_DASH, who: MATCH_DASH }

/**
 * Auditoria do modal a partir do lookup da conciliação ativa (#175). `when` = data da conciliação
 * (date-only, p/ evitar fuso); `who` = nome de quem conciliou, resolvido server-side pelo core-api
 * (#207); fallback pro id cru enquanto `reconciledByName` vier null (não-resolvido). O lado Título
 * segue "—" (depende do #172).
 */
export const matchAuditFromLookup = (r: TransactionReconciliation): MatchDetailsAudit => ({
  when: formatDayHeader(r.reconciledAt.slice(0, 10)),
  who: r.reconciledByName ?? r.reconciledBy,
})

/**
 * Lado "Título" de um match INDIVIDUAL (1 item) a partir do item enriquecido no BFF (interim #172):
 * favorecido (fallback nº doc, fallback payableId), documento, vencimento e valor conciliado. Derivação
 * PURA (sem React, ADR-0009). `item === null` → null (a view cai no default "—"). O `valueCents` é o valor
 * conciliado do próprio item (items[0].reconciledValueCents), mantendo o "Valor conciliado" já exibido hoje.
 */
export const matchDocFromItem = (
  item: TransactionReconciliationItem | null,
  valueCents: string | null,
): MatchDetailsDoc | null => {
  if (item === null) return null
  return {
    name: item.supplierName ?? item.documentNumber ?? item.payableId,
    // Imposto retido → favorecido é o órgão arrecadador (tag i18n); título-pai → null (usa `name`).
    nameTag: retentionAgencyTag(item.retentionType),
    documento: item.documentNumber ?? MATCH_DASH,
    vencimento: item.dueDate !== null ? formatDayHeader(item.dueDate) : MATCH_DASH,
    // Categoria NÃO vem do core-api em nenhuma leitura (category_ref write-only); depende de backend expor — issue análoga a #268.
    categoria: MATCH_DASH,
    valueBRL: valueCents !== null ? centsToBRL(valueCents) : MATCH_DASH,
  }
}

/**
 * Lado "Título" do modal quando UMA saída foi conciliada com VÁRIOS títulos (#175 com >1 item): contagem +
 * valor por título + DIFERENÇA (acréscimo multa/juros ou desconto) + total = VALOR DO EXTRATO. null quando há
 * só 1 item (usa `doc`). A diferença é derivada do extrato − Σtítulos (auto-consistente: o total bate com o
 * extrato exibido à esquerda); o TIPO exato da diferença (multa/juros/desconto/tarifa) ainda não vem no
 * lookup do core-api — então o rótulo só distingue acréscimo × desconto pelo sinal.
 */
export const buildMatchTitles = (
  r: TransactionReconciliation,
  extratoCents: string | null,
): MatchTitlesView | null => {
  if (r.items.length <= 1) return null
  const subtotalCents = r.items.reduce((acc, it) => acc + Number(it.reconciledValueCents), 0)
  const extrato = extratoCents !== null && extratoCents !== '' ? Number(extratoCents) : subtotalCents
  const diffCents = extrato - subtotalCents
  const hasDiff = diffCents !== 0
  return {
    count: r.items.length,
    // Cada linha surfa favorecido/órgão + nº do documento do item enriquecido no BFF (#357); mesma regra do
    // 1:1 (`matchDocFromItem`): imposto retido → headline é o ÓRGÃO (nameTag), não o fornecedor do pai.
    lines: r.items.map((it) => ({
      valueBRL: centsToBRL(it.reconciledValueCents),
      name: it.supplierName ?? it.documentNumber ?? it.payableId,
      nameTag: retentionAgencyTag(it.retentionType),
      documento: it.documentNumber ?? MATCH_DASH,
    })),
    differenceBRL: hasDiff ? centsToBRL(String(Math.abs(diffCents))) : null,
    differenceTag: hasDiff
      ? diffCents > 0
        ? 'financial.recon.match.diffSurplus'
        : 'financial.recon.match.diffDiscount'
      : '',
    totalBRL: centsToBRL(String(extrato)),
  }
}

/**
 * Deriva o TIPO do lançamento manual a partir do texto da transação (payeeName/memo/entryType) quando o
 * backend não o expõe no lookup (#268) e não há tipo da sessão. O `entryType` costuma vir "Other", então
 * a pista real está no payeeName. Ordem importa: "Resgate de aplicação" é RESGATE (não aplicação);
 * "Tarifa de transferência" é TARIFA (não transferência). Sem casamento → null (cai no genérico).
 */
export const deriveManualKindFromTx = (tx: StatementTransaction): ManualEntryType | null => {
  const hay = `${tx.entryType} ${tx.payeeName} ${tx.memo}`.toUpperCase()
  if (hay.includes('RESG') || hay.includes('REDEM') || hay.includes('RETIRAD')) return 'Redemption'
  if (
    hay.includes('TARIF') ||
    hay.includes('FEE') ||
    hay.includes('JUR') ||
    hay.includes('MULTA') ||
    hay.includes('ENCARG')
  )
    return 'FeePenaltyInterest'
  if (hay.includes('APLIC') || hay.includes('INVEST')) return 'Investment'
  if (hay.includes('TRANSF') || hay.includes('XFER') || hay.includes('TED') || hay.includes('PIX'))
    return 'Transfer'
  if (hay.includes('FORNEC') || hay.includes('PAGAMENT') || hay.includes('DANFE') || hay.includes('BOLETO'))
    return 'Payment'
  return null
}

/** Monta a visão do modal de detalhes a partir da transação conciliada (lado extrato = real) + detalhes. */
export const matchDetailsView = (
  tx: StatementTransaction,
  doc: MatchDetailsDoc | null,
  audit: MatchDetailsAudit | null,
  multi: MatchTitlesView | null = null,
  // A FORMA da conciliação vem do `type` da reconciliation (lookup #175), NÃO do status da transação —
  // uma nova transação grava a transação como 'Reconciled' (igual ao match); só o tipo a distingue.
  isManualEntry = false,
  // Tipo específico do lançamento manual (Payment/Transfer/Investment/…), conhecido na sessão. null → genérico.
  manualType: ManualEntryType | null = null,
  // Contraparte (conta de destino ou fornecedor) conhecida na sessão; null → "—" (até o backend, #268).
  counterparty: string | null = null,
  // Valor conciliado de um match 1:1 (1 título): vem do PRÓPRIO lookup (#175 items[0].reconciledValueCents).
  // Acende o "Valor conciliado" do lado Título sem depender do enriquecimento do documento (#172). null → "—".
  singleMatchValueCents: string | null = null,
  // #554/#555: categoria da conciliação (lançamento manual — fatia 1; ou título — fatia 2), resolvida
  // server-side no lookup (#175). Preenche a linha "Categoria" do modal; null/'' → "—".
  category: string | null = null,
): MatchDetailsView => {
  // Tipo efetivo: o da sessão (preciso) ou, na falta, o derivado do texto da transação (#268).
  const effectiveManualType = manualType ?? (isManualEntry ? deriveManualKindFromTx(tx) : null)
  // Movimentação entre contas próprias (transferência/aplicação/resgate): contrapartida, não tarifa/despesa.
  const isSelfMove =
    effectiveManualType === 'Transfer' ||
    effectiveManualType === 'Investment' ||
    effectiveManualType === 'Redemption'
  // Só mostra a linha de contraparte quando há valor real (conta de destino/fornecedor da sessão); sem
  // valor não renderiza "Conta destino: —" (o hint já diz que é entre contas próprias).
  const hasCounterparty = counterparty !== null && counterparty !== ''
  // #554/#555: categoria real do lookup sobrepõe o "—" do doc (aplica ao lançamento manual e ao título 1:1).
  const hasCategory = category !== null && category !== ''
  // Base do lado "Título": manual usa o valor da própria transação; senão o doc enriquecido (ou o valor 1:1).
  const baseDoc: MatchDetailsDoc = isManualEntry
    ? { ...(doc ?? DASH_DOC), valueBRL: centsToBRL(tx.valueCents) }
    : (doc ??
      (singleMatchValueCents !== null
        ? { ...DASH_DOC, valueBRL: centsToBRL(singleMatchValueCents) }
        : DASH_DOC))
  const resolvedDoc: MatchDetailsDoc = hasCategory ? { ...baseDoc, categoria: category } : baseDoc
  return {
    isManualEntry,
    manualKindTag:
      effectiveManualType !== null
        ? `financial.recon.manualType.${effectiveManualType}`
        : 'financial.recon.match.manualKind',
    manualCounterparty: {
      // Transferência/Aplicação/Resgate → conta de destino; Pagamento/Recebimento → fornecedor; senão, sem linha.
      labelTag: !hasCounterparty
        ? ''
        : manualType === 'Transfer' || manualType === 'Investment' || manualType === 'Redemption'
          ? 'financial.recon.match.rowDestAccount'
          : manualType === 'Payment' || manualType === 'Receipt'
            ? 'financial.recon.manual.f.supplier'
            : '',
      value: counterparty ?? MATCH_DASH,
    },
    manualHintTag: isSelfMove
      ? 'financial.recon.match.manualHintTransfer'
      : 'financial.recon.match.manualHint',
    ext: {
      name: tx.payeeName,
      date: formatDayHeader(tx.date),
      kind: tx.entryType,
      id: tx.fitid,
      valueBRL: centsToBRL(tx.valueCents),
    },
    // Nova transação (lançamento manual) não tem título: o "valor conciliado" é o valor da própria
    // transação (a saída inteira foi lançada). A categoria vem do lookup (#554/#555); tipo/descrição
    // ainda dependem do backend (core-api#268).
    doc: resolvedDoc,
    audit: audit ?? DASH_AUDIT,
    multi,
  }
}

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
