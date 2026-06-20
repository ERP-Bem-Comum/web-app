/**
 * Imports-list (US1) — view burra: coluna esquerda do workspace. Movimentações agrupadas por dia, com
 * ícone por `entryType` (heurística + fallback por movimento), valor (cor por direção) e tag
 * pendente/conciliado, + filtro Pendentes/Conciliadas/Todas. Recebe o estado derivado por props; sem
 * data-hooks. O palpite de topo por linha (banda + score) vem das sugestões em lote (#174) e só aparece
 * com "Exibir palpites" ligado (`guesses` vazio = off).
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import {
  centsToBRL,
  entryTypeIcon,
  isPending,
  transactionTag,
  type ListFilter,
  type StatementTransaction,
} from '../reconciliation-workspace.view-model.ts'
import type { TxListState, FilterCounts, RowGuess } from '../reconciliation-workspace.binding.ts'

const t = createTranslator(ptBR)

export type ImportsListProps = Readonly<{
  state: TxListState
  filter: ListFilter
  counts: FilterCounts
  selectedId: string | null
  guesses: ReadonlyMap<string, RowGuess>
  onFilter: (filter: ListFilter) => void
  onSelect: (id: string) => void
}>

const FILTERS: readonly { id: ListFilter; tag: string }[] = [
  { id: 'pendentes', tag: 'financial.recon.filter.pendentes' },
  { id: 'conciliadas', tag: 'financial.recon.filter.conciliadas' },
  { id: 'todas', tag: 'financial.recon.filter.todas' },
]

function GuessBadge({ guess }: Readonly<{ guess: RowGuess }>) {
  const label = guess.band === 'alta' ? 'financial.recon.list.guessHigh' : 'financial.recon.list.guessMid'
  return (
    <span className={s.rowGuess} aria-label={`${t(label)} ${String(guess.score)}%`}>
      <span className={s.rowGuessDot[guess.band]} aria-hidden="true" />
      {`${String(guess.score)}%`}
    </span>
  )
}

function Row({
  tx,
  selected,
  guess,
  onSelect,
}: Readonly<{
  tx: StatementTransaction
  selected: boolean
  guess: RowGuess | null
  onSelect: (id: string) => void
}>) {
  const variant = selected ? s.txRow.selected : isPending(tx) ? s.txRow.base : s.txRow.reconciled
  const kind = entryTypeIcon(tx.entryType, tx.movement)
  const tag = transactionTag(tx)
  return (
    <button
      type="button"
      className={variant}
      aria-pressed={selected}
      onClick={() => {
        onSelect(tx.id)
      }}
    >
      <span className={`${s.txIcon} ${s.txIconKind[kind]}`} aria-hidden="true" />
      <span className={s.txBody}>
        <span className={s.txDate}>{tx.date}</span>
        <span className={s.txName}>{tx.payeeName}</span>
        <span className={s.txDesc}>{tx.memo}</span>
      </span>
      <span className={s.txAmtBlock}>
        <span className={tx.movement === 'Credit' ? s.txAmt.in : s.txAmt.out}>
          {centsToBRL(tx.valueCents)}
        </span>
        {/* #174: palpite de topo — só em pendente (conciliada não tem candidato ativo) */}
        {guess !== null && tag !== 'reconciled' ? <GuessBadge guess={guess} /> : null}
        <span className={tag === 'reconciled' ? s.txTag.reconciled : s.txTag.pending}>
          {tag === 'reconciled' ? t('financial.recon.tag.reconciled') : t('financial.recon.tag.pending')}
        </span>
      </span>
    </button>
  )
}

export function ImportsList({
  state,
  filter,
  counts,
  selectedId,
  guesses,
  onFilter,
  onSelect,
}: ImportsListProps) {
  return (
    <div className={s.importsCol}>
      <div className={s.importsHead}>
        <div className={s.filterTabs} role="group" aria-label={t('financial.recon.tab.conciliacao')}>
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
              {t(f.tag)} {String(counts[f.id])}
            </button>
          ))}
        </div>
      </div>

      <div className={s.importsList}>
        {state.tag === 'idle' ? <p className={s.emptyState}>{t('financial.recon.list.idle')}</p> : null}
        {state.tag === 'loading' ? <p className={s.emptyState}>{t('financial.detail.loading')}</p> : null}
        {state.tag === 'error' ? <p className={s.errorText}>{t(state.errorTag)}</p> : null}
        {state.tag === 'empty' ? <p className={s.emptyState}>{t('financial.recon.list.empty')}</p> : null}
        {state.tag === 'ready'
          ? state.groups.map((g) => (
              <div key={g.date}>
                <div className={s.dayDivider}>{g.date}</div>
                {g.items.map((tx) => (
                  <Row
                    key={tx.id}
                    tx={tx}
                    selected={tx.id === selectedId}
                    guess={guesses.get(tx.id) ?? null}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            ))
          : null}
      </div>
    </div>
  )
}
