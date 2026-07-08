/**
 * ViewModel PURA do relatório "Análise de Pagamentos" (ADR-0009, §XI): matriz TEMPO-orçamentária. Cruza a
 * árvore Plano Orçamentário (nível 0) → Centro de Custo (nível 1) com uma SÉRIE MENSAL de valores (agregado por
 * mês de vencimento). Cada célula é UM valor por mês (não é snapshot de status — isso é a "Posição"). Agrega os
 * valores folha (CC) → Plano → Total do Período, por mês e no total, deriva as agregações dos 2 gráficos
 * (total por Centro de Custo desc; total por mês) e monta o CSV. ZERO React/TanStack (o lint barra `react`/
 * `@tanstack/react-*` em `*.view-model.ts`). Testável em node:test.
 *
 * ── GERAÇÃO DE MESES (à prova de "Invalid Date") ── Os meses do período são derivados de um INTERVALO
 * bem-formado `{start,end}` no formato `YYYY-MM` iterando ano/mês inteiros — NUNCA `new Date(stringInvalida)`.
 * Os rótulos (`Jan/26` …) saem de um array de abreviações POR ÍNDICE de mês (0..11), com fallback seguro; então
 * jamais produzem "Invalid Date" (bug do relatório legado que NÃO reproduzimos). Meses em ordem CRESCENTE.
 *
 * ── FONTE PLUGÁVEL ── quando o core-api (#114/consolidated) subir, `loadAnalise('p'|'r')` troca a fonte: a
 * Análise de RECEBIMENTOS será o ESPELHO (mesmo engine/tela), com placeholder vazio + empty-state, como fizemos
 * na "Posição de Recebimentos". Dinheiro em CENTAVOS inteiros (§IV). Sem `throw` nas derivações (§II).
 */
import {
  ANALISE_PAGAMENTOS_RAW,
  ANALISE_PERIOD,
  type RawAnaliseRow,
  type MonthRange,
} from './data/analise-pagamentos.placeholder.ts'

/** Nível do nó na árvore: plano orçamentário (0) → centro de custo (folha, 1). */
export type AnaliseLevel = 'plano' | 'costCenter'

/**
 * Nó da árvore agregada. `monthCells` mapeia CHAVE de mês (`YYYY-MM`) → valor em centavos (só as chaves do
 * período, completadas com 0). `total` é a soma da série (= soma das células). Shape NEUTRO (serve 'p' e 'r').
 */
export type AnaliseNode = Readonly<{
  /** chave estável (caminho na árvore) para React key / expand-state. */
  id: string
  name: string
  level: AnaliseLevel
  total: number
  monthCells: Readonly<Record<string, number>>
  children: readonly AnaliseNode[]
}>

/** Relatório completo: os planos (raízes) + as chaves de mês (ASC) + o Total do Período (soma geral). */
export type AnaliseReport = Readonly<{
  totalPeriodo: number
  months: readonly string[]
  planos: readonly AnaliseNode[]
}>

/** Tipo de análise: 'p' = Pagamentos · 'r' = Recebimentos (quando o Contas a Receber subir — espelho vazio). */
export type AnaliseType = 'p' | 'r'

/** Total por Centro de Custo (soma da série), para o gráfico de barras "Distribuição por Centro de Custo". */
export type CostCenterTotal = Readonly<{ id: string; name: string; valueCents: number }>

/** Total por mês (soma de todas as folhas no mês), para o gráfico "Distribuição Mensal". */
export type MonthTotal = Readonly<{ key: string; valueCents: number }>

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

/** Nomes por extenso (minúsculos) dos 12 meses — usados no CSV (cabeçalho longo, se preciso). */
export const MONTH_NAMES_PT: readonly string[] = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

/**
 * Faz o parse de uma chave `YYYY-MM` em `{ year, monthIndex }` (monthIndex 0..11). Retorna `null` se a string
 * não for um mês bem-formado (ano de 4 dígitos + mês 01..12) — o chamador decide o fallback. NUNCA usa `Date`.
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
 * Gera as chaves de mês `YYYY-MM` do intervalo `{start,end}` INCLUSIVE, em ordem CRESCENTE, iterando ano/mês
 * inteiros. Se algum extremo for malformado ou `end < start`, retorna `[]` (sem `throw`, sem `Date`). Guard de
 * segurança (limite de 600 meses) para nunca laçar infinito. Esta é a única fonte de meses do relatório.
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
 * ano vira sufixo de 2 dígitos. Se a chave for malformada, retorna a PRÓPRIA chave (fallback honesto) — jamais
 * "Invalid Date". Esta função é o coração da correção do bug legado.
 */
export function formatMonthLabel(key: string): string {
  const parsed = parseMonthKey(key)
  if (parsed === null) return key
  const abbr = MONTH_ABBR_PT[parsed.monthIndex] ?? key
  const yearSuffix = String(parsed.year).slice(-2)
  return `${abbr}/${yearSuffix}`
}

const sumValues = (cells: Readonly<Record<string, number>>): number =>
  Object.values(cells).reduce((acc, v) => acc + v, 0)

/**
 * Agrega as linhas cruas (folhas = Centro de Custo) na árvore Plano → Centro de Custo (ordem de inserção),
 * completando cada série com as chaves do período `months` (chave ausente = 0), somando o total por folha, o
 * subtotal por Plano (por mês e no total) e o Total do Período (soma geral).
 */
export function aggregateAnalise(raw: readonly RawAnaliseRow[], months: readonly string[]): AnaliseReport {
  interface Node {
    name: string
    order: string[]
    kids: Map<string, Node>
    cells: Record<string, number>
    level: AnaliseLevel
    id: string
  }
  const blankCells = (): Record<string, number> => {
    const c: Record<string, number> = {}
    for (const m of months) c[m] = 0
    return c
  }
  const makeNode = (name: string, level: AnaliseLevel, id: string): Node => ({
    name,
    order: [],
    kids: new Map(),
    cells: blankCells(),
    level,
    id,
  })
  const root: Node = makeNode('__root__', 'plano', '')
  const getChild = (parent: Node, name: string, level: AnaliseLevel): Node => {
    const existing = parent.kids.get(name)
    if (existing) return existing
    const id = parent.id === '' ? name : `${parent.id} ▸ ${name}`
    const node = makeNode(name, level, id)
    parent.kids.set(name, node)
    parent.order.push(name)
    return node
  }

  for (const row of raw) {
    const plano = getChild(root, row.plano, 'plano')
    const costCenter = getChild(plano, row.costCenter, 'costCenter')
    // Soma na folha (CC) SÓ os meses do período e propaga ao plano.
    for (const month of months) {
      const value = row.monthValues[month] ?? 0
      costCenter.cells[month] = (costCenter.cells[month] ?? 0) + value
      plano.cells[month] = (plano.cells[month] ?? 0) + value
    }
  }

  const makeNodeFallback = (name: string): AnaliseNode => ({
    id: name,
    name,
    level: 'costCenter',
    total: 0,
    monthCells: blankCells(),
    children: [],
  })
  const toNode = (node: Node): AnaliseNode => ({
    id: node.id,
    name: node.name,
    level: node.level,
    total: sumValues(node.cells),
    monthCells: node.cells,
    children: node.order.map((k) => {
      const child = node.kids.get(k)
      // child sempre existe (inserido junto com order) — fallback só p/ satisfazer o tipo sem throw.
      return child ? toNode(child) : makeNodeFallback(k)
    }),
  })

  const planos = root.order.map((k) => {
    const p = root.kids.get(k)
    return p ? toNode(p) : makeNodeFallback(k)
  })
  const totalPeriodo = planos.reduce((acc, p) => acc + p.total, 0)

  return { totalPeriodo, months, planos }
}

/**
 * Total por Centro de Custo (soma da série de cada folha, COMBINADO por nome entre planos), em ordem
 * DECRESCENTE — fonte do gráfico de barras horizontais "Distribuição por Centro de Custo". Não muta o relatório
 * (§VII). Empates preservam a ordem de 1ª aparição (sort estável).
 */
export function totalByCostCenter(report: AnaliseReport): readonly CostCenterTotal[] {
  const byName = new Map<string, number>()
  const order: string[] = []
  for (const plano of report.planos) {
    for (const cc of plano.children) {
      if (!byName.has(cc.name)) order.push(cc.name)
      byName.set(cc.name, (byName.get(cc.name) ?? 0) + cc.total)
    }
  }
  return order
    .map((name): CostCenterTotal => ({ id: name, name, valueCents: byName.get(name) ?? 0 }))
    .sort((a, b) => b.valueCents - a.valueCents)
}

/**
 * Total por mês (soma de todas as folhas naquele mês), na ordem CRESCENTE de `report.months` — fonte do gráfico
 * "Distribuição Mensal". Cada chave vem do período (bem-formada) → o rótulo derivado é sempre válido.
 */
export function totalByMonth(report: AnaliseReport): readonly MonthTotal[] {
  return report.months.map((key): MonthTotal => {
    const valueCents = report.planos.reduce((acc, p) => acc + (p.monthCells[key] ?? 0), 0)
    return { key, valueCents }
  })
}

/**
 * Fonte da tela (front-first): a árvore agregada dos dados PLACEHOLDER. Ponto ÚNICO pelo qual a View obtém o
 * relatório — mantém a View sem tocar a `data/` (boundary client-ui ↛ client-data).
 *
 * `type` seleciona a fonte com o MESMO shape agregado (engine NEUTRO): `'p'` (Pagamentos) usa
 * `ANALISE_PAGAMENTOS_RAW`; `'r'` (Recebimentos) hoje retorna VAZIO → a árvore vem sem planos e o Total zero
 * (a tela cai no empty state honesto). Quando o Contas a Receber subir, `'r'` mapeará a fonte real neste mesmo
 * shape — as agregações e a View NÃO mudam; só a FONTE e os RÓTULOS (i18n na tela). Sem `throw` (§II).
 */
export function loadAnalise(type: AnaliseType = 'p'): AnaliseReport {
  const months = monthsInRange(ANALISE_PERIOD)
  const raw = type === 'r' ? [] : ANALISE_PAGAMENTOS_RAW
  return aggregateAnalise(raw, months)
}

// ── Formatação ──

const brlFmt = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Centavos → "R$ 1.234,56". */
export function formatBRL(cents: number): string {
  return brlFmt.format(cents / 100)
}

/** Centavos → "R$ 1,2 mi" / "R$ 345 mil" — rótulo curto p/ eixos/legendas (evita transbordo). */
export function formatBRLShort(cents: number): string {
  const reais = cents / 100
  if (Math.abs(reais) >= 1_000_000) {
    return `R$ ${(reais / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  }
  if (Math.abs(reais) >= 1_000) {
    return `R$ ${(reais / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`
  }
  return `R$ ${reais.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
}

/** Percentual "63,4%" / "55%" — sem casas quando inteiro; 1 casa quando fracionário. Guard não-finito → "0%". */
export function formatPercent(pct: number): string {
  if (!Number.isFinite(pct)) return '0%'
  const rounded = Math.round(pct * 10) / 10
  if (Number.isInteger(rounded)) return `${String(rounded)}%`
  return `${rounded.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

/** % de uma fatia sobre o total (largura das barras / legenda). Guard ÷0 → 0. */
export function sharePercent(valueCents: number, totalCents: number): number {
  return totalCents === 0 ? 0 : (valueCents / totalCents) * 100
}

// ── Export CSV (client-side; header pt-BR + uma coluna por mês) ──

/** Header base do CSV (fixo). As colunas de mês são acrescentadas por `buildCsvHeader`. */
export const CSV_HEADER_BASE = 'Plano Orçamentário;Centro de custo;Total'

/**
 * Header completo do CSV: base + uma coluna por mês (rótulo `Jan/26` …), na ordem do período. Delimitado por
 * ';'. Os rótulos de mês vêm de `formatMonthLabel` (sempre válidos — nunca "Invalid Date").
 */
export function buildCsvHeader(months: readonly string[]): string {
  const monthCols = months.map((m) => formatMonthLabel(m))
  return [CSV_HEADER_BASE, ...monthCols].join(';')
}

/**
 * Monta o CSV: uma linha por FOLHA (Plano → Centro de Custo), com o Total e um valor por mês (na ordem do
 * período), todos em BRL. Delimitado por ';'. Percorre a árvore agregada até a folha (Centro de Custo).
 */
export function buildCsv(report: AnaliseReport = loadAnalise('p')): string {
  const lines: string[] = [buildCsvHeader(report.months)]
  for (const plano of report.planos) {
    for (const cc of plano.children) {
      const monthCells = cc.monthCells
      const cols = report.months.map((m) => `"${formatBRL(monthCells[m] ?? 0)}"`)
      lines.push([`"${plano.name}"`, `"${cc.name}"`, `"${formatBRL(cc.total)}"`, ...cols].join(';'))
    }
  }
  return lines.join('\r\n')
}

/** Reexporta o shape do período p/ a page/testes sem tocar a `data/` diretamente. */
export { ANALISE_PERIOD }
export type { MonthRange, RawAnaliseRow }
