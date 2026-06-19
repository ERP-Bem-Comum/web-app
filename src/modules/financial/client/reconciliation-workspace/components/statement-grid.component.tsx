/**
 * Statement-grid (US8) — view burra: aba Extrato. Fiel ao mock (`conciliacao_bancaria`, view-extrato):
 * 9 colunas (conc-mark, Data, Tipo, Nome, Descrição, Ref·Identif, Entrada, Saída, Saldo), divisor por dia
 * com a faixa de resumo (+entradas · −saídas · Saldo) e rodapé de TOTAIS. O conc-mark traz o ponto laranja
 * (pendente) ou o check verde (conciliado). Recebe dias já agrupados + totais + contagens por props; sem
 * data-hooks. Ref·Identif mostra só o `fitid` do banco (ref de documento depende de #172).
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { CheckCircleIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import {
  centsToBRL,
  centsToReais,
  extratoKindClass,
  formatDayShort,
  type ExtratoDayGroup,
  type ExtratoFilter,
  type ExtratoTotals,
  type StatementTransaction,
} from '../reconciliation-workspace.view-model.ts'

const t = createTranslator(ptBR)
const DASH = '—' // sem valor na coluna (não é string de UI traduzível)
const PLUS = '+'
const MINUS = '−' // U+2212 (minus matemático)
const DOT = '·'

type ExtratoCounts = Readonly<{
  todos: number
  entradas: number
  saidas: number
  conciliados: number
  pendentes: number
}>

const FILTERS: readonly { id: ExtratoFilter; tag: string; count: (c: ExtratoCounts) => number }[] = [
  { id: 'todos', tag: 'financial.recon.ext.filter.todos', count: (c) => c.todos },
  { id: 'entradas', tag: 'financial.recon.ext.filter.entradas', count: (c) => c.entradas },
  { id: 'saidas', tag: 'financial.recon.ext.filter.saidas', count: (c) => c.saidas },
  { id: 'conciliados', tag: 'financial.recon.ext.filter.conciliados', count: (c) => c.conciliados },
  { id: 'pendentes', tag: 'financial.recon.ext.filter.pendentes', count: (c) => c.pendentes },
]

const SPACED_DOT = ` ${DOT} `

export type StatementGridProps = Readonly<{
  hasStatement: boolean
  days: readonly ExtratoDayGroup[]
  totals: ExtratoTotals
  count: number
  counts: ExtratoCounts
  filter: ExtratoFilter
  onFilter: (filter: ExtratoFilter) => void
  onOpenDetails: (tx: StatementTransaction) => void
}>

function ConcMark({ tx }: { tx: StatementTransaction }) {
  if (tx.reconciliationStatus === 'Pending') {
    return <span className={s.concMark.pending} aria-hidden />
  }
  return (
    <span className={s.concMark.reconciled} aria-hidden>
      <CheckCircleIcon />
    </span>
  )
}

function ExtratoRow({
  tx,
  onOpenDetails,
}: {
  tx: StatementTransaction
  onOpenDetails: (tx: StatementTransaction) => void
}) {
  const reconciled = tx.reconciliationStatus !== 'Pending'
  const isCredit = tx.movement === 'Credit'
  const cells = (
    <>
      <ConcMark tx={tx} />
      <span className={s.extDt}>{formatDayShort(tx.date)}</span>
      <span className={s.extKind[extratoKindClass(tx.entryType)]}>{tx.entryType}</span>
      <span className={reconciled ? `${s.extName} ${s.extNameReconciled}` : s.extName}>{tx.payeeName}</span>
      <span className={s.extDesc}>{tx.memo}</span>
      <span className={s.extRef}>
        <span className={s.extRefId}>{tx.fitid}</span>
      </span>
      <span className={isCredit ? s.extVal.in : s.extVal.empty}>
        {isCredit ? centsToBRL(tx.valueCents) : DASH}
      </span>
      <span className={!isCredit ? s.extVal.out : s.extVal.empty}>
        {!isCredit ? centsToBRL(tx.valueCents) : DASH}
      </span>
      <span className={s.extSaldo}>{centsToBRL(tx.balanceAfterCents)}</span>
    </>
  )
  // Linha conciliada abre o modal de detalhes (clicável); pendente é só leitura.
  if (reconciled) {
    return (
      <button
        type="button"
        className={s.extRow.reconciled}
        onClick={() => {
          onOpenDetails(tx)
        }}
      >
        {cells}
      </button>
    )
  }
  return <div className={s.extRow.base}>{cells}</div>
}

function DayDivider({ day }: { day: ExtratoDayGroup }) {
  return (
    <div className={s.extDayDivider}>
      <span className={s.extDayLabel}>{day.header}</span>
      <span className={s.extDayMeta}>
        <span className={s.extDayIn}>
          {PLUS}
          {centsToReais(day.inCents)}
        </span>
        {SPACED_DOT}
        <span className={s.extDayOut}>
          {MINUS}
          {centsToReais(day.outCents)}
        </span>
      </span>
      <span className={s.extDaySaldo}>
        <span className={s.extDaySaldoLbl}>{t('financial.recon.ext.daySaldo')}</span>
        {centsToBRL(day.saldoCents)}
      </span>
    </div>
  )
}

export function StatementGrid({
  hasStatement,
  days,
  totals,
  count,
  counts,
  filter,
  onFilter,
  onOpenDetails,
}: StatementGridProps) {
  if (!hasStatement) {
    return <div className={s.emptyState}>{t('financial.recon.ext.idle')}</div>
  }
  return (
    <div className={s.extWrap}>
      <div className={s.extHead}>
        <span className={s.extHeadOverline}>{t('financial.recon.ext.overline')}</span>
        <span className={s.extCount}>
          {count} {t('financial.recon.ext.lancamentos')}
        </span>
        <div className={s.filterTabs} role="group" aria-label={t('financial.recon.tab.extrato')}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={filter === f.id ? s.filterTab.active : s.filterTab.inactive}
              aria-pressed={filter === f.id}
              onClick={() => {
                onFilter(f.id)
              }}
            >
              {t(f.tag)} {f.count(counts)}
            </button>
          ))}
        </div>
      </div>

      <div className={s.extGridHead}>
        <span />
        <span>{t('financial.recon.ext.col.date')}</span>
        <span>{t('financial.recon.ext.col.tipo')}</span>
        <span>{t('financial.recon.ext.col.name')}</span>
        <span>{t('financial.recon.ext.col.desc')}</span>
        <span>{t('financial.recon.ext.col.ref')}</span>
        <span className={s.extRight}>{t('financial.recon.ext.col.in')}</span>
        <span className={s.extRight}>{t('financial.recon.ext.col.out')}</span>
        <span className={s.extRight}>{t('financial.recon.ext.col.balance')}</span>
      </div>

      <div className={s.extRows}>
        {days.length === 0 ? (
          <p className={s.emptyState}>{t('financial.recon.ext.empty')}</p>
        ) : (
          <>
            {days.map((day) => (
              <div key={day.date}>
                <DayDivider day={day} />
                {day.items.map((tx) => (
                  <ExtratoRow key={tx.id} tx={tx} onOpenDetails={onOpenDetails} />
                ))}
              </div>
            ))}
            {/* faixa bege de TOTAIS — logo abaixo da última transação (rola junto com o extrato) */}
            <div className={s.extFoot}>
              <span />
              <span />
              <span />
              <span className={s.extFtLbl}>
                {count} {t('financial.recon.ext.movimentacoes')}
              </span>
              <span />
              <span className={`${s.extFtLbl} ${s.extRight}`}>{t('financial.recon.ext.totals')}</span>
              <span className={s.extFtIn}>{centsToBRL(totals.inCents)}</span>
              <span className={s.extFtOut}>{centsToBRL(totals.outCents)}</span>
              <span />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
