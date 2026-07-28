/**
 * ViewModel PURA do relatório "Fluxo de Caixa" (ADR-0009, §XI): duas SEÇÕES — Saídas (payables + cartão) e
 * Entradas (receivables). Cada seção é uma árvore Categoria → Subcategoria (folha) com 2 MEDIDAS: Realizado
 * (REALIZED) × Previsto (EXPECTED), somadas folha → categoria → total da seção. O SALDO = Entradas − Saídas
 * (por medida). Deriva também a série mensal "por vencimento" (Entradas × Saídas por mês) do gráfico e monta
 * o CSV. ZERO React/TanStack (o lint barra `react`/`@tanstack/react-*` em `*.view-model.ts`). node:test-ável.
 *
 * ── GERAÇÃO DE MESES (à prova de "Invalid Date") ── os meses do período vêm de um INTERVALO bem-formado
 * `{start,end}` (`YYYY-MM`) iterando ano/mês inteiros — NUNCA `new Date(stringInvalida)`. Os rótulos (`Jan/26`)
 * saem de um array de abreviações POR ÍNDICE (0..11). É o mesmo blindado da "Análise" (bug legado NÃO reproduzido).
 *
 * ── EMPTY-STATE PLUGÁVEL ── a seção Entradas é independente: hoje `receivables` é SEMPRE `[]` (financial é
 * payables-centric), então a seção vem vazia (0 categorias, total 0) → a View cai no empty state ("Nenhuma
 * entrada registrada") SEM quebrar Saídas; o Saldo passa a ser `0 − Saídas`. Quando o Contas a Receber subir,
 * é só a fonte entrar. Dinheiro em CENTAVOS inteiros (§IV). Árvore preserva a ORDEM DE INSERÇÃO. Sem `throw` (§II).
 */
import type { CashflowRow, CashflowChartRow, CashflowCostCenter } from './data/model/cashflow.model.ts'

/** Intervalo do período (mês-01), formato `YYYY-MM`. A geração de meses deriva as chaves daqui. */
export type MonthRange = Readonly<{ start: string; end: string }>

/**
 * Uma linha CRUA = uma FOLHA da árvore de uma seção (Categoria → Subcategoria) + o mês de vencimento + as 2
 * medidas em CENTAVOS. Várias folhas podem compartilhar Categoria/Subcategoria em meses diferentes — a árvore
 * soma; o gráfico "linha do tempo" agrupa por `month`. A árvore (Slice A) ignora `month`; a série (Slice B) usa.
 */
export type RawFluxoLeaf = Readonly<{
  category: string
  subcategory: string
  /** Mês de vencimento (`YYYY-MM`) — fonte da série "linha do tempo". `''` quando a folha não é datada (árvore). */
  month: string
  realizedCents: number
  expectedCents: number
}>

/** Rótulos de fallback quando o core-api devolve categoria/subcategoria sem nome (ref/nome null). */
const SEM_CATEGORIA = 'Sem categoria'
const SEM_SUBCATEGORIA = 'Sem subcategoria'

/** Nível do nó na árvore de uma seção: categoria (0) → subcategoria (folha, 1). */
export type FluxoLevel = 'category' | 'subcategory'

/** As 2 medidas de um nó, em centavos. Ordem canônica de exibição (colunas/CSV): Realizado → Previsto. */
export type FluxoMeasures = Readonly<{
  realizedCents: number
  expectedCents: number
}>

/** Nó da árvore agregada (com as 2 medidas somadas + filhos). Shape NEUTRO (serve Saídas e Entradas). */
export type FluxoNode = Readonly<{
  /** chave estável (caminho na árvore) para React key / expand-state. */
  id: string
  name: string
  level: FluxoLevel
  measures: FluxoMeasures
  children: readonly FluxoNode[]
}>

/** Uma seção do relatório: as categorias (raízes) + os totais das 2 medidas. */
export type FluxoSection = Readonly<{
  categories: readonly FluxoNode[]
  totals: FluxoMeasures
}>

/** Ponto da série mensal "por vencimento": mês + rótulo + realizado de Entradas e de Saídas nesse mês. */
export type MonthlyFlow = Readonly<{
  key: string
  /** Rótulo do mês já formatado (ex.: "Jan/26") — sempre válido (vem daqui). */
  label: string
  entradasCents: number
  saidasCents: number
}>

/**
 * Ponto da série "linha do tempo" (Previsto/Esperado × Realizado × Saldo por PERÍODO, mês por vencimento). Para
 * o mês m, somando as folhas das 2 seções cujo `month` bate:
 *   • `previstoCents`  = Σ expectedCents (Entradas ∪ Saídas) — total PREVISTO movimentado no mês.
 *   • `realizadoCents` = Σ realizedCents (Entradas ∪ Saídas) — total REALIZADO movimentado no mês.
 *   • `saldoCents`     = Σ realizedCents(Entradas) − Σ realizedCents(Saídas) — Saldo do período (pode negativar).
 * As 3 séries são DISTINTAS (Previsto/Realizado = movimentação bruta; Saldo = líquido Entradas − Saídas). O
 * rótulo vem por ÍNDICE (`formatMonthLabel`) — nunca "Invalid Date".
 */
export type TimelinePoint = Readonly<{
  key: string
  label: string
  previstoCents: number
  realizadoCents: number
  saldoCents: number
}>

/** Barra do gráfico "Agrupado por Centro de Custo": o CC + as 2 medidas (Previsto × Realizado) agregadas. */
export type CostCenterMeasure = Readonly<{
  label: string
  previstoCents: number
  realizadoCents: number
}>

/** Fatia do donut Previsto × Realizado de uma seção (chave da medida + valor em centavos). */
export type SectionDonumSlice = Readonly<{ key: 'previsto' | 'realizado'; valueCents: number }>

// ── Demonstrativo de fluxo de caixa (statement por mês) ──────────────────────────
// Célula = as 2 medidas (Realizado × Previsto) de uma (linha, mês). Item = uma categoria com uma célula por
// mês + total. Seção = itens + totais por mês + total geral. O statement acrescenta Fluxo líquido (Entradas −
// Saídas por mês) e Saldo inicial/acumulado (corrida). Tudo em CENTAVOS inteiros (§IV).

/** As 2 medidas de uma célula do demonstrativo (um mês de uma linha). */
export type StatementCell = Readonly<{ realizedCents: number; expectedCents: number }>

/** Uma linha-item do demonstrativo (categoria): células por mês (alinhadas a `months`) + total. */
export type StatementItem = Readonly<{
  name: string
  byMonth: readonly StatementCell[]
  total: StatementCell
}>

/** Uma seção do demonstrativo (Entradas ou Saídas): itens + totais por mês + total geral. */
export type StatementSection = Readonly<{
  items: readonly StatementItem[]
  totalByMonth: readonly StatementCell[]
  total: StatementCell
}>

/**
 * Demonstrativo completo: as 2 seções + Fluxo líquido (Entradas − Saídas por mês) + Saldo inicial (corrida
 * ANTES do mês) e Saldo acumulado (corrida DEPOIS). Cada linha carrega as 2 medidas por mês (2 subcolunas na UI).
 */
export type FluxoStatement = Readonly<{
  months: readonly string[]
  entradas: StatementSection
  saidas: StatementSection
  saldoInicial: readonly StatementCell[]
  liquido: readonly StatementCell[]
  liquidoTotal: StatementCell
  saldoAcumulado: readonly StatementCell[]
}>

/**
 * Relatório completo: as 2 seções + o Saldo (Entradas − Saídas por medida) + os meses + as séries derivadas:
 * `monthly` (barras por vencimento), `timeline` (Previsto/Realizado/Saldo no tempo) e `byCostCenter` (Previsto ×
 * Realizado por Centro de Custo — RECONSTRUÍDO pelo BFF via fan-out, já que o #590 não expõe CC como eixo).
 */
export type FluxoReport = Readonly<{
  saidas: FluxoSection
  entradas: FluxoSection
  saldo: FluxoMeasures
  months: readonly string[]
  monthly: readonly MonthlyFlow[]
  timeline: readonly TimelinePoint[]
  byCostCenter: readonly CostCenterMeasure[]
  /** Demonstrativo de fluxo de caixa (statement por mês) — a tabela principal da tela. */
  statement: FluxoStatement
}>

/** Seção do relatório: 'saidas' (payables/cartão) ou 'entradas' (receivables). */
export type FluxoSectionKind = 'saidas' | 'entradas'

// ── Geração de meses (blindada contra "Invalid Date" — NUNCA `Date`) ──

/** Abreviações Title-case dos 12 meses (0=jan … 11=dez) — o rótulo do mês sai daqui POR ÍNDICE. */
export const MONTH_ABBR_PT: readonly string[] = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

/**
 * Parse de `YYYY-MM` em `{ year, monthIndex }` (monthIndex 0..11). `null` se malformado (ano 4 díg + mês
 * 01..12). NUNCA usa `Date`.
 */
function parseMonthKey(key: string): { year: number; monthIndex: number } | null {
  const parts = key.split('-')
  if (parts.length !== 2) return null
  const yearPart = parts[0]
  const monthPart = parts[1]
  if (yearPart === undefined || monthPart === undefined) return null
  if (!/^\d{4}$/.test(yearPart) || !/^\d{2}$/.test(monthPart)) return null
  const year = Number(yearPart)
  const month = Number(monthPart)
  if (month < 1 || month > 12) return null
  return { year, monthIndex: month - 1 }
}

/** Formata a chave de 2 dígitos do mês (1..12 → `01`..`12`). */
function pad2(n: number): string {
  return n < 10 ? `0${String(n)}` : String(n)
}

/**
 * Gera as chaves `YYYY-MM` do intervalo INCLUSIVE, em ordem CRESCENTE, iterando ano/mês inteiros. Extremo
 * malformado ou `end < start` → `[]`. Guard de 600 meses (nunca laço infinito). Sem `throw`, sem `Date`.
 */
export function monthsInRange(range: MonthRange): readonly string[] {
  const from = parseMonthKey(range.start)
  const to = parseMonthKey(range.end)
  if (from === null || to === null) return []
  const startOrdinal = from.year * 12 + from.monthIndex
  const endOrdinal = to.year * 12 + to.monthIndex
  if (endOrdinal < startOrdinal) return []
  const out: string[] = []
  const MAX_MONTHS = 600
  for (let ord = startOrdinal; ord <= endOrdinal && out.length < MAX_MONTHS; ord++) {
    const year = Math.floor(ord / 12)
    const monthIndex = ord % 12
    out.push(`${String(year)}-${pad2(monthIndex + 1)}`)
  }
  return out
}

/**
 * Rótulo curto do mês a partir da chave `YYYY-MM`: `Jan/26`. A abreviação sai do array POR ÍNDICE (0..11) e o
 * ano vira sufixo de 2 dígitos. Chave malformada → a própria chave (fallback honesto) — jamais "Invalid Date".
 */
export function formatMonthLabel(key: string): string {
  const parsed = parseMonthKey(key)
  if (parsed === null) return key
  const abbr = MONTH_ABBR_PT[parsed.monthIndex] ?? key
  const yearSuffix = String(parsed.year).slice(-2)
  return `${abbr}/${yearSuffix}`
}

// ── Agregação ──

const emptyMeasures = (): FluxoMeasures => ({ realizedCents: 0, expectedCents: 0 })

const addMeasures = (a: FluxoMeasures, b: FluxoMeasures): FluxoMeasures => ({
  realizedCents: a.realizedCents + b.realizedCents,
  expectedCents: a.expectedCents + b.expectedCents,
})

/** Total (soma das 2 medidas) de um nó — usado por KPIs/participação. */
export function measureTotal(m: FluxoMeasures): number {
  return m.realizedCents + m.expectedCents
}

const leafMeasures = (row: RawFluxoLeaf): FluxoMeasures => ({
  realizedCents: row.realizedCents,
  expectedCents: row.expectedCents,
})

/**
 * Agrega as folhas de UMA seção na árvore Categoria → Subcategoria (ordem de inserção), somando as 2 medidas
 * de baixo para cima. Cada folha (subcategoria) recebe as medidas da sua linha; a categoria soma os filhos; o
 * total da seção soma as categorias. Fonte vazia → seção vazia (0 categorias, total 0).
 */
export function aggregateSection(raw: readonly RawFluxoLeaf[]): FluxoSection {
  interface Node {
    name: string
    order: string[]
    kids: Map<string, Node>
    measures: FluxoMeasures
    level: FluxoLevel
    id: string
  }
  const makeNode = (name: string, level: FluxoLevel, id: string): Node => ({
    name,
    order: [],
    kids: new Map(),
    measures: emptyMeasures(),
    level,
    id,
  })
  const root: Node = makeNode('__root__', 'category', '')
  const getChild = (parent: Node, name: string, level: FluxoLevel): Node => {
    const existing = parent.kids.get(name)
    if (existing) return existing
    const id = parent.id === '' ? name : `${parent.id} ▸ ${name}`
    const node = makeNode(name, level, id)
    parent.kids.set(name, node)
    parent.order.push(name)
    return node
  }

  for (const row of raw) {
    const leaf = leafMeasures(row)
    const category = getChild(root, row.category, 'category')
    const subcategory = getChild(category, row.subcategory, 'subcategory')
    subcategory.measures = addMeasures(subcategory.measures, leaf)
    category.measures = addMeasures(category.measures, leaf)
  }

  const makeNodeFallback = (name: string): FluxoNode => ({
    id: name,
    name,
    level: 'subcategory',
    measures: emptyMeasures(),
    children: [],
  })
  const toNode = (node: Node): FluxoNode => ({
    id: node.id,
    name: node.name,
    level: node.level,
    measures: node.measures,
    children: node.order.map((k) => {
      const child = node.kids.get(k)
      // child sempre existe (inserido junto com order) — fallback só p/ satisfazer o tipo sem throw.
      return child ? toNode(child) : makeNodeFallback(k)
    }),
  })

  const categories = root.order.map((k) => {
    const c = root.kids.get(k)
    return c ? toNode(c) : makeNodeFallback(k)
  })
  const totals = categories.reduce<FluxoMeasures>((acc, c) => addMeasures(acc, c.measures), emptyMeasures())

  return { categories, totals }
}

/** Saldo = Entradas − Saídas (por medida). Pode ficar NEGATIVO (saídas > entradas) — a View colore. */
export function computeSaldo(entradas: FluxoSection, saidas: FluxoSection): FluxoMeasures {
  return {
    realizedCents: entradas.totals.realizedCents - saidas.totals.realizedCents,
    expectedCents: entradas.totals.expectedCents - saidas.totals.expectedCents,
  }
}

/**
 * Série mensal "por vencimento" (Entradas × Saídas por mês, em REALIZADO), na ordem CRESCENTE de `months`.
 * Cada mês soma o `realizedCents` das folhas cujo `month` bate. Meses sem movimento ficam com 0. Rótulo
 * derivado por índice (sempre válido). Quando Entradas = [], a série de entradas fica toda 0 (chart só Saídas).
 */
export function monthlyFlow(
  saidasRaw: readonly RawFluxoLeaf[],
  entradasRaw: readonly RawFluxoLeaf[],
  months: readonly string[],
): readonly MonthlyFlow[] {
  const saidasByMonth = new Map<string, number>(months.map((m) => [m, 0]))
  const entradasByMonth = new Map<string, number>(months.map((m) => [m, 0]))
  for (const row of saidasRaw) {
    if (saidasByMonth.has(row.month)) {
      saidasByMonth.set(row.month, (saidasByMonth.get(row.month) ?? 0) + row.realizedCents)
    }
  }
  for (const row of entradasRaw) {
    if (entradasByMonth.has(row.month)) {
      entradasByMonth.set(row.month, (entradasByMonth.get(row.month) ?? 0) + row.realizedCents)
    }
  }
  return months.map((key) => ({
    key,
    label: formatMonthLabel(key),
    entradasCents: entradasByMonth.get(key) ?? 0,
    saidasCents: saidasByMonth.get(key) ?? 0,
  }))
}

/**
 * Série "linha do tempo" (Previsto/Esperado × Realizado × Saldo por PERÍODO), na ordem CRESCENTE de `months`.
 * Ver `TimelinePoint`: Previsto/Realizado = movimentação BRUTA do mês (Entradas ∪ Saídas, por medida); Saldo =
 * LÍQUIDO realizado (Entradas − Saídas), podendo negativar. Meses sem movimento ficam com 0. Quando Entradas =
 * [], as entradas somam 0 (o Saldo passa a ser −Saídas realizadas). Rótulo por índice (sempre válido).
 */
export function buildTimeline(
  saidasRaw: readonly RawFluxoLeaf[],
  entradasRaw: readonly RawFluxoLeaf[],
  months: readonly string[],
): readonly TimelinePoint[] {
  interface Acc {
    saidasReal: number
    saidasExp: number
    entradasReal: number
    entradasExp: number
  }
  const zero = (): Acc => ({ saidasReal: 0, saidasExp: 0, entradasReal: 0, entradasExp: 0 })
  const byMonth = new Map<string, Acc>(months.map((m) => [m, zero()]))
  for (const row of saidasRaw) {
    const acc = byMonth.get(row.month)
    if (acc) {
      acc.saidasReal += row.realizedCents
      acc.saidasExp += row.expectedCents
    }
  }
  for (const row of entradasRaw) {
    const acc = byMonth.get(row.month)
    if (acc) {
      acc.entradasReal += row.realizedCents
      acc.entradasExp += row.expectedCents
    }
  }
  return months.map((key) => {
    const a = byMonth.get(key) ?? zero()
    return {
      key,
      label: formatMonthLabel(key),
      previstoCents: a.entradasExp + a.saidasExp,
      realizadoCents: a.entradasReal + a.saidasReal,
      saldoCents: a.entradasReal - a.saidasReal,
    }
  })
}

/**
 * Dados das 2 fatias do donut Previsto × Realizado de uma seção (a partir dos `totals` já agregados). Quando a
 * seção vem vazia, ambos os valores são 0 → o donut cai no empty-state honesto (total ≤ 0). Ordem: Previsto,
 * Realizado.
 */
export function sectionDonutData(section: FluxoSection): readonly SectionDonumSlice[] {
  return [
    { key: 'previsto', valueCents: section.totals.expectedCents },
    { key: 'realizado', valueCents: section.totals.realizedCents },
  ]
}

// ── Demonstrativo (statement) — derivação PURA a partir das folhas datadas por mês ──

const zeroCell = (): StatementCell => ({ realizedCents: 0, expectedCents: 0 })
const addCell = (a: StatementCell, b: StatementCell): StatementCell => ({
  realizedCents: a.realizedCents + b.realizedCents,
  expectedCents: a.expectedCents + b.expectedCents,
})
const subCell = (a: StatementCell, b: StatementCell): StatementCell => ({
  realizedCents: a.realizedCents - b.realizedCents,
  expectedCents: a.expectedCents - b.expectedCents,
})

/**
 * Agrega folhas datadas (categoria × mês) numa SEÇÃO do demonstrativo: uma linha-item por CATEGORIA (ordem de
 * inserção), com uma célula por mês (alinhada a `months`) + totais. Folha de mês fora de `months` é ignorada.
 */
export function buildStatementSection(
  leaves: readonly RawFluxoLeaf[],
  months: readonly string[],
): StatementSection {
  const idxOf = new Map(months.map((m, i) => [m, i]))
  const order: string[] = []
  const byCat = new Map<string, StatementCell[]>()
  for (const l of leaves) {
    const mi = idxOf.get(l.month)
    if (mi === undefined) continue
    let arr = byCat.get(l.category)
    if (arr === undefined) {
      arr = months.map(() => zeroCell())
      byCat.set(l.category, arr)
      order.push(l.category)
    }
    arr[mi] = addCell(arr[mi] ?? zeroCell(), {
      realizedCents: l.realizedCents,
      expectedCents: l.expectedCents,
    })
  }
  const items: readonly StatementItem[] = order.map((name) => {
    const arr = byCat.get(name) ?? months.map(() => zeroCell())
    return { name, byMonth: arr, total: arr.reduce(addCell, zeroCell()) }
  })
  const totalByMonth = months.map((_m, mi) =>
    items.reduce((acc, it) => addCell(acc, it.byMonth[mi] ?? zeroCell()), zeroCell()),
  )
  return { items, totalByMonth, total: totalByMonth.reduce(addCell, zeroCell()) }
}

/**
 * Monta o demonstrativo: as 2 seções + Fluxo líquido (Entradas − Saídas por mês, nas 2 medidas) + Saldo inicial
 * (corrida ANTES do mês, começando em 0) e Saldo acumulado (corrida DEPOIS). Sem `throw` (§II).
 */
export function buildStatement(
  entradasLeaves: readonly RawFluxoLeaf[],
  saidasLeaves: readonly RawFluxoLeaf[],
  months: readonly string[],
): FluxoStatement {
  const entradas = buildStatementSection(entradasLeaves, months)
  const saidas = buildStatementSection(saidasLeaves, months)
  const liquido = months.map((_m, mi) =>
    subCell(entradas.totalByMonth[mi] ?? zeroCell(), saidas.totalByMonth[mi] ?? zeroCell()),
  )
  const saldoInicial: StatementCell[] = []
  const saldoAcumulado: StatementCell[] = []
  let acc = zeroCell()
  for (const l of liquido) {
    saldoInicial.push(acc)
    acc = addCell(acc, l)
    saldoAcumulado.push(acc)
  }
  return {
    months,
    entradas,
    saidas,
    saldoInicial,
    liquido,
    liquidoTotal: liquido.reduce(addCell, zeroCell()),
    saldoAcumulado,
  }
}

/**
 * Recorta o demonstrativo à janela de meses [fromIdx, toIdx] (inclusive), RECOMPUTANDO os totais (item/seção/
 * líquido) sobre os meses visíveis. O Saldo inicial do 1º mês visível JÁ é a corrida ANTES dele (preserva a
 * continuidade do saldo mesmo escondendo meses anteriores). Índices são clampados; janela inválida → vazia.
 */
export function sliceStatement(s: FluxoStatement, fromIdx: number, toIdx: number): FluxoStatement {
  const last = s.months.length - 1
  const lo = Math.max(0, Math.min(fromIdx, last < 0 ? 0 : last))
  const hi = Math.max(lo, Math.min(toIdx, last < 0 ? 0 : last))
  const pick = <T>(arr: readonly T[]): T[] => arr.slice(lo, hi + 1)
  const sliceSection = (sec: StatementSection): StatementSection => {
    const items = sec.items.map((it): StatementItem => {
      const byMonth = pick(it.byMonth)
      return { name: it.name, byMonth, total: byMonth.reduce(addCell, zeroCell()) }
    })
    const totalByMonth = pick(sec.totalByMonth)
    return { items, totalByMonth, total: totalByMonth.reduce(addCell, zeroCell()) }
  }
  const liquido = pick(s.liquido)
  return {
    months: pick(s.months),
    entradas: sliceSection(s.entradas),
    saidas: sliceSection(s.saidas),
    saldoInicial: pick(s.saldoInicial),
    liquido,
    liquidoTotal: liquido.reduce(addCell, zeroCell()),
    saldoAcumulado: pick(s.saldoAcumulado),
  }
}

/**
 * Monta o relatório a partir das duas fontes cruas + o intervalo de meses (engine puro, testável — Entradas =
 * [] → Saldo). `byCostCenter` = [] aqui: o eixo de CC vem do fan-out do BFF (`buildReportFromCashflow`), não
 * das folhas (que não carregam CC).
 */
export function buildReport(
  saidasRaw: readonly RawFluxoLeaf[],
  entradasRaw: readonly RawFluxoLeaf[],
  range: MonthRange,
): FluxoReport {
  const months = monthsInRange(range)
  const saidas = aggregateSection(saidasRaw)
  const entradas = aggregateSection(entradasRaw)
  return {
    saidas,
    entradas,
    saldo: computeSaldo(entradas, saidas),
    months,
    monthly: monthlyFlow(saidasRaw, entradasRaw, months),
    timeline: buildTimeline(saidasRaw, entradasRaw, months),
    byCostCenter: [],
    statement: buildStatement(entradasRaw, saidasRaw, months),
  }
}

// ── Fonte REAL (#590) ────────────────────────────────────────────────────────────

/** CashflowRow (Slice A) → folha da ÁRVORE (sem mês; a árvore ignora `month`). Nome null → sentinela honesta. */
function payableToLeaf(r: CashflowRow): RawFluxoLeaf {
  return {
    category: r.categoryName ?? SEM_CATEGORIA,
    subcategory: r.subcategoryName ?? SEM_SUBCATEGORIA,
    month: '',
    realizedCents: r.realizedCents,
    expectedCents: r.expectedCents,
  }
}

/** CashflowChartRow (Slice B) → folha DATADA (mês do vencimento) para a série temporal. */
function chartRowToLeaf(r: CashflowChartRow): RawFluxoLeaf {
  return {
    category: r.categoryName ?? SEM_CATEGORIA,
    subcategory: r.subcategoryName ?? SEM_SUBCATEGORIA,
    month: r.dueMonth,
    realizedCents: r.realizedCents,
    expectedCents: r.expectedCents,
  }
}

/**
 * Intervalo [min, max] dos meses PRESENTES na série (chaves `YYYY-MM` bem-formadas ordenam lexicograficamente).
 * Sem mês válido → `null` (a série cai vazia). NUNCA usa `Date` (mesmo blindado da geração de meses).
 */
function rangeFromChart(chart: readonly CashflowChartRow[]): MonthRange | null {
  let min: string | null = null
  let max: string | null = null
  for (const r of chart) {
    if (!/^\d{4}-\d{2}$/.test(r.dueMonth)) continue
    if (min === null || r.dueMonth < min) min = r.dueMonth
    if (max === null || r.dueMonth > max) max = r.dueMonth
  }
  return min !== null && max !== null ? { start: min, end: max } : null
}

/** Corte por CC do BFF (fan-out) → barra do gráfico (`CostCenterMeasure`). O BFF já entrega ordenado. */
function costCenterToMeasure(cc: CashflowCostCenter): CostCenterMeasure {
  return { label: cc.name, previstoCents: cc.expectedCents, realizadoCents: cc.realizedCents }
}

/**
 * Fonte REAL da tela (#590): a árvore Saídas vem do Slice A (payables, agregado por Categoria × Subcategoria,
 * sem mês); a série temporal (`monthly`/`timeline`) vem do Slice B (chart, com mês); o eixo de Centro de Custo
 * (`byCostCenter`) vem do fan-out do BFF (o #590 não o expõe). Entradas = SEMPRE vazia (receivables `[]`,
 * financial é payables-centric) → cai no empty-state honesto; o Saldo passa a ser `0 − Saídas`. Os meses saem
 * do MIN..MAX presente na série (sem `Date`). Sem `throw` (§II).
 */
export function buildReportFromCashflow(
  payables: readonly CashflowRow[],
  chart: readonly CashflowChartRow[],
  byCostCenter: readonly CashflowCostCenter[],
): FluxoReport {
  const saidas = aggregateSection(payables.map(payableToLeaf))
  const entradas = aggregateSection([])
  const chartLeaves = chart.map(chartRowToLeaf)
  const range = rangeFromChart(chart)
  const months = range === null ? [] : monthsInRange(range)
  return {
    saidas,
    entradas,
    saldo: computeSaldo(entradas, saidas),
    months,
    monthly: monthlyFlow(chartLeaves, [], months),
    timeline: buildTimeline(chartLeaves, [], months),
    byCostCenter: byCostCenter.map(costCenterToMeasure),
    // Demonstrativo: Saídas com o eixo de mês (chart); Entradas vazio (receivables []) até o A-Receber subir.
    statement: buildStatement([], chartLeaves, months),
  }
}

// ── Formatação ──

const brlFmt = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Centavos → "R$ 1.234,56" (aceita negativo: "-R$ 1.234,56"). */
export function formatBRL(cents: number): string {
  return brlFmt.format(cents / 100)
}

const amountFmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Centavos → "1.234,56" SEM o símbolo "R$" (colunas densas do demonstrativo; o cabeçalho já diz "valores em R$"). */
export function formatAmount(cents: number): string {
  return amountFmt.format(cents / 100)
}

/**
 * Percentual "63,4%" / "55%" — sem casas quando inteiro; 1 casa quando fracionário. Guard não-finito → "0%".
 * Usado no rótulo central/tooltip dos donuts (execução = realizado ÷ previsto).
 */
export function formatPercent(pct: number): string {
  if (!Number.isFinite(pct)) return '0%'
  const rounded = Math.round(pct * 10) / 10
  if (Number.isInteger(rounded)) return `${String(rounded)}%`
  return `${rounded.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

/** % de execução de uma seção (realizado ÷ previsto, 0–100). Guard ÷0 → 0. */
export function executionPercent(section: FluxoSection): number {
  const expected = section.totals.expectedCents
  return expected === 0 ? 0 : (section.totals.realizedCents / expected) * 100
}

/** Centavos → "R$ 1,2 mi" / "R$ 345 mil" — rótulo curto p/ eixos/KPIs (evita transbordo). Preserva o sinal. */
export function formatBRLShort(cents: number): string {
  const reais = cents / 100
  const sign = reais < 0 ? '-' : ''
  const abs = Math.abs(reais)
  if (abs >= 1_000_000) {
    return `${sign}R$ ${(abs / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  }
  if (abs >= 1_000) {
    return `${sign}R$ ${(abs / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`
  }
  return `${sign}R$ ${abs.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
}

// ── Export CSV (client-side; header pt-BR fiel às 2 medidas por seção) ──

/** Header pt-BR do CSV (uma coluna de Seção para diferenciar Saídas × Entradas). */
export const CSV_HEADER = 'Seção;Categoria;Subcategoria;Realizado;Previsto'

/** Percorre as folhas de uma seção emitindo as linhas do CSV (rótulo da seção + Cat/Sub + 2 medidas em BRL). */
function sectionCsvLines(sectionLabel: string, section: FluxoSection): readonly string[] {
  const lines: string[] = []
  for (const category of section.categories) {
    for (const subcategory of category.children) {
      lines.push(
        [
          `"${sectionLabel}"`,
          `"${category.name}"`,
          `"${subcategory.name}"`,
          `"${formatBRL(subcategory.measures.realizedCents)}"`,
          `"${formatBRL(subcategory.measures.expectedCents)}"`,
        ].join(';'),
      )
    }
  }
  return lines
}

/**
 * Monta o CSV: uma linha por FOLHA (subcategoria) de cada seção, com a Seção + Categoria + Subcategoria + as 2
 * medidas em BRL (Realizado · Previsto). Saídas primeiro, depois Entradas. Delimitado por ';'. Os rótulos das
 * seções são parametrizáveis (i18n na page); o CORPO é idêntico. `\r\n` como no legado.
 */
export function buildCsv(report: FluxoReport, saidasLabel = 'Saídas', entradasLabel = 'Entradas'): string {
  const lines: string[] = [CSV_HEADER]
  lines.push(...sectionCsvLines(saidasLabel, report.saidas))
  lines.push(...sectionCsvLines(entradasLabel, report.entradas))
  return lines.join('\r\n')
}
