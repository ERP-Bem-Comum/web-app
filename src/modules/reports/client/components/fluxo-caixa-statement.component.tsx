/**
 * FluxoCaixaStatement — view do "Demonstrativo de fluxo de caixa" (statement por mês). Recebe o `FluxoStatement`
 * JÁ derivado (ViewModel pura) + rótulos i18n + o formatador de valor, e apresenta a tabela contábil: cabeçalho
 * de 2 faixas (meses × subcolunas Real/Prev) + Saldo inicial → + Entradas (itens + subtotal) → − Saídas (itens +
 * subtotal) → = Fluxo líquido → = Saldo acumulado. Coluna Total à direita.
 *
 * FILTRO DE MESES (De / Até): UI-state LOCAL da view (como o `expanded` da antiga tree — §XI permite UI-state na
 * view). Recorta as colunas via `sliceStatement` (puro) preservando a continuidade do Saldo acumulado. CSS GRID
 * por LINHA (mesmo template por inline-style, nº dinâmico de meses — rem cru em inline-style é permitido; hex/px
 * ficam fora daqui). 1ª coluna sticky. Entradas vazia (receivables []) → nota discreta, sem quebrar o statement.
 */
import { Fragment, useMemo, useState, type ReactNode } from 'react'

import { ChevronLeftIcon, ChevronRightIcon } from '#shared/ui/index.ts'

import type { FluxoStatement, StatementCell, StatementItem } from '../fluxo-caixa.view-model.ts'
import { formatMonthLabel, sliceStatement } from '../fluxo-caixa.view-model.ts'
import {
  card,
  cardHeadRow,
  cardTitle,
  scroll,
  hint,
  picker,
  pickerLabel,
  pickerSelect,
  pickerNav,
  stmt,
  srow,
  cell,
  valReal,
  valPrev,
  valZero,
  desc,
  totCell,
  sheadMonths,
  sheadMeas,
  headCell,
  headMonth,
  headDesc,
  headTot,
  rowKind,
  sectionDescIn,
  sectionDescOut,
  sign,
  descItem,
  descStrong,
  netValuePos,
  netValueNeg,
  emptyNote,
} from './fluxo-caixa-statement.css.ts'

export type FluxoStatementLabels = Readonly<{
  cardTitle: string
  hint: string
  descCol: string
  totalCol: string
  realShort: string
  prevShort: string
  saldoInicial: string
  entradas: string
  totalEntradas: string
  saidas: string
  totalSaidas: string
  liquido: string
  saldoAcumulado: string
  emptyEntradas: string
  /** Rótulos do filtro de meses. */
  monthsFrom: string
  monthsTo: string
  prevMonth: string
  nextMonth: string
}>

export type FluxoCaixaStatementProps = Readonly<{
  statement: FluxoStatement
  labels: FluxoStatementLabels
  formatValue: (cents: number) => string
}>

// Larguras das colunas (rem cru em inline-style é permitido — §X só barra hex/px em `.css.ts`/componentes de estilo).
const DESC_COL = '14rem'
const SUBCOL = '6.75rem'
const GROUP = '13.5rem' // 2 × SUBCOL (grupo de mês no cabeçalho de nomes)

export function FluxoCaixaStatement(props: FluxoCaixaStatementProps): ReactNode {
  const { statement: full, labels: L, formatValue: fmt } = props
  const allMonths = full.months

  // UI-state local: janela de meses (De/Até) — `null` = extremo do período. Índices clampados no slice.
  const [fromMonth, setFromMonth] = useState<string | null>(null)
  const [toMonth, setToMonth] = useState<string | null>(null)
  const fromIdx = fromMonth !== null ? allMonths.indexOf(fromMonth) : 0
  const toIdxRaw = toMonth !== null ? allMonths.indexOf(toMonth) : allMonths.length - 1
  const loIdx = fromIdx < 0 ? 0 : fromIdx
  const hiIdx = toIdxRaw < 0 ? allMonths.length - 1 : toIdxRaw
  const s = useMemo(() => sliceStatement(full, loIdx, hiIdx), [full, loIdx, hiIdx])

  // Passador de mês: desloca a janela [De, Até] em `delta` meses (clampado aos extremos).
  const shiftWindow = (delta: number): void => {
    const nf = loIdx + delta
    const nt = hiIdx + delta
    if (nf < 0 || nt > allMonths.length - 1) return
    setFromMonth(allMonths[nf] ?? null)
    setToMonth(allMonths[nt] ?? null)
  }

  const monthCount = s.months.length
  // Template das linhas de dados (Descrição + [Real Prev] por mês + [Real Prev] do Total).
  const gridData = { gridTemplateColumns: `${DESC_COL} repeat(${String((monthCount + 1) * 2)}, ${SUBCOL})` }
  // Template do cabeçalho de NOMES de mês (Descrição + um grupo largo por mês + Total).
  const gridMonths = { gridTemplateColumns: `${DESC_COL} repeat(${String(monthCount + 1)}, ${GROUP})` }

  // Renderiza os pares (Real | Prev) de cada mês + o par do Total. `tone` sobrescreve a cor (Fluxo líquido).
  const valueCells = (
    byMonth: readonly StatementCell[],
    total: StatementCell,
    tone?: { real: string; prev: string },
  ): ReactNode => (
    <>
      {s.months.map((m, i) => {
        const c = byMonth[i] ?? { realizedCents: 0, expectedCents: 0 }
        return (
          <Fragment key={m}>
            <div className={`${cell} ${c.realizedCents === 0 ? valZero : (tone?.real ?? valReal)}`}>
              {fmt(c.realizedCents)}
            </div>
            <div className={`${cell} ${c.expectedCents === 0 ? valZero : (tone?.prev ?? valPrev)}`}>
              {fmt(c.expectedCents)}
            </div>
          </Fragment>
        )
      })}
      <div className={`${cell} ${totCell}`}>{fmt(total.realizedCents)}</div>
      <div className={`${cell} ${totCell}`}>{fmt(total.expectedCents)}</div>
    </>
  )

  const itemRow = (it: StatementItem, keyPrefix: string): ReactNode => (
    <div key={`${keyPrefix}-${it.name}`} className={`${srow} ${rowKind.item}`} style={gridData}>
      <div className={`${desc} ${descItem}`}>{it.name}</div>
      {valueCells(it.byMonth, it.total)}
    </div>
  )

  const netPositive = s.liquidoTotal.realizedCents >= 0

  return (
    <div className={card}>
      <div className={cardHeadRow}>
        <h2 className={cardTitle}>{L.cardTitle}</h2>
        <div className={picker}>
          {allMonths.length >= 2 && (
            <>
              <button
                type="button"
                className={pickerNav}
                aria-label={L.prevMonth}
                disabled={loIdx <= 0}
                onClick={() => {
                  shiftWindow(-1)
                }}
              >
                <ChevronLeftIcon size={16} />
              </button>
              <label className={pickerLabel}>
                {L.monthsFrom}
                <select
                  className={pickerSelect}
                  value={allMonths[loIdx] ?? allMonths[0]}
                  aria-label={L.monthsFrom}
                  onChange={(e) => {
                    setFromMonth(e.target.value)
                  }}
                >
                  {allMonths.map((m) => (
                    <option key={m} value={m}>
                      {formatMonthLabel(m)}
                    </option>
                  ))}
                </select>
              </label>
              <label className={pickerLabel}>
                {L.monthsTo}
                <select
                  className={pickerSelect}
                  value={allMonths[hiIdx] ?? allMonths[allMonths.length - 1]}
                  aria-label={L.monthsTo}
                  onChange={(e) => {
                    setToMonth(e.target.value)
                  }}
                >
                  {allMonths.map((m) => (
                    <option key={m} value={m}>
                      {formatMonthLabel(m)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className={pickerNav}
                aria-label={L.nextMonth}
                disabled={hiIdx >= allMonths.length - 1}
                onClick={() => {
                  shiftWindow(1)
                }}
              >
                <ChevronRightIcon size={16} />
              </button>
            </>
          )}
          <span className={hint}>{L.hint}</span>
        </div>
      </div>

      <div className={scroll}>
        <div className={stmt}>
          {/* Cabeçalho — faixa 1: nomes de mês (cada um sobre suas 2 subcolunas) + Total */}
          <div className={sheadMonths} style={gridMonths}>
            <div className={headDesc} aria-hidden="true" />
            {s.months.map((m) => (
              <div key={m} className={headMonth}>
                {formatMonthLabel(m)}
              </div>
            ))}
            <div className={headTot}>{L.totalCol}</div>
          </div>
          {/* Cabeçalho — faixa 2: Descrição + (Real | Prev) por mês + (Real | Prev) do Total */}
          <div className={sheadMeas} style={gridData}>
            <div className={headDesc}>{L.descCol}</div>
            {s.months.map((m) => (
              <Fragment key={m}>
                <div className={headCell}>{L.realShort}</div>
                <div className={headCell}>{L.prevShort}</div>
              </Fragment>
            ))}
            <div className={headCell}>{L.realShort}</div>
            <div className={headCell}>{L.prevShort}</div>
          </div>

          {/* Saldo inicial (corrida ANTES) — Total = valor inicial (1º mês visível). */}
          <div className={`${srow} ${rowKind.saldo}`} style={gridData}>
            <div className={`${desc} ${descStrong}`}>{L.saldoInicial}</div>
            {valueCells(s.saldoInicial, s.saldoInicial[0] ?? { realizedCents: 0, expectedCents: 0 })}
          </div>

          {/* + Entradas */}
          <div className={`${srow} ${rowKind.sectionIn}`} style={gridData}>
            <div className={`${desc} ${sectionDescIn}`}>
              <span className={sign}>+</span>
              {L.entradas}
            </div>
          </div>
          {s.entradas.items.length === 0 ? (
            <div className={srow} style={gridData}>
              <div className={emptyNote}>{L.emptyEntradas}</div>
            </div>
          ) : (
            s.entradas.items.map((it) => itemRow(it, 'ent'))
          )}
          <div className={`${srow} ${rowKind.subtotal}`} style={gridData}>
            <div className={`${desc} ${descStrong}`}>{L.totalEntradas}</div>
            {valueCells(s.entradas.totalByMonth, s.entradas.total)}
          </div>

          {/* − Saídas */}
          <div className={`${srow} ${rowKind.sectionOut}`} style={gridData}>
            <div className={`${desc} ${sectionDescOut}`}>
              <span className={sign}>−</span>
              {L.saidas}
            </div>
          </div>
          {s.saidas.items.map((it) => itemRow(it, 'sai'))}
          <div className={`${srow} ${rowKind.subtotal}`} style={gridData}>
            <div className={`${desc} ${descStrong}`}>{L.totalSaidas}</div>
            {valueCells(s.saidas.totalByMonth, s.saidas.total)}
          </div>

          {/* = Fluxo líquido do período (colorido por sinal) */}
          <div className={`${srow} ${netPositive ? rowKind.netPos : rowKind.netNeg}`} style={gridData}>
            <div className={`${desc} ${descStrong}`}>{L.liquido}</div>
            {valueCells(s.liquido, s.liquidoTotal, {
              real: netPositive ? netValuePos : netValueNeg,
              prev: netPositive ? netValuePos : netValueNeg,
            })}
          </div>

          {/* = Saldo acumulado (corrida DEPOIS) — Total = saldo final (último mês visível) */}
          <div className={`${srow} ${rowKind.saldo}`} style={gridData}>
            <div className={`${desc} ${descStrong}`}>{L.saldoAcumulado}</div>
            {valueCells(
              s.saldoAcumulado,
              s.saldoAcumulado[monthCount - 1] ?? { realizedCents: 0, expectedCents: 0 },
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
