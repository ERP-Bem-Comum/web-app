/**
 * ViewModel PURA do relatório "Realizado × Planejado" (ADR-0009, §XI): agrega as linhas cruas em árvore
 * (Centro de Custo → Categoria → Subcategoria), soma as 3 medidas (provisionado/realizado/planejado) por mês
 * e no total, deriva AV% (realizado/planejado, guard ÷0→0), os grand totals do cabeçalho e as agregações dos
 * gráficos (por CC, por mês, realizado-vs-previsto), e monta o CSV. ZERO React/TanStack (o lint barra
 * `react`/`@tanstack/react-*` em `*.view-model.ts`). Testável em node:test.
 *
 * Dinheiro em CENTAVOS inteiros (§IV). A árvore preserva a ORDEM DE INSERÇÃO. Meses: DESC (dez→jan) na
 * matriz; ASC (jan→dez) no gráfico mensal. Sem `throw` nas derivações (§II).
 */
import {
  REALIZADO_X_PLANEJADO_RAW,
  type RawBudgetRow,
  type MonthCell,
} from './data/realizado-x-planejado.placeholder.ts'

/** As 3 medidas de uma célula/linha, em centavos. */
export type Measures = Readonly<{
  provisionadoCents: number
  realizadoCents: number
  planejadoCents: number
}>

/** Uma célula mensal agregada (mês + as 3 medidas). */
export type MonthMeasures = Readonly<{ month: number } & Measures>

/** Profundidade da linha na árvore: 0=Centro de Custo, 1=Categoria, 2=Subcategoria. */
export type BudgetDepth = 0 | 1 | 2

/** Linha da árvore (matriz) já agregada + AV% derivado + série mensal e filhos. */
export type BudgetTreeRow = Readonly<{
  /** chave estável (caminho na árvore) para React key / expand-state. */
  id: string
  name: string
  depth: BudgetDepth
  totals: Measures
  /** realizado/planejado × 100 (0 se planejado 0). */
  avPct: number
  /** série mensal em ORDEM CRESCENTE (0=jan … 11=dez) — a view ordena p/ exibir. */
  months: readonly MonthMeasures[]
  children: readonly BudgetTreeRow[]
}>

/** Fatia agregada para os gráficos (donut por CC / realizado-vs-previsto). */
export type ChartSlice = Readonly<{ id: string; label: string; valueCents: number }>

/** Barra mensal (gráfico de distribuição mensal) — planejado por mês. */
export type MonthBar = Readonly<{ month: number; planejadoCents: number }>

/** Nomes dos 12 meses (0=jan) — a view usa via i18n; aqui só p/ CSV e ordenação. */
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

const emptyMeasures = (): Measures => ({ provisionadoCents: 0, realizadoCents: 0, planejadoCents: 0 })

const addInto = (acc: MonthMeasures[], cell: MonthCell): void => {
  const cur = acc[cell.month]
  acc[cell.month] = {
    month: cell.month,
    provisionadoCents: (cur?.provisionadoCents ?? 0) + cell.provisionadoCents,
    realizadoCents: (cur?.realizadoCents ?? 0) + cell.realizadoCents,
    planejadoCents: (cur?.planejadoCents ?? 0) + cell.planejadoCents,
  }
}

const sumMonths = (acc: MonthMeasures[]): Measures =>
  acc.reduce<Measures>(
    (t, m) => ({
      provisionadoCents: t.provisionadoCents + m.provisionadoCents,
      realizadoCents: t.realizadoCents + m.realizadoCents,
      planejadoCents: t.planejadoCents + m.planejadoCents,
    }),
    emptyMeasures(),
  )

const blankMonthSeries = (): MonthMeasures[] =>
  Array.from({ length: 12 }, (_, month) => ({ month, ...emptyMeasures() }))

const mergeInto = (target: MonthMeasures[], source: readonly MonthMeasures[]): void => {
  for (const m of source) {
    const cur = target[m.month]
    target[m.month] = {
      month: m.month,
      provisionadoCents: (cur?.provisionadoCents ?? 0) + m.provisionadoCents,
      realizadoCents: (cur?.realizadoCents ?? 0) + m.realizadoCents,
      planejadoCents: (cur?.planejadoCents ?? 0) + m.planejadoCents,
    }
  }
}

/** AV% = realizado/planejado × 100. Guard divisão-por-zero → 0 (nunca NaN/Infinity). */
export function computeAvPct(m: Measures): number {
  return m.planejadoCents === 0 ? 0 : (m.realizadoCents / m.planejadoCents) * 100
}

/**
 * Agrega as linhas cruas na árvore CC → Categoria → Subcategoria (ordem de inserção), somando as 3 medidas
 * por mês e no total, e derivando AV% em cada nível.
 */
export function aggregateBudgetTree(raw: readonly RawBudgetRow[]): readonly BudgetTreeRow[] {
  // Estrutura mutável interna (preserva ordem via arrays de chaves).
  interface Node {
    name: string
    order: string[]
    kids: Map<string, Node>
    months: MonthMeasures[]
    depth: BudgetDepth
    id: string
  }
  const makeNode = (name: string, depth: BudgetDepth, id: string): Node => ({
    name,
    order: [],
    kids: new Map(),
    months: blankMonthSeries(),
    depth,
    id,
  })
  const roots: Node = makeNode('__root__', 0, '')
  const getChild = (parent: Node, name: string, depth: BudgetDepth): Node => {
    const existing = parent.kids.get(name)
    if (existing) return existing
    const id = parent.id === '' ? name : `${parent.id} ▸ ${name}`
    const node = makeNode(name, depth, id)
    parent.kids.set(name, node)
    parent.order.push(name)
    return node
  }

  for (const row of raw) {
    const cc = getChild(roots, row.centroCusto, 0)
    const cat = getChild(cc, row.categoria, 1)
    const sub = getChild(cat, row.subcategoria, 2)
    // Soma na folha (subcategoria) e propaga para os ancestrais.
    for (const cell of row.months) {
      addInto(sub.months, cell)
      addInto(cat.months, cell)
      addInto(cc.months, cell)
    }
  }

  const toRow = (node: Node): BudgetTreeRow => {
    const totals = sumMonths(node.months)
    return {
      id: node.id,
      name: node.name,
      depth: node.depth,
      totals,
      avPct: computeAvPct(totals),
      months: node.months,
      children: node.order.map((k) => {
        const child = node.kids.get(k)
        // child sempre existe (foi inserido junto com order) — fallback só p/ satisfazer o tipo sem throw.
        return child ? toRow(child) : makeRowFallback(k)
      }),
    }
  }
  const makeRowFallback = (name: string): BudgetTreeRow => ({
    id: name,
    name,
    depth: 2,
    totals: emptyMeasures(),
    avPct: 0,
    months: blankMonthSeries(),
    children: [],
  })

  return roots.order.map((k) => {
    const cc = roots.kids.get(k)
    return cc ? toRow(cc) : makeRowFallback(k)
  })
}

/** Grand total (soma de todos os centros de custo) das 3 medidas + AV%. */
export type GrandTotal = Readonly<Measures & { avPct: number; months: readonly MonthMeasures[] }>

export function grandTotal(rows: readonly BudgetTreeRow[]): GrandTotal {
  const acc = blankMonthSeries()
  for (const r of rows) mergeInto(acc, r.months)
  const totals = sumMonths(acc)
  return { ...totals, avPct: computeAvPct(totals), months: acc }
}

// ── Agregações dos gráficos ──

/** Planejado por Centro de Custo (donut "Distribuição por Centro de Custo"). */
export function planejadoByCentroCusto(rows: readonly BudgetTreeRow[]): readonly ChartSlice[] {
  return rows.map((r) => ({ id: r.id, label: r.name, valueCents: r.totals.planejadoCents }))
}

/**
 * Top-N centros de custo por Planejado, em ordem DECRESCENTE (gráfico de barras horizontais "Por centro de
 * custo" do mock — mostra os ~6 maiores). Não muta `rows` (copia antes de ordenar §VII). Empates preservam a
 * ordem de inserção (sort estável). `limit` default 6.
 */
export function topCentroCustoByPlanejado(rows: readonly BudgetTreeRow[], limit = 6): readonly ChartSlice[] {
  return [...planejadoByCentroCusto(rows)]
    .sort((a, b) => b.valueCents - a.valueCents)
    .slice(0, Math.max(0, limit))
}

/** Planejado por mês em ordem CRESCENTE (jan→dez) — barras horizontais "Distribuição Mensal". */
export function planejadoByMonth(total: GrandTotal): readonly MonthBar[] {
  return [...total.months]
    .sort((a, b) => a.month - b.month)
    .map((m) => ({ month: m.month, planejadoCents: m.planejadoCents }))
}

/** Realizado / Previsto (Planejado) / Provisionado (donut "Realizado vs Previsto"). */
export function realizadoVsPrevisto(total: GrandTotal): Readonly<Measures> {
  return {
    provisionadoCents: total.provisionadoCents,
    realizadoCents: total.realizadoCents,
    planejadoCents: total.planejadoCents,
  }
}

/**
 * Fonte da tela (front-first): a árvore agregada dos dados PLACEHOLDER. Ponto único pelo qual a View obtém
 * as linhas — mantém a View sem tocar a `data/` (boundary client-ui ↛ client-data). Quando o endpoint do
 * core-api (#114) nascer, esta função passa a receber o DTO real (mesmo shape `RawBudgetRow`).
 */
export function loadBudgetTree(): readonly BudgetTreeRow[] {
  return aggregateBudgetTree(REALIZADO_X_PLANEJADO_RAW)
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

/** Centavos → "R$ 1,2 mi" / "R$ 345 mil" — rótulo curto p/ eixos/legendas (evita sobreposição). */
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

/**
 * AV% no formato do legado: parte inteira + "%", sem casas quando é inteiro; com 1 casa quando fracionário.
 * 0 → "0%"; 63.4 → "63,4%"; 55 → "55%". Guarda valores não-finitos → "0%".
 */
export function formatPercent(pct: number): string {
  if (!Number.isFinite(pct)) return '0%'
  const rounded = Math.round(pct * 10) / 10
  if (Number.isInteger(rounded)) return `${String(rounded)}%`
  return `${rounded.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

/** Percentual de uma fatia sobre o total (para legendas do donut). Guard ÷0 → 0. */
export function sharePercent(valueCents: number, totalCents: number): number {
  return totalCents === 0 ? 0 : (valueCents / totalCents) * 100
}

// ── Export CSV (client-side; fiel ao CSV legado) ──

const CSV_HEADER =
  'Centro de Custo;Categoria;Subcategoria;Nome do Mês;Valor Esperado;Valor Realizado;Valor Provisionado'

/** Centavos → "R$ 1.234,56" para o campo do CSV (mesmo formato do legado). */
function csvMoney(cents: number): string {
  return brlFmt.format(cents / 100)
}

/**
 * Monta o CSV: uma linha por Centro de Custo → Categoria → Subcategoria × MÊS (jan→dez), com as 3 medidas
 * formatadas em BRL. Delimitado por ';'. Percorre a árvore até a folha (subcategoria).
 */
export function buildCsv(rows: readonly RawBudgetRow[] = REALIZADO_X_PLANEJADO_RAW): string {
  const lines: string[] = [CSV_HEADER]
  for (const r of rows) {
    for (const m of [...r.months].sort((a, b) => a.month - b.month)) {
      const mes = MONTH_NAMES_PT[m.month] ?? ''
      lines.push(
        [
          `"${r.centroCusto}"`,
          `"${r.categoria}"`,
          `"${r.subcategoria}"`,
          `"${mes}"`,
          `"${csvMoney(m.planejadoCents)}"`,
          `"${csvMoney(m.realizadoCents)}"`,
          `"${csvMoney(m.provisionadoCents)}"`,
        ].join(';'),
      )
    }
  }
  return lines.join('\r\n')
}

/** Reexporta o shape cru p/ a page passar ao `buildCsv` sem tocar a `data/` diretamente. */
export { REALIZADO_X_PLANEJADO_RAW }
export type { RawBudgetRow }
