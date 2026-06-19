/**
 * Suggestion-pane (US1) — view burra: painel da transação selecionada. Match card lado a lado
 * (extrato × título), critérios atendidos, confiança e ações Conciliar/Rejeitar, + outras possibilidades.
 * Título exibido com o **mínimo** (documento/valor/vencimento/forma) até core-api#172 enriquecer. Recebe
 * o estado derivado por props; sem data-hooks.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { CheckCircleIcon, LinkIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import { centsToBRL, type StatementTransaction } from '../reconciliation-workspace.view-model.ts'
import type { MatchView, SuggestionState } from '../reconciliation-workspace.binding.ts'

const t = createTranslator(ptBR)
const DOT = '·'
const DASH = '—'

export type SuggestionPaneProps = Readonly<{
  state: SuggestionState
  selectedTx: StatementTransaction | null
  reconciling: boolean
  rejecting: boolean
  errorTag: string | null
  onReconcile: (payableId: string) => void
  onReject: (payableId: string) => void
}>

const CRITS: readonly { key: keyof MatchView['criteria']; tag: string }[] = [
  { key: 'payeeMatch', tag: 'financial.recon.crit.payeeMatch' },
  { key: 'exactValue', tag: 'financial.recon.crit.exactValue' },
  { key: 'dateD0', tag: 'financial.recon.crit.dateD0' },
  { key: 'memoRef', tag: 'financial.recon.crit.memoRef' },
]

function TituloSide({ m }: Readonly<{ m: MatchView }>) {
  return (
    <div className={s.matchSide.doc}>
      <span className={s.sideLbl}>{t('financial.recon.sugg.side.titulo')}</span>
      <span className={s.sideTitle}>
        {m.payable?.documentNumber ?? m.payable?.documentId ?? t('financial.recon.sugg.supplierPending')}
      </span>
      {m.payable !== null ? (
        <>
          <span className={s.sideRow}>
            <span className={s.sideKey}>{t('financial.recon.sugg.value')}</span>
            <span className={s.sideVal}>{centsToBRL(m.payable.valueCents)}</span>
          </span>
          <span className={s.sideRow}>
            <span className={s.sideKey}>{t('financial.recon.sugg.due')}</span>
            <span className={s.sideVal}>{m.payable.dueDate}</span>
          </span>
          <span className={s.sideRow}>
            <span className={s.sideKey}>{t('financial.recon.sugg.method')}</span>
            <span className={s.sideVal}>{m.payable.paymentMethod}</span>
          </span>
        </>
      ) : (
        <span className={s.sideRow}>
          <span className={s.sideKey}>{t('financial.recon.sugg.doc')}</span>
          <span className={s.sideVal}>{m.payableId}</span>
        </span>
      )}
    </div>
  )
}

export function SuggestionPane({
  state,
  selectedTx,
  reconciling,
  rejecting,
  errorTag,
  onReconcile,
  onReject,
}: SuggestionPaneProps) {
  if (state.tag === 'idle' || selectedTx === null) {
    return <div className={s.assocCol}>{t('financial.recon.sugg.idle')}</div>
  }
  if (state.tag === 'loading') {
    return <div className={s.assocCol}>{t('financial.detail.loading')}</div>
  }
  if (state.tag === 'error') {
    return <div className={s.assocCol}>{t(state.errorTag)}</div>
  }
  if (state.tag === 'none') {
    return <div className={s.assocCol}>{t('financial.recon.sugg.none')}</div>
  }

  const { top, alternatives } = state
  const bandTag = top.band === 'alta' ? 'financial.recon.sugg.high' : 'financial.recon.sugg.mid'
  const conf = `${String(top.score)}%`

  return (
    <div className={s.assocCol}>
      <div className={s.matchCard}>
        <div className={s.matchHead}>
          <span>{t(bandTag)}</span>
          <span>{conf}</span>
        </div>
        <div className={s.matchSides}>
          <div className={s.matchSide.extrato}>
            <span className={s.sideLbl}>{t('financial.recon.sugg.side.extrato')}</span>
            <span className={s.sideTitle}>{selectedTx.payeeName}</span>
            <span className={s.sideRow}>
              <span className={s.sideKey}>{t('financial.recon.sugg.value')}</span>
              <span className={s.sideVal}>{centsToBRL(selectedTx.valueCents)}</span>
            </span>
            <span className={s.sideRow}>
              <span className={s.sideKey}>{t('financial.recon.sugg.due')}</span>
              <span className={s.sideVal}>{selectedTx.date}</span>
            </span>
          </div>
          <span className={s.matchArrow} aria-hidden="true">
            <LinkIcon />
          </span>
          <TituloSide m={top} />
        </div>

        <div className={s.critList}>
          {CRITS.map((c) => (
            <span key={c.key} className={top.criteria[c.key] ? s.crit.ok : s.crit.warn}>
              {t(c.tag)}
            </span>
          ))}
        </div>

        <div className={s.matchActions}>
          <button
            type="button"
            className={s.btnSecondary}
            disabled={rejecting}
            onClick={() => {
              onReject(top.payableId)
            }}
          >
            {t('financial.recon.sugg.reject')}
          </button>
          <span className={s.spacer} />
          <button
            type="button"
            className={s.btnConfirm}
            disabled={reconciling}
            onClick={() => {
              onReconcile(top.payableId)
            }}
          >
            <CheckCircleIcon />
            {t('financial.recon.sugg.confirm')}
          </button>
        </div>
      </div>

      {errorTag !== null ? <p className={s.errorText}>{t(errorTag)}</p> : null}

      {alternatives.length > 0 ? (
        <div className={s.altList}>
          <span className={s.altOverline}>
            {t('financial.recon.sugg.alternatives')} {DOT} {alternatives.length}
          </span>
          {alternatives.map((alt) => (
            <div key={alt.payableId} className={s.altCard}>
              <div className={s.altInfo}>
                <div className={s.altNm}>
                  {alt.payable?.supplierName ?? alt.payable?.documentNumber ?? alt.payableId}
                </div>
                <div className={s.altMeta}>
                  <span className={s.altDocRef}>{alt.payable?.documentNumber ?? alt.payableId}</span>
                  <span className={s.altStatusMini.pago}>{t('financial.recon.sugg.paid')}</span>
                  <span className={s.altConfMini}>
                    {`${String(alt.score)}% ${t('financial.recon.sugg.matchWord')}`}
                    {alt.payable !== null
                      ? ` ${DOT} ${t('financial.recon.sugg.vencWord')} ${alt.payable.dueDate}`
                      : ''}
                  </span>
                </div>
              </div>
              <span className={s.altAmt}>
                {alt.payable !== null ? centsToBRL(alt.payable.valueCents) : DASH}
              </span>
              <button
                type="button"
                className={s.altBtn}
                disabled={reconciling}
                onClick={() => {
                  onReconcile(alt.payableId)
                }}
              >
                {t('financial.recon.sugg.confirm')}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
