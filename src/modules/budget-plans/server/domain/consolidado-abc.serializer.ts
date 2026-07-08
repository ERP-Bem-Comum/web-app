/**
 * Serializador PURO do Consolidado ABC → CSV (§II sem throw, §XI lógica no domínio). Espelha byte-a-byte a
 * amostra oficial (`HANDBOOK-plano-orcamentario-consolidado-abc-export-exemplo.csv`):
 *
 *   Header (16 colunas): "Centro de Custo","Categoria","Subcategoria","Janeiro"…"Dezembro","Total"
 *   Por Centro de Custo: 1 linha de GRUPO (nome do CC, meses vazios, total do CC), seguida das linhas de
 *     Categoria (Categoria, 12 meses, total) e, quando houver, das linhas de Subcategoria.
 *   Linha final TOTAL: soma coluna-a-coluna dos meses + total geral.
 *
 * Valores em BRL pt-BR a partir de centavos (§IV) via `Intl.NumberFormat` — o mesmo formato do handbook,
 * inclusive o espaço não-quebrável (U+00A0) após "R$" (nada a normalizar). Campos entre aspas duplas,
 * delimitados por vírgula; linhas separadas por LF (a amostra real usa LF, sem newline final).
 */
import type { ConsolidatedAbc, MonthlyCents } from '#modules/budget-plans/server/domain/consolidado-abc.io.ts'

const MONTH_HEADERS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

const MONTHS = MONTH_HEADERS.length // 12

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Centavos (inteiros) → string BRL (ex.: 1064553000 → "R$ 10.645.530,00"). */
const brl = (cents: number): string => BRL.format(cents / 100)

/** Escapa um campo CSV (RFC 4180): envolve em aspas duplas e dobra aspas internas. */
const quote = (field: string): string => `"${field.replaceAll('"', '""')}"`

/** Monta uma linha CSV: cada campo entre aspas, separados por vírgula. */
const row = (fields: readonly string[]): string => fields.map(quote).join(',')

/** 12 células BRL a partir de uma série mensal (posições ausentes = "R$ 0,00", defensivo). */
const monthCells = (monthly: MonthlyCents): readonly string[] =>
  Array.from({ length: MONTHS }, (_, i) => brl(monthly[i] ?? 0))

/** 12 células vazias (meses da linha de GRUPO do Centro de Custo). */
const emptyMonthCells: readonly string[] = Array.from({ length: MONTHS }, () => '')

/** Soma coluna-a-coluna dos meses de todos os Centros de Custo (linha TOTAL). */
const totalMonthly = (result: ConsolidatedAbc): MonthlyCents =>
  Array.from({ length: MONTHS }, (_, i) =>
    result.costCenters.reduce((acc, cc) => acc + (cc.monthlyInCents[i] ?? 0), 0),
  )

/** Serializa o Consolidado ABC no CSV oficial (byte-a-byte com o handbook). */
export const consolidatedAbcToCsv = (result: ConsolidatedAbc): string => {
  const header = row(['Centro de Custo', 'Categoria', 'Subcategoria', ...MONTH_HEADERS, 'Total'])

  const bodyRows = result.costCenters.flatMap((cc) => {
    const groupRow = row([cc.name, '', '', ...emptyMonthCells, brl(cc.totalInCents)])
    const categoryRows = cc.categories.flatMap((cat) => {
      const catRow = row(['', cat.name, '', ...monthCells(cat.monthlyInCents), brl(cat.totalInCents)])
      const subRows = cat.subCategories.map((sub) =>
        row(['', '', sub.name, ...monthCells(sub.monthlyInCents), brl(sub.totalInCents)]),
      )
      return [catRow, ...subRows]
    })
    return [groupRow, ...categoryRows]
  })

  const totalRow = row(['TOTAL', '', '', ...monthCells(totalMonthly(result)), brl(result.totalInCents)])

  return [header, ...bodyRows, totalRow].join('\n')
}
