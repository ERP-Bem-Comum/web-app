/**
 * Coluna esquerda — Pré-visualização / OCR (view BURRA §XI). No Figma 626:22 é um shell vazio (480px):
 * aqui materializamos o **estado vazio** (drop-zone) que sinaliza o fluxo OCR. É CHROME — não há backend
 * de upload/OCR no v1, então o botão é inerte (sem handler de I/O). Mantém a coluna ocupada e on-brand.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { FileTextIcon } from '#shared/ui/index.ts'

import {
  dropzone,
  dropzoneFormats,
  dropzoneHint,
  dropzoneIcon,
  previewBadge,
  previewCol,
  previewHeader,
  previewHeaderText,
  ghostButton,
  scrollArea,
} from '../page/lancar-documento.css.ts'

const t = createTranslator(ptBR)

export function DocumentPreview(): ReactNode {
  return (
    <aside className={`${previewCol} ${scrollArea}`} aria-label={t('financial.create.preview.title')}>
      <div className={previewHeader}>
        <span className={previewBadge}>{t('financial.create.preview.ocrBadge')}</span>
        <span className={previewHeaderText}>{t('financial.create.preview.title')}</span>
      </div>
      <div className={dropzone}>
        <span className={dropzoneIcon} aria-hidden="true">
          <FileTextIcon size={24} />
        </span>
        <p className={dropzoneHint}>{t('financial.create.preview.hint')}</p>
        <button type="button" className={ghostButton} disabled>
          {t('financial.create.preview.select')}
        </button>
        <span className={dropzoneFormats}>{t('financial.create.preview.formats')}</span>
      </div>
    </aside>
  )
}
