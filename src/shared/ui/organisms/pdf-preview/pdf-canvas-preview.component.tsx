/**
 * PdfCanvasPreview — organism REUTILIZÁVEL (view BURRA §XI) que apresenta um PDF rasterizado em canvas,
 * só o conteúdo (sem toolbar/miniaturas do visualizador nativo). Toda a lógica imperativa vive no binding
 * `usePdfCanvas`; aqui só ligamos a ref do container e apresentamos os estados (carregando/erro).
 *
 * Agnóstico de domínio: os rótulos (aria/carregando/erro/download) chegam por prop → a i18n mora no caller.
 * O container leva `role="img"` + `aria-label` (o conteúdo é uma imagem rasterizada, não texto acessível).
 */
import type { ReactNode } from 'react'

import { usePdfCanvas } from './use-pdf-canvas.binding.ts'
import * as s from './pdf-canvas-preview.css.ts'

export type PdfCanvasPreviewProps = Readonly<{
  /** URL same-origin do PDF (tipicamente um `blob:` do arquivo local). `null` = nada a renderizar. */
  url: string | null
  /** Zoom em % (50–200) — controla a escala de rasterização (o binding clampa). */
  zoom: number
  /** Rótulo de acessibilidade do container (role="img"). */
  label: string
  /** Texto do estado "carregando…". */
  loadingLabel: string
  /** Texto do estado de erro (falha do pdf.js). */
  errorLabel: string
  /** Texto do link de download exibido no erro (mantém o arquivo acessível). */
  downloadLabel: string
}>

export function PdfCanvasPreview(props: PdfCanvasPreviewProps): ReactNode {
  const { containerRef, status } = usePdfCanvas(props.url, props.zoom)
  return (
    <div className={s.viewport} role="img" aria-label={props.label}>
      <div ref={containerRef} className={s.pages} />
      {status === 'loading' ? (
        <div className={s.loading} role="status">
          {props.loadingLabel}
        </div>
      ) : null}
      {status === 'error' ? (
        <div className={s.error} role="alert">
          <span>{props.errorLabel}</span>
          {props.url !== null ? (
            <a className={s.downloadLink} href={props.url} download>
              {props.downloadLabel}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
