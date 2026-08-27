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
import {
  centsToBRL,
  statementMemoDetail,
  statementPartyLabel,
  type StatementTransaction,
} from '../reconciliation-workspace.view-model.ts'
import type { MatchView, SuggestionState } from '../reconciliation-workspace.binding.ts'
import type { DocumentCategorizationBinding } from '#modules/financial/client/contas-a-pagar-list/document-categorization.binding.ts'

const t = createTranslator(ptBR)
const DOT = '·'
const DASH = '—'

export type SuggestionPaneProps = Readonly<{
  state: SuggestionState
  selectedTx: StatementTransaction | null
  /** Taxonomia do título de topo (vem do DOCUMENTO). `undefined` nos usos sem binding (estado idle). */
  taxonomy?: DocumentCategorizationBinding
  reconciling: boolean
  rejecting: boolean
  errorTag: string | null
  onReconcile: (payableId: string) => void
  onReject: (payableId: string) => void
}>

// Fallback (backend antigo, breakdown vazio): chips booleanos atendido/não-atendido.
const CRITS: readonly { key: keyof MatchView['criteria']; tag: string }[] = [
  { key: 'payeeMatch', tag: 'financial.recon.crit.payeeMatch' },
  { key: 'exactValue', tag: 'financial.recon.crit.exactValue' },
  { key: 'dateD0', tag: 'financial.recon.crit.dateD0' },
  { key: 'memoRef', tag: 'financial.recon.crit.memoRef' },
]

// #140 — breakdown ponderado: rótulo por critério + classe por resultado (3 estados). Tipos derivados do
// MatchView (sem novo import; respeita a fronteira da view burra).
type CritKey = MatchView['criteriaBreakdown'][number]['criterion']
type CritOutcome = MatchView['criteriaBreakdown'][number]['result']
const CRIT_LABEL: Readonly<Record<CritKey, string>> = {
  exactValue: 'financial.recon.crit.exactValue',
  payeeMatch: 'financial.recon.crit.payeeMatch',
  dateD0: 'financial.recon.crit.dateD0',
  memoRef: 'financial.recon.crit.memoRef',
  supplierOpen: 'financial.recon.crit.supplierOpen',
}
const OUTCOME_CLASS: Readonly<Record<CritOutcome, string>> = {
  ok: s.crit.ok,
  parcial: s.crit.warn,
  falha: s.crit.falha,
}

// Taxonomia do título (#382) — Programa / Plano Orçamentário / Centro de Custo / Categoria / Subcategoria,
// carimbados no documento no momento do lançamento. Sempre VISÍVEL (pedido da P.O.: sem clique p/ revelar);
// cada campo degrada p/ "—" quando a ref não resolve. Some por inteiro só quando não há documento a resolver.
//
// LAYOUT (P.O.): rótulo EM CIMA do valor, numa ÚNICA grade de 3 colunas — Programa + Plano (que ocupa 2)
// fecham a 1ª faixa; Centro + Categoria + Subcategoria fecham a 2ª. Grade única = trilhos comuns, então as
// duas faixas alinham (com grades separadas as bordas não coincidiam e o bloco parecia bagunçado).
type TaxonomyKey = keyof NonNullable<DocumentCategorizationBinding['view']>
const TAXONOMY_CELLS: readonly { key: TaxonomyKey; tag: string; wide?: true }[] = [
  { key: 'program', tag: 'financial.detail.label.programa' },
  { key: 'budgetPlan', tag: 'financial.detail.label.planoOrcamentario', wide: true },
  { key: 'costCenter', tag: 'financial.detail.label.centroCusto' },
  { key: 'category', tag: 'financial.detail.label.categoria' },
  { key: 'subcategory', tag: 'financial.detail.label.subcategoria' },
]

function TaxonomyBlock({ taxonomy }: Readonly<{ taxonomy: DocumentCategorizationBinding | undefined }>) {
  if (taxonomy === undefined) return null
  if (taxonomy.loading) {
    return (
      <div className={s.sideTaxonomy}>
        <span className={s.sideTaxonomyLbl}>{t('financial.recon.sugg.taxonomy')}</span>
        <span className={s.sideTaxonomyEmpty}>{t('financial.detail.loading')}</span>
      </div>
    )
  }
  const view = taxonomy.view
  if (view === null) return null
  return (
    <div className={s.sideTaxonomy}>
      <span className={s.sideTaxonomyLbl}>{t('financial.recon.sugg.taxonomy')}</span>
      <div className={s.sideTaxGrid}>
        {TAXONOMY_CELLS.map((cell) => (
          <span
            key={cell.key}
            className={cell.wide === true ? `${s.sideTaxCell} ${s.sideTaxCellWide}` : s.sideTaxCell}
          >
            <span className={s.sideTaxKey}>{t(cell.tag)}</span>
            <span className={s.sideTaxVal}>{view[cell.key]}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function TituloSide({
  m,
  taxonomy,
}: Readonly<{ m: MatchView; taxonomy: DocumentCategorizationBinding | undefined }>) {
  return (
    <div className={s.matchSide.doc}>
      <span className={s.sideLbl}>{t('financial.recon.sugg.side.titulo')}</span>
      <span className={s.sideTitle}>
        {m.payable?.supplierName ??
          m.payable?.documentNumber ??
          m.payable?.documentId ??
          t('financial.recon.sugg.supplierPending')}
      </span>
      {m.payable !== null ? (
        <>
          {/* #172: com o nome do favorecido no título, o nº do documento vira ref abaixo (fiel ao mock). */}
          {m.payable.supplierName !== null && m.payable.documentNumber !== null ? (
            <span className={s.sideRow}>
              <span className={s.sideKey}>{t('financial.recon.sugg.doc')}</span>
              <span className={s.sideVal}>{m.payable.documentNumber}</span>
            </span>
          ) : null}
          <span className={s.sideRow}>
            <span className={s.sideKey}>{t('financial.recon.sugg.value')}</span>
            <span className={s.sideValStrong}>{centsToBRL(m.payable.valueCents)}</span>
          </span>
          {/* Data relevante p/ o match é o PAGAMENTO (baixa = saída bancária), não o vencimento (#265). */}
          <span className={s.sideRow}>
            <span className={s.sideKey}>{t('financial.recon.sugg.paidAt')}</span>
            <span className={s.sideVal}>{m.payable.paidAt ?? DASH}</span>
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
      <TaxonomyBlock taxonomy={taxonomy} />
    </div>
  )
}

export function SuggestionPane({
  state,
  selectedTx,
  taxonomy,
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
            {/* Favorecido como o extrato mostra: `payeeName`, ou o `memo` quando o banco não preenche o
              nome (OFX/CSV) — era exatamente o caso em que o card aparecia sem identificação nenhuma. */}
            <span className={s.sideTitle}>{statementPartyLabel(selectedTx) || DASH}</span>
            {statementMemoDetail(selectedTx) !== '' ? (
              <span className={s.sideSubtitle}>{statementMemoDetail(selectedTx)}</span>
            ) : null}
            <span className={s.sideRow}>
              <span className={s.sideKey}>{t('financial.recon.sugg.value')}</span>
              <span className={s.sideValStrong}>{centsToBRL(selectedTx.valueCents)}</span>
            </span>
            <span className={s.sideRow}>
              <span className={s.sideKey}>{t('financial.recon.sugg.txDate')}</span>
              <span className={s.sideVal}>{selectedTx.date}</span>
            </span>
          </div>
          <span className={s.matchArrow} aria-hidden="true">
            <LinkIcon />
          </span>
          <TituloSide m={top} taxonomy={taxonomy} />
        </div>

        <div className={s.critList}>
          {top.criteriaBreakdown.length > 0
            ? top.criteriaBreakdown.map((c) => (
                <span key={c.criterion} className={OUTCOME_CLASS[c.result]}>
                  <span>
                    {t(CRIT_LABEL[c.criterion])}
                    {c.criterion === 'supplierOpen' && c.detail !== '' ? ` (${c.detail})` : ''}
                  </span>
                  <span className={s.critWeight}>{String(c.weight)}</span>
                </span>
              ))
            : CRITS.map((c) => (
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
