/**
 * Coluna esquerda — Pré-visualização / OCR (view BURRA §XI). Duas faces:
 *  - SEM arquivo → drop-zone da INGESTÃO por OCR: o operador seleciona/arrasta um PDF ou XML e o backend
 *    (core-api#62) CRIA UM RASCUNHO pré-preenchido; a tela então abre esse rascunho em modo edição.
 *  - COM arquivo (`preview`) → WEB VIEW do documento: PDF em `<iframe blob:>`, XML em texto — para o
 *    operador LER e conferir o que subiu (essencial no PDF, cuja extração ainda é parcial). A view só
 *    apresenta o estado (running/done/erro) e a fonte de preview que recebe por props.
 */
import { useState, type ChangeEvent, type CSSProperties, type DragEvent, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { FileTextIcon, PdfCanvasPreview } from '#shared/ui/index.ts'

import type { DocumentPreviewData, OcrStatus } from '../document-form.view.ts'
import {
  dropzone,
  dropzoneActive,
  dropzoneFormats,
  dropzoneHint,
  dropzoneIcon,
  dropzoneNote,
  previewBadge,
  previewCol,
  previewHeader,
  previewHeaderText,
  previewPane,
  previewXml,
  previewReplace,
  zoomControls,
  zoomBtn,
  zoomPct,
  ghostButton,
  fileInputHidden,
  scrollArea,
} from '../page/lancar-documento.css.ts'

const t = createTranslator(ptBR)

export type DocumentPreviewProps = Readonly<{
  status: OcrStatus
  fileName: string | null
  /** Tag i18n do erro real da ingestão (mime/tamanho/arquivo/servidor); só usada quando status === 'error'. */
  errorTag: string | null
  /** Fonte do web view (PDF/XML) derivada do arquivo subido; `null` = ainda sem arquivo → drop-zone. */
  preview: DocumentPreviewData | null
  /** Modo criação permite trocar o arquivo; em edição/consulta o documento é fixo. */
  allowReplace: boolean
  onSelectFile: (file: File) => void
}>

// Mensagem conforme o estado da ingestão. running → "Lendo…"; done → "Rascunho criado — revise"; error → a
// mensagem específica do erro (errorTag). idle → sem nota.
const noteTag = (status: OcrStatus, errorTag: string | null): string | null => {
  if (status === 'running') return 'financial.create.preview.reading'
  if (status === 'done') return 'financial.create.preview.done'
  if (status === 'error') return errorTag ?? 'financial.create.ocr.error.server'
  return null
}

// Input de arquivo escondido reutilizado pelo botão da drop-zone e pelo link "trocar arquivo".
function FileInput({
  onSelectFile,
  disabled,
}: Readonly<{ onSelectFile: (f: File) => void; disabled: boolean }>): ReactNode {
  const onChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (file !== undefined) onSelectFile(file)
    e.target.value = '' // permite re-selecionar o mesmo arquivo
  }
  return (
    <input
      type="file"
      className={fileInputHidden}
      accept=".pdf,.xml,application/pdf,text/xml,application/xml"
      onChange={onChange}
      disabled={disabled}
    />
  )
}

// Zoom do web view (ambos os formatos): 50%–200% em passos de 25% (PDF via `#zoom=` nativo; XML via `--ocr-zoom`).
const ZOOM_MIN = 50
const ZOOM_MAX = 200
const ZOOM_STEP = 25

// Controles de zoom (− / % / +) — ao lado do título "Pré-visualização do documento".
function ZoomControls(props: Readonly<{ zoom: number; onIn: () => void; onOut: () => void }>): ReactNode {
  return (
    <div className={zoomControls}>
      <button
        type="button"
        className={zoomBtn}
        aria-label={t('financial.create.preview.zoomOut')}
        disabled={props.zoom <= ZOOM_MIN}
        onClick={props.onOut}
      >
        −
      </button>
      <span className={zoomPct}>{`${String(props.zoom)}%`}</span>
      <button
        type="button"
        className={zoomBtn}
        aria-label={t('financial.create.preview.zoomIn')}
        disabled={props.zoom >= ZOOM_MAX}
        onClick={props.onIn}
      >
        +
      </button>
    </div>
  )
}

export function DocumentPreview(props: DocumentPreviewProps): ReactNode {
  const tag = noteTag(props.status, props.errorTag)
  // Estado EFÊMERO de UI (drag-over) — como hover; não é server-state.
  const [dragging, setDragging] = useState(false)
  const [zoom, setZoom] = useState(100)
  const busy = props.status === 'running'
  const zoomOut = (): void => {
    setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))
  }
  const zoomIn = (): void => {
    setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))
  }

  // Drag-and-drop: preventDefault no dragover É OBRIGATÓRIO p/ o drop disparar (senão o navegador ABRE o
  // arquivo e sai do app). No drop, pega o 1º arquivo e delega ao mesmo caminho do seletor.
  const onDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    if (!busy) setDragging(true)
  }
  const onDragLeave = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    setDragging(false)
  }
  const onDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    setDragging(false)
    if (busy) return
    const file = e.dataTransfer.files[0]
    if (file !== undefined) props.onSelectFile(file)
  }

  return (
    <aside className={`${previewCol} ${scrollArea}`} aria-label={t('financial.create.preview.title')}>
      <div className={previewHeader}>
        <span className={previewBadge}>{t('financial.create.preview.ocrBadge')}</span>
        <span className={previewHeaderText}>{t('financial.create.preview.title')}</span>
        {props.preview !== null && props.preview.kind !== 'unsupported' ? (
          <ZoomControls zoom={zoom} onIn={zoomIn} onOut={zoomOut} />
        ) : null}
      </div>

      {props.preview !== null ? (
        <>
          <div className={previewPane}>
            {props.preview.kind === 'pdf' ? (
              // Render próprio via pdf.js em canvas (só o conteúdo): o visualizador nativo do navegador
              // IGNORA `#toolbar=0&navpanes=0` e injeta barra + miniaturas. O zoom (− % +) controla a
              // escala de rasterização. Organism reutilizável em `#shared/ui` (specs/071).
              <PdfCanvasPreview
                url={props.preview.url}
                zoom={zoom}
                label={t('financial.create.preview.frameLabel')}
                loadingLabel={t('financial.create.preview.rendering')}
                errorLabel={t('financial.create.preview.renderError')}
                downloadLabel={t('financial.create.preview.download')}
              />
            ) : props.preview.kind === 'xml' ? (
              <pre
                className={previewXml}
                aria-label={t('financial.create.preview.frameLabel')}
                style={{ ['--ocr-zoom']: String(zoom / 100) } as CSSProperties}
              >
                {props.preview.text}
              </pre>
            ) : (
              <p className={dropzoneNote}>{t('financial.create.preview.unsupported')}</p>
            )}
          </div>
          {props.allowReplace ? (
            <label className={previewReplace}>
              {t('financial.create.preview.replace')}
              <FileInput onSelectFile={props.onSelectFile} disabled={busy} />
            </label>
          ) : null}
        </>
      ) : (
        <div
          className={dragging ? dropzoneActive : dropzone}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <span className={dropzoneIcon} aria-hidden="true">
            <FileTextIcon size={24} />
          </span>
          <p className={dropzoneHint}>{props.fileName ?? t('financial.create.preview.hint')}</p>
          <label className={ghostButton}>
            {t('financial.create.preview.select')}
            <FileInput onSelectFile={props.onSelectFile} disabled={busy} />
          </label>
          <span className={dropzoneFormats}>{t('financial.create.preview.formats')}</span>
          {tag !== null ? (
            <span className={dropzoneNote} role="status">
              {t(tag)}
            </span>
          ) : null}
        </div>
      )}
    </aside>
  )
}
