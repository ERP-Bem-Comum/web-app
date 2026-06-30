/**
 * Coluna esquerda — Pré-visualização / OCR (view BURRA §XI). Drop-zone do fluxo OCR: o operador
 * seleciona um PDF/imagem e o OCR pré-preenche o form. A COSTURA está pronta (upload → server fn →
 * preenchimento), mas o backend de OCR ainda não existe (core-api#62) → a borda devolve "indisponível" e
 * a view mostra a mensagem honesta. Quando o backend entregar, o preenchimento passa a acontecer sozinho.
 */
import type { ChangeEvent, ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { FileTextIcon } from '#shared/ui/index.ts'

import type { OcrStatus } from '../document-form.view.ts'
import {
  dropzone,
  dropzoneFormats,
  dropzoneHint,
  dropzoneIcon,
  dropzoneNote,
  previewBadge,
  previewCol,
  previewHeader,
  previewHeaderText,
  ghostButton,
  fileInputHidden,
  scrollArea,
} from '../page/lancar-documento.css.ts'

const t = createTranslator(ptBR)

export type DocumentPreviewProps = Readonly<{
  status: OcrStatus
  fileName: string | null
  onSelectFile: (file: File) => void
}>

// Mensagem honesta conforme o estado do OCR (running/indisponível/erro). idle/done → sem nota.
const noteTag = (status: OcrStatus): string | null => {
  if (status === 'running') return 'financial.create.preview.reading'
  if (status === 'unavailable') return 'financial.create.preview.unavailable'
  if (status === 'error') return 'financial.create.preview.error'
  return null
}

export function DocumentPreview(props: DocumentPreviewProps): ReactNode {
  const tag = noteTag(props.status)
  const onChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (file !== undefined) props.onSelectFile(file)
    e.target.value = '' // permite re-selecionar o mesmo arquivo
  }
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
        <p className={dropzoneHint}>{props.fileName ?? t('financial.create.preview.hint')}</p>
        <label className={ghostButton}>
          {t('financial.create.preview.select')}
          <input
            type="file"
            className={fileInputHidden}
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            onChange={onChange}
            disabled={props.status === 'running'}
          />
        </label>
        <span className={dropzoneFormats}>{t('financial.create.preview.formats')}</span>
        {tag !== null ? (
          <span className={dropzoneNote} role="status">
            {t(tag)}
          </span>
        ) : null}
      </div>
    </aside>
  )
}
