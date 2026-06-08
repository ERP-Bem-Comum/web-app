/**
 * DocumentPreviewModal — prévia do documento anexado SEM sair da página e SEM download.
 * View burra: recebe `doc` (nome + url) por prop. Renderiza o PDF num <iframe> quando há url;
 * enquanto o backend não expõe o conteúdo do documento (ver handbook/core-api/tickets/
 * CTR-HTTP-DOCUMENT-CONTENT), mostra um placeholder. Estilo só-tokens.
 */
import type { ReactNode } from 'react'
import type { DocRef } from './contract-documents.component.tsx'
import * as s from './document-preview-modal.css.ts'

export interface DocumentPreviewModalProps {
  readonly open: boolean
  readonly doc: DocRef | null
  readonly onClose: () => void
}

export function DocumentPreviewModal({ open, doc, onClose }: DocumentPreviewModalProps): ReactNode {
  if (!open || doc === null) return null

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.content} onClick={(e) => { e.stopPropagation() }} role="dialog" aria-modal="true" aria-label="Prévia do documento">
        <div className={s.header}>
          <h3 className={s.title}>{doc.name}</h3>
          <div className={s.headActions}>
            {doc.url !== undefined && (
              <a className={s.downloadLink} href={doc.url} download>Baixar</a>
            )}
            <button type="button" className={s.close} onClick={onClose} aria-label="Fechar">×</button>
          </div>
        </div>
        <div className={s.body}>
          {doc.url !== undefined ? (
            <iframe className={s.frame} src={doc.url} title={`Prévia — ${doc.name}`} />
          ) : (
            <div className={s.placeholder}>
              <div className={s.placeholderIcon}>📄</div>
              <div className={s.placeholderTitle}>Prévia indisponível</div>
              <div className={s.placeholderText}>
                O backend ainda não expõe o conteúdo do documento para visualização/baixa.
                <br />Pendência registrada em <code>CTR-HTTP-DOCUMENT-CONTENT</code>.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
