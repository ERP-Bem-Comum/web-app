/**
 * DocumentPreviewModal — prévia do documento anexado SEM sair da página. View burra: recebe a
 * `blobUrl` (já buscada via BFF pela ViewModel/binding — CTR-HTTP-DOCUMENT-CONTENT) + estados de
 * carregamento/erro. Renderiza o PDF num <iframe>. <dialog> nativo (A4: ESC/focus-trap). Só-tokens.
 *
 * ⚠️ Variação conhecida entre navegadores (decisão: aceitar; fallback = link "Baixar" no header):
 *  - Chrome/Edge/Firefox (desktop): renderizam o PDF (blob:) no <iframe> normalmente.
 *  - Safari desktop (intermitente) e iOS Safari (sempre): o WebKit NÃO renderiza PDF servido por
 *    `blob:` dentro de <iframe> → área em branco. Não há fix puramente client-side: trocar para
 *    <embed>/<object> esbarra na CSP (`object-src 'none'`, ADR-0006); a alternativa robusta seria
 *    servir o PDF por uma rota same-origin inline (Content-Type: application/pdf + Disposition: inline),
 *    coberta por `frame-src 'self'` — não adotada por ora. O MIME do Blob é normalizado para
 *    application/pdf no binding (toBlob) para evitar a falha por sniffing no Firefox/Safari.
 */
import type { ReactNode } from 'react'
import { useId } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import * as s from './document-preview-modal.css.ts'

const t = createTranslator(ptBR)

export interface DocumentPreviewModalProps {
  readonly open: boolean
  readonly name: string
  readonly blobUrl: string | null
  readonly loading: boolean
  readonly errorTag: string | null
  readonly onClose: () => void
}

export function DocumentPreviewModal({ open, name, blobUrl, loading, errorTag, onClose }: DocumentPreviewModalProps): ReactNode {
  const titleId = useId()
  if (!open) return null

  return (
    <dialog
      className={s.dialog}
      aria-labelledby={titleId}
      // showModal() entrega ESC + focus-trap + inert (A4). ref-callback abre ao montar; try/catch p/ jsdom.
      ref={(el) => {
        if (el !== null && !el.open) {
          try { el.showModal() } catch { el.open = true }
        }
      }}
      onCancel={(e) => { e.preventDefault(); onClose() }}
      onClick={(e) => { if (e.currentTarget === e.target) onClose() }}
    >
      <div className={s.content}>
        <div className={s.header}>
          <h3 className={s.title} id={titleId}>{name}</h3>
          <div className={s.headActions}>
            {blobUrl !== null && (
              <a className={s.downloadLink} href={blobUrl} download={name}>{t('contracts.detail.documents.download')}</a>
            )}
            <button type="button" className={s.close} onClick={onClose} aria-label={t('common.close')}>×</button>
          </div>
        </div>
        <div className={s.body}>
          {loading ? (
            <div className={s.placeholder}>
              <div className={s.placeholderIcon}>⏳</div>
              <div className={s.placeholderText}>{t('common.loading')}</div>
            </div>
          ) : errorTag !== null ? (
            <div className={s.placeholder} role="alert">
              <div className={s.placeholderIcon}>⚠</div>
              <div className={s.placeholderText}>{t(errorTag)}</div>
            </div>
          ) : blobUrl !== null ? (
            <iframe className={s.frame} src={blobUrl} title={`${t('contracts.detail.documents.preview')} — ${name}`} />
          ) : (
            <div className={s.placeholder}>
              <div className={s.placeholderIcon}>📄</div>
              <div className={s.placeholderText}>{t('contracts.detail.document.empty')}</div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  )
}
