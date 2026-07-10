/**
 * DocumentTimeline — view BURRA (§XI): aba "Histórico" do drawer. Renderiza a trilha de auditoria a partir
 * do estado (loading | error | empty | ready). Linha do tempo vertical, mais recente no topo; cada nó tem
 * rótulo do evento, data/hora, autor (ou "Sistema") e, nos ajustes, as pílulas de diff campo a campo.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import type { DocumentTimelineState } from '../document-timeline.binding.ts'
import {
  resolveTimelineTitle,
  deriveReconciledTitleRows,
  type TimelineChangeRow,
  type TimelineTargetPayable,
} from '../document-timeline.view-model.ts'
import {
  timelineWrap,
  timelineLine,
  timelineItem,
  timelineDot,
  timelineHead,
  timelineLabelGroup,
  timelineLabel,
  timelineTargetTag,
  timelineDate,
  timelineActor,
  timelineChanges,
  timelineChangePill,
  timelineStateBox,
} from '../page/contas-a-pagar.css.ts'

const t = createTranslator(ptBR)

function ChangePill({ change }: Readonly<{ change: TimelineChangeRow }>): ReactNode {
  return (
    <span className={timelineChangePill}>
      {t(change.labelTag)} {change.before} → {change.after}
    </span>
  )
}

export type DocumentTimelineProps = Readonly<{
  state: DocumentTimelineState
  payables: readonly TimelineTargetPayable[]
  documentType: string // tipo do documento (NFS-e, DANFE…) = rótulo do título-pai
}>

export function DocumentTimeline({ state, payables, documentType }: DocumentTimelineProps): ReactNode {
  if (state.status === 'loading') {
    return <div className={timelineStateBox}>{t('financial.timeline.loading')}</div>
  }
  if (state.status === 'error') {
    return <div className={timelineStateBox}>{t('financial.timeline.error')}</div>
  }
  // Nós de conciliação sintetizados do status (topo) + eventos reais da trilha. Cobre o `empty` que só tenha
  // títulos conciliados (sem evento na trilha ainda — core-api#406).
  const realRows = state.status === 'ready' ? state.rows : []
  const rows = [...deriveReconciledTitleRows(payables, realRows), ...realRows]
  if (rows.length === 0) {
    return <div className={timelineStateBox}>{t('financial.timeline.empty')}</div>
  }
  return (
    <div className={timelineWrap}>
      <span className={timelineLine} aria-hidden="true" />
      {rows.map((row) => (
        <div key={row.key} className={timelineItem}>
          <span className={timelineDot[row.presentation.tone]} aria-hidden="true" />
          <div className={timelineHead}>
            <span className={timelineLabelGroup}>
              <span className={timelineLabel}>{t(row.presentation.labelTag)}</span>
              <span className={timelineTargetTag}>
                {resolveTimelineTitle(row.targetKind, row.targetId, payables, documentType)}
              </span>
            </span>
            <span className={timelineDate}>{row.dateLabel}</span>
          </div>
          {row.changes.length > 0 ? (
            <div className={timelineChanges}>
              {row.changes.map((c) => (
                <ChangePill key={c.fieldRaw} change={c} />
              ))}
            </div>
          ) : null}
          <div className={timelineActor}>
            {row.isSystem ? t('financial.timeline.system') : (row.actorName ?? '—')}
          </div>
        </div>
      ))}
    </div>
  )
}
