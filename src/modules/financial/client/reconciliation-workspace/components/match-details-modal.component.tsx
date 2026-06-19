/**
 * MatchDetailsModal — view burra: modal "Detalhes da conciliação" (modal-match). Estrutura fiel ao mock:
 * cabeçalho verde de sucesso, comparação lado-a-lado (Extrato ↔ Título) com a ponte "Conciliado", seção
 * de Auditoria e rodapé (Desfazer · Ver título · Fechar). O lado extrato é real; título/auditoria vêm "—"
 * até o backend (#175). Só props.
 */
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
  onUndo: () => void
  onViewTitle: () => void
  onClose: () => void
}>

export function MatchDetailsModal({
  open,
  view,
  canUndo,
  undoing,
  onUndo,
  onViewTitle,
  onClose,
}: MatchDetailsModalProps) {
  if (!open || view === null) return null
  const manual = view.isManualEntry
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
              <div className={s.mmSideLbl.doc}>
                {manual ? t('financial.recon.match.docLblManual') : t('financial.recon.match.docLbl')}
              </div>
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

        <footer className={s.matchFoot}>
          <button
            type="button"
            className={s.footBtnUndo}
            disabled={!canUndo || undoing}
            aria-disabled={!canUndo || undoing}
            title={canUndo ? undefined : t('financial.recon.match.undoUnavailable')}
            onClick={onUndo}
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
        </footer>
      </div>
    </div>
  )
}
