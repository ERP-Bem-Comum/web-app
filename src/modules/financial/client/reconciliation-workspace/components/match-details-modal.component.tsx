/**
 * MatchDetailsModal — view burra: modal "Detalhes da conciliação" (modal-match). Estrutura fiel ao mock:
 * cabeçalho verde de sucesso, comparação lado-a-lado (Extrato ↔ Título) com a ponte "Conciliado", seção
 * de Auditoria e rodapé (Desfazer · Ver título · Fechar). O lado extrato é real; título/auditoria vêm "—"
 * até o backend (#175). Só props.
 */
import { useState } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { FileTextIcon, LinkIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import type { MatchDetailsView } from '../reconciliation-workspace.view-model.ts'

const t = createTranslator(ptBR)
const CLOSE_GLYPH = '✕'

export type MatchDetailsModalProps = Readonly<{
  open: boolean
  view: MatchDetailsView | null
  canUndo: boolean
  undoing: boolean
  /** Erro do desfazer (ex.: período fechado) — mostrado no modal em vez de fechar silenciosamente. */
  undoErrorTag: string | null
  onUndo: () => void
  onViewTitle: () => void
  onClose: () => void
}>

export function MatchDetailsModal({
  open,
  view,
  canUndo,
  undoing,
  undoErrorTag,
  onUndo,
  onViewTitle,
  onClose,
}: MatchDetailsModalProps) {
  // Passo de confirmação do Desfazer (US5): 1º clique pede confirmação com a consequência; 2º confirma.
  const [confirming, setConfirming] = useState(false)
  // Reseta a confirmação ao abrir/fechar (padrão React de ajuste no render, sem efeito) — evita carregar
  // um "confirmando" antigo p/ a próxima conciliação aberta.
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    setConfirming(false)
  }

  if (!open || view === null) return null
  const manual = view.isManualEntry
  // Consequência honesta: títulos voltam a PAGO; lançamento manual/transferência é desfeito (vira pendente).
  const undoConsequence = manual
    ? t('financial.recon.match.undoConsequenceManual')
    : t('financial.recon.match.undoConsequenceTitles')
  return (
    <div
      className={s.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={manual ? t('financial.recon.match.titleManual') : t('financial.recon.match.title')}
      onClick={onClose}
    >
      <div
        className={s.matchDialog}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <header className={s.mmHead}>
          <span className={s.matchHeadIc} aria-hidden>
            <LinkIcon />
          </span>
          <div className={s.matchHeadText}>
            <h3 className={s.matchTitle}>
              {manual ? t('financial.recon.match.titleManual') : t('financial.recon.match.title')}
            </h3>
            <span className={s.matchSub}>{t('financial.recon.match.sub')}</span>
          </div>
          <button
            type="button"
            className={s.modalClose}
            aria-label={t('financial.recon.match.close')}
            onClick={onClose}
          >
            {CLOSE_GLYPH}
          </button>
        </header>

        <div className={s.matchBody}>
          {/* Comparação lado-a-lado: extrato ↔ título */}
          <div className={s.matchPair}>
            <div className={s.mmSide.ext}>
              <div className={s.mmSideLbl.ext}>{t('financial.recon.match.extLbl')}</div>
              <div className={s.mmSideTitle}>{view.ext.name}</div>
              <div className={s.mmSideRow}>
                <span className={s.mmSideK}>{t('financial.recon.match.rowDate')}</span>
                <span className={s.mmSideV}>{view.ext.date}</span>
              </div>
              <div className={s.mmSideRow}>
                <span className={s.mmSideK}>{t('financial.recon.match.rowKind')}</span>
                <span className={s.mmSideV}>{view.ext.kind}</span>
              </div>
              <div className={s.mmSideRow}>
                <span className={s.mmSideK}>{t('financial.recon.match.rowId')}</span>
                <span className={s.mmSideV}>{view.ext.id}</span>
              </div>
              <div className={s.mmSideRow}>
                <span className={s.mmSideK}>{t('financial.recon.match.rowValue')}</span>
                <span className={s.mmSideVAmt.ext}>{view.ext.valueBRL}</span>
              </div>
            </div>

            <div className={s.matchBridge}>
              <span className={s.matchBadge}>
                <LinkIcon />
                {manual ? t('financial.recon.match.badgeManual') : t('financial.recon.match.badge')}
              </span>
            </div>

            <div className={s.mmSide.doc}>
              {view.multi !== null ? (
                <>
                  <div className={s.mmSideLbl.doc}>
                    {`${t('financial.recon.match.titlesLbl')} (${String(view.multi.count)})`}
                  </div>
                  <div className={s.mmSideTitle}>
                    {`${String(view.multi.count)} ${t('financial.recon.match.titlesWord')}`}
                  </div>
                  {view.multi.lines.map((ln, i) => (
                    <div className={s.mmSideRow} key={`${String(i)}-${ln.valueBRL}`}>
                      <span
                        className={s.mmSideK}
                      >{`${t('financial.recon.match.titleN')} ${String(i + 1)}`}</span>
                      <span className={s.mmSideV}>{ln.valueBRL}</span>
                    </div>
                  ))}
                  {/* Diferença (acréscimo multa/juros ou desconto) — fecha o total com o valor do extrato. */}
                  {view.multi.differenceBRL !== null ? (
                    <div className={s.mmSideRow}>
                      <span className={s.mmSideK}>{t(view.multi.differenceTag)}</span>
                      <span className={s.mmSideV}>{view.multi.differenceBRL}</span>
                    </div>
                  ) : null}
                  <div className={s.mmTotalRow}>
                    <span className={s.mmSideK}>{t('financial.recon.match.totalConciliado')}</span>
                    <span className={s.mmSideVAmt.doc}>{view.multi.totalBRL}</span>
                  </div>
                  <span className={s.mmMultiHint}>{t('financial.recon.match.titlesHint')}</span>
                </>
              ) : manual ? (
                // Nova transação: não há título a casar (ex.: tarifa). Mostra a FORMA (lançamento manual),
                // o valor conciliado real e a categoria (acende quando o backend enriquecer — core-api#268).
                <>
                  <div className={s.mmSideLbl.doc}>{t('financial.recon.match.docLblManual')}</div>
                  <div className={s.mmSideTitle}>{t(view.manualKindTag)}</div>
                  {view.manualCounterparty.labelTag !== '' ? (
                    // Contraparte: conta de destino (transferência/aplicação/resgate) ou fornecedor.
                    <div className={s.mmSideRow}>
                      <span className={s.mmSideK}>{t(view.manualCounterparty.labelTag)}</span>
                      <span className={s.mmSideV}>{view.manualCounterparty.value}</span>
                    </div>
                  ) : null}
                  <div className={s.mmSideRow}>
                    <span className={s.mmSideK}>{t('financial.recon.match.rowCat')}</span>
                    <span className={s.mmSideV}>{view.doc.categoria}</span>
                  </div>
                  <div className={s.mmSideRow}>
                    <span className={s.mmSideK}>{t('financial.recon.match.rowValueDoc')}</span>
                    <span className={s.mmSideVAmt.doc}>{view.doc.valueBRL}</span>
                  </div>
                  <span className={s.mmMultiHint}>{t('financial.recon.match.manualHint')}</span>
                </>
              ) : (
                <>
                  <div className={s.mmSideLbl.doc}>{t('financial.recon.match.docLbl')}</div>
                  <div className={s.mmSideTitle}>{view.doc.name}</div>
                  <div className={s.mmSideRow}>
                    <span className={s.mmSideK}>{t('financial.recon.match.rowDoc')}</span>
                    <span className={s.mmSideV}>{view.doc.documento}</span>
                  </div>
                  <div className={s.mmSideRow}>
                    <span className={s.mmSideK}>{t('financial.recon.match.rowDue')}</span>
                    <span className={s.mmSideV}>{view.doc.vencimento}</span>
                  </div>
                  <div className={s.mmSideRow}>
                    <span className={s.mmSideK}>{t('financial.recon.match.rowCat')}</span>
                    <span className={s.mmSideV}>{view.doc.categoria}</span>
                  </div>
                  <div className={s.mmSideRow}>
                    <span className={s.mmSideK}>{t('financial.recon.match.rowValueDoc')}</span>
                    <span className={s.mmSideVAmt.doc}>{view.doc.valueBRL}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Auditoria */}
          <div className={s.matchSection}>
            <div className={s.matchSectionLbl}>{t('financial.recon.match.auditLbl')}</div>
            <div className={s.matchAuditRows}>
              <span className={s.auditLbl}>{t('financial.recon.match.auditWhen')}</span>
              <span className={s.auditV}>{view.audit.when}</span>
              <span className={s.auditLbl}>{t('financial.recon.match.auditWho')}</span>
              <span className={s.auditV}>{view.audit.who}</span>
            </div>
          </div>
        </div>

        {undoErrorTag !== null ? <div className={s.mmUndoError}>{t(undoErrorTag)}</div> : null}

        <footer className={s.matchFoot}>
          {confirming ? (
            <>
              <span className={s.mmUndoConfirm}>
                {`${t('financial.recon.match.undoConfirmQ')} ${undoConsequence}`}
              </span>
              <span className={s.matchFootSpacer} />
              <button
                type="button"
                className={s.footBtnSecondary}
                disabled={undoing}
                aria-disabled={undoing}
                onClick={() => {
                  setConfirming(false)
                }}
              >
                {t('financial.recon.match.undoCancelBtn')}
              </button>
              <button
                type="button"
                className={s.footBtnUndo}
                disabled={undoing}
                aria-disabled={undoing}
                onClick={onUndo}
              >
                <LinkIcon />
                {t('financial.recon.match.undoConfirmBtn')}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={s.footBtnUndo}
                disabled={!canUndo || undoing}
                aria-disabled={!canUndo || undoing}
                title={canUndo ? undefined : t('financial.recon.match.undoUnavailable')}
                onClick={() => {
                  setConfirming(true)
                }}
              >
                <LinkIcon />
                {t('financial.recon.match.undo')}
              </button>
              <span className={s.matchFootSpacer} />
              <button
                type="button"
                className={s.footBtnSecondary}
                disabled
                aria-disabled="true"
                title={t('financial.recon.match.viewTitleUnavailable')}
                onClick={onViewTitle}
              >
                <FileTextIcon />
                {t('financial.recon.match.viewTitle')}
              </button>
              <button type="button" className={s.footBtnPrimary} onClick={onClose}>
                {t('financial.recon.match.close')}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  )
}
