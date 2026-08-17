/**
 * RemittancePreviewModal — view BURRA (§XI): conferência do lote ANTES de gerar a remessa (VAN,
 * core-api#728). Não decide nada; recebe a `PreviewView` já derivada e desenha.
 *
 * O pré-voo é LEITURA PURA — abrir este modal não consome NSA, não prende título e não grava no bucket da
 * VAN. Por isso ele não tem botão que dispare pagamento: "Gerar remessa" chega na fatia seguinte, e até lá
 * o rodapé oferece só o fechamento. O que a tela promete é o que o backend faz.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import type { PreviewView } from '../remittance-preview.view-model.ts'

import {
  confirmOverlay,
  confirmTitle,
  confirmText,
  confirmActions,
  confirmCancelBtn,
} from '../page/contas-a-pagar.css.ts'
import {
  previewDialog,
  summary,
  summaryItem,
  summaryLabel,
  summaryValue,
  scrollArea,
  table,
  th,
  td,
  tdRight,
  statusPill,
  gapList,
  gapField,
  routeLabel,
  notice,
  errorBox,
  emptyState,
} from './remittance-preview.css.ts'

const t = createTranslator(ptBR)

export type RemittancePreviewModalProps = Readonly<{
  open: boolean
  running: boolean
  view: PreviewView | null
  errorTag: string | null
  /** Títulos selecionados que não estão Aprovados — barrados no front, nunca chegam ao core-api. */
  notApprovedCount: number
  onClose: () => void
}>

export function RemittancePreviewModal(props: RemittancePreviewModalProps): ReactNode {
  if (!props.open) return null
  const { view } = props

  return (
    <div className={confirmOverlay} role="dialog" aria-modal="true" onClick={props.onClose}>
      <div
        className={previewDialog}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <h2 className={confirmTitle}>{t('financial.remittance.preview.title')}</h2>
        <p className={confirmText}>{t('financial.remittance.preview.subtitle')}</p>

        {props.notApprovedCount > 0 ? (
          <p className={notice}>
            {`${String(props.notApprovedCount)} ${t('financial.remittance.preview.notApproved')}`}
          </p>
        ) : null}

        {props.errorTag !== null ? <p className={errorBox}>{t(props.errorTag)}</p> : null}

        {props.running ? (
          <p className={emptyState}>{t('common.loading')}</p>
        ) : view === null ? null : (
          <>
            <div className={summary}>
              <span className={summaryItem}>
                <span className={summaryLabel}>{t('financial.remittance.preview.summary.ready')}</span>
                <span className={summaryValue}>{`${String(view.readyCount)} · ${view.readyTotal}`}</span>
              </span>
              <span className={summaryItem}>
                <span className={summaryLabel}>{t('financial.remittance.preview.summary.blocked')}</span>
                <span className={summaryValue}>{`${String(view.blockedCount)} · ${view.blockedTotal}`}</span>
              </span>
              <span className={summaryItem}>
                <span className={summaryLabel}>{t('financial.remittance.preview.summary.outOfVan')}</span>
                <span className={summaryValue}>{String(view.outOfVanCount)}</span>
              </span>
              {view.notFoundCount > 0 ? (
                <span className={summaryItem}>
                  <span className={summaryLabel}>{t('financial.remittance.preview.summary.notFound')}</span>
                  <span className={summaryValue}>{String(view.notFoundCount)}</span>
                </span>
              ) : null}
            </div>

            <div className={scrollArea}>
              {view.lines.length === 0 ? (
                <p className={emptyState}>{t('financial.remittance.preview.empty')}</p>
              ) : (
                <table className={table}>
                  <thead>
                    <tr>
                      <th className={th}>{t('financial.remittance.preview.col.status')}</th>
                      <th className={th}>{t('financial.remittance.preview.col.supplier')}</th>
                      <th className={th}>{t('financial.remittance.preview.col.document')}</th>
                      <th className={th}>{t('financial.remittance.preview.col.reason')}</th>
                      <th className={th}>{t('financial.remittance.preview.col.net')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.lines.map((l) => (
                      <tr key={l.documentId}>
                        <td className={td}>
                          <span className={statusPill[l.status]}>{t(l.statusTag)}</span>
                          {l.routeTag !== null ? (
                            <>
                              <br />
                              <span className={routeLabel}>{t(l.routeTag)}</span>
                            </>
                          ) : null}
                        </td>
                        <td className={td}>{l.supplier}</td>
                        <td className={td}>{l.documentNumber}</td>
                        <td className={td}>
                          {l.gaps.length === 0 ? (
                            '—'
                          ) : (
                            <ul className={gapList}>
                              {l.gaps.map((g) => (
                                <li key={`${g.fieldTag}:${g.reasonTag}`}>
                                  <span className={gapField}>{t(g.fieldTag)}</span>
                                  {` — ${t(g.reasonTag)}`}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td className={tdRight}>{l.net}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        <div className={confirmActions}>
          <button type="button" className={confirmCancelBtn} onClick={props.onClose}>
            {t('financial.remittance.preview.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
